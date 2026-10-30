import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { after, test } from 'node:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capabilityFixture } from './helpers/capability-fixture.mjs';

const fixture = await capabilityFixture(['undo']);
after(fixture.cleanup);
const { createUndoController } = await fixture.load('services/undo/undoController.ts');
const item = (id, title = id, readAt = null) => ({ id, title, readAt });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function parse(value) {
  if (!value || typeof value.id !== 'string' || typeof value.title !== 'string'
    || !(value.readAt === null || typeof value.readAt === 'string')) throw new Error('Invalid item');
  return { id: value.id, title: value.title, readAt: value.readAt };
}
function setup(options = {}) {
  let items = [item('old')]; let owner = 'account-a:1'; let calls = 0;
  let before = async () => {}; let mode = 'success';
  const storage = {
    async transact(update, context) {
      calls++;
      await before(context);
      if (!context.isCurrent() || mode === 'reject') return 'not-committed';
      let next;
      try { next = update(items); } catch { return 'not-committed'; }
      if (!context.isCurrent()) return 'not-committed';
      if (mode === 'unknown-before') throw new Error('Unknown acknowledgement');
      items = next;
      if (mode === 'owner-after') owner = 'account-b:1';
      if (mode === 'unknown-after') throw new Error('Unknown acknowledgement');
      return 'committed';
    },
  };
  const controller = createUndoController({ owner, getOwner: () => owner, parse, getId: value => value.id, storage, ...options });
  return { controller, storage, items: () => items, set: value => { items = value; }, owner: value => { owner = value; },
    before: value => { before = value; }, mode: value => { mode = value; }, calls: () => calls };
}

test('restore preserves new arrivals and current edits, keeping one entry per identity', async () => {
  const s = setup(); s.set([item('old'), item('shared', 'original')]);
  assert.deepEqual(await s.controller.clear(), { status: 'committed', kind: 'clear', count: 2, current: true });
  s.set([item('arrival'), item('shared', 'edited after clear')]);
  await s.controller.restore();
  assert.deepEqual(s.items(), [item('arrival'), item('shared', 'edited after clear'), item('old')]);
  assert.deepEqual(await s.controller.restore(), { status: 'empty', current: true });
});

test('a domain merge preserves read acknowledgements without reverting newer content', async () => {
  const s = setup({ merge: (current, removed) => ({ ...current, readAt: current.readAt ?? removed.readAt }) });
  s.set([item('old', 'original', 'read-before-clear')]); await s.controller.clear();
  s.set([item('arrival'), item('old', 'new title')]); await s.controller.restore();
  assert.deepEqual(s.items(), [item('arrival'), item('old', 'new title', 'read-before-clear')]);
});

test('atomic update receives arrivals made while an async restore is waiting', async () => {
  const s = setup(); await s.controller.clear(); const gate = deferred();
  s.before(() => gate.promise); const restoring = s.controller.restore();
  s.set([item('arrived-during-wait')]); gate.resolve(); await restoring;
  assert.deepEqual(s.items().map(value => value.id), ['arrived-during-wait', 'old']);
});

test('failed restore retains recovery for retry and repeated clear of empty data keeps it', async () => {
  const s = setup(); await s.controller.clear(); await s.controller.clear();
  assert.equal(s.controller.getSnapshot().count, 1);
  s.mode('reject'); assert.equal((await s.controller.restore()).status, 'retryable');
  assert.equal(s.controller.getSnapshot().canUndo, true); assert.deepEqual(s.items(), []);
  s.set([item('arrival')]); s.mode('success'); await s.controller.restore();
  assert.deepEqual(s.items().map(value => value.id), ['arrival', 'old']);
});

test('a failed second clear preserves the earlier offer and does not erase arrivals', async () => {
  const s = setup(); await s.controller.clear(); s.set([item('arrival')]); s.mode('reject');
  assert.equal((await s.controller.clear()).status, 'retryable'); assert.equal(s.controller.getSnapshot().count, 1);
  s.mode('success'); await s.controller.restore();
  assert.deepEqual(s.items().map(value => value.id), ['arrival', 'old']);
});

test('same action coalesces, opposing action refuses while busy, including reentrant listeners', async () => {
  const s = setup(); const gate = deferred(); s.before(() => gate.promise);
  let reentrant;
  s.controller.subscribe(() => { if (s.controller.getSnapshot().status === 'busy') reentrant = s.controller.clear(); });
  const first = s.controller.clear(); assert.equal(first, s.controller.clear()); assert.equal(first, reentrant);
  assert.equal((await s.controller.restore()).status, 'busy'); gate.resolve(); await first;
  assert.equal(s.calls(), 1);
});

test('discard and disposal fence pending commits and drop recovery', async () => {
  for (const action of ['discard', 'dispose']) {
    const s = setup(); await s.controller.clear(); const gate = deferred(); s.before(() => gate.promise);
    const restoring = s.controller.restore(); s.controller[action](); gate.resolve();
    assert.equal((await restoring).status, 'stale'); assert.deepEqual(s.items(), []);
    assert.equal(s.controller.getSnapshot().canUndo, false);
  }
});

test('an owner or lease generation change prevents restoration into another session', async () => {
  for (const owner of ['account-b:1', 'account-a:2']) {
    const s = setup(); await s.controller.clear(); const gate = deferred(); s.before(() => gate.promise);
    const restoring = s.controller.restore(); s.owner(owner); gate.resolve();
    assert.equal((await restoring).status, 'stale'); assert.deepEqual(s.items(), []);
    assert.equal(s.controller.getSnapshot().count, 0); assert.equal(s.controller.getSnapshot().error, 'ownership');
  }
});

