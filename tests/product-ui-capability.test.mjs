import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { join } from 'node:path';
import { capabilityFixture } from './helpers/capability-fixture.mjs';
import { React, act, create, render, themed, ui, native, setDimensions, setFocusedInput, keyboardListeners,
  flattenStyle, loadSource, testTheme } from './product-ui-harness.mjs';

const e = React.createElement;
const host = (renderer, testID) => renderer.root.find(node => typeof node.type === 'string' && node.props.testID === testID);
const button = (renderer, label) => renderer.root.find(node => node.type === 'Pressable' && node.props.accessibilityLabel === label);
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
afterEach(() => { native.Platform.OS = 'web'; setDimensions({ width: 390, height: 844, fontScale: 1 }); setFocusedInput(null); });

test('the installed pack loads independently with its host theme', async () => {
  const fixture = await capabilityFixture(['product-ui']);
  try {
    const installed = loadSource(join(fixture.root, 'src/components/product-ui/index.ts'));
    let renderer;
    await act(async () => { renderer = create(e(installed.ProductUIProvider, { theme: testTheme }, e(installed.ScreenHeader, { title: 'Installed screen' }))); });
    assert.ok(JSON.stringify(renderer.toJSON()).includes('Installed screen'));
    assert.equal(renderer.root.findByProps({ accessibilityRole: 'header' }).props['aria-level'], 1);
    await act(async () => renderer.unmount());
  } finally { await fixture.cleanup(); }
});

test('actions lock synchronously, expose busy/disabled state and retain safe retry text', async () => {
  const pending = deferred(); let calls = 0;
  const renderer = await render(e(ui.ActionButton, { label: 'Save', onPress: () => { calls++; return pending.promise; } }));
  const press = button(renderer, 'Save').props.onPress; let work;
  await act(async () => { work = press(); void press(); });
  assert.equal(calls, 1); assert.equal(button(renderer, 'Save').props.disabled, true);
  assert.equal(button(renderer, 'Save').props.accessibilityState.busy, true);
  assert.equal(button(renderer, 'Save').props['aria-busy'], true);
  assert.equal(button(renderer, 'Save').props['aria-disabled'], true);
  await act(async () => { pending.reject(new Error('PRIVATE_SERVER_DETAIL')); await work; });
  assert.equal(button(renderer, 'Save').props.disabled, false);
  assert.equal(button(renderer, 'Save').props['aria-busy'], false);
  assert.ok(renderer.root.findAllByProps({ accessibilityRole: 'alert' }).length);
  assert.equal(JSON.stringify(renderer.toJSON()).includes('PRIVATE_SERVER_DETAIL'), false);
  await act(async () => renderer.unmount());
});

test('disabled actions do not dispatch and a completion after unmount does not render feedback', async () => {
  let calls = 0; const blocked = await render(e(ui.ActionButton, { label: 'Unavailable', disabled: true, onPress: () => { calls++; } }));
  await act(async () => button(blocked, 'Unavailable').props.onPress()); assert.equal(calls, 0);
  await act(async () => blocked.unmount());
  const pending = deferred(); const live = await render(e(ui.ActionButton, { label: 'Submit', onPress: () => pending.promise }));
  let work; await act(async () => { work = button(live, 'Submit').props.onPress(); });
  await act(async () => live.unmount()); pending.reject(new Error('late')); await work;
  assert.equal(live.toJSON(), null);
});

test('fields preserve raw input and associate required/error text without exposing unlabeled inputs', async () => {
  const changes = [];
  const renderer = await render(e(ui.FormField, { label: 'Amount', required: true, error: 'Check this amount', value: '12.', onChangeText: value => changes.push(value) }));
  const input = renderer.root.findByType('TextInput');
  assert.equal(input.props.value, '12.'); assert.equal(input.props.accessibilityLabel, 'Amount');
  assert.equal(input.props['aria-invalid'], true); assert.equal(input.props['aria-required'], true);
  assert.ok(renderer.root.findAllByProps({ nativeID: input.props['aria-describedby'] }).length);
  await act(async () => input.props.onChangeText('')); assert.deepEqual(changes, ['']);
  await act(async () => renderer.unmount());
});

test('search clear removes only query text and returns focus to its input', async () => {
  const changes = []; let focuses = 0;
  const renderer = await render(e(ui.SearchField, { label: 'Search entries', value: 'partial', onChangeText: value => changes.push(value) }),
    { createNodeMock: element => element.type === 'TextInput' ? { focus() { focuses++; } } : {} });
  await act(async () => button(renderer, 'Clear search').props.onPress());
  assert.deepEqual(changes, ['']); assert.equal(focuses, 1);
  await act(async () => renderer.unmount());
});

