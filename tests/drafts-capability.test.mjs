import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { join } from 'node:path';
import ts from 'typescript';
import { capabilityFixture } from './helpers/capability-fixture.mjs';

const fixture = await capabilityFixture(['drafts']);
after(fixture.cleanup);
const { createDraftController } = await fixture.load('services/drafts/draftController.ts');
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const parse = input => {
  if (!input || typeof input !== 'object' || typeof input.title !== 'string' || !Array.isArray(input.tags) || !input.tags.every(tag => typeof tag === 'string')) throw new Error('Invalid draft payload');
  return { title: input.title, tags: [...input.tags] };
};
const initial = { title: '', tags: [] };
function setup(overrides = {}) {
  let raw = null;
  const writes = [];
  const storage = { read: async () => raw, write: async next => { writes.push(next); raw = next; }, remove: async () => { raw = null; } };
  const options = { owner: 'guest', draftId: 'one', initial, parse, storage, ...overrides };
  return { controller: createDraftController(options), options, storage, writes, raw: () => raw, inject: next => { raw = next; } };
}
const stored = (value, extra = {}) => JSON.stringify({ version: 1, owner: 'guest', draftId: 'one', baseline: JSON.stringify(initial), revision: 5, value, ...extra });

for (const explicitRecovery of [false, true]) {
  test(`stored revision cannot exhaust the live edit/discard counter (${explicitRecovery ? 'explicit recovery' : 'hydration'})`, async () => {
    const s = setup();
    s.inject(stored({ title: 'Recovered work', tags: [] }, { revision: Number.MAX_SAFE_INTEGER }));
    if (explicitRecovery) s.controller.set({ title: 'New input', tags: [] });
    assert.equal(await s.controller.load(), true);
    if (explicitRecovery) s.controller.recover();
    assert.equal(s.controller.getSnapshot().value.title, 'Recovered work');
    assert.equal(s.controller.getSnapshot().saved, true);
    assert.doesNotThrow(() => s.controller.set({ title: 'Still editable', tags: ['safe'] }));
    assert.equal(await s.controller.save(), true);
    assert.equal(await s.controller.clear(), true);
    assert.deepEqual(s.controller.getSnapshot().value, initial);
    assert.equal(s.raw(), null);
  });
}

test('installed draft controller passes strict TypeScript', () => {
  const program = ts.createProgram([join(fixture.root, 'src/services/drafts/draftController.ts')], {
    noEmit: true, strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true, types: [],
  });
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')), []);
});

test('draft remains separate from initial data, persists and reopens as verified saved input', async () => {
  const s = setup(); await s.controller.load();
  s.controller.set({ title: 'Keep this', tags: ['one'], privateExtra: 'drop' });
  assert.deepEqual(initial, { title: '', tags: [] });
  assert.equal(s.controller.getSnapshot().dirty, true); assert.equal(s.controller.getSnapshot().saved, false);
  assert.equal(await s.controller.save(), true); assert.equal(s.controller.getSnapshot().saved, true);
  assert.equal(s.raw().includes('privateExtra'), false);
  const reopened = createDraftController(s.options); await reopened.load();
  assert.deepEqual(reopened.getSnapshot().value, { title: 'Keep this', tags: ['one'] });
  assert.equal(reopened.getSnapshot().saved, true); assert.equal(reopened.getSnapshot().dirty, false);
});

test('snapshots are stable between transitions and deeply frozen; caller mutation cannot bypass revision', async () => {
  const s = setup(); await s.controller.load();
  const input = { title: 'Original', tags: ['one'] }; s.controller.set(input);
  input.title = 'Changed'; input.tags.push('two');
  const snapshot = s.controller.getSnapshot();
  assert.equal(snapshot, s.controller.getSnapshot());
  assert.deepEqual(snapshot.value, { title: 'Original', tags: ['one'] });
  assert.throws(() => { snapshot.value.title = 'bypass'; }, TypeError);
  assert.throws(() => snapshot.value.tags.push('bypass'), TypeError);
  await s.controller.save(); assert.equal(s.controller.getSnapshot().saved, true);
});

test('mutable class instances from a codec are rejected instead of presenting a falsely immutable snapshot', () => {
  assert.throws(() => createDraftController({ owner: 'guest', draftId: 'one', initial: {},
    parse: () => ({ date: new Date(0) }), storage: { read: async () => null, write: async () => {}, remove: async () => {} },
  }), /plain JSON data/);
});

