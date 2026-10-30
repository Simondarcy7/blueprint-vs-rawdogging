import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { capabilityFixture } from './helpers/capability-fixture.mjs';
const fixture = await capabilityFixture(['account-recovery']);
after(fixture.cleanup);
const { createLocalAccountCleanup } = await fixture.load('services/account-recovery/localAccountCleanup.ts');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const lock = () => { let tail = Promise.resolve(); return operation => { const next = tail.then(operation); tail = next.catch(() => {}); return next; }; };
const accepted = async ({ owner }) => ({ status: 'accepted', owner });
function harness(overrides = {}) {
  let raw = null;
  const writes = [], removals = [], leases = [];
  const ownerLocks = new Map();
  const options = {
    journal: { read: async () => raw, write: async value => { writes.push(value); raw = value; } },
    withJournalLock: lock(),
    withOwnerLease: (owner, operation) => {
      if (!ownerLocks.has(owner)) ownerLocks.set(owner, lock());
      return ownerLocks.get(owner)(() => { leases.push(owner); return operation({ owner, assertCurrent() {} }); });
    },
    steps: ['records', 'plans', 'owner-marker'].map(id => ({ id, remove: async ctx => { ctx.assertCurrent(); removals.push([ctx.owner, id]); } })),
    ...overrides,
  };
  return { controller: createLocalAccountCleanup(options), options, writes, removals, leases, setRaw: value => { raw = value; }, raw: () => raw };
}
const pending = (owner = 'a', completed = []) => JSON.stringify({ version: 1, entries: [{ owner, completed }] });

test('records only explicitly accepted ownership, then removes in order under a fresh owner lease', async () => {
  const r = harness();
  const result = await r.controller.start('a', async ctx => {
    assert.equal(r.raw(), null);
    assert.deepEqual(r.removals, []);
    return accepted(ctx);
  });
  assert.deepEqual(result, { status: 'complete', completedOwners: 1 });
  assert.deepEqual(r.leases, ['a']);
  assert.deepEqual(r.removals, [['a', 'records'], ['a', 'plans'], ['a', 'owner-marker']]);
  assert.deepEqual(JSON.parse(r.writes[0]).entries, [{ owner: 'a', completed: [] }]);
  assert.deepEqual(JSON.parse(r.raw()).entries, []);
  r.controller.dispose();
});

test('rejected, unknown and wrong-owner authorization never create cleanup intent', async () => {
  for (const response of [{ status: 'rejected' }, { status: 'unknown' }, { status: 'accepted', owner: 'other' }, undefined]) {
    const r = harness();
    const result = await r.controller.start('a', async () => response);
    assert.equal(result.status, response?.status === 'rejected' ? 'rejected' : 'unknown');
    assert.equal(r.raw(), null);
    assert.deepEqual(r.removals, []);
    r.controller.dispose();
  }
});

test('failed cleanup retains its prefix and recovery resumes only remaining idempotent steps', async () => {
  const r = harness();
  const failing = r.options.steps[1].remove;
  let fail = true;
  r.options.steps[1].remove = async ctx => { if (fail) { fail = false; throw new Error('Plans unavailable'); } return failing(ctx); };
  // Factories snapshot step callbacks so later host mutation cannot alter an active policy.
  const controller = createLocalAccountCleanup(r.options);
  assert.equal((await controller.start('a', accepted)).status, 'pending');
  assert.deepEqual(JSON.parse(r.raw()).entries[0].completed, ['records']);
  assert.equal((await controller.recover()).status, 'complete');
  assert.deepEqual(r.removals, [['a', 'records'], ['a', 'plans'], ['a', 'owner-marker']]);
  assert.deepEqual(r.leases, ['a', 'a']);
  controller.dispose(); r.controller.dispose();
});