test('choice semantics, roving focus and explicit focus recovery respect disabled options', async () => {
  const changes = []; const focus = []; const ref = React.createRef();
  const renderer = await render(e(ui.ChoiceGroup, { ref, label: 'Filter', value: 'all', onChange: value => changes.push(value),
    options: [{ value: 'all', label: 'All', accessibilityLabel: 'All entries' }, { value: 'locked', label: 'Locked', disabled: true }, { value: 'new', label: 'New' }] }),
    { createNodeMock: element => ({ focus() { focus.push(element.props.accessibilityLabel); } }) });
  const options = renderer.root.findAll(node => node.type === 'Pressable');
  assert.deepEqual(options.map(node => node.props.tabIndex), [0, -1, -1]);
  assert.deepEqual(options.map(node => node.props.accessibilityState.checked), [true, false, false]);
  assert.deepEqual(options.map(node => node.props['aria-checked']), [true, false, false]);
  assert.deepEqual(options.map(node => node.props['aria-disabled']), [false, true, false]);
  await act(async () => { options[1].props.onPress(); options[2].props.onPress(); ref.current.focusOption('locked'); ref.current.focusOption('all'); });
  assert.deepEqual(changes, ['new']); assert.deepEqual(focus, ['All entries']);
  await act(async () => renderer.unmount());
});

test('controlled radio selection emits explicit ARIA checked state after a change on the web', async () => {
  function Controlled() {
    const [value, setValue] = React.useState('system');
    return e(ui.ChoiceGroup, { label: 'Appearance', value, onChange: setValue,
      options: [{ value: 'system', label: 'System' }, { value: 'dark', label: 'Dark' }] });
  }
  const renderer = await render(e(Controlled));
  await act(async () => button(renderer, 'Dark').props.onPress());
  assert.equal(button(renderer, 'System').props['aria-checked'], false);
  assert.equal(button(renderer, 'Dark').props['aria-checked'], true);
  assert.equal(button(renderer, 'Dark').props.tabIndex, 0);
  await act(async () => renderer.unmount());
});

test('radio keyboard navigation skips disabled/nested choices, handles descendant targets and leaves modified shortcuts alone', async () => {
  const renderer = await render(e(ui.ChoiceGroup, { label: 'Choice', value: 'a', onChange() {}, options: [{ value: 'a', label: 'A' }] }));
  const group = renderer.root.findByProps({ accessibilityRole: 'radiogroup' }); const focused = []; const clicked = []; let prevented = 0;
  const container = { querySelectorAll: () => choices };
  const choices = [0, 1, 2, 3].map(index => ({ closest: () => index === 3 ? {} : container,
    getAttribute: () => index === 1 ? 'true' : null, focus: () => focused.push(index), click: () => clicked.push(index) }));
  const event = { key: 'ArrowRight', currentTarget: container, target: { closest: () => choices[0] }, preventDefault() { prevented++; } };
  await act(async () => group.props.onKeyDown(event)); assert.deepEqual(focused, [2]); assert.deepEqual(clicked, [2]);
  await act(async () => group.props.onKeyDown({ key: 'ArrowRight', metaKey: true })); assert.equal(prevented, 1);
  await act(async () => group.props.onKeyDown({ ...event, key: ' ', target: { closest: () => choices[2] } }));
  assert.deepEqual(focused, [2]); assert.deepEqual(clicked, [2, 2]);
  await act(async () => group.props.onKeyDown({ ...event, key: 'Home' })); assert.deepEqual(focused, [2, 0]);
  await act(async () => renderer.unmount());
});

test('settings sections remove collapsed controls and rows expose one labeled interactive target', async () => {
  const content = expanded => e(ui.SettingsSection, { title: 'Privacy', expanded, onToggle() {} },
    e(ui.FormField, { label: 'Contact' }), e(ui.SettingsRow, { title: 'Recovery', value: 'Available', description: 'Keep access', onPress() {}, busy: true }));
  const renderer = await render(content(true));
  assert.equal(button(renderer, 'Privacy').props.accessibilityState.expanded, true);
  assert.equal(button(renderer, 'Recovery. Available. Keep access').props.disabled, true);
  assert.equal(button(renderer, 'Recovery. Available. Keep access').props['aria-busy'], true);
  assert.equal(button(renderer, 'Recovery. Available. Keep access').props['aria-disabled'], true);
  assert.equal(renderer.root.findAllByType('TextInput').length, 1);
  await act(async () => renderer.update(themed(content(false))));
  assert.equal(renderer.root.findAllByType('TextInput').length, 0);
  assert.equal(button(renderer, 'Privacy').props.accessibilityState.expanded, false);
  assert.equal(button(renderer, 'Privacy').props['aria-controls'], undefined);
  await act(async () => renderer.unmount());
});

