import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { act, create } from 'react-test-renderer';

// Mocked component behavior only; real native/browser rendering is verified in the host app.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const require = createRequire(import.meta.url);
const source = fileURLToPath(new URL('../codex/skills/mature-app-starter/assets/app-baseline/src/', import.meta.url));
const listeners = new Map();
let readMotion = async () => false;
const native = {
  View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput: 'TextInput', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'web' },
  AccessibilityInfo: { isReduceMotionEnabled: () => readMotion(), isScreenReaderEnabled: async () => true, announceForAccessibility() {}, addEventListener(name, callback) { listeners.set(name, callback); return { remove: () => listeners.delete(name) }; } },
  AppState: { addEventListener: () => ({ remove() {} }) },
};
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; cache.set(path, module.exports);
  const localRequire = id => {
    if (id === 'react-native') return native;
    if (id.startsWith('.')) {
      const base = resolve(dirname(path), id);
      const next = ['.ts', '.tsx', '/index.ts'].map(ext => base + ext).find(existsSync);
      if (!next) throw new Error(`Missing recipe import: ${id}`);
      return load(next);
    }
    return require(id);
  };
  vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`, { filename: path })(localRequire, module, module.exports);
  cache.set(path, module.exports); return module.exports;
}
const { AppButton, AppTextField } = load(resolve(source, 'components/ui/primitives.tsx'));
const { AppState } = load(resolve(source, 'components/ui/AppState.tsx'));
const { useReducedMotion } = load(resolve(source, 'hooks/useReducedMotion.ts'));

test('shared button blocks duplicate async actions and retains actionable failure text', async () => {
  let calls = 0; let fail; let renderer;
  await act(async () => { renderer = create(React.createElement(AppButton, { label: 'Save', onPress: () => { calls++; return new Promise((_, reject) => { fail = reject; }); } })); });
  const press = renderer.root.findByType('Pressable').props.onPress;
  let running;
  await act(async () => { running = press(); void press(); });
  assert.equal(calls, 1); assert.equal(renderer.root.findByType('Pressable').props.disabled, true);
  await act(async () => { fail(new Error('PRIVATE_SENTINEL')); await running; });
  assert.equal(renderer.root.findByType('Pressable').props.disabled, false);
  assert.equal(JSON.stringify(renderer.toJSON()).includes('PRIVATE_SENTINEL'), false);
  assert.ok(renderer.root.findAllByProps({ accessibilityRole: 'alert' }).length);
  await act(async () => renderer.unmount());
});
test('text field connects visible error text and accessible labeling', async () => {
  let renderer;
  await act(async () => { renderer = create(React.createElement(AppTextField, { label: 'Name', error: 'Enter a name' })); });
  const input = renderer.root.findByType('TextInput');
  assert.equal(input.props.accessibilityLabel, 'Name'); assert.equal(input.props['aria-invalid'], true);
  assert.ok(renderer.root.findAllByProps({ nativeID: input.props['aria-describedby'] }).length);
  await act(async () => renderer.unmount());
});
test('recovery action failure stays visible and permits retry', async () => {
  let renderer;
  await act(async () => { renderer = create(React.createElement(AppState, { title: 'Unavailable', message: 'Try again', palette: { background: 'white', text: 'black', muted: 'gray', accent: 'blue', border: 'gray' }, action: { label: 'Retry', run: async () => { throw new Error('unavailable'); } } })); });
  await act(async () => { await renderer.root.findByType('Pressable').props.onPress(); });
  assert.ok(renderer.root.findAllByProps({ accessibilityRole: 'alert' }).length);
  assert.equal(renderer.root.findByType('Pressable').props.disabled, false);
  await act(async () => renderer.unmount());
});
test('a late OS preference read cannot override a newer reduced-motion event', async () => {
  let resolveRead; let renderer;
  readMotion = () => new Promise(resolve => { resolveRead = resolve; });
  function Probe() { return React.createElement('Motion', { reduced: useReducedMotion() }); }
  await act(async () => { renderer = create(React.createElement(Probe)); });
  assert.equal(renderer.root.findByType('Motion').props.reduced, true);
  await act(async () => { listeners.get('reduceMotionChanged')(true); resolveRead(false); });
  assert.equal(renderer.root.findByType('Motion').props.reduced, true);
  await act(async () => renderer.unmount()); assert.equal(listeners.has('reduceMotionChanged'), false);
});
