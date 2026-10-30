import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { join } from 'node:path';
import { capabilityFixture } from './helpers/capability-fixture.mjs';
import { React, act, render, loadSource, testTheme } from './product-ui-harness.mjs';

const fixture = await capabilityFixture(['product-ui', 'product-workflows', 'account-recovery']);
after(fixture.cleanup);
const ui = loadSource(join(fixture.root, 'src/components/product-ui/index.ts'));
const { SettingsWorkflow } = loadSource(join(fixture.root, 'src/modules/product-workflows/SettingsWorkflow.tsx'));
const { AccountRecoveryPanel } = loadSource(join(fixture.root, 'src/modules/product-workflows/AccountRecoveryPanel.tsx'));
const { createAccountRecovery } = loadSource(join(fixture.root, 'src/services/account-recovery/accountRecovery.ts'));
const h = React.createElement;
const fields = [{ id: 'format', label: 'Format', options: [{ value: 'short', label: 'Short' }, { value: 'long', label: 'Long' }] }];
const wrap = child => h(ui.ProductUIProvider, { theme: testTheme }, child);
async function mounted(t, child, options) { const view = await render(wrap(child), options); t.after(async () => { await act(async () => view.unmount()); }); return view; }
const button = (view, label) => view.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === label);
const text = view => JSON.stringify(view.toJSON());
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };

