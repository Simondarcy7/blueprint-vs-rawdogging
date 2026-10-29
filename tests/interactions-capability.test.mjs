import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { createOverlayFocusManager } from '../codex/skills/mature-app-starter/assets/app-capabilities/interactions/src/services/interactions/overlayFocus.ts';

// Lightweight DOM contract model. Real DOM regressions run in the donor's Vitest/jsdom suite;
// this model does not prove layout, focus traps, browser paint or assistive-technology behaviour.
function dom() {
  const elements = [];
  const frames = new Map();
  const listeners = new Map();
  let frameId = 0;
  const owner = {
    activeElement: null,
    querySelectorAll: selector => elements.filter(element => element.isConnected && element.matches(selector)),
    addEventListener: (event, callback) => { const callbacks = listeners.get(event) ?? new Set(); callbacks.add(callback); listeners.set(event, callbacks); },
    removeEventListener: (event, callback) => { listeners.get(event)?.delete(callback); },
    defaultView: {
      requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
      cancelAnimationFrame: id => frames.delete(id),
      getComputedStyle: element => element.style,
    },
  };
  function node(tag = 'div', parent = owner.body, attributes = {}) {
    const element = {
      tag, parentElement: parent ?? null, ownerDocument: owner, isConnected: true,
      attributes: { ...attributes }, style: { display: 'block', visibility: 'visible' },
      scrollHeight: 100, clientHeight: 100, scrollWidth: 100, clientWidth: 100, scrollTop: 0, scrollLeft: 0,
      focusCalls: [], rects: [1],
      getClientRects() { return this.rects; },
      hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
      matches(selector) {
        return selector.split(',').some(part => {
          part = part.trim();
          if (part === ':disabled') return this.hasAttribute('disabled') || (this.tag === 'button' && Boolean(this.parentElement?.closest('fieldset[disabled]')));
          const match = /^([a-z]+)?(?:\[([\w-]+)(?:="([^"]*)")?\])?$/.exec(part);
          return Boolean(match && (!match[1] || match[1] === this.tag) && (!match[2] || (this.hasAttribute(match[2]) && (match[3] === undefined || this.attributes[match[2]] === match[3]))));
        });
      },
      closest(selector) { for (let current = this; current; current = current.parentElement) if (current.matches(selector)) return current; return null; },
      contains(other) { for (let current = other; current; current = current.parentElement) if (current === this) return true; return false; },
      focus(options) { this.focusCalls.push(options); owner.activeElement = this; this.onFocus?.(); },
    };
    elements.push(element);
    return element;
  }
  owner.body = node('body', null);
  owner.activeElement = owner.body;
  return {
    owner, node, frames, listeners,
    flush() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(0)); },
    emit(type, target, properties = {}) { for (const callback of listeners.get(type) ?? []) callback({ type, target, ...properties }); },
  };
}
function fixture(t, options) {
  const model = dom();
  const manager = createOverlayFocusManager({ document: model.owner, ...options });
  t.after(() => manager.dispose());
  const trigger = model.node('button');
  trigger.focus();
  trigger.focusCalls.length = 0;
  return { ...model, manager, trigger };
}