test('codec accessors are rejected without invocation and cannot change an acknowledged snapshot', async () => {
  let unsafe = false; let external = 'Changed elsewhere'; let reads = 0;
  const s = setup({ parse: input => {
    if (!unsafe) return parse(input);
    return { get title() { reads++; return external; }, tags: [] };
  } });
  await s.controller.load(); s.controller.set({ title: 'Verified', tags: ['one'] }); await s.controller.save();
  const before = s.controller.getSnapshot(); unsafe = true;
  assert.throws(() => s.controller.set({ title: 'Replacement', tags: [] }), /without accessors/);
  external = 'Another mutation';
  assert.equal(reads, 0); assert.equal(s.controller.getSnapshot(), before);
  assert.equal(before.value.title, 'Verified'); assert.equal(before.saved, true);
  for (const createUnsafe of [
    () => ({ nested: { get title() { reads++; return external; } } }),
    () => Object.defineProperty({}, 'hidden', { value: external, enumerable: false }),
  ]) assert.throws(() => setup({ parse: createUnsafe }), /plain JSON data/);
  assert.equal(reads, 0);
});

test('failed saves retain input and the prior stored draft, then recover on retry', async () => {
  const s = setup(); await s.controller.load(); s.controller.set({ title: 'First', tags: [] }); await s.controller.save();
  const prior = s.raw(); const write = s.storage.write; s.storage.write = async () => { throw new Error('disk full'); };
  s.controller.set({ title: 'Second', tags: [] });
  assert.equal(await s.controller.save(), false); assert.equal(s.raw(), prior);
  assert.equal(s.controller.getSnapshot().value.title, 'Second'); assert.equal(s.controller.getSnapshot().saved, false);
  assert.equal(s.controller.getSnapshot().error, 'save');
  s.storage.write = write; assert.equal(await s.controller.save(), true);
});

test('overlapping saves serialize immutable snapshots; an older receipt never marks newer input saved', async () => {
  const gate = deferred(); const started = deferred(); let calls = 0;
  const s = setup(); const write = s.storage.write;
  s.storage.write = async raw => { if (++calls === 1) { started.resolve(); await gate.promise; } await write(raw); };
  await s.controller.load(); s.controller.set({ title: 'One', tags: [] });
  const first = s.controller.save(); await started.promise;
  s.controller.set({ title: 'Two', tags: [] }); const second = s.controller.save();
  gate.resolve(); assert.equal(await first, false); assert.equal(await second, true);
  assert.deepEqual(s.writes.map(raw => JSON.parse(raw).value.title), ['One', 'Two']);
  assert.equal(s.controller.getSnapshot().saved, true); assert.equal(s.controller.getSnapshot().busy, false);
});

test('an edit during loading survives; stored recovery needs an explicit choice before overwrite', async () => {
  for (const choice of ['recover', 'keepCurrent']) {
    const read = deferred(); const s = setup({ storage: { read: () => read.promise, write: async () => {}, remove: async () => {} } });
    const loading = s.controller.load(); assert.equal(s.controller.load(), loading);
    s.controller.set({ title: 'Typed now', tags: [] });
    read.resolve(stored({ title: 'Earlier work', tags: [] })); await loading;
    assert.equal(s.controller.getSnapshot().value.title, 'Typed now');
    assert.equal(s.controller.getSnapshot().recovery.title, 'Earlier work');
    assert.equal(s.controller.getSnapshot().error, 'conflict'); assert.equal(await s.controller.save(), false);
    s.controller[choice]();
    assert.equal(s.controller.getSnapshot().value.title, choice === 'recover' ? 'Earlier work' : 'Typed now');
    assert.equal(s.controller.getSnapshot().recovery, null);
    assert.equal(await s.controller.save(), true);
  }
});

test('pre-load edits are also preserved and changed saved-record baseline is never silently restored', async () => {
  const s = setup({ baselineRevision: 'record-v2' });
  s.inject(stored({ title: 'Old record edit', tags: [] }, { baseline: 'record-v1' }));
  await s.controller.load();
  assert.equal(s.controller.getSnapshot().value.title, ''); assert.equal(s.controller.getSnapshot().recovery.title, 'Old record edit');
  assert.equal(await s.controller.save(), false);
  s.controller.recover(); assert.equal(s.controller.getSnapshot().dirty, true); assert.equal(s.controller.getSnapshot().saved, false);
  assert.equal(await s.controller.save(), true); assert.equal(JSON.parse(s.raw()).baseline, 'record-v2');
  const local = setup(); local.inject(stored({ title: 'Stored', tags: [] })); local.controller.set({ title: 'Before load', tags: [] });
  await local.controller.load(); assert.equal(local.controller.getSnapshot().value.title, 'Before load'); assert.ok(local.controller.getSnapshot().recovery);
});

