import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { join } from 'node:path';
import { capabilityFixture } from './helpers/capability-fixture.mjs';
import { React, act, render, loadSource } from './product-ui-harness.mjs';

const fixture = await capabilityFixture(['product-ui', 'product-workflows', 'notification-preferences', 'account-recovery', 'undo']);
after(fixture.cleanup);
const ui = loadSource(join(fixture.root, 'src/components/product-ui/index.ts'));
const { NotificationInbox } = loadSource(join(fixture.root, 'src/modules/product-workflows/notificationInbox.tsx'));
const { NotificationPreferencesPanel } = loadSource(join(fixture.root, 'src/modules/product-workflows/notificationPreferencesPanel.tsx'));
const { createNotificationPreferencesController } = loadSource(join(fixture.root, 'src/services/notification-preferences/notificationPreferences.ts'));
const theme = { colors: { background: '#fff', surface: '#fff', text: '#111', muted: '#555', border: '#ccc', accent: '#123', onAccent: '#fff', danger: '#a00', focus: '#04a' } };
const mount = element => render(React.createElement(ui.ProductUIProvider, { theme }, element));
const text = tree => tree.root.findAllByType('Text').map(node => node.children.filter(value => typeof value === 'string').join('')).join(' ');
const press = (tree, label) => tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === label).props.onPress();
const fields = [{ id: 'reminders', title: 'Round reminders', description: 'After a saved round', selected: value => value.enabled, change: (value, enabled) => ({ ...value, enabled }) }];
function preferences(overrides = {}) {
  let value = { enabled: false }, revision = '0', owner = 'a:1';
  const calls = [];
  const adapter = {
    owner, getOwner: () => owner, parse: input => { if (typeof input.enabled !== 'boolean') throw Error('invalid'); return { enabled: input.enabled }; },
    requiresPermission: (old, next) => !old.enabled && next.enabled,
    read: async () => { calls.push('read'); return { value, revision }; },
    write: async (next, ctx) => { calls.push('write'); assert.equal(ctx.expectedRevision, revision); value = next; revision = String(Number(revision) + 1); return { status: 'saved', revision }; },
    getPermission: async () => 'granted', requestPermission: async () => { calls.push('permission'); return 'granted'; },
    apply: async () => { calls.push('apply'); }, ...overrides,
  };
  return { controller: createNotificationPreferencesController(adapter), calls, setOwner: next => { owner = next; } };
}

test('inbox retains supplied content while a second source is loading and reports partial failures', async () => {
  const tree = await mount(React.createElement(NotificationInbox, { entries: [{ id: 'a', unread: true }], filter: 'all', onFilterChange() {}, ready: false,
    errorMessage: 'Group updates are unavailable', onRetry() {}, onMarkAllRead() {}, renderItem: ({ item }) => React.createElement('Text', null, item.id) }));
  assert.equal(tree.root.findByType('FlatList').props.data.length, 1);
  assert.match(text(tree), /Group updates are unavailable/);
  assert.doesNotMatch(text(tree), /You’re all caught up/);
  await act(async () => tree.unmount());
});

test('inbox unread recovery changes controlled selection without deleting read history', async () => {
  const changes = [];
  const tree = await mount(React.createElement(NotificationInbox, { entries: [{ id: 'read', unread: false }], filter: 'unread', onFilterChange: value => changes.push(value), ready: true,
    onMarkAllRead() {}, renderItem: () => null }));
  assert.match(text(tree), /No unread notifications/);
  await act(async () => press(tree, 'Show all notifications'));
  assert.deepEqual(changes, ['all']);
  assert.equal(tree.root.findByType(NotificationInbox).props.entries.length, 1);
  await act(async () => tree.unmount());
});

