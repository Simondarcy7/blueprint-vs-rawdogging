import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { act, create } from 'react-test-renderer';

// This exercises React state/identity and native prop contracts; it is not device/browser rendering.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const require = createRequire(import.meta.url);
export { React, act, create };
export const productUIRoot = fileURLToPath(new URL('../codex/skills/mature-app-starter/assets/app-capabilities/product-ui/src/components/product-ui/', import.meta.url));
let dimensions = { width: 390, height: 844, fontScale: 1, scale: 1 };
let focusedInput = null;
export const keyboardListeners = new Map();
export const setDimensions = patch => { dimensions = { ...dimensions, ...patch }; };
export const setFocusedInput = value => { focusedInput = value; };
function forwarded(name) { return React.forwardRef((props, ref) => React.createElement(name, { ...props, ref }, props.children)); }
const TextInput = forwarded('TextInput');
TextInput.State = { currentlyFocusedInput: () => focusedInput };
export const native = {
  View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput, ScrollView: forwarded('ScrollView'),
  KeyboardAvoidingView: 'KeyboardAvoidingView', ActivityIndicator: 'ActivityIndicator', Switch: 'Switch', Modal: 'Modal',
  Platform: { OS: 'web', select: values => values.web ?? values.default },
  useWindowDimensions: () => dimensions,
  Keyboard: { addListener(name, callback) { const token = Symbol(name); keyboardListeners.set(token, { name, callback }); return { remove: () => keyboardListeners.delete(token) }; } },
  StyleSheet: { create: value => value, hairlineWidth: 1, flatten: value => flattenStyle(value) },
};
native.FlatList = React.forwardRef((props, ref) => React.createElement('FlatList', { ...props, ref },
  props.ListHeaderComponent,
  props.data?.length ? props.data.map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor?.(item, index) ?? index }, props.renderItem({ item, index }))) : props.ListEmptyComponent,
  props.ListFooterComponent));
const cache = new Map();
export function loadSource(path) {
  path = resolve(path);
  if (cache.has(path)) return cache.get(path);
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} }; cache.set(path, module.exports);
  const localRequire = id => {
    if (id === 'react-native') return native;
    if (id.startsWith('.')) {
      const base = resolve(dirname(path), id);
      const next = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(file => existsSync(file) && statSync(file).isFile());
      if (!next) throw new Error(`Missing component import ${id}`);
      return loadSource(next);
    }
    return require(id);
  };
  vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`, { filename: path })(localRequire, module, module.exports);
  cache.set(path, module.exports); return module.exports;
}
export const ui = loadSource(resolve(productUIRoot, 'index.ts'));
export const testTheme = { colors: { background: '#fff', surface: '#f5f5f5', text: '#151515', muted: '#555', border: '#bbb', accent: '#154f4f', onAccent: '#fff', danger: '#a11222', focus: '#005bcc' } };
export const themed = child => React.createElement(ui.ProductUIProvider, { theme: testTheme }, child);
export function flattenStyle(value) {
  if (Array.isArray(value)) return Object.assign({}, ...value.map(flattenStyle));
  return value && typeof value === 'object' ? value : {};
}
export async function render(element, options) {
  let renderer;
  const error = console.error;
  console.error = (...args) => { if (!String(args[0]).includes('react-test-renderer is deprecated')) error(...args); };
  try { await act(async () => { renderer = create(themed(element), options); }); }
  finally { console.error = error; }
  return renderer;
}
