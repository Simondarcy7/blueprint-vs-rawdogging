import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGenerationGuard, createSerialTaskQueue, singleFlight, withDeadline } from '../codex/skills/mature-app-starter/assets/app-baseline/src/lib/asyncWork.ts';
import { createResourceCache } from '../codex/skills/mature-app-starter/assets/app-baseline/src/lib/resourceCache.ts';
import { createScrollMemory } from '../codex/skills/mature-app-starter/assets/app-baseline/src/modules/navigation/scrollMemory.ts';
import { scopedStorage, createOwnerScope } from '../codex/skills/mature-app-starter/assets/app-capabilities/storage/src/services/storage/ports.ts';
import { createBackupCodec, restoreBackup } from '../codex/skills/mature-app-starter/assets/app-capabilities/storage/src/services/storage/backup.ts';
import { createRecoveryJournal } from '../codex/skills/mature-app-starter/assets/app-capabilities/storage/src/services/storage/recoveryJournal.ts';
import { createChunkedStorage } from '../codex/skills/mature-app-starter/assets/app-capabilities/storage/src/services/storage/chunkedStorage.ts';
import { createInstallBoundStorage } from '../codex/skills/mature-app-starter/assets/app-capabilities/storage/src/services/storage/installBoundStorage.ts';
import { createDeviceActions } from '../codex/skills/mature-app-starter/assets/app-capabilities/device/src/services/device/actions.ts';
import { validateImageBudget } from '../codex/skills/mature-app-starter/assets/app-capabilities/device/src/services/device/imageBudget.ts';
import { createTemporaryFileLease } from '../codex/skills/mature-app-starter/assets/app-capabilities/device/src/services/device/temporaryFileLease.ts';
import { requestCapability, optionalHaptic } from '../codex/skills/mature-app-starter/assets/app-capabilities/device/src/services/device/permissions.ts';
import { createFeatureStore } from '../codex/skills/mature-app-starter/assets/app-capabilities/flags/src/services/features/featureStore.ts';
import { sanitizeEvent, sanitizeDiagnostic, createTelemetry } from '../codex/skills/mature-app-starter/assets/app-capabilities/diagnostics/src/services/observability/safeTelemetry.ts';
import { assertReleaseTarget, waitForRelease } from '../templates/scripts/release-tools.mjs';

const memory = () => {
  const data = new Map();
  return { data, getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async key => { data.delete(key); } };
};
const codec = () => createBackupCodec({ appId: 'example', schemaVersion: 1, maxBytes: 500, parseSnapshot(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.items) || !value.items.every(item => typeof item === 'string')) throw new Error('Invalid snapshot');
  return { items: [...value.items] };
} });

test('serial writes retain invocation order, read state at execution and recover from failure', async () => {
  const queue = createSerialTaskQueue();
  const calls = [];
  let release;
  let value = 0;
  const first = queue.run(async () => { calls.push('first'); await new Promise(resolve => { release = resolve; }); throw new Error('failed'); });
  const rejected = assert.rejects(first, /failed/);
  const second = queue.run(() => { calls.push('second'); value += 1; });
  const third = queue.run(() => { calls.push('third'); return value + 1; });
  await Promise.resolve();
  assert.deepEqual(calls, ['first']);
  release();
  await rejected;
  await second;
  assert.equal(await third, 2);
  assert.deepEqual(calls, ['first', 'second', 'third']);
});

