import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAnalyticsClient } from '../codex/skills/mature-app-starter/assets/app-capabilities/diagnostics/src/services/analytics/analyticsClient.ts';
import { createSentryReporter } from '../codex/skills/mature-app-starter/assets/app-capabilities/diagnostics/src/services/observability/sentryReporter.ts';

const deferred = () => {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const policy = { saved: { surface: ['editor'], result: ['success', 'failed'] }, screen_view: { screen: ['home', 'library'] } };
function provider() {
  const calls = [];
  return {
    calls,
    async setEnabled(value) { calls.push(['enabled', value]); },
    async capture(event) { calls.push(['capture', event]); },
    async reset() { calls.push(['reset']); },
  };
}
const client = (providers, extra = {}) => createAnalyticsClient({ environment: 'production', policy, providers, timeoutMs: 20, ...extra });
const captures = p => p.calls.filter(call => call[0] === 'capture');

test('analytics stays inert until explicit consent and never initializes in non-production', async () => {
  for (const settings of [{}, { environment: 'preview' }, { environment: 'development' }, { development: true }]) {
    let loads = 0;
    const p = provider();
    const analytics = client([async () => { loads++; return p; }], settings);
    assert.equal(await analytics.capture('saved', { result: 'success' }), false);
    assert.equal(loads, 0);
    if (Object.keys(settings).length) {
      await analytics.setEnabled(true);
      assert.equal(await analytics.capture('saved'), false);
      assert.equal(loads, 0);
    }
    await analytics.dispose();
  }
});

test('analytics snapshots allowlists and inputs, redacts free text, and skips unknown events', async () => {
  const pending = deferred();
  const p = provider();
  const rules = { saved: { result: ['success'] } };
  const analytics = client([() => pending.promise], { policy: rules });
  const enabling = analytics.setEnabled(true);
  const input = { result: 'success', email: 'PRIVATE_SENTINEL' };
  const capture = analytics.capture('saved', input);
  input.result = 'PRIVATE_SENTINEL';
  rules.saved.result.push('PRIVATE_SENTINEL');
  pending.resolve(p);
  await enabling;
  assert.equal(await capture, true);
  assert.equal(await analytics.capture('unlisted', input), false);
  assert.equal(await analytics.capture('saved', input), true);
  assert.equal(JSON.stringify(p.calls).includes('PRIVATE_SENTINEL'), false);
  assert.deepEqual(captures(p)[0][1], { name: 'saved', properties: { result: 'success' } });
  await analytics.dispose();
});

test('revocation while lazy loading drops captures and never enables the stale provider', async () => {
  const pending = deferred();
  const started = deferred();
  const p = provider();
  const analytics = client([() => { started.resolve(); return pending.promise; }]);
  const enabling = analytics.setEnabled(true);
  await started.promise;
  const capture = analytics.capture('saved');
  const disabling = analytics.setEnabled(false);
  pending.resolve(p);
  await Promise.all([enabling, disabling]);
  assert.equal(await capture, false);
  assert.equal(captures(p).length, 0);
  assert.equal(p.calls.some(call => call[0] === 'enabled' && call[1]), false);
  await analytics.dispose();
});

test('account reset fences waiting events even if the next account immediately enables analytics', async () => {
  const pending = deferred();
  const started = deferred();
  const p = provider();
  const analytics = client([() => { started.resolve(); return pending.promise; }]);
  const first = analytics.setEnabled(true);
  await started.promise;
  const stale = analytics.capture('saved', { result: 'success' });
  const resetting = analytics.reset();
  const next = analytics.setEnabled(true);
  pending.resolve(p);
  await Promise.all([first, resetting, next]);
  assert.equal(await stale, false);
  assert.equal(await analytics.capture('saved', { result: 'failed' }), true);
  assert.deepEqual(p.calls.map(row => row[0]), ['enabled', 'reset', 'enabled', 'capture']);
  assert.deepEqual(p.calls[0], ['enabled', false]);
  await analytics.dispose();
});

test('provider rejection and stalled startup do not stop independent providers', async () => {
  const p = provider();
  const analytics = client([
    async () => { throw new Error('Unavailable SDK'); },
    () => new Promise(() => {}),
    async () => p,
  ], { timeoutMs: 5 });
  await analytics.setEnabled(true);
  assert.equal(await analytics.capture('saved', { result: 'success' }), true);
  assert.equal(captures(p).length, 1);
  await analytics.dispose();
});

test('timed-out providers are quarantined and late initialization gets disabled', async () => {
  const late = deferred();
  const disabled = deferred();
  const p = provider();
  const slow = provider();
  slow.setEnabled = async enabled => { slow.calls.push(['enabled', enabled]); if (!enabled) disabled.resolve(); };
  const analytics = client([() => late.promise, async () => p], { timeoutMs: 5 });
  await analytics.setEnabled(true);
  late.resolve(slow);
  await disabled.promise;
  assert.equal(await analytics.capture('saved'), true);
  assert.equal(captures(slow).length, 0);
  assert.deepEqual(slow.calls, [['enabled', false]]);
  await analytics.dispose();
});

test('slow enable is disabled again on late settlement and cannot resurrect collection', async () => {
  const enable = deferred();
  const lateDisable = deferred();
  const p = provider();
  let disables = 0;
  p.setEnabled = async value => {
    p.calls.push(['enabled', value]);
    if (value) await enable.promise;
    else if (++disables === 2) lateDisable.resolve();
  };
  const analytics = client([async () => p], { timeoutMs: 5 });
  await analytics.setEnabled(true);
  assert.equal(await analytics.capture('saved'), false);
  enable.resolve();
  await lateDisable.promise;
  assert.deepEqual(p.calls, [['enabled', true], ['enabled', false], ['enabled', false]]);
  await analytics.dispose();
});

test('stalled captures are bounded and one transport cannot mutate another transport payload', async () => {
  const p = provider();
  const first = provider();
  first.capture = async event => { event.properties.result = 'PRIVATE_SENTINEL'; await new Promise(() => {}); };
  const analytics = client([async () => first, async () => p], { timeoutMs: 5 });
  await analytics.setEnabled(true);
  assert.equal(await analytics.capture('saved', { result: 'success' }), true);
  assert.equal(captures(p)[0][1].properties.result, 'success');
  await analytics.dispose();
  await analytics.setEnabled(true);
  assert.equal(await analytics.capture('saved'), false);
});

test('invalid optional-work timeouts fail before creating any SDK', () => {
  for (const timeoutMs of [0, -1, NaN, Infinity, 60_001, 1.5]) {
    assert.throws(() => client([], { timeoutMs }), /timeout/);
    assert.throws(() => createSentryReporter({ load: async () => ({}), allowedFiles: [], contextPolicy: {}, environment: 'test', release: 'test', timeoutMs }), /timeout/);
  }
});

test('failed consent or reset operations quarantine only the affected provider', async () => {
  const broken = provider();
  const healthy = provider();
  broken.setEnabled = async value => { if (value) throw new Error('Consent unavailable'); };
  const analytics = client([async () => broken, async () => healthy]);
  await analytics.setEnabled(true);
  assert.equal(await analytics.capture('saved'), true);
  assert.equal(captures(broken).length, 0);
  healthy.reset = async () => { throw new Error('Reset failed'); };
  await analytics.reset();
  await analytics.setEnabled(true);
  assert.equal(await analytics.capture('saved'), false);
  await analytics.dispose();
});

function reporting(options = {}) {
  const calls = [];
  let sdkOptions;
  const sdk = {
    async initialize(value) { sdkOptions = value; calls.push(['initialize']); },
    async captureEvent(value) { calls.push(['capture', value]); },
  };
  const reporter = createSentryReporter({
    load: async () => sdk, allowedFiles: ['src/editor.ts'], contextPolicy: { operation: ['save', 'restore'] },
    environment: 'production', release: 'example@1.0.0', timeoutMs: 20, ...options,
  });
  return { reporter, calls, sdk, options: () => sdkOptions };
}

test('reporting consent is separate, lazy and revocable; initialization is coalesced', async () => {
  const r = reporting();
  assert.equal(await r.reporter.capture(new Error('PRIVATE_SENTINEL')), false);
  assert.deepEqual(r.calls, []);
  r.reporter.setEnabled(true);
  await Promise.all([r.reporter.capture(new Error('private')), r.reporter.capture(new TypeError('private'))]);
  assert.equal(r.calls.filter(row => row[0] === 'initialize').length, 1);
  const config = r.options();
  assert.equal(config.defaultIntegrations, false);
  assert.equal(config.autoInitializeNativeSdk, false);
  assert.equal(config.sendDefaultPii, false);
  assert.equal(config.replaysOnErrorSampleRate, 0);
  assert.equal(config.beforeBreadcrumb({ message: 'private' }), null);
  r.reporter.reset();
  assert.equal(config.beforeSend({ message: 'private' }), null);
  assert.equal(await r.reporter.capture(new Error()), false);
});

test('Sentry receives only new allowlisted envelopes; final SDK fields are sanitized again', async () => {
  const r = reporting();
  r.reporter.setEnabled(true);
  const raw = {
    type: 'TypeError', message: 'PRIVATE_SENTINEL', user: { email: 'PRIVATE_SENTINEL' },
    request: { url: 'PRIVATE_SENTINEL' }, frames: [{ file: 'src/editor.ts', line: 17 }, { file: 'PRIVATE_SENTINEL', line: 9 }],
  };
  assert.equal(await r.reporter.capture(raw, { operation: 'save', email: 'PRIVATE_SENTINEL' }), true);
  const sent = r.calls.find(row => row[0] === 'capture')[1];
  assert.deepEqual(sent.exception.values[0].stacktrace.frames, [{ filename: 'src/editor.ts', lineno: 17 }]);
  assert.deepEqual(sent.extra, { operation: 'save' });
  assert.equal(sent.exception.values[0].type, 'TypeError');
  const final = r.options().beforeSend({ ...sent, user: raw.user, message: raw.message, request: raw.request, breadcrumbs: [{ message: raw.message }], extra: { operation: 'restore', email: raw.message } });
  assert.equal(JSON.stringify(final).includes('PRIVATE_SENTINEL'), false);
  assert.deepEqual(Object.keys(final).sort(), ['environment', 'exception', 'extra', 'level', 'release']);
  assert.deepEqual(final.extra, { operation: 'restore' });
  const eventId = '0123456789abcdef0123456789abcdef';
  assert.equal(r.options().beforeSend({ ...sent, event_id: eventId }).event_id, eventId);
  assert.equal(r.options().beforeSend({ ...sent, event_id: 'PRIVATE_SENTINEL' }).event_id, undefined);
  assert.equal(raw.message, 'PRIVATE_SENTINEL');
});

test('reporting drops pending errors across reset and re-enable', async () => {
  const pending = deferred();
  const started = deferred();
  const r = reporting({ load: () => { started.resolve(); return pending.promise; } });
  r.reporter.setEnabled(true);
  const stale = r.reporter.capture({ type: 'Error' });
  await started.promise;
  r.reporter.reset();
  r.reporter.setEnabled(true);
  pending.resolve(r.sdk);
  assert.equal(await stale, false);
  assert.equal(await r.reporter.capture({ type: 'Error' }), true);
  assert.equal(r.calls.filter(row => row[0] === 'capture').length, 1);
  r.reporter.dispose();
  r.reporter.setEnabled(true);
  assert.equal(await r.reporter.capture({}), false);
});

test('reporter failure or stalled SDK never escapes the capture call', async () => {
  for (const load of [async () => { throw new Error('SDK missing'); }, () => new Promise(() => {})]) {
    const r = reporting({ load, timeoutMs: 5 });
    r.reporter.setEnabled(true);
    assert.equal(await r.reporter.capture(new Error()), false);
    assert.equal(await r.reporter.capture(new Error()), false);
  }
  const r = reporting({ timeoutMs: 5 });
  r.sdk.captureEvent = async () => new Promise(() => {});
  r.reporter.setEnabled(true);
  assert.equal(await r.reporter.capture(new Error()), false);
  assert.equal(await r.reporter.capture(new Error()), false);
});

test('stalled reporter initialization is quarantined and cannot send late events', async () => {
  const init = deferred();
  const r = reporting({ timeoutMs: 5 });
  r.sdk.initialize = async options => { r.calls.push(['initialize', options]); await init.promise; };
  r.reporter.setEnabled(true);
  assert.equal(await r.reporter.capture(new Error()), false);
  init.resolve();
  const options = r.calls[0][1];
  assert.equal(options.beforeSend({}), null);
  assert.equal(await r.reporter.capture(new Error()), false);
  assert.equal(r.calls.some(call => call[0] === 'capture'), false);
});

test('hostile diagnostic getters fail closed without interrupting a workflow', async () => {
  const r = reporting();
  r.reporter.setEnabled(true);
  assert.equal(await r.reporter.capture({ get frames() { throw new Error('bad input'); } }), false);
  await r.reporter.capture({});
  assert.equal(r.options().beforeSend({ get extra() { throw new Error('bad SDK data'); } }), null);
});
