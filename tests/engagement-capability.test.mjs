import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPromptPolicy } from '../codex/skills/mature-app-starter/assets/app-capabilities/engagement/src/services/engagement/promptPolicy.ts';

const day = 86_400_000;
const policy = { minimumActivities: 3, activitiesBetweenRequests: 3, promptGapMs: 14 * day, requestGapMs: 180 * day };
const evaluate = createPromptPolicy(policy);
const base = { enabled: true, workflowBusy: false, completedActivities: 3, now: 1000 * day, history: { lastPromptAt: null, lastRequestAt: null, activitiesAtLastRequest: 0 } };

test('explicit opt-out and current workflow take priority over eligibility', () => {
  assert.equal(evaluate(base), 'eligible');
  assert.equal(evaluate({ ...base, enabled: false }), 'disabled');
  assert.equal(evaluate({ ...base, workflowBusy: true }), 'busy');
  assert.equal(evaluate({ ...base, completedActivities: 2 }), 'insufficient-activity');
  assert.equal(evaluate({ ...base, enabled: 'false' }), 'disabled');
  assert.equal(evaluate({ ...base, workflowBusy: undefined }), 'busy');
});
test('eligibility counts additional completed activity, independently of any sentiment', () => {
  const history = { lastPromptAt: null, lastRequestAt: 10, activitiesAtLastRequest: 3 };
  assert.equal(evaluate({ ...base, history, completedActivities: 5 }), 'insufficient-activity');
  for (const sentiment of ['positive', 'negative', undefined])
    assert.equal(evaluate({ ...base, history, completedActivities: 6, sentiment }), 'eligible');
});
test('shared prompt and request cooldown boundaries are inclusive; epoch zero is real history', () => {
  const at = base.now;
  assert.equal(evaluate({ ...base, history: { ...base.history, lastPromptAt: at - 14 * day + 1 } }), 'prompt-cooldown');
  assert.equal(evaluate({ ...base, history: { ...base.history, lastPromptAt: at - 14 * day } }), 'eligible');
  assert.equal(evaluate({ ...base, history: { ...base.history, lastRequestAt: at - 180 * day + 1 } }), 'request-cooldown');
  assert.equal(evaluate({ ...base, history: { ...base.history, lastRequestAt: at - 180 * day } }), 'eligible');
  assert.equal(evaluate({ ...base, now: 1, history: { ...base.history, lastPromptAt: 0 } }), 'prompt-cooldown');
});
test('malformed, future or regressed history fails closed', () => {
  for (const value of [NaN, Infinity, -1, 1.5, '3', undefined]) {
    assert.equal(evaluate({ ...base, completedActivities: value }), 'invalid-history');
    assert.equal(evaluate({ ...base, now: value }), 'invalid-history');
    assert.equal(evaluate({ ...base, history: { ...base.history, lastPromptAt: value } }), 'invalid-history');
  }
  assert.equal(evaluate({ ...base, history: { ...base.history, lastRequestAt: base.now + 1 } }), 'invalid-history');
  assert.equal(evaluate({ ...base, history: { ...base.history, activitiesAtLastRequest: 4 } }), 'invalid-history');
});
test('caller mutation cannot widen policy and invalid configuration is rejected', () => {
  const mutable = { ...policy }; const frozen = createPromptPolicy(mutable); mutable.minimumActivities = 0;
  assert.equal(frozen({ ...base, completedActivities: 0 }), 'insufficient-activity');
  assert.throws(() => createPromptPolicy({ ...policy, activitiesBetweenRequests: 0 }));
  assert.throws(() => createPromptPolicy({ ...policy, requestGapMs: NaN }));
  assert.throws(() => createPromptPolicy({}));
});
