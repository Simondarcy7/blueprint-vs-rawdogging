import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import ts from 'typescript';
import { join } from 'node:path';
import { capabilityFixture } from './helpers/capability-fixture.mjs';

const fixture = await capabilityFixture(['account-recovery']);
after(fixture.cleanup);
const { createAccountRecovery } = await fixture.load('services/account-recovery/accountRecovery.ts');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function example(overrides = {}, options = {}) {
  let scope = { owner: 'member-a', generation: '1' };
  let time = 1000;
  let account = { owner: scope.owner, pending: true, destinations: [{ id: 'new-inbox', label: 'New inbox' }], expiresAt: 10_000 };
  const calls = [];
  const adapter = {
    read: async ctx => { calls.push(['read', ctx]); return account; },
    request: async (value, ctx) => { calls.push(['request', value, ctx]); return 'accepted'; },
    verify: async (id, proof, ctx) => { calls.push(['verify', id, proof, ctx]); return 'accepted'; },
    ...overrides,
  };
  const controller = createAccountRecovery({ adapter, getScope: () => scope, now: () => time, readTimeoutMs: 40, resendCooldownMs: 100, ...options });
  return { controller, calls, adapter, setTime: value => { time = value; }, setScope: value => { scope = value; }, setAccount: value => { account = value; } };
}

test('installed account workflows pass strict TypeScript with their baseline dependency', () => {
  const files = ['accountRecovery.ts', 'localAccountCleanup.ts'].map(file => join(fixture.root, 'src/services/account-recovery', file));
  const program = ts.createProgram(files, { noEmit: true, strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true, types: [] });
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
});

test('loads an account, requests a challenge, refreshes authoritative state and enforces resend cooldown', async () => {
  const r = example();
  assert.equal(r.controller.getSnapshot().status, 'idle');
  assert.equal((await r.controller.request('person@example.test')).status, 'stale');
  assert.deepEqual(await r.controller.refresh(), { status: 'ready', current: true, refreshed: true });
  assert.deepEqual(await r.controller.request('person@example.test'), { status: 'accepted', current: true, refreshed: true });
  assert.equal(r.controller.getSnapshot().acknowledged, 'request');
  assert.equal(r.controller.getSnapshot().retryAt, 1100);
  assert.equal((await r.controller.request('person@example.test')).status, 'cooldown');
  assert.equal(r.calls.filter(([kind]) => kind === 'request').length, 1);
  r.setTime(1100);
  assert.equal((await r.controller.request('person@example.test')).status, 'accepted');
  r.controller.dispose();
});

test('keeps an accepted request acknowledged when the following status refresh fails', async () => {
  const r = example();
  await r.controller.refresh();
  r.adapter.read = async () => { throw new Error('private provider detail'); };
  assert.deepEqual(await r.controller.request('secret@example.test'), { status: 'accepted', current: true, refreshed: false });
  assert.equal(r.controller.getSnapshot().status, 'refresh-required');
  assert.equal(r.controller.getSnapshot().acknowledged, 'request');
  assert.equal((await r.controller.request('secret@example.test')).status, 'refresh-required');
  assert.equal(r.calls.filter(([kind]) => kind === 'request').length, 1);
  const serialized = JSON.stringify(r.controller.getSnapshot());
  assert.ok(!serialized.includes('secret@example.test'));
  assert.ok(!serialized.includes('private provider detail'));
  r.controller.dispose();
});

test('verification success and status refresh failure remain separate, without storing the proof', async () => {
  const r = example();
  await r.controller.refresh();
  r.adapter.read = async () => { throw new Error('offline'); };
  assert.equal((await r.controller.verify('new-inbox', 'sensitive-proof')).status, 'accepted');
  assert.equal(r.controller.getSnapshot().acknowledged, 'verify');
  assert.equal(r.controller.getSnapshot().status, 'refresh-required');
  assert.ok(!JSON.stringify(r.controller.getSnapshot()).includes('sensitive-proof'));
  assert.equal((await r.controller.verify('new-inbox', 'sensitive-proof')).status, 'refresh-required');
  r.controller.dispose();
});

test('a definite rejection is retryable but an ambiguous mutation requires an authoritative refresh', async () => {
  const r = example({ request: async () => 'rejected' });
  await r.controller.refresh();
  assert.equal((await r.controller.request('destination')).status, 'rejected');
  assert.equal(r.controller.getSnapshot().status, 'ready');
  r.adapter.request = async () => { throw new Error('connection lost after sending'); };
  assert.equal((await r.controller.request('destination')).status, 'unknown');
  assert.equal(r.controller.getSnapshot().status, 'uncertain');
  assert.equal((await r.controller.request('destination')).status, 'refresh-required');
  assert.equal((await r.controller.refresh()).status, 'ready');
  assert.equal((await r.controller.request('destination')).status, 'cooldown');
  r.controller.dispose();
});

test('rejects invalid or expired proof destinations before contacting the provider', async () => {
  const r = example();
  await r.controller.refresh();
  for (const [id, proof] of [['missing', '123456'], ['new-inbox', ''], ['new-inbox', 'x'.repeat(4097)]]) {
    assert.equal((await r.controller.verify(id, proof)).status, 'invalid');
  }
  r.setTime(10_000);
  assert.equal((await r.controller.verify('new-inbox', '123456')).status, 'expired');
  assert.equal(r.calls.filter(([kind]) => kind === 'verify').length, 0);
  r.controller.dispose();
});

