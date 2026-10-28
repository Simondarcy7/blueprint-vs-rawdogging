import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDiagnosticTrail } from '../codex/skills/mature-app-starter/assets/app-capabilities/diagnostics/src/services/observability/safeTelemetry.ts';
import { createSaveAcknowledgement } from '../codex/skills/mature-app-starter/assets/app-capabilities/storage/src/services/storage/saveAcknowledgement.ts';

test('trail is consent-gated, bounded, defensive and excludes arbitrary user content', () => {
  const policy = { navigation: { screen: ['home', 'settings'] } };
  const trail = createDiagnosticTrail(policy, 2);
  assert.equal(trail.record('navigation'), false);
  trail.setEnabled(true);
  policy.navigation.screen.push('SECRET');
  assert.equal(trail.record('unknown', { token: 'SECRET' }), false);
  trail.record('navigation', { screen: 'home', token: 'SECRET' });
  trail.record('navigation', { screen: 'settings' });
  trail.record('navigation', { screen: 'SECRET', url: '/users/SECRET' });
  assert.deepEqual(trail.snapshot(), [
    { name: 'navigation', properties: { screen: 'settings' } },
    { name: 'navigation', properties: {} },
  ]);
  const copy = trail.snapshot(); copy[0].properties.screen = 'SECRET'; copy.push({});
  assert.equal(JSON.stringify(trail.snapshot()).includes('SECRET'), false);
  trail.setEnabled(false); assert.deepEqual(trail.snapshot(), []);
  trail.setEnabled(true); assert.deepEqual(trail.snapshot(), []);
  trail.record('navigation'); trail.clear(); assert.deepEqual(trail.snapshot(), []);
  assert.throws(() => createDiagnosticTrail(policy, Infinity), /limit/);
  assert.throws(() => createDiagnosticTrail(policy, 0), /limit/);
});

test('diagnostic input failures never escape into navigation', () => {
  const trail = createDiagnosticTrail({ action: { state: ['ready'] } });
  trail.setEnabled(true);
  assert.equal(trail.record('action', { get state() { throw new Error('SECRET'); } }), false);
  assert.deepEqual(trail.snapshot(), []);
});

test('old completion cannot mark new edits saved; out-of-order receipts do not regress state', () => {
  const state = createSaveAcknowledgement();
  assert.equal(state.isCurrent(), false);
  const initial = state.capture(); state.changed();
  assert.equal(state.acknowledge(initial), false);
  const older = state.capture(); state.changed(); const newer = state.capture();
  assert.equal(state.acknowledge(newer), true);
  assert.equal(state.acknowledge(older), true);
  assert.equal(state.isCurrent(), true);
  state.changed(); assert.equal(state.isCurrent(), false);
  assert.equal(state.acknowledge(newer), false);
});

test('owner changes, resets and foreign tickets cannot acknowledge replacement data', () => {
  const state = createSaveAcknowledgement(); const old = state.capture();
  state.reset(); state.reset();
  assert.equal(state.acknowledge(old), false);
  assert.equal(state.acknowledge(createSaveAcknowledgement().capture()), false);
  assert.equal(state.acknowledge({}), false);
  assert.equal(state.isCurrent(), false);
  assert.equal(state.acknowledge(state.capture()), true);
});
