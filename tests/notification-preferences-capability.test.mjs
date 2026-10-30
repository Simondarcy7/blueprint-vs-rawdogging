import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { join } from 'node:path';
import ts from 'typescript';
import { capabilityFixture } from './helpers/capability-fixture.mjs';

const fixture = await capabilityFixture(['notification-preferences']);
after(fixture.cleanup);
const { createNotificationPreferencesController } = await fixture.load('services/notification-preferences/notificationPreferences.ts');
const deferred = () => {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const off = { enabled: false, weekly: { hour: 10 } };
const on = { enabled: true, weekly: { hour: 10 } };
function setup(t, overrides = {}) {
  let stored = { value: off, revision: '0' };
  let owner = 'a';
  let permission = 'granted';
  const writes = [];
  const plans = [];
  const requests = [];
  const controller = createNotificationPreferencesController({
    owner: 'a', getOwner: () => owner,
    parse(input) {
      if (typeof input?.enabled !== 'boolean' || !Number.isInteger(input?.weekly?.hour)
        || input.weekly.hour < 0 || input.weekly.hour > 23) throw new Error('Invalid preferences');
      return { enabled: input.enabled, weekly: { hour: input.weekly.hour } };
    },
    requiresPermission: (current, next) => !current.enabled && next.enabled,
    read: async () => stored,
    write: async (value, context) => {
      assert.equal(context.isCurrent(), true);
      writes.push({ value, expectedRevision: context.expectedRevision, owner: context.owner });
      if (context.expectedRevision !== stored.revision) return { status: 'conflict' };
      stored = { value, revision: String(Number(stored.revision) + 1) };
      return { status: 'saved', revision: stored.revision };
    },
    getPermission: async () => permission,
    requestPermission: async () => { requests.push(true); return permission; },
    apply: async (value, allowed, context) => {
      assert.equal(context.isCurrent(), true);
      plans.push({ value, allowed, owner: context.owner });
    },
    ...overrides,
  });
  t.after(() => controller.dispose());
  return { controller, writes, plans, requests, getStored: () => stored,
    setStored: value => { stored = value; }, setOwner: value => { owner = value; },
    setPermission: value => { permission = value; } };
}

test('installed notification preferences and its baseline dependency pass strict TypeScript', () => {
  const program = ts.createProgram([join(fixture.root, 'src/services/notification-preferences/notificationPreferences.ts')], {
    noEmit: true, strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true, types: [],
  });
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')), []);
});

test('startup reconciles authoritative preferences without asking permission or writing defaults', async t => {
  const s = setup(t); s.setPermission('denied');
  assert.equal((await s.controller.update(on)).status, 'blocked');
  assert.equal((await s.controller.reconcile()).status, 'reconciled');
  assert.deepEqual(s.controller.getSnapshot().value, off);
  assert.equal(s.controller.getSnapshot().permission, 'denied');
  assert.deepEqual(s.plans, [{ value: off, allowed: 'denied', owner: 'a' }]);
  assert.equal(s.requests.length, 0); assert.equal(s.writes.length, 0);
});

test('the visible preference changes only after async durability acknowledgement', async t => {
  const saved = deferred();
  const s = setup(t, { write: () => saved.promise });
  await s.controller.reconcile(); s.plans.length = 0;
  const input = { enabled: true, weekly: { hour: 11 } };
  const operation = s.controller.update(input);
  input.weekly.hour = 20;
  await flush();
  assert.equal(s.controller.getSnapshot().status, 'saving');
  assert.deepEqual(s.controller.getSnapshot().value, off);
  assert.equal(s.plans.length, 0);
  saved.resolve({ status: 'saved', revision: '1' });
  assert.equal((await operation).status, 'updated');
  assert.equal(s.controller.getSnapshot().value.weekly.hour, 11);
  assert.throws(() => { s.controller.getSnapshot().value.weekly.hour = 2; }, TypeError);
  assert.equal(s.plans[0].value.weekly.hour, 11);
});

test('permission denial or rejected permission request cannot save an enabling preference', async t => {
  for (const denied of ['denied', 'unavailable']) {
    const s = setup(t, { requestPermission: async () => { if (denied === 'unavailable') throw new Error('SDK failed'); return denied; } });
    await s.controller.reconcile(); s.setPermission('undetermined');
    assert.equal((await s.controller.update(on)).status, 'permission-denied');
    assert.equal(s.writes.length, 0);
    assert.deepEqual(s.controller.getSnapshot().value, off);
    assert.equal(s.controller.getSnapshot().error, 'permission');
  }
});

test('explicit permission grant precedes save; disabling still reconciles when permission is revoked', async t => {
  const s = setup(t, { requestPermission: async () => 'granted' });
  await s.controller.reconcile(); s.setPermission('undetermined');
  assert.equal((await s.controller.update(on)).status, 'updated');
  s.setPermission('denied');
  assert.equal((await s.controller.update(off)).status, 'updated');
  assert.equal(s.plans.at(-1).allowed, 'denied');
  assert.deepEqual(s.plans.at(-1).value, off);
});

test('known failed persistence leaves preferences unchanged without scheduling', async t => {
  const s = setup(t, { write: async () => ({ status: 'not-saved' }) });
  await s.controller.reconcile(); s.plans.length = 0;
  assert.equal((await s.controller.update(on)).status, 'not-saved');
  assert.deepEqual(s.controller.getSnapshot().value, off); assert.equal(s.plans.length, 0);
});

test('device failure rolls back with the saved revision and repairs the previous device plan', async t => {
  const applied = [];
  const s = setup(t, { apply: async value => { applied.push(value); if (value.enabled) throw new Error('partial scheduling'); } });
  await s.controller.reconcile();
  assert.equal((await s.controller.update(on)).status, 'rolled-back');
  assert.deepEqual(s.writes.map(write => write.expectedRevision), ['0', '1']);
  assert.deepEqual(s.getStored(), { value: off, revision: '2' });
  assert.deepEqual(applied, [off, on, off]);
  assert.equal(s.controller.getSnapshot().device, 'applied');
});

test('failed rollback persistence retains the acknowledged new value and requires reconciliation', async t => {
  let calls = 0;
  const s = setup(t, { write: async () => ++calls === 1 ? { status: 'saved', revision: '1' } : { status: 'not-saved' },
    apply: async value => { if (value.enabled) throw new Error('failed'); } });
  await s.controller.reconcile();
  assert.equal((await s.controller.update(on)).status, 'reconciliation-required');
  assert.deepEqual(s.controller.getSnapshot().value, on);
  assert.equal(s.controller.getSnapshot().device, 'pending');
  assert.equal(s.controller.getSnapshot().error, 'rollback');
});

test('failed device repair keeps durable rollback and foreground reconciliation retries it', async t => {
  let failing = false;
  const s = setup(t, { apply: async () => { if (failing) throw new Error('SDK unavailable'); } });
  await s.controller.reconcile(); failing = true;
  assert.equal((await s.controller.update(on)).status, 'reconciliation-required');
  assert.deepEqual(s.controller.getSnapshot().value, off);
  assert.equal(s.controller.getSnapshot().device, 'pending');
  failing = false;
  assert.equal((await s.controller.reconcile()).status, 'reconciled');
  assert.equal(s.controller.getSnapshot().device, 'applied');
});

test('unknown or rejected writes block further mutation until an authoritative read', async t => {
  for (const outcome of ['unknown', 'throw', 'malformed']) {
    const s = setup(t, { write: async () => {
      if (outcome === 'throw') throw new Error('lost response');
      return outcome === 'malformed' ? { status: 'saved', revision: '0' } : { status: 'unknown' };
    } });
    await s.controller.reconcile(); s.plans.length = 0;
    assert.equal((await s.controller.update(on)).status, 'reconciliation-required');
    assert.equal(s.controller.getSnapshot().value, null);
    assert.equal(s.controller.getSnapshot().error, 'unknown-write');
    assert.equal((await s.controller.update(off)).status, 'blocked');
    assert.equal(s.plans.length, 0);
    s.setStored({ value: on, revision: '9' });
    assert.equal((await s.controller.reconcile()).status, 'reconciled');
    assert.deepEqual(s.controller.getSnapshot().value, on);
  }
});

test('rollback conflict never overwrites a newer external preference revision', async t => {
  const s = setup(t, { apply: async value => {
    if (value.enabled) { s.setStored({ value: { enabled: false, weekly: { hour: 23 } }, revision: 'external' }); throw new Error('partial apply'); }
  } });
  await s.controller.reconcile();
  assert.equal((await s.controller.update(on)).status, 'reconciliation-required');
  assert.equal(s.controller.getSnapshot().error, 'conflict');
  assert.equal(s.getStored().revision, 'external');
  await s.controller.reconcile();
  assert.equal(s.controller.getSnapshot().value.weekly.hour, 23);
});

test('concurrent updates are explicitly busy and cannot overtake a pending write', async t => {
  const save = deferred(); const s = setup(t, { write: () => save.promise });
  await s.controller.reconcile(); const first = s.controller.update(on); await flush();
  assert.equal((await s.controller.update(off)).status, 'busy');
  assert.equal((await s.controller.reconcile()).status, 'busy');
  save.resolve({ status: 'saved', revision: '1' }); await first;
});

test('suspend after write handoff acknowledges persistence but does not claim device apply or rollback', async t => {
  const save = deferred(); const s = setup(t, { write: () => save.promise });
  await s.controller.reconcile(); s.plans.length = 0;
  const first = s.controller.update(on); await flush(); s.controller.suspend();
  assert.equal((await s.controller.update(off)).status, 'inactive');
  save.resolve({ status: 'saved', revision: '1' });
  assert.equal((await first).status, 'reconciliation-required');
  assert.deepEqual(s.controller.getSnapshot().value, on);
  assert.equal(s.controller.getSnapshot().device, 'pending'); assert.equal(s.plans.length, 0);
  s.setStored({ value: on, revision: '1' }); s.controller.resume();
  await s.controller.reconcile(); assert.equal(s.plans.length, 1);
});

test('owner changes hide old preferences and fence late permission, read and device results', async t => {
  for (const stage of ['read', 'permission', 'apply']) {
    const pending = deferred();
    let pause = false;
    const overrides = stage === 'read' ? { read: () => pending.promise }
      : stage === 'permission' ? { getPermission: () => pause ? pending.promise : Promise.resolve('granted') }
        : { apply: () => pause ? pending.promise : Promise.resolve() };
    const s = setup(t, overrides);
    if (stage !== 'read') await s.controller.reconcile();
    pause = true;
    const work = stage === 'read' ? s.controller.reconcile() : s.controller.update(on);
    await flush(); s.setOwner('b');
    assert.equal(s.controller.getSnapshot().value, null);
    pending.resolve(stage === 'read' ? { value: off, revision: '0' } : stage === 'permission' ? 'granted' : undefined);
    assert.equal((await work).status, 'reconciliation-required');
    assert.equal(s.controller.getSnapshot().value, null);
    assert.equal(s.writes.length, stage === 'apply' ? 1 : 0);
  }
});

test('read and permission hangs are bounded without pretending pending writes have failed', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const s = setup(t, { read: () => new Promise(() => {}), readTimeoutMs: 10 });
  const loading = s.controller.reconcile(); await flush(); t.mock.timers.tick(10);
  assert.equal((await loading).status, 'blocked');
  assert.equal(s.controller.getSnapshot().error, 'read');
  const p = setup(t, { getPermission: () => new Promise(() => {}), readTimeoutMs: 10 });
  const permissionWork = p.controller.reconcile(); await flush(); t.mock.timers.tick(10);
  assert.equal((await permissionWork).status, 'blocked'); assert.equal(p.plans.length, 0);
  const save = deferred(); const w = setup(t, { write: () => save.promise, readTimeoutMs: 10 });
  await w.controller.reconcile(); const writing = w.controller.update(on); await flush();
  t.mock.timers.tick(100_000); assert.equal(w.controller.getSnapshot().status, 'saving');
  save.resolve({ status: 'not-saved' }); await writing;
});