test('stale tickets remain invalid after identity changes away and back', () => {
  const scope = createOwnerScope('one'); const ticket = scope.capture();
  scope.change('two'); scope.change('one'); assert.equal(ticket.isCurrent(), false);
  const guard = createGenerationGuard(); const current = guard.ticket(); guard.invalidate(); assert.equal(current(), false);
});
test('concurrent operations coalesce and can retry after failure', async () => {
  let calls = 0;
  const run = singleFlight(async () => { calls++; if (calls === 1) throw new Error('retry'); return 7; });
  const first = run(); assert.equal(run(), first); await assert.rejects(first);
  assert.equal(await run(), 7); assert.equal(calls, 2);
});
test('deadline rejects stalled work and requests abort', async () => {
  let signal;
  await assert.rejects(withDeadline(async received => { signal = received; return new Promise(() => {}); }, 5), /timed out/);
  assert.equal(signal.aborted, true);
  assert.equal(await withDeadline(async () => 3, 1000), 3);
  await assert.rejects(withDeadline(async () => 3, 0));
});
test('cache expires, evicts least-recently-used entries and clears identity data', () => {
  let now = 0; const cache = createResourceCache(2, () => now);
  cache.set('a', 1, 10); cache.set('b', 2, 10); cache.get('a'); cache.set('c', 3, 10);
  assert.equal(cache.get('b'), undefined); now = 10; assert.equal(cache.get('a'), undefined);
  cache.clear(); assert.equal(cache.get('c'), undefined);
});
test('scroll memory rejects invalid positions and bounds retained screens', () => {
  const positions = createScrollMemory(1); positions.write('first', 50); positions.write('second', 80);
  positions.write('second', NaN); assert.equal(positions.read('first'), 0); assert.equal(positions.read('second'), 80);
  positions.clear(); assert.equal(positions.read('second'), 0);
});
test('namespaces cannot collide through embedded separators', async () => {
  const base = memory(); await scopedStorage(base, 'a:b').setItem('c', 'one'); await scopedStorage(base, 'a').setItem('b:c', 'two');
  assert.equal(await scopedStorage(base, 'a:b').getItem('c'), 'one');
  assert.equal(await scopedStorage(base, 'a').getItem('b:c'), 'two');
});
test('backup validation rejects wrong schema, app and malformed data before replacement', async () => {
  const format = codec(); let calls = 0;
  const valid = format.encode({ items: ['hello'] });
  for (const raw of ['bad', valid.replace('example', 'different'), valid.replace('"schemaVersion":1', '"schemaVersion":2'), valid.replace('["hello"]', '[1]'), 'x'.repeat(501)]) {
    await assert.rejects(restoreBackup(raw, format.decode, async () => { calls++; }));
  }
  assert.equal(calls, 0); await restoreBackup(valid, format.decode, async value => { assert.deepEqual(value.items, ['hello']); calls++; }); assert.equal(calls, 1);
});
test('recovery history deduplicates, bounds retention and skips invalid newest snapshots', async () => {
  const storage = memory(); const format = codec();
  const journal = createRecoveryJournal({ storage, key: 'history', limit: 2, ...format });
  await journal.archive({ items: ['a'] }); await journal.archive({ items: ['a'] });
  assert.equal(JSON.parse(storage.data.get('history')).length, 1);
  await journal.archive({ items: ['b'] }); await journal.archive({ items: ['c'] });
  const rows = JSON.parse(storage.data.get('history')); rows[0] = 'corrupt'; storage.data.set('history', JSON.stringify(rows));
  assert.deepEqual(await journal.latest(), { items: ['b'] });
  await journal.clear(); assert.equal(await journal.latest(), null);
});
test('chunk writes preserve previous committed value on a failed manifest commit', async () => {
  const base = memory(); let id = 0; let fail = false;
  const storage = { ...base, setItem: async (key, value) => { if (fail && key.includes(':manifest:')) throw new Error('unavailable'); await base.setItem(key, value); } };
  const chunks = createChunkedStorage({ storage, prefix: 'session', chunkBytes: 8, maxChunks: 10, createGenerationId: () => `generation${++id}` });
  await chunks.setItem('key', 'hello 🌎🌎'); assert.equal(await chunks.getItem('key'), 'hello 🌎🌎');
  fail = true; await assert.rejects(chunks.setItem('key', 'new')); assert.equal(await chunks.getItem('key'), 'hello 🌎🌎');
  fail = false; await chunks.removeItem('key'); assert.equal(base.data.size, 0);
});
test('chunk storage distinguishes incomplete/corrupt data from missing data', async () => {
  const base = memory(); let id = 0;
  const chunks = createChunkedStorage({ storage: base, prefix: 'private', chunkBytes: 4, maxChunks: 2, createGenerationId: () => `generation${++id}` });
  await assert.rejects(chunks.setItem('k', '123456789'), /limit/);
  await chunks.setItem('k', '12345678');
  base.data.delete([...base.data.keys()].find(key => key.includes(':chunk:')));
  await assert.rejects(chunks.getItem('k'), /incomplete/);
});
test('installation binding rejects prior installation sessions and retries read failure', async () => {
  const ordinary = memory(); const secure = memory(); let fail = true;
  const build = id => createInstallBoundStorage({ installationKey: 'install', createInstallationId: () => id, installationStore: { ...ordinary, getItem: async key => { if (fail) throw new Error('offline'); return ordinary.getItem(key); } }, secureStore: secure });
  const first = build('installation000001'); await assert.rejects(first.setItem('session', 'private')); fail = false;
  await first.setItem('session', 'private'); assert.equal(await first.getItem('session'), 'private');
  ordinary.data.clear(); const second = build('installation000002'); assert.equal(await second.getItem('session'), null);
  assert.ok(secure.data.has('session')); await second.removeItem('session'); assert.equal(secure.data.size, 0);
});
test('device actions distinguish unsupported, cancelled, failed and confirmed outcomes', async () => {
  assert.deepEqual(await createDeviceActions({}).copyText('hello'), { status: 'unavailable' });
  const actions = createDeviceActions({ share: async () => 'cancelled', copyText: async () => { throw new Error('denied'); }, confirm: async () => false });
  assert.equal((await actions.share({ title: 'Example' })).status, 'cancelled');
  assert.equal((await actions.share({ title: 'Example', url: 'javascript:alert(1)' })).status, 'failed');
  assert.equal((await actions.copyText('hello')).status, 'failed');
  assert.equal((await actions.confirm({ title: 'Remove?', message: 'Remove item', confirmLabel: 'Remove', destructive: true })).value, false);
});