test('rendered settings owns load, editing, failed-save retry and truthful acknowledgement', async t => {
  let calls = 0;
  const view = await mounted(t, h(SettingsWorkflow, { scopeKey: 'a', title: 'Preferences', fields, adapter: {
    read: async () => ({ format: 'short' }), save: async () => ++calls === 1 ? 'not-saved' : 'saved',
  } }));
  assert.equal(button(view, 'Save settings').props.disabled, true);
  await act(async () => button(view, 'Long').props.onPress());
  await act(async () => button(view, 'Save settings').props.onPress());
  assert.match(text(view), /Settings were not saved/); assert.doesNotMatch(text(view), /Settings saved\./);
  await act(async () => button(view, 'Retry saving settings').props.onPress());
  assert.match(text(view), /Settings saved\./); assert.equal(calls, 2);
});
test('rendered uncertain save offers reconciliation and preserves selected input', async t => {
  const view = await mounted(t, h(SettingsWorkflow, { scopeKey: 'a', title: 'Preferences', fields, adapter: {
    read: async () => ({ format: 'short' }), save: async () => 'unknown',
  } }));
  await act(async () => button(view, 'Long').props.onPress());
  await act(async () => button(view, 'Save settings').props.onPress());
  assert.match(text(view), /save outcome is unknown/);
  assert.equal(button(view, 'Long').props.disabled, true);
  await act(async () => button(view, 'Reload saved settings').props.onPress());
  assert.equal(button(view, 'Long').props.accessibilityState.checked, true);
  assert.equal(button(view, 'Save settings').props.disabled, false);
});
test('scope remount clears previous selections and ignores a pending save receipt', async t => {
  const pending = deferred();
  const make = (scopeKey, value, save) => h(SettingsWorkflow, { scopeKey, title: 'Preferences', fields, adapter: { read: async () => ({ format: value }), save } });
  const view = await mounted(t, make('a', 'short', () => pending.promise));
  await act(async () => button(view, 'Long').props.onPress());
  let saving; await act(async () => { saving = button(view, 'Save settings').props.onPress(); });
  await act(async () => view.update(wrap(make('b', 'short', async () => 'saved'))));
  await act(async () => { pending.resolve('saved'); await saving; });
  assert.equal(button(view, 'Short').props.accessibilityState.checked, true); assert.doesNotMatch(text(view), /Settings saved\./);
});
test('settings lifecycle supports React StrictMode effect cleanup and replay', async t => {
  const view = await mounted(t, h(React.StrictMode, null, h(SettingsWorkflow, { scopeKey: 'a', title: 'Preferences', fields,
    adapter: { read: async () => ({ format: 'short' }), save: async () => 'saved' } })), { unstable_strictMode: true });
  assert.equal(button(view, 'Long').props.disabled, false);
});
test('unavailable recovery cannot pretend to send or verify credentials', async t => {
  const view = await mounted(t, h(AccountRecoveryPanel, { scopeKey: 'a', controller: null, unavailableMessage: 'Configure a recovery provider first.' }));
  assert.match(text(view), /Configure a recovery provider first/); assert.equal(view.root.findAllByType('Pressable').length, 0);
});
test('rendered recovery requests, verifies, clears secret input and refreshes authoritative status', async t => {
  let pending = false; const received = [];
  const controller = createAccountRecovery({ getScope: () => ({ owner: 'a', generation: '1' }), resendCooldownMs: 0, adapter: {
    read: async () => ({ owner: 'a', pending, destinations: pending ? [{ id: 'email', label: 'Email' }] : [], expiresAt: null }),
    request: async destination => { received.push(destination); pending = true; return 'accepted'; },
    verify: async (id, proof) => { received.push({ id, proof }); pending = false; return 'accepted'; },
  } }); t.after(async () => { await act(async () => controller.dispose()); });
  const view = await mounted(t, h(AccountRecoveryPanel, { scopeKey: 'a', controller }));
  await act(async () => view.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === 'Recovery destination').props.onChangeText('person@example.test'));
  await act(async () => button(view, 'Request recovery code').props.onPress());
  assert.match(text(view), /provider accepted your recovery request/);
  await act(async () => view.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === 'Verification code').props.onChangeText('secret-proof'));
  await act(async () => button(view, 'Verify recovery code').props.onPress());
  assert.deepEqual(received, ['person@example.test', { id: 'email', proof: 'secret-proof' }]);
  assert.doesNotMatch(text(view), /secret-proof/); assert.match(text(view), /provider accepted verification/);
});
test('accepted recovery followed by read failure retains acknowledgement and offers refresh', async t => {
  let fail = false;
  const controller = createAccountRecovery({ getScope: () => ({ owner: 'a', generation: '1' }), resendCooldownMs: 0, adapter: {
    read: async () => { if (fail) throw new Error('private response'); return { owner: 'a', pending: false, destinations: [], expiresAt: null }; },
    request: async () => { fail = true; return 'accepted'; }, verify: async () => 'rejected',
  } }); t.after(async () => { await act(async () => controller.dispose()); });
  const view = await mounted(t, h(AccountRecoveryPanel, { scopeKey: 'a', controller }));
  await act(async () => view.root.findAllByType('TextInput')[0].props.onChangeText('person@example.test'));
  await act(async () => button(view, 'Request recovery code').props.onPress());
  assert.match(text(view), /provider accepted your recovery request/); assert.match(text(view), /could not be refreshed/);
  assert.doesNotMatch(text(view), /private response/); assert.equal(button(view, 'Request recovery code').props.disabled, true);
  fail = false; await act(async () => button(view, 'Refresh recovery status').props.onPress());
  assert.equal(button(view, 'Request recovery code').props.disabled, false);
});

test('a recovery resend stays disabled until its cooldown expires', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 });
  const controller = createAccountRecovery({ getScope: () => ({ owner: 'a', generation: '1' }), resendCooldownMs: 500, adapter: {
    read: async () => ({ owner: 'a', pending: false, destinations: [], expiresAt: null }),
    request: async () => 'accepted', verify: async () => 'rejected',
  } }); t.after(async () => { await act(async () => controller.dispose()); });
  const view = await mounted(t, h(AccountRecoveryPanel, { scopeKey: 'a', controller }));
  await act(async () => view.root.findAllByType('TextInput')[0].props.onChangeText('person@example.test'));
  await act(async () => button(view, 'Request recovery code').props.onPress());
  assert.equal(button(view, 'Request another code in 1s').props.disabled, true);
  await act(async () => t.mock.timers.tick(1001));
  assert.equal(button(view, 'Request recovery code').props.disabled, false);
});