test('corrupt journals and invalid progress fail closed before authorization or deletion', async () => {
  for (const raw of ['not json', '[]', '{"version":2,"entries":[]}', pending('a', ['plans']), pending('a', ['records', 'records']), pending('a', ['removed-policy-step']), pending(''), JSON.stringify({ version: 1, entries: [{ owner: 'a', completed: [] }, { owner: 'a', completed: [] }] })]) {
    const r = harness(); r.setRaw(raw);
    let authorized = 0;
    assert.equal((await r.controller.start('b', async ctx => { authorized++; return accepted(ctx); })).status, 'blocked');
    assert.equal((await r.controller.recover()).status, 'blocked');
    assert.equal(authorized, 0);
    assert.equal(r.raw(), raw);
    assert.equal(r.writes.length, 0);
    assert.equal(r.removals.length, 0);
    r.controller.dispose();
  }
});

test('accepted authorization with a failed journal write is unrecorded and retries without reauthorizing', async () => {
  const r = harness();
  const write = r.options.journal.write;
  let fail = true, authorizations = 0;
  r.options.journal.write = async raw => { if (fail) { fail = false; throw new Error('Disk full'); } return write(raw); };
  assert.equal((await r.controller.start('a', async ctx => { authorizations++; return accepted(ctx); })).status, 'unrecorded');
  assert.equal(r.removals.length, 0);
  assert.equal((await r.controller.recover()).status, 'complete');
  assert.equal(authorizations, 1);
  assert.equal(r.removals.length, 3);
  r.controller.dispose();
});

test('a lost progress acknowledgement is reconciled from journal without repeating completed work', async () => {
  const r = harness();
  const write = r.options.journal.write;
  let failed = false;
  r.options.journal.write = async raw => {
    await write(raw);
    if (!failed && JSON.parse(raw).entries[0]?.completed.includes('records')) { failed = true; throw new Error('Acknowledgement lost'); }
  };
  assert.equal((await r.controller.start('a', accepted)).status, 'pending');
  assert.equal((await r.controller.recover()).status, 'complete');
  assert.equal(r.removals.filter(([, step]) => step === 'records').length, 1);
  r.controller.dispose();
});

test('an unacknowledged step safely retries if its progress write never committed', async () => {
  const r = harness();
  const write = r.options.journal.write;
  let failed = false;
  r.options.journal.write = async raw => {
    if (!failed && JSON.parse(raw).entries[0]?.completed.includes('records')) { failed = true; throw new Error('Write rejected'); }
    await write(raw);
  };
  assert.equal((await r.controller.start('a', accepted)).status, 'pending');
  assert.equal((await r.controller.recover()).status, 'complete');
  assert.equal(r.removals.filter(([, step]) => step === 'records').length, 2);
  r.controller.dispose();
});

test('cancellation during authorization cannot erase its later accepted cleanup intent', async () => {
  const r = harness(), response = deferred(), started = deferred();
  let signal;
  const work = r.controller.start('a', async ctx => { signal = ctx.signal; started.resolve(); return response.promise; });
  await started.promise;
  r.controller.cancel();
  assert.equal(signal.aborted, true);
  assert.equal(r.controller.getSnapshot().busy, true);
  assert.equal((await r.controller.recover()).status, 'busy');
  response.resolve({ status: 'accepted', owner: 'a' });
  assert.equal((await work).status, 'pending');
  assert.deepEqual(JSON.parse(r.raw()).entries, [{ owner: 'a', completed: [] }]);
  assert.equal(r.removals.length, 0);
  assert.equal((await r.controller.recover()).status, 'complete');
  r.controller.dispose();
});

test('dispose while authorizing retains accepted intent for a new recovery instance', async () => {
  const r = harness(), response = deferred(), started = deferred();
  const work = r.controller.start('a', async () => { started.resolve(); return response.promise; });
  await started.promise;
  r.controller.dispose();
  response.resolve({ status: 'accepted', owner: 'a' });
  assert.equal((await work).status, 'pending');
  assert.equal(r.controller.getSnapshot().status, 'disposed');
  const replacement = createLocalAccountCleanup(r.options);
  assert.equal((await replacement.recover()).status, 'complete');
  assert.equal(r.removals.length, 3);
  replacement.dispose();
});

