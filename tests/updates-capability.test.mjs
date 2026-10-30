import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import ts from 'typescript';

// Exercise the installed layout, including the existing baseline deadline helper.
const fixture = await mkdtemp(join(tmpdir(), 'blueprint-updates-'));
after(() => rm(fixture, { recursive: true, force: true }));
await mkdir(join(fixture, 'src/services/updates'), { recursive: true });
await mkdir(join(fixture, 'src/lib'), { recursive: true });
const assets = new URL('../codex/skills/mature-app-starter/assets/', import.meta.url);
for (const file of ['launchUpdate.ts', 'expoAdapter.ts']) {
  await copyFile(new URL(`app-capabilities/updates/src/services/updates/${file}`, assets), join(fixture, 'src/services/updates', file));
}
await copyFile(new URL('app-baseline/src/lib/asyncWork.ts', assets), join(fixture, 'src/lib/asyncWork.ts'));
const { createLaunchUpdateController } = await import(pathToFileURL(join(fixture, 'src/services/updates/launchUpdate.ts')));
const { createExpoUpdateAdapter } = await import(pathToFileURL(join(fixture, 'src/services/updates/expoAdapter.ts')));
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function setup(t, options = {}) {
  const calls = [];
  const adapter = {
    enabled: true,
    check: async () => { calls.push('check'); return { isAvailable: true }; },
    download: async () => { calls.push('download'); return { isNew: true }; },
    reload: async () => { calls.push('reload'); },
    ...options.adapter,
  };
  const controller = createLaunchUpdateController({ isActive: () => true, ...options, adapter });
  t.after(() => controller.dispose());
  return { controller, calls };
}

test('installed update capability and its baseline dependency pass strict TypeScript', () => {
  const program = ts.createProgram(['launchUpdate.ts', 'expoAdapter.ts'].map(file => join(fixture, 'src/services/updates', file)), {
    noEmit: true, strict: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true, types: [],
  });
  const errors = ts.getPreEmitDiagnostics(program);
  assert.deepEqual(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')), []);
});

test('one application-scoped controller coalesces concurrent starts and component remounts', async t => {
  const { controller, calls } = setup(t);
  const seen = [];
  const unsubscribe = controller.subscribe(() => seen.push(controller.getSnapshot()));
  const first = controller.start();
  assert.equal(controller.start(), first);
  await first;
  unsubscribe();
  const stop = controller.subscribe(() => {});
  assert.equal(controller.start(), first);
  await controller.start();
  stop();
  assert.deepEqual(calls, ['check', 'download', 'reload']);
  assert.deepEqual(seen, ['reloading']);
});

test('no update opens once and a later remount cannot replace an interactive app', async t => {
  let checks = 0;
  const { controller, calls } = setup(t, { adapter: { check: async () => ({ isAvailable: ++checks > 1 }) } });
  await controller.start();
  assert.equal(controller.getSnapshot(), 'ready');
  await controller.start();
  assert.equal(checks, 1);
  assert.deepEqual(calls, []);
});

test('hung check opens the gate at the startup deadline and bounds background work', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  const { controller, calls } = setup(t, { windowMs: 5, checkTimeoutMs: 15, adapter: { check: async next => { signal = next; return new Promise(() => {}); } } });
  const work = controller.start();
  await flush();
  t.mock.timers.tick(5);
  assert.equal(controller.getSnapshot(), 'ready');
  t.mock.timers.tick(10);
  await work;
  assert.equal(signal.aborted, true);
  assert.deepEqual(calls, []);
});

test('hung download cannot block the app and its deadline aborts the adapter signal', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  const { controller, calls } = setup(t, { windowMs: 5, downloadTimeoutMs: 20, adapter: { download: async next => { signal = next; return new Promise(() => {}); } } });
  const work = controller.start();
  await flush();
  t.mock.timers.tick(5);
  assert.equal(controller.getSnapshot(), 'ready');
  t.mock.timers.tick(15);
  await work;
  assert.equal(signal.aborted, true);
  assert.deepEqual(calls, ['check']);
});

test('late successful download waits for a future launch even if the clock moves backward', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const download = deferred();
  const { controller, calls } = setup(t, { now: () => 100, windowMs: 5, adapter: { download: () => download.promise } });
  const work = controller.start();
  await flush();
  t.mock.timers.tick(5);
  download.resolve({ isNew: true });
  await work;
  assert.equal(controller.getSnapshot(), 'ready');
  assert.deepEqual(calls, ['check']);
});

test('background apps download without reload; foregrounding does not start another attempt', async t => {
  let active = false;
  const { controller, calls } = setup(t, { isActive: () => active });
  await controller.start();
  active = true;
  await controller.start();
  assert.equal(controller.getSnapshot(), 'ready');
  assert.deepEqual(calls, ['check', 'download']);
});