test('deduplicates mutations and keeps cancellation pending until a non-cooperative provider settles', async () => {
  const pending = deferred(), started = deferred();
  let context;
  const r = example({ request: async (_, ctx) => { context = ctx; started.resolve(); return pending.promise; } });
  await r.controller.refresh();
  const request = r.controller.request('destination');
  await started.promise;
  r.controller.cancel();
  assert.equal(context.signal.aborted, true);
  assert.equal(r.controller.getSnapshot().status, 'cancelling');
  assert.equal(r.controller.getSnapshot().busy, true);
  assert.equal((await r.controller.refresh()).status, 'busy');
  assert.equal((await r.controller.request('other')).status, 'busy');
  pending.resolve('accepted');
  assert.deepEqual(await request, { status: 'accepted', current: false, refreshed: false });
  assert.equal(r.controller.getSnapshot().status, 'refresh-required');
  assert.equal(r.controller.getSnapshot().acknowledged, 'request');
  assert.equal(r.controller.getSnapshot().busy, false);
  assert.equal(r.controller.getSnapshot().retryAt, 1100);
  await r.controller.refresh();
  assert.equal(r.controller.getSnapshot().retryAt, 1100);
  assert.equal((await r.controller.request('destination')).status, 'cooldown');
  r.controller.dispose();
});

test('dispose suppresses notifications but does not turn an accepted provider mutation into rollback', async () => {
  const pending = deferred(), started = deferred();
  const r = example({ verify: async () => { started.resolve(); return pending.promise; } });
  await r.controller.refresh();
  let notifications = 0;
  r.controller.subscribe(() => notifications++);
  const verification = r.controller.verify('new-inbox', '123456');
  await started.promise;
  r.controller.dispose();
  const afterDispose = notifications;
  pending.resolve('accepted');
  assert.equal((await verification).status, 'accepted');
  assert.equal(r.controller.getSnapshot().status, 'disposed');
  assert.equal(notifications, afterDispose);
});

test('account A→B→A changes are fenced by generation, including late accepted verification', async () => {
  const pending = deferred(), started = deferred();
  const r = example({ verify: async () => { started.resolve(); return pending.promise; } });
  await r.controller.refresh();
  const verification = r.controller.verify('new-inbox', '123456');
  await started.promise;
  r.setScope({ owner: 'member-a', generation: '3' });
  pending.resolve('accepted');
  assert.deepEqual(await verification, { status: 'accepted', current: false, refreshed: false });
  assert.equal(r.controller.getSnapshot().account, null);
  assert.equal(r.controller.getSnapshot().status, 'stale');
  assert.equal(r.calls.filter(([kind]) => kind === 'read').length, 1);
  r.controller.dispose();
});

test('read cancellation settles promptly and ignores a late response', async () => {
  const pending = deferred(), started = deferred();
  const r = example({ read: async () => { started.resolve(); return pending.promise; } });
  const reading = r.controller.refresh();
  await started.promise;
  r.controller.cancel();
  assert.equal((await reading).status, 'cancelled');
  pending.resolve({ owner: 'member-a', pending: false, destinations: [], expiresAt: null });
  await Promise.resolve();
  assert.equal(r.controller.getSnapshot().account, null);
  r.controller.dispose();
});

test('read deadlines expose retry without claiming a mutation failed', async () => {
  let signal;
  const r = example({ read: async ctx => { signal = ctx.signal; return new Promise(() => {}); } }, { readTimeoutMs: 5 });
  assert.equal((await r.controller.refresh()).status, 'unavailable');
  assert.equal(signal.aborted, true);
  assert.equal(r.controller.getSnapshot().status, 'refresh-required');
  r.controller.dispose();
});

test('account data is cloned/frozen and malformed or wrong-owner provider state fails closed', async () => {
  const account = { owner: 'member-a', pending: true, destinations: [{ id: 'inbox', label: 'Masked inbox' }], expiresAt: null };
  const r = example({ read: async () => account });
  await r.controller.refresh();
  account.destinations[0].label = 'Mutated';
  assert.equal(r.controller.getSnapshot().account.destinations[0].label, 'Masked inbox');
  assert.throws(() => { r.controller.getSnapshot().account.destinations.push({}); }, TypeError);
  let getterCalls = 0;
  for (const value of [null, { ...account, owner: 'member-b' }, { ...account, expiresAt: NaN }, { ...account, destinations: [account.destinations[0], account.destinations[0]] }, { get owner() { getterCalls++; return 'member-a'; } }]) {
    r.adapter.read = async () => value;
    assert.equal((await r.controller.refresh()).status, 'unavailable');
  }
  assert.equal(getterCalls, 0);
  r.controller.dispose();
});

test('observer failures and reentrant cancellation cannot start a provider mutation', async () => {
  const r = example();
  await r.controller.refresh();
  r.controller.subscribe(() => { throw new Error('Observer'); });
  r.controller.subscribe(() => { if (r.controller.getSnapshot().status === 'requesting') r.controller.cancel(); });
  assert.equal((await r.controller.request('destination')).status, 'cancelled');
  assert.equal(r.controller.getSnapshot().status, 'cancelled');
  assert.equal(r.calls.filter(([kind]) => kind === 'request').length, 0);
  r.controller.dispose();
});

test('invalid timing, missing ownership and invalid clocks fail closed', async () => {
  for (const readTimeoutMs of [0, -1, NaN, 60_001]) assert.throws(() => example({}, { readTimeoutMs }));
  for (const resendCooldownMs of [-1, NaN, 86_400_001]) assert.throws(() => example({}, { resendCooldownMs }));
  const r = example();
  r.setScope({ owner: '', generation: '1' });
  assert.equal((await r.controller.refresh()).status, 'stale');
  r.setScope({ owner: 'member-a', generation: '1' });
  await r.controller.refresh();
  r.setTime(NaN);
  assert.equal((await r.controller.request('destination')).status, 'invalid');
  r.controller.dispose();
});
