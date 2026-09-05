# Testing Strategy

Start with fast tests that protect the riskiest logic.

## Default Sequence

1. Typecheck and lint from day one.
2. Unit-test pure product logic.
3. Test service contracts and parser behavior.
4. Add lightweight component tests for important UI states.
5. Add end-to-end smoke tests after stable journeys exist.
6. Add broader browser/mobile automation only when the flows are durable enough to justify maintenance.

## What To Test Early

- Calculations.
- Validation rules.
- State transitions.
- Ranking/sorting behavior.
- API payload parsing.
- Fallback/stub behavior.
- Empty, partial, stale, unavailable, and failed states.
- Config parsing and fail-fast rules.

## What To Delay

- Full journey automation before journeys stabilize.
- Snapshot-heavy UI tests.
- Broad E2E suites for workflows likely to change.
- Tests that mostly duplicate framework behavior.

## Handoff Verification

Use the lightest proof:

- Pure function: unit test.
- Service contract: service test with success and malformed payload.
- Component state: component test or manual check.
- Route journey: smoke test or manual walkthrough.
- Visual layout: screenshot or screen recording.

## Coverage and evidence gaps

Read `verification-and-review.md` from the mature-app-starter references or installed foundation docs when assessing review findings, platform bugs or release claims. Ensure shared domain code and public exports are included in typechecking/test discovery. Test data meaning and async ordering using `code-correctness.md` where applicable. Record unverified device/deployment behavior separately from passing source checks.