function DraftCounter() {
  const [value, setValue] = React.useState(0);
  return e('Pressable', { accessibilityLabel: 'Local draft', onPress: () => setValue(value + 1) }, e('Text', null, `Draft ${value}`));
}
test('refresh and failed refresh preserve the existing content and its local input', async () => {
  const content = status => e(ui.AsyncContent, { status, hasContent: true, onRetry() {}, errorMessage: 'Refresh failed' }, e(DraftCounter));
  const renderer = await render(content('ready')); await act(async () => button(renderer, 'Local draft').props.onPress());
  for (const status of ['loading', 'error', 'ready']) {
    await act(async () => renderer.update(themed(content(status))));
    assert.ok(JSON.stringify(renderer.toJSON()).includes('Draft 1'));
  }
  await act(async () => renderer.unmount());
});

test('first-load placeholders reserve layout, reveal after delay and hide all decorative accessibility targets', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const renderer = await render(e(ui.AsyncContent, { status: 'loading', skeleton: e('View', { style: { height: 180 } }) }));
  const placeholder = () => host(renderer, 'product-loading-placeholder');
  assert.equal(placeholder().props.style.opacity, 0); assert.equal(placeholder().props.inert, true);
  assert.equal(placeholder().props.accessibilityElementsHidden, true); assert.equal(placeholder().props.pointerEvents, 'none');
  await act(async () => t.mock.timers.tick(119)); assert.equal(placeholder().props.style.opacity, 0);
  await act(async () => t.mock.timers.tick(1)); assert.equal(placeholder().props.style.opacity, 1);
  await act(async () => renderer.unmount()); await act(async () => t.mock.timers.tick(1000));
});

test('retryable content replaces a failed lazy attempt and does not expose raw errors', async () => {
  let attempt = 0;
  const error = console.error; console.error = (...args) => { if (!String(args[0]).includes('PRODUCT_TEST_CHUNK') && !String(args[0]).includes('above error occurred')) error(...args); };
  let renderer;
  try {
    renderer = await render(e(ui.RetryableContent, { load: async () => {
      if (++attempt === 1) throw new Error('PRODUCT_TEST_CHUNK'); return { default: () => e('Text', null, 'Loaded successfully') };
    }, contentProps: {}, errorMessage: 'This screen could not open' }));
    assert.ok(JSON.stringify(renderer.toJSON()).includes('This screen could not open'));
    assert.equal(JSON.stringify(renderer.toJSON()).includes('PRODUCT_TEST_CHUNK'), false);
    await act(async () => button(renderer, 'Try again').props.onPress());
    assert.equal(attempt, 2); assert.ok(JSON.stringify(renderer.toJSON()).includes('Loaded successfully'));
  } finally { if (renderer) await act(async () => renderer.unmount()); console.error = error; }
});

test('late lazy loads cannot replace a newer reset attempt', async () => {
  const old = deferred(); const next = deferred(); let calls = 0;
  const content = resetKey => e(ui.RetryableContent, { resetKey, load: () => ++calls === 1 ? old.promise : next.promise, contentProps: {} });
  const renderer = await render(content('first'));
  await act(async () => renderer.update(themed(content('second'))));
  await act(async () => next.resolve({ default: () => e('Text', null, 'New route') }));
  await act(async () => old.resolve({ default: () => e('Text', null, 'Stale route') }));
  assert.ok(JSON.stringify(renderer.toJSON()).includes('New route')); assert.equal(JSON.stringify(renderer.toJSON()).includes('Stale route'), false);
  await act(async () => renderer.unmount());
});

test('responsive columns preserve draft identity while using measured width and enlarged-text thresholds', async () => {
  const content = () => e(ui.AdaptiveColumns, { primary: e(DraftCounter), secondary: wide => e('Text', null, wide ? 'Alongside' : 'Below') });
  const renderer = await render(content()); await act(async () => button(renderer, 'Local draft').props.onPress());
  for (const [width, direction] of [[800, 'row'], [350, 'column'], [700, 'row']]) {
    await act(async () => host(renderer, 'product-columns').props.onLayout({ nativeEvent: { layout: { width } } }));
    assert.equal(host(renderer, 'product-columns').props.style.flexDirection, direction); assert.ok(JSON.stringify(renderer.toJSON()).includes('Draft 1'));
  }
  setDimensions({ fontScale: 2 }); await act(async () => renderer.update(themed(content())));
  assert.equal(host(renderer, 'product-columns').props.style.flexDirection, 'column');
  await act(async () => renderer.unmount());
});