test('corrupt, foreign-owner, future and invalid-payload drafts block writes and preserve raw storage', async () => {
  for (const raw of ['', '{broken', stored({ title: 'Value', tags: [] }, { version: 2 }), stored({ title: 'Value', tags: [] }, { owner: 'other' }), stored({ title: 'Value', tags: [] }, { draftId: 'other' }), stored({ title: 1, tags: [] })]) {
    const s = setup(); s.inject(raw); s.controller.set({ title: 'Unsaved', tags: [] });
    assert.equal(await s.controller.load(), false); assert.equal(s.controller.getSnapshot().status, 'blocked');
    assert.equal(s.controller.getSnapshot().error, 'corrupt'); assert.equal(await s.controller.save(), false);
    assert.equal(s.raw(), raw); assert.equal(s.controller.getSnapshot().value.title, 'Unsaved');
  }
});

test('load failure can retry without losing current input', async () => {
  const s = setup(); const read = s.storage.read; s.storage.read = async () => { throw new Error('unavailable'); };
  s.controller.set({ title: 'Local', tags: [] }); assert.equal(await s.controller.load(), false);
  assert.equal(s.controller.getSnapshot().error, 'read'); s.storage.read = read;
  assert.equal(await s.controller.load(), true); assert.equal(s.controller.getSnapshot().value.title, 'Local');
  assert.equal(await s.controller.save(), true);
});

test('clear waits for an active write, fences its receipt and removes it before reporting success', async () => {
  const gate = deferred(); const started = deferred(); const s = setup(); const write = s.storage.write;
  s.storage.write = async raw => { started.resolve(); await gate.promise; await write(raw); };
  await s.controller.load(); s.controller.set({ title: 'Pending', tags: [] }); const saving = s.controller.save();
  await started.promise; const clearing = s.controller.clear(); gate.resolve();
  assert.equal(await saving, false); assert.equal(await clearing, true); assert.equal(s.raw(), null);
  assert.deepEqual(s.controller.getSnapshot().value, initial); assert.equal(s.controller.getSnapshot().dirty, false); assert.equal(s.controller.getSnapshot().saved, false);
});

test('a queued old save cannot resurrect a cleared draft', async () => {
  const remove = deferred(); const started = deferred(); const s = setup();
  s.storage.remove = async () => { started.resolve(); await remove.promise; s.inject(null); };
  await s.controller.load(); s.controller.set({ title: 'Clear me', tags: [] }); await s.controller.save();
  const clearing = s.controller.clear(); await started.promise; const saving = s.controller.save();
  remove.resolve(); assert.equal(await clearing, true); assert.equal(await saving, false); assert.equal(s.raw(), null);
});

test('new edits and their queued save survive a clear that was already in progress', async () => {
  const remove = deferred(); const started = deferred(); const s = setup();
  s.storage.remove = async () => { started.resolve(); await remove.promise; s.inject(null); };
  await s.controller.load(); s.controller.set({ title: 'Old', tags: [] }); await s.controller.save();
  const clearing = s.controller.clear(); await started.promise;
  s.controller.set({ title: 'New', tags: [] }); const saving = s.controller.save();
  remove.resolve(); assert.equal(await clearing, true); assert.equal(await saving, true);
  assert.equal(s.controller.getSnapshot().value.title, 'New'); assert.equal(JSON.parse(s.raw()).value.title, 'New');
});

test('clear failure keeps edits; clear during pending load cannot leave a stuck loading state', async () => {
  const read = deferred(); const s = setup({ storage: { read: () => read.promise, write: async () => {}, remove: async () => { throw new Error('delete failed'); } } });
  const loading = s.controller.load(); s.controller.set({ title: 'Keep', tags: [] }); const clearing = s.controller.clear();
  read.resolve(stored({ title: 'Old', tags: [] })); await loading;
  assert.equal(await clearing, false); assert.equal(s.controller.getSnapshot().value.title, 'Keep');
  assert.equal(s.controller.getSnapshot().status, 'blocked'); assert.equal(s.controller.getSnapshot().busy, false);
  assert.equal(s.controller.getSnapshot().error, 'clear');
});

test('corrupt storage can only be discarded through explicit clear', async () => {
  const s = setup(); s.inject('{broken'); await s.controller.load();
  assert.equal(await s.controller.clear(), true); assert.equal(s.raw(), null);
  assert.equal(s.controller.getSnapshot().status, 'ready');
});