test('failed flag reload preserves values but blocks subsequent writes until recovery', async () => {
  let raw = null;
  const store = createFeatureStore({ enabled: false }, { read: async () => raw, write: async value => { raw = value; } });
  await store.load();
  await store.set('enabled', true);
  raw = '{broken';
  await assert.rejects(store.load());
  assert.equal(store.getSnapshot().ready, false);
  assert.equal(store.getSnapshot().flags.enabled, true);
  await assert.rejects(store.set('enabled', false));
  assert.equal(raw, '{broken');
  raw = null;
  await store.load();
  await store.set('enabled', true);
  assert.equal(store.getSnapshot().flags.enabled, true);
});
test('temporary leases keep failed cleanup retryable and release once', async () => {
  let fail = true; const removed = [];
  const lease = createTemporaryFileLease(async uri => { if (fail) throw new Error('busy'); removed.push(uri); });
  await lease.adopt('cache:one'); await assert.rejects(lease.adopt('cache:two')); assert.equal(lease.current(), 'cache:one');
  fail = false; await lease.adopt('cache:two'); await lease.release(); await lease.release();
  assert.deepEqual(removed, ['cache:one', 'cache:two']);
});
test('image limits reject unknown bytes, invalid dimensions and oversized input', () => {
  const limits = { maxBytes: 100, maxDimension: 20, maxPixels: 100 };
  assert.equal(validateImageBudget({ width: 10, height: 10 }, limits), 'unknown-size');
  assert.equal(validateImageBudget({ bytes: 101, width: 10, height: 10 }, limits), 'too-large');
  assert.equal(validateImageBudget({ bytes: 80, width: NaN, height: 10 }, limits), 'invalid-dimensions');
  assert.equal(validateImageBudget({ bytes: 80, width: 11, height: 10 }, limits), 'too-many-pixels');
  assert.equal(validateImageBudget({ bytes: 80, width: 10, height: 10 }, limits), null);
});
test('denied permissions are not prompted again; haptics never propagate failure', async () => {
  let prompts = 0; assert.equal(await requestCapability({ read: async () => 'denied', request: async () => { prompts++; return 'granted'; } }), 'denied');
  assert.equal(prompts, 0); assert.equal(await optionalHaptic(true, async () => { throw new Error('unsupported'); }), false);
});
test('feature flag errors preserve previous values; concurrent updates and retry work', async () => {
  let raw = '{"removed":true}'; let fail = false;
  const store = createFeatureStore({ first: false, second: false }, { read: async () => raw, write: async value => { if (fail) throw new Error('unavailable'); raw = value; } });
  await assert.rejects(store.load()); assert.equal(store.getSnapshot().ready, false);
  raw = null; await store.load();
  await Promise.all([store.set('first', true), store.set('second', true)]);
  assert.deepEqual(store.getSnapshot().flags, { first: true, second: true });
  fail = true; await assert.rejects(store.set('first', false)); assert.equal(store.getSnapshot().flags.first, true);
  fail = false; await store.reset(); assert.deepEqual(store.getSnapshot().flags, { first: false, second: false });
});
test('telemetry is disabled by default, strips private values and isolates provider failure', async () => {
  const policy = { saved: { source: ['settings'], success: [true, false] } }; const sent = [];
  const telemetry = createTelemetry(policy, async event => { sent.push(event); });
  assert.equal(await telemetry.capture('saved', { source: 'settings' }), false);
  telemetry.setEnabled(true);
  await telemetry.capture('saved', { source: 'PRIVATE_SENTINEL', success: true, email: 'PRIVATE_SENTINEL' });
  assert.equal(JSON.stringify(sent).includes('PRIVATE_SENTINEL'), false); assert.equal(sent[0].properties.success, true);
  assert.equal(sanitizeEvent('unknown', {}, policy), null); telemetry.setEnabled(false); assert.equal(await telemetry.capture('saved', {}), false);
  const broken = createTelemetry(policy, async () => { throw new Error('provider'); }); broken.setEnabled(true); assert.equal(await broken.capture('saved', {}), false);
  const diagnostic = sanitizeDiagnostic({ type: 'PRIVATE_SENTINEL', message: 'PRIVATE_SENTINEL', request: { token: 'PRIVATE_SENTINEL' }, frames: [{ file: 'PRIVATE_SENTINEL' }, { file: 'src/app.ts', line: 8 }] }, ['src/app.ts']);
  assert.equal(JSON.stringify(diagnostic).includes('PRIVATE_SENTINEL'), false); assert.deepEqual(diagnostic.frames, [{ file: 'src/app.ts', line: 8 }]);
});
test('release target must match and monitoring requires terminal artifact evidence', async () => {
  const expected = { project: 'example', environment: 'preview', platform: 'web', artifact: 'site' };
  assert.throws(() => assertReleaseTarget({ ...expected, environment: 'production' }, expected)); assert.deepEqual(assertReleaseTarget(expected, expected), expected);
  let time = 0; let polls = 0;
  const options = { timeoutMs: 20, intervalMs: 5, now: () => time, sleep: async ms => { time += ms; } };
  const result = await waitForRelease({ ...options, readStatus: async () => ++polls < 3 ? { state: 'running' } : { state: 'succeeded', id: '1', artifactUrl: 'https://example.com' } });
  assert.equal(result.id, '1');
  for (const state of ['failed', 'cancelled', 'unknown', 'succeeded']) await assert.rejects(waitForRelease({ ...options, readStatus: async () => ({ state }) }));
  time = 0; await assert.rejects(waitForRelease({ ...options, readStatus: async () => ({ state: 'queued' }) }), /timed out/);
});

test('release monitoring bounds a stalled provider and honours cancellation', async () => {
  let signal;
  await assert.rejects(waitForRelease({ timeoutMs: 5, readStatus: async next => { signal = next; return new Promise(() => {}); } }), /timed out/);
  assert.equal(signal.aborted, true);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(waitForRelease({ timeoutMs: 100, signal: controller.signal, readStatus: async () => ({ state: 'running' }) }), /cancelled/);
});