test('host exposing content before download completes permanently closes the reload window', async t => {
  const download = deferred();
  const { controller, calls } = setup(t, { adapter: { download: () => download.promise } });
  const work = controller.start();
  await flush();
  controller.markInteractive();
  download.resolve({ isNew: true });
  await work;
  assert.equal(controller.getSnapshot(), 'ready');
  assert.deepEqual(calls, ['check']);
});

test('disabled, zero-window and already-expired controllers do not call the SDK', async t => {
  let time = 0;
  for (const options of [{ adapter: { enabled: false } }, { windowMs: 0 }, { now: () => time, windowMs: 5 }]) {
    time = 0;
    const { controller, calls } = setup(t, options);
    time = 10;
    await controller.start();
    assert.equal(controller.getSnapshot(), 'ready');
    assert.deepEqual(calls, []);
  }
});

test('check, download and reload rejections return readiness without escaping', async t => {
  for (const name of ['check', 'download', 'reload']) {
    const { controller } = setup(t, { adapter: { [name]: async () => { throw new Error('offline'); } } });
    await controller.start();
    assert.equal(controller.getSnapshot(), 'ready');
  }
});

test('no-new-update result does not reload', async t => {
  const { controller, calls } = setup(t, { adapter: { download: async () => ({ isNew: false }) } });
  await controller.start();
  assert.equal(controller.getSnapshot(), 'ready');
  assert.deepEqual(calls, ['check']);
});

test('cancel or disposal settles ignored-abort work and prevents late downloads/reloads', async t => {
  for (const stop of ['cancel', 'dispose']) {
    const check = deferred();
    let signal;
    const { controller, calls } = setup(t, { adapter: { check: next => { signal = next; return check.promise; } } });
    const work = controller.start();
    await flush();
    controller[stop]();
    await work;
    assert.equal(signal.aborted, true);
    assert.equal(controller.getSnapshot(), 'ready');
    check.resolve({ isAvailable: true });
    await flush();
    await controller.start();
    assert.deepEqual(calls, []);
  }
});

test('synchronous cancellation by a reloading observer prevents the native call', async t => {
  const { controller, calls } = setup(t);
  controller.subscribe(() => { if (controller.getSnapshot() === 'reloading') controller.cancel(); });
  await controller.start();
  assert.equal(controller.getSnapshot(), 'ready');
  assert.deepEqual(calls, ['check', 'download']);
});

test('a foreground-reader failure after reloading is published opens the app without reload', async t => {
  let reads = 0;
  const { controller, calls } = setup(t, { isActive: () => {
    if (++reads === 2) throw new Error('Foreground state unavailable');
    return true;
  } });
  await controller.start();
  assert.equal(controller.getSnapshot(), 'ready');
  assert.deepEqual(calls, ['check', 'download']);
});

test('an accepted but unresolved reload never exposes an interactive app on timeout', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const reload = deferred();
  const { controller } = setup(t, { windowMs: 5, adapter: { reload: () => reload.promise } });
  const work = controller.start();
  await flush();
  assert.equal(controller.getSnapshot(), 'reloading');
  t.mock.timers.tick(1000);
  assert.equal(controller.getSnapshot(), 'reloading');
  reload.reject(new Error('native reload failed'));
  await work;
  assert.equal(controller.getSnapshot(), 'ready');
});

test('invalid deadlines and clocks are rejected before work', () => {
  const adapter = { enabled: true };
  for (const field of ['windowMs', 'checkTimeoutMs', 'downloadTimeoutMs']) {
    for (const value of [-1, NaN, Infinity, 2_147_483_648])
      assert.throws(() => createLaunchUpdateController({ adapter, isActive: () => true, [field]: value }), /duration/);
  }
  assert.throws(() => createLaunchUpdateController({ adapter, isActive: () => true, checkTimeoutMs: 0 }), /duration/);
  assert.throws(() => createLaunchUpdateController({ adapter, isActive: () => true, now: () => NaN }), /clock/);
});

test('Expo adapter maps the SDK and refuses work that was already cancelled', async () => {
  const calls = [];
  const adapter = createExpoUpdateAdapter({
    isEnabled: true,
    checkForUpdateAsync: async () => { calls.push('check'); return { isAvailable: true }; },
    fetchUpdateAsync: async () => { calls.push('fetch'); return { isNew: true }; },
    reloadAsync: async () => { calls.push('reload'); },
  });
  const controller = new AbortController();
  assert.equal(adapter.enabled, true);
  await adapter.check(controller.signal);
  await adapter.download(controller.signal);
  await adapter.reload();
  controller.abort();
  assert.throws(() => adapter.check(controller.signal), /cancelled/);
  assert.throws(() => adapter.download(controller.signal), /cancelled/);
  assert.deepEqual(calls, ['check', 'fetch', 'reload']);
});