test('ownership loss after read or before queued write blocks applying data and changing storage', async () => {
  let owner = true; let writes = 0;
  const s = setup({ assertOwner: () => { if (!owner) throw new Error('owner changed'); }, storage: { read: async () => { owner = false; return null; }, write: async () => { writes++; }, remove: async () => {} } });
  assert.equal(await s.controller.load(), false); assert.equal(s.controller.getSnapshot().error, 'ownership');
  assert.throws(() => s.controller.set({ title: 'No', tags: [] }), /owner changed/);
  assert.equal(writes, 0);
  owner = true; const next = setup({ assertOwner: () => { if (!owner) throw new Error('owner changed'); } });
  await next.controller.load(); next.controller.set({ title: 'No', tags: [] }); const saving = next.controller.save(); owner = false;
  assert.equal(await saving, false); assert.equal(next.raw(), null);
});

test('disposal fences late hydration and save receipts while preserving stored data', async () => {
  const read = deferred(); const s = setup({ storage: { read: () => read.promise, write: async () => {}, remove: async () => {} } });
  const loading = s.controller.load(); s.controller.dispose(); read.resolve(stored({ title: 'Old owner', tags: [] }));
  assert.equal(await loading, false); assert.equal(s.controller.getSnapshot().status, 'disposed'); assert.equal(s.controller.getSnapshot().value.title, '');
  assert.throws(() => s.controller.set({ title: 'No', tags: [] }), /disposed/);
  const write = deferred(); const started = deferred(); const next = setup(); const persist = next.storage.write;
  next.storage.write = async raw => { started.resolve(); await write.promise; await persist(raw); };
  await next.controller.load(); next.controller.set({ title: 'Pending', tags: [] }); const saving = next.controller.save(); await started.promise;
  next.controller.dispose(); write.resolve(); assert.equal(await saving, false); assert.equal(next.controller.getSnapshot().saved, false);
});

test('saved status is no longer asserted after disposal or ownership loss', async () => {
  let owned = true; const s = setup({ assertOwner: () => { if (!owned) throw new Error('lost lease'); } });
  await s.controller.load(); s.controller.set({ title: 'Saved', tags: [] }); await s.controller.save();
  assert.equal(s.controller.getSnapshot().saved, true); owned = false;
  assert.equal(await s.controller.save(), false); assert.equal(s.controller.getSnapshot().saved, false);
  const next = setup(); await next.controller.load(); await next.controller.save(); next.controller.dispose();
  assert.equal(next.controller.getSnapshot().saved, false);
});

test('missing storage after ownership recovery invalidates the old receipt and retains live input as dirty', async () => {
  let owned = true;
  const s = setup({ assertOwner: () => { if (!owned) throw new Error('lost lease'); } });
  await s.controller.load(); s.controller.set({ title: 'Preserve this', tags: [] }); await s.controller.save();
  assert.equal(s.controller.getSnapshot().saved, true);
  owned = false; assert.equal(await s.controller.save(), false);
  s.inject(null); owned = true;
  assert.equal(await s.controller.load(), true);
  assert.equal(s.controller.getSnapshot().value.title, 'Preserve this');
  assert.equal(s.controller.getSnapshot().saved, false); assert.equal(s.controller.getSnapshot().dirty, true);
  assert.equal(s.raw(), null); assert.equal(await s.controller.save(), true);
  assert.equal(JSON.parse(s.raw()).value.title, 'Preserve this');
});

test('limits and invalid edits preserve the prior live value', async () => {
  for (const options of [{ owner: '' }, { draftId: '' }, { maxBytes: 0 }, { maxBytes: Infinity }]) assert.throws(() => setup(options));
  const s = setup({ maxBytes: 200 }); await s.controller.load();
  const before = s.controller.getSnapshot(); assert.throws(() => s.controller.set({ title: 5, tags: [] }));
  assert.equal(s.controller.getSnapshot(), before); assert.throws(() => s.controller.set({ title: '🌎'.repeat(100), tags: [] }), /limit/);
  s.controller.set({ title: 'x'.repeat(100), tags: [] }); assert.equal(await s.controller.save(), false); assert.equal(s.raw(), null);
});

test('observer failures are isolated and unsubscribe stops notifications', async () => {
  const s = setup(); let changes = 0;
  s.controller.subscribe(() => { throw new Error('observer'); }); const stop = s.controller.subscribe(() => { changes++; });
  await s.controller.load(); const count = changes; stop();
  s.controller.set({ title: 'Still works', tags: [] }); assert.equal(changes, count); assert.equal(await s.controller.save(), true);
});