test('shell navigation adapts without remounting content and conveys active/disabled destinations', async () => {
  const navigate = []; const content = () => e(ui.AppShell, { navigation: [{ key: 'home', label: 'Home' }, { key: 'settings', label: 'Settings' }, { key: 'private', label: 'Private', disabled: true }],
    activeKey: 'home', onNavigate: key => navigate.push(key), insets: { top: 10, bottom: 20 } }, e(DraftCounter));
  const renderer = await render(content()); await act(async () => button(renderer, 'Local draft').props.onPress());
  assert.equal(button(renderer, 'Home').props['aria-current'], 'page');
  await act(async () => { button(renderer, 'Home').props.onPress(); button(renderer, 'Private').props.onPress(); button(renderer, 'Settings').props.onPress(); });
  assert.deepEqual(navigate, ['settings']);
  await act(async () => host(renderer, 'product-app-shell').props.onLayout({ nativeEvent: { layout: { width: 1200 } } }));
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Draft 1'));
  assert.equal(host(renderer, 'product-app-shell').props.style.paddingBottom, 20);
  assert.equal(renderer.root.findByProps({ role: 'navigation' }).props.style.width, 240);
  await act(async () => renderer.unmount());
});

test('web shell supplies one main landmark and a focusable skip action', async () => {
  let destination;
  const renderer = await render(e(ui.AppShell, { navigation: [], activeKey: '', onNavigate() {} }, e('Text', null, 'Task')),
    { createNodeMock: element => ({ focus() { destination = element.props.nativeID; } }) });
  assert.equal(renderer.root.findAllByProps({ role: 'main' }).length, 1);
  const skip = button(renderer, 'Skip to content');
  await act(async () => skip.props.onFocus()); assert.equal(button(renderer, 'Skip to content').props.style.opacity, 1);
  await act(async () => skip.props.onPress()); assert.equal(destination, 'product-app-shell-main');
  await act(async () => renderer.unmount());
});

test('screen keeps a direct in-flow sticky rail, form identity and footer safe area without overlap', async () => {
  const content = sticky => e(ui.ScreenScaffold, { header: e(ui.ScreenHeader, { title: 'Editor' }), stickyHeader: sticky ? e('Text', null, 'Filters') : undefined,
    footer: e('Text', null, 'Save controls'), insets: { top: 10, bottom: 24 }, testID: 'editor' }, e(DraftCounter));
  const renderer = await render(content(false)); await act(async () => button(renderer, 'Local draft').props.onPress());
  await act(async () => renderer.update(themed(content(true))));
  const scroll = renderer.root.findByType('ScrollView');
  assert.equal(React.Children.toArray(scroll.props.children).length, 3); assert.deepEqual(scroll.props.stickyHeaderIndices, [1]);
  assert.equal(React.Children.toArray(scroll.props.children)[1].props.testID, 'editor-rail');
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Draft 1'));
  assert.equal(host(renderer, 'editor-footer').props.style.paddingBottom, 44);
  assert.equal(scroll.findAll(node => node.props.testID === 'editor-footer').length, 0);
  assert.equal(scroll.props.keyboardDismissMode, 'none');
  await act(async () => scroll.props.onLayout({ nativeEvent: { layout: { height: 700 } } }));
  await act(async () => host(renderer, 'editor-rail').props.onLayout({ nativeEvent: { layout: { height: 50 } } }));
  assert.equal(flattenStyle(host(renderer, 'editor-content').props.style).minHeight, 650);
  await act(async () => renderer.unmount());
});

test('host-owned bottom insets are not applied twice', async () => {
  const renderer = await render(e(ui.ScreenScaffold, { insets: { top: 0, bottom: 24 }, bottomInsetHandledByHost: true, footer: e('Text', null, 'Save') }));
  assert.equal(host(renderer, 'product-screen-footer').props.style.paddingBottom, 20);
  await act(async () => renderer.unmount());
});

test('native keyboard reveal only follows a focused input and cancels its scheduled frame on teardown', async () => {
  native.Platform.OS = 'ios'; const callbacks = new Map(); let next = 0; const reveals = [];
  const raf = globalThis.requestAnimationFrame; const cancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = callback => { callbacks.set(++next, callback); return next; };
  globalThis.cancelAnimationFrame = id => callbacks.delete(id);
  let renderer;
  try {
    renderer = await render(e(ui.ScreenScaffold, null, e('Text', null, 'Form')),
      { createNodeMock: () => ({ scrollResponderScrollNativeHandleToKeyboard: (...args) => reveals.push(args) }) });
    const scroll = renderer.root.findByType('ScrollView'); const input = {};
    await act(async () => scroll.props.onFocus({ target: {} })); assert.equal(callbacks.size, 0);
    setFocusedInput(input); await act(async () => scroll.props.onFocus({ target: input })); assert.equal(callbacks.size, 1);
    callbacks.values().next().value(); assert.equal(reveals[0][0], input);
    await act(async () => scroll.props.onFocus({ target: input }));
    await act(async () => renderer.unmount()); renderer = null;
    assert.equal(keyboardListeners.size, 0); assert.equal(callbacks.has(next), false);
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    globalThis.requestAnimationFrame = raf; globalThis.cancelAnimationFrame = cancel;
  }
});
