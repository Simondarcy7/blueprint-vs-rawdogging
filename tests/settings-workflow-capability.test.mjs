import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { join } from 'node:path';
import ts from 'typescript';
import { capabilityFixture } from './helpers/capability-fixture.mjs';

const fixture = await capabilityFixture(['product-workflows']);
after(fixture.cleanup);
const { createSettingsWorkflow } = await fixture.load('modules/product-workflows/settingsWorkflowController.ts');
const fields = [{ id: 'format', label: 'Format', options: [{ value: 'short', label: 'Short' }, { value: 'long', label: 'Long' }] }];
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
function setup(t, overrides = {}) {
  let stored = { format: 'short' }; const writes = [];
  const controller = createSettingsWorkflow({ fields, adapter: {
    read: async () => stored,
    save: async values => { writes.push(values); stored = values; return 'saved'; }, ...overrides,
  } });
  t.after(() => controller.dispose());
  return { controller, writes, setStored: value => { stored = value; } };
}

test('installed settings controller passes strict TypeScript', () => {
  const program = ts.createProgram([join(fixture.root, 'src/modules/product-workflows/settingsWorkflowController.ts')], {
    noEmit: true, strict: true, noUncheckedIndexedAccess: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true, types: [],
  });
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')), []);
});
test('loads without writing defaults; validates edits and commits only an acknowledged immutable draft', async t => {
  const pending = deferred(); const s = setup(t, { save: () => pending.promise });
  assert.equal(s.controller.edit('format', 'long'), false);
  await s.controller.reload(); assert.equal(s.writes.length, 0);
  assert.equal(s.controller.edit('format', 'invalid'), false);
  assert.equal(s.controller.edit('format', 'long'), true);
  const operation = s.controller.save();
  assert.equal(s.controller.getSnapshot().committed.format, 'short');
  assert.equal(s.controller.getSnapshot().saved, false);
  assert.equal(s.controller.edit('format', 'short'), false);
  assert.equal(await s.controller.save(), false);
  assert.throws(() => { s.controller.getSnapshot().draft.format = 'short'; }, TypeError);
  pending.resolve('saved'); assert.equal(await operation, true);
  assert.equal(s.controller.getSnapshot().committed.format, 'long'); assert.equal(s.controller.getSnapshot().saved, true);
});
test('known failed save retains input and permits an explicit retry', async t => {
  let succeed = false; const s = setup(t, { save: async () => succeed ? 'saved' : 'not-saved' });
  await s.controller.reload(); s.controller.edit('format', 'long');
  assert.equal(await s.controller.save(), false); assert.equal(s.controller.getSnapshot().error, 'save');
  assert.equal(s.controller.getSnapshot().draft.format, 'long');
  succeed = true; assert.equal(await s.controller.save(), true);
});
test('unknown or thrown save blocks mutation until authoritative reconciliation without losing the draft', async t => {
  for (const outcome of ['unknown', 'throw', 'invalid']) {
    const s = setup(t, { save: async () => { if (outcome === 'throw') throw new Error('private provider response'); return outcome; } });
    await s.controller.reload(); s.controller.edit('format', 'long'); await s.controller.save();
    assert.equal(s.controller.getSnapshot().status, 'uncertain');
    assert.equal(s.controller.edit('format', 'short'), false); assert.equal(await s.controller.save(), false);
    assert.equal(await s.controller.reload(), true);
    assert.equal(s.controller.getSnapshot().draft.format, 'long'); assert.equal(s.controller.getSnapshot().dirty, true);
    assert.equal(s.controller.getSnapshot().saved, false);
  }
});
test('reconciliation observes a completed uncertain write without reapplying it', async t => {
  const s = setup(t, { save: async () => 'unknown' });
  await s.controller.reload(); s.controller.edit('format', 'long'); await s.controller.save();
  s.setStored({ format: 'long' }); await s.controller.reload();
  assert.equal(s.controller.getSnapshot().dirty, false); assert.equal(s.controller.getSnapshot().committed.format, 'long');
  assert.equal(await s.controller.save(), false);
});
test('malformed stored data and failed reads never enable default overwrites', async t => {
  const s = setup(t); s.setStored({ format: 'bogus' });
  assert.equal(await s.controller.reload(), false); assert.equal(s.controller.getSnapshot().error, 'read');
  assert.equal(s.controller.getSnapshot().draft, null); assert.equal(await s.controller.save(), false);
  s.setStored({ format: 'long' }); assert.equal(await s.controller.reload(), true);
});
test('cancellation clears scope data and ignores late reads and writes, while allowing effect replay', async t => {
  const pending = deferred(); let first = true;
  const s = setup(t, { read: () => first ? (first = false, pending.promise) : Promise.resolve({ format: 'long' }) });
  const reading = s.controller.reload(); await flush(); s.controller.cancel();
  await s.controller.reload(); pending.resolve({ format: 'short' }); await reading;
  assert.equal(s.controller.getSnapshot().draft.format, 'long');
  const writing = deferred(); const second = setup(t, { save: () => writing.promise });
  await second.controller.reload(); second.controller.edit('format', 'long'); const operation = second.controller.save();
  second.controller.cancel(); writing.resolve('saved'); assert.equal(await operation, false);
  assert.equal(second.controller.getSnapshot().draft, null); assert.equal(second.controller.getSnapshot().saved, false);
});
test('a reentrant observer can cancel before a write is dispatched', async t => {
  const s = setup(t); await s.controller.reload(); s.controller.edit('format', 'long');
  s.controller.subscribe(() => { if (s.controller.getSnapshot().status === 'saving') s.controller.cancel(); });
  assert.equal(await s.controller.save(), false); assert.equal(s.writes.length, 0);
});
test('a hung read reaches a retryable error and a late reply cannot overwrite retry', async t => {
  let first = true; const pending = deferred();
  const controller = createSettingsWorkflow({ fields, readTimeoutMs: 5, adapter: {
    read: () => first ? (first = false, pending.promise) : Promise.resolve({ format: 'long' }), save: async () => 'saved',
  } }); t.after(() => controller.dispose());
  assert.equal(await controller.reload(), false); assert.equal(controller.getSnapshot().error, 'read');
  await controller.reload(); pending.resolve({ format: 'short' }); await flush();
  assert.equal(controller.getSnapshot().draft.format, 'long');
});