test('interaction capability has no React/runtime dependencies and passes strict TypeScript', () => {
  const file = fileURLToPath(new URL('../codex/skills/mature-app-starter/assets/app-capabilities/interactions/src/services/interactions/overlayFocus.ts', import.meta.url));
  const program = ts.createProgram([file], { noEmit: true, strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, types: [] });
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')), []);
});
test('SSR capture, restore and disposal are inert', () => {
  const manager = createOverlayFocusManager({ document: null });
  const release = manager.watchTriggers();
  const restore = manager.captureReturnFocus();
  restore(); restore.cancel(); release(); manager.dispose(); manager.dispose(); restore();
});
test('restores once after the closing frame and preserves both scroll axes', t => {
  const { owner, node, manager, flush, trigger } = fixture(t);
  const scroller = node();
  scroller.scrollHeight = 1000; scroller.scrollWidth = 500; scroller.scrollTop = 480; scroller.scrollLeft = 70;
  trigger.parentElement = scroller;
  trigger.onFocus = () => { scroller.scrollTop = 0; scroller.scrollLeft = 0; };
  const restore = manager.captureReturnFocus();
  owner.activeElement = owner.body;
  restore(); restore();
  assert.equal(trigger.focusCalls.length, 0);
  flush();
  assert.deepEqual(trigger.focusCalls, [{ preventScroll: true }]);
  assert.equal(scroller.scrollTop, 480); assert.equal(scroller.scrollLeft, 70);
});
test('preserves any deliberate destination focus, before or after restore is requested', t => {
  for (const before of [true, false]) {
    const { node, owner, manager, flush, trigger } = fixture(t);
    const destination = node('a');
    const restore = manager.captureReturnFocus();
    if (before) destination.focus();
    restore();
    if (!before) destination.focus();
    flush();
    assert.equal(owner.activeElement, destination);
    assert.equal(trigger.focusCalls.length, 0);
  }
});
test('does not steal focus from a newer modal and returns to a still-open parent modal', t => {
  for (const nested of [true, false]) {
    const { node, owner, manager, flush, trigger } = fixture(t);
    const modal = node('div', owner.body, { 'aria-modal': 'true' });
    if (nested) trigger.parentElement = modal;
    const restore = manager.captureReturnFocus();
    owner.activeElement = owner.body;
    restore(); flush();
    assert.equal(trigger.focusCalls.length, nested ? 1 : 0);
  }
});
test('a hidden modal does not block the underlying trigger', t => {
  const { node, owner, manager, flush, trigger } = fixture(t);
  const modal = node('div', owner.body, { 'aria-modal': 'true' });
  modal.style.visibility = 'hidden';
  const restore = manager.captureReturnFocus(); owner.activeElement = owner.body;
  restore(); flush();
  assert.equal(trigger.focusCalls.length, 1);
});
test('detached, disabled, inert, hidden and inaccessible targets are not focused', t => {
  const mutations = [
    (trigger) => { trigger.isConnected = false; },
    (trigger) => { trigger.attributes.disabled = ''; },
    (_, parent) => { parent.attributes.inert = ''; },
    (_, parent) => { parent.attributes.hidden = ''; },
    (_, parent) => { parent.attributes['aria-hidden'] = 'true'; },
    (_, parent) => { parent.attributes['aria-disabled'] = 'true'; },
    (_, parent) => { parent.style.display = 'none'; },
    (_, parent) => { parent.style.visibility = 'hidden'; },
  ];
  for (const mutate of mutations) {
    const { owner, node, manager, flush, trigger } = fixture(t);
    const parent = node(); trigger.parentElement = parent;
    const restore = manager.captureReturnFocus(); owner.activeElement = owner.body;
    restore(); mutate(trigger, parent); flush();
    assert.equal(trigger.focusCalls.length, 0);
  }
});
test('capture preserves pre-pointer-focus scroll and reference-counts shared listeners', t => {
  const { owner, manager, emit, trigger, flush, listeners } = fixture(t);
  const first = manager.watchTriggers(); const second = manager.watchTriggers();
  assert.equal(listeners.get('pointerdown').size, 1);
  owner.body.scrollHeight = 1000; owner.body.scrollTop = 250;
  emit('pointerdown', trigger);
  owner.body.scrollTop = 0;
  const restore = manager.captureReturnFocus(); owner.activeElement = owner.body;
  restore(); flush();
  assert.equal(owner.body.scrollTop, 250);
  first(); first(); assert.equal(listeners.get('pointerdown').size, 1);
  second(); assert.equal(listeners.get('pointerdown').size, 0);
});
test('modified/repeated keys do not capture a stale trigger', t => {
  for (const properties of [{ key: 'Escape' }, { key: 'Enter', ctrlKey: true }, { key: ' ', repeat: true }]) {
    const { owner, node, manager, emit, trigger, flush } = fixture(t);
    manager.watchTriggers();
    emit('keydown', trigger, properties);
    const current = node('button'); current.focus(); current.focusCalls.length = 0;
    const restore = manager.captureReturnFocus(); owner.activeElement = owner.body;
    restore(); flush();
    assert.equal(trigger.focusCalls.length, 0); assert.equal(current.focusCalls.length, 1);
  }
});
test('stale and future-dated trigger captures fall back to the current focus', t => {
  for (const time of [2000, -1]) {
    let now = 0;
    const { owner, node, manager, emit, trigger, flush } = fixture(t, { now: () => now });
    manager.watchTriggers(); emit('keydown', trigger, { key: 'Enter' });
    now = time;
    const current = node('button'); current.focus(); current.focusCalls.length = 0;
    const restore = manager.captureReturnFocus(); owner.activeElement = owner.body;
    restore(); flush();
    assert.equal(trigger.focusCalls.length, 0); assert.equal(current.focusCalls.length, 1);
  }
});
test('explicit cancellation and manager disposal cancel queued frames and listeners', t => {
  for (const cancelManager of [true, false]) {
    const { manager, frames, listeners, trigger, flush } = fixture(t);
    const release = manager.watchTriggers();
    const restore = manager.captureReturnFocus(); restore();
    assert.equal(frames.size, 1);
    if (cancelManager) manager.dispose(); else restore.cancel();
    assert.equal(frames.size, 0);
    flush(); restore();
    assert.equal(trigger.focusCalls.length, 0);
    release(); release();
    assert.equal(listeners.get('pointerdown').size, 0);
  }
});
test('managers do not share triggers across documents', t => {
  const first = fixture(t); const second = fixture(t);
  first.manager.watchTriggers(); second.manager.watchTriggers();
  first.emit('pointerdown', first.trigger);
  second.manager.captureReturnFocus()(); second.flush();
  assert.equal(first.trigger.focusCalls.length, 0);
  assert.equal(second.trigger.focusCalls.length, 1);
});
test('invalid trigger windows are rejected', () => {
  for (const triggerWindowMs of [-1, NaN, Infinity]) assert.throws(() => createOverlayFocusManager({ document: null, triggerWindowMs }));
});