test('inbox preserves row identity and previous visible entry for host day-grouping', async () => {
  const entries = [{ id: 'old', unread: false }, { id: 'one', unread: true }, { id: 'two', unread: true }];
  const rendered = [];
  const tree = await mount(React.createElement(NotificationInbox, { entries, filter: 'unread', onFilterChange() {}, ready: true, onMarkAllRead() {},
    renderItem: ({ item, previous }) => { rendered.push([item.id, previous?.id]); return React.createElement('Text', null, item.id); } }));
  assert.deepEqual(rendered, [['one', undefined], ['two', 'one']]);
  assert.equal(tree.root.findByType('FlatList').props.keyExtractor(entries[2]), 'two');
  await act(async () => tree.unmount());
});

test('preferences mount reconciles and displays saved value without requesting permission', async () => {
  const r = preferences({ getPermission: async () => 'undetermined' });
  const tree = await mount(React.createElement(NotificationPreferencesPanel, { controller: r.controller, fields }));
  assert.equal(tree.root.findByType('Switch').props.value, false);
  assert.equal(tree.root.findByType('Switch').props.disabled, false);
  assert.ok(!r.calls.includes('permission'));
  assert.match(text(tree), /may ask for device permission/);
  await act(async () => tree.unmount()); r.controller.dispose();
});

test('denied permission never checks a toggle or claims a save and offers system settings', async () => {
  let permissionRequests = 0, opened = 0;
  const r = preferences({ getPermission: async () => 'denied', requestPermission: async () => { permissionRequests++; return 'denied'; } });
  const tree = await mount(React.createElement(NotificationPreferencesPanel, { controller: r.controller, fields, onOpenSettings: () => { opened++; } }));
  await act(async () => { tree.root.findByType('Switch').props.onValueChange(true); });
  assert.equal(permissionRequests, 1); assert.ok(!r.calls.includes('write'));
  assert.equal(tree.root.findByType('Switch').props.value, false);
  assert.match(text(tree), /blocked in device settings/);
  await act(async () => press(tree, 'Open device settings')); assert.equal(opened, 1);
  await act(async () => tree.unmount()); r.controller.dispose();
});

test('an unknown preference write blocks further toggles until an authoritative refresh', async () => {
  let writes = 0;
  const r = preferences({ write: async () => { writes++; return { status: 'unknown' }; } });
  const tree = await mount(React.createElement(NotificationPreferencesPanel, { controller: r.controller, fields }));
  const oldChange = tree.root.findByType('Switch').props.onValueChange;
  await act(async () => { oldChange(true); });
  assert.match(text(tree), /save result is not confirmed/);
  assert.equal(tree.root.findAllByType('Switch').length, 0);
  await act(async () => { oldChange(true); });
  assert.equal(writes, 1);
  await act(async () => press(tree, 'Try again'));
  assert.equal(tree.root.findByType('Switch').props.disabled, false);
  assert.equal(tree.root.findByType('Switch').props.value, false);
  await act(async () => tree.unmount()); r.controller.dispose();
});

test('device scheduling rollback renders the restored value and explicit failure', async () => {
  let applyCalls = 0;
  const r = preferences({ apply: async () => { if (++applyCalls === 2) throw Error('device unavailable'); } });
  const tree = await mount(React.createElement(NotificationPreferencesPanel, { controller: r.controller, fields }));
  await act(async () => { tree.root.findByType('Switch').props.onValueChange(true); });
  assert.equal(tree.root.findByType('Switch').props.value, false);
  assert.match(text(tree), /Previous preferences were restored/);
  assert.equal(r.calls.filter(value => value === 'write').length, 2);
  await act(async () => tree.unmount()); r.controller.dispose();
});

test('owner changes hide old preferences and suppress writes', async () => {
  const r = preferences();
  const tree = await mount(React.createElement(NotificationPreferencesPanel, { controller: r.controller, fields }));
  await act(async () => { r.setOwner('b:2'); await r.controller.reconcile(); });
  assert.equal(tree.root.findAllByType('Switch').length, 0);
  assert.match(text(tree), /unavailable for this session/);
  assert.equal(r.calls.filter(value => value === 'write').length, 0);
  await act(async () => tree.unmount()); r.controller.dispose();
});