test('cancellation during a step records that completed step and pauses before the next', async () => {
  const finished = deferred(), started = deferred();
  const r = harness();
  r.options.steps[0].remove = async ctx => { r.removals.push([ctx.owner, 'records']); started.resolve(); await finished.promise; };
  const controller = createLocalAccountCleanup(r.options);
  const work = controller.start('a', accepted);
  await started.promise;
  controller.cancel();
  finished.resolve();
  assert.equal((await work).status, 'pending');
  assert.deepEqual(JSON.parse(r.raw()).entries[0].completed, ['records']);
  assert.equal((await controller.recover()).status, 'complete');
  assert.equal(r.removals.filter(([, step]) => step === 'records').length, 1);
  controller.dispose(); r.controller.dispose();
});

test('wrong-owner or expired leases retain the journal and prevent data writes', async () => {
  for (const lease of [{ owner: 'other', assertCurrent() {} }, { owner: 'a', assertCurrent() { throw new Error('Expired'); } }]) {
    const r = harness({ withOwnerLease: async (_, operation) => operation(lease) });
    assert.equal((await r.controller.start('a', accepted)).status, 'pending');
    assert.equal(r.controller.getSnapshot().error, 'lease');
    assert.equal(r.removals.length, 0);
    assert.deepEqual(JSON.parse(r.raw()).entries, [{ owner: 'a', completed: [] }]);
    r.controller.dispose();
  }
});

test('shared journal serialization preserves different owners and exclusive leases fence duplicate recoverers', async () => {
  const r = harness();
  r.setRaw(JSON.stringify({ version: 1, entries: [{ owner: 'a', completed: [] }, { owner: 'b', completed: [] }] }));
  const second = createLocalAccountCleanup(r.options);
  const outcomes = await Promise.all([r.controller.recover(), second.recover()]);
  assert.ok(outcomes.every(value => value.status === 'complete'));
  assert.equal(r.removals.filter(([owner]) => owner === 'a').length, 3);
  assert.equal(r.removals.filter(([owner]) => owner === 'b').length, 3);
  assert.deepEqual(JSON.parse(r.raw()).entries, []);
  r.controller.dispose(); second.dispose();
});

test('progress acknowledgements remain idempotent even when a faulty lease permits overlap', async () => {
  const both = deferred(); let calls = 0;
  const r = harness({
    withOwnerLease: async (owner, operation) => operation({ owner, assertCurrent() {} }),
    steps: [{ id: 'one', remove: async () => { if (++calls === 2) both.resolve(); await both.promise; } }],
  });
  r.setRaw(pending());
  const second = createLocalAccountCleanup(r.options);
  const results = await Promise.all([r.controller.recover(), second.recover()]);
  assert.ok(results.every(result => result.status === 'complete'));
  assert.ok(r.writes.every(raw => new Set(JSON.parse(raw).entries[0]?.completed ?? []).size <= 1));
  assert.deepEqual(JSON.parse(r.raw()).entries, []);
  r.controller.dispose(); second.dispose();
});

test('reentrant cancellation before authorization starts prevents side effects', async () => {
  const r = harness(); let authorizations = 0;
  r.controller.subscribe(() => { if (r.controller.getSnapshot().status === 'authorizing') r.controller.cancel(); });
  assert.equal((await r.controller.start('a', async ctx => { authorizations++; return accepted(ctx); })).status, 'cancelled');
  assert.equal(authorizations, 0);
  assert.equal(r.writes.length, 0);
  r.controller.dispose();
});

test('capacity and policy validation reject without authorizing a new removal', async () => {
  for (const maxPendingOwners of [0, -1, 257, NaN]) assert.throws(() => harness({ maxPendingOwners }));
  assert.throws(() => harness({ steps: [] }));
  assert.throws(() => harness({ steps: [{ id: 'x', remove: async () => {} }, { id: 'x', remove: async () => {} }] }));
  const r = harness({ maxPendingOwners: 1 }); r.setRaw(pending());
  let authorizations = 0;
  assert.equal((await r.controller.start('b', async ctx => { authorizations++; return accepted(ctx); })).status, 'blocked');
  assert.equal(authorizations, 0);
  r.controller.dispose();
});
