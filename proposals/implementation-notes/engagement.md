# Engagement eligibility — 29 October 2026

## Product value and source

The Golf App's `mobile/src/modules/optional-prompts/reviewPolicy.ts` captures a reusable product decision: earn an interruption through completed use, space requests apart, and avoid prompting while someone is busy. Source revision: `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df`. The extracted policy uses product-owned activity units and thresholds; it does not copy golf round counts or ask for sentiment as an eligibility input.

Implementation: `codex/skills/mature-app-starter/assets/app-capabilities/engagement/src/services/engagement/promptPolicy.ts`.

`createPromptPolicy` validates and copies `minimumActivities`, `activitiesBetweenRequests`, `promptGapMs` and `requestGapMs`. `evaluate` requires explicit enablement, an idle workflow, completed activity, current time and history. It returns an eligibility decision and stable reason; it never displays a prompt or invokes an SDK.

History uses explicit `null` for absent timestamps. Non-finite, negative, fractional, future and regressed history fails closed. Malformed runtime enablement/busy flags also fail closed. Epoch zero is a valid timestamp. The host persists only real actions and decides shared prompt coordination, platform limits and appropriate consent. An SDK request does not establish that the operating system displayed a review prompt.

## Donor improvement

Four failing parameterized cases reproduced an invalid current time (`NaN`, `Infinity`, a negative value or a fraction) allowing prompt eligibility in the original donor implementation. A focused guard now rejects malformed current time and stored history before calculating cooldowns. Existing thresholds and product semantics are unchanged.

Changed donor files:

- `mobile/src/modules/optional-prompts/reviewPolicy.ts`
- `mobile/src/modules/optional-prompts/reviewPolicy.test.ts`

## Evidence

- Blueprint: five policy tests cover invalid configuration/runtime flags, enabled/idle gating, activity minimums, cooldown boundaries, explicit absent history and malformed/future/regressed history.
- Golf App: all ten review-policy tests pass after the fix; four failed before it.
- Focused donor ESLint passes. The donor full mobile typecheck is recorded with phase 2 verification.
- The browser reference exposes eligibility with incomplete drafting, an open dialog and all active import states treated as busy; no real engagement prompt or platform review request is sent.

The extracted policy and donor fix are local changes, with fingerprints recorded in `../golf-ux-extraction-provenance.json`.