test('an accepted commit after owner change reports truth without exposing a new undo offer', async () => {
  const s = setup(); s.mode('owner-after');
  assert.deepEqual(await s.controller.clear(), { status: 'committed', kind: 'clear', count: 1, current: false });
  assert.deepEqual(s.items(), []); assert.equal(s.controller.getSnapshot().canUndo, false);
});

test('a transaction checks ownership after preparing its update and before committing', async () => {
  let owner = 'a:1'; let items = [item('old')]; const ready = deferred(); const finish = deferred();
  const controller = createUndoController({ owner, getOwner: () => owner, parse, getId: value => value.id,
    storage: { async transact(update, context) {
      const next = update(items); ready.resolve(); await finish.promise;
      if (!context.isCurrent()) return 'not-committed';
      items = next; return 'committed';
    } },
  });
  const clearing = controller.clear(); await ready.promise; owner = 'b:1'; finish.resolve();
  assert.equal((await clearing).status, 'stale'); assert.deepEqual(items, [item('old')]);
  assert.equal(controller.getSnapshot().count, 0);
});

test('unknown clear outcome blocks replay until host reconciliation, then restores only cleared items', async () => {
  const s = setup(); s.mode('unknown-after'); assert.equal((await s.controller.clear()).status, 'unknown');
  assert.equal(s.controller.getSnapshot().status, 'uncertain'); assert.equal(s.controller.getSnapshot().operationId, 1);
  s.set([item('arrival')]); assert.equal((await s.controller.clear()).status, 'unknown'); assert.equal(s.calls(), 1);
  assert.equal(s.controller.resolveUnknown(true), true); s.mode('success'); await s.controller.restore();
  assert.deepEqual(s.items().map(value => value.id), ['arrival', 'old']);
});

test('proven uncommitted unknown restore keeps the offer for explicit retry', async () => {
  const s = setup(); await s.controller.clear(); s.mode('unknown-before'); await s.controller.restore();
  assert.equal(s.controller.getSnapshot().canUndo, false); assert.equal(s.controller.resolveUnknown(false), true);
  assert.equal(s.controller.getSnapshot().canUndo, true); s.mode('success'); await s.controller.restore();
  assert.deepEqual(s.items(), [item('old')]);
});

test('discard after uncertain outcome forgets recovery without claiming rollback', async () => {
  const s = setup(); s.mode('unknown-after'); await s.controller.clear(); s.controller.discard();
  assert.equal(s.controller.getSnapshot().status, 'idle'); assert.deepEqual(s.items(), []);
  assert.equal(s.controller.resolveUnknown(true), false);
});

test('corrupt collections, duplicate IDs, byte/item limits and invalid merges do not commit', async () => {
  for (const data of [[item('x'), item('x')], [{ id: 'x', title: 1, readAt: null }], Array(1)]) {
    const s = setup(); s.set(data); assert.equal((await s.controller.clear()).status, 'retryable');
    assert.equal(s.controller.getSnapshot().error, 'invalid'); assert.equal(s.items(), data);
  }
  for (const options of [{ maxItems: 1 }, { maxBytes: 60 }]) {
    const s = setup(options); await s.controller.clear(); s.set([item('arrival')]);
    assert.equal((await s.controller.restore()).status, 'retryable'); assert.equal(s.controller.getSnapshot().count, 1);
    assert.deepEqual(s.items(), [item('arrival')]);
  }
  const s = setup({ merge: current => ({ ...current, id: 'different' }) }); await s.controller.clear(); s.set([item('old')]);
  assert.equal((await s.controller.restore()).status, 'retryable'); assert.deepEqual(s.items(), [item('old')]);
});

test('captured values are detached; getters, cycles and mutable parser aliases cannot change recovery', async () => {
  const original = item('old'); const s = setup({ parse: value => value }); s.set([original]); await s.controller.clear();
  original.title = 'mutated'; await s.controller.restore(); assert.equal(s.items()[0].title, 'old');
  let getterCalls = 0; const accessor = { id: 'x', get title() { getterCalls++; return 'title'; }, readAt: null };
  s.set([accessor]); assert.equal((await s.controller.clear()).status, 'retryable'); assert.equal(getterCalls, 0);
  const cycle = item('cycle'); cycle.self = cycle; s.set([cycle]); assert.equal((await s.controller.clear()).status, 'retryable');
});

test('transaction conflict retries capture the final clear snapshot rather than an earlier read', async () => {
  let items = [item('old')];
  const controller = createUndoController({ owner: 'guest:1', getOwner: () => 'guest:1', parse, getId: value => value.id,
    storage: { async transact(update, context) {
      if (context.kind === 'clear') { update(items); items = [...items, item('arrival-before-commit')]; }
      items = update(items); return 'committed';
    } },
  });
  await controller.clear(); assert.equal(controller.getSnapshot().count, 2); await controller.restore();
  assert.deepEqual(items.map(value => value.id), ['old', 'arrival-before-commit']);
});

test('invalid configuration is rejected and snapshots are stable, frozen and observer safe', async () => {
  for (const options of [{ owner: '' }, { maxItems: 0 }, { maxItems: Infinity }, { maxBytes: 0 }, { maxBytes: NaN }])
    assert.throws(() => setup(options));
  const s = setup(); const initial = s.controller.getSnapshot(); assert.equal(initial, s.controller.getSnapshot());
  assert.throws(() => { initial.count = 9; });
  s.controller.subscribe(() => { throw new Error('Observer failed'); }); await s.controller.clear();
  assert.equal(s.controller.getSnapshot().canUndo, true);
});

test('standalone installed undo pack passes strict TypeScript', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/typescript/lib/tsc.js', import.meta.url)),
    '--noEmit', '--strict', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
    join(fixture.root, 'src/services/undo/undoController.ts')], { stdio: 'pipe' });
});