test('malformed preference data and corrupt reads never schedule or save', async t => {
  const s = setup(t); await s.controller.reconcile(); s.plans.length = 0;
  assert.equal((await s.controller.update({ enabled: true, weekly: { hour: 99 } })).status, 'invalid');
  assert.equal(s.writes.length, 0); assert.equal(s.plans.length, 0);
  const corrupt = setup(t, { read: async () => ({ value: on, revision: '' }) });
  assert.equal((await corrupt.controller.reconcile()).status, 'blocked'); assert.equal(corrupt.plans.length, 0);
  for (const value of [{ get enabled() { throw new Error('accessor'); } }, new Date(), { a: NaN }]) {
    const unsafe = setup(t, { parse: () => value });
    assert.equal((await unsafe.controller.reconcile()).status, 'blocked');
  }
});

test('observer errors and reentrant suspend cannot trigger an unwanted write', async t => {
  const s = setup(t); await s.controller.reconcile();
  s.controller.subscribe(() => { throw new Error('render failed'); });
  s.controller.subscribe(() => { if (s.controller.getSnapshot().status === 'saving') s.controller.suspend(); });
  assert.equal((await s.controller.update(on)).status, 'reconciliation-required');
  assert.equal(s.writes.length, 0);
});

test('disposal during device application leaves the outcome explicit without rollback or observer updates', async t => {
  const pending = deferred(); let applying = false;
  const s = setup(t, { apply: () => applying ? pending.promise : Promise.resolve() });
  await s.controller.reconcile(); applying = true;
  const work = s.controller.update(on); await flush(); s.controller.dispose();
  pending.resolve(); assert.equal((await work).status, 'disposed');
  assert.equal(s.controller.getSnapshot().status, 'disposed');
  assert.equal(s.controller.getSnapshot().value, null); assert.equal(s.writes.length, 1);
});
