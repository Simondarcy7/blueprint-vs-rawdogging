# Phase 2 execution record — 29 October 2026

## Outcome

Four additional reusable UX/product capabilities are implemented locally, composed into a runnable non-golf journal example, and integrated with Blueprint's existing-app scaffold. Two targeted Golf App fundamentals were reproduced and corrected. This extends the [full proposal](../2026-10-29-product-capability-foundation.md) and [phase 1 record](execution-summary.md); it does not complete every candidate in the inventory.

The reusable value is the behaviour: preserve unfinished work, acknowledge only confirmed persistence, require review before replacement, recover useful focus, and choose a considerate moment to ask for engagement. Domain rules, branding and backend authorization remain explicit application decisions.

## Delivered capabilities

| Pack | Behaviour delivered | Detailed evidence |
| --- | --- | --- |
| `drafts` | Owner/document-scoped envelopes; late-load protection; explicit conflict recovery; immutable snapshots; serialized save/discard; honest saved revision; retained input after failure | [Drafts](drafts.md) |
| `import-review` | Selection without writes; immutable review; revision-bound confirmation; revalidation; owner-change fencing; retained retry context; truthful cancellation after commit handoff | [Import review](import-review.md) |
| `interactions` | Return focus and both scroll axes; respect deliberate destination focus/newer overlays; reject unavailable targets; per-document listeners and cancellable teardown | [Interactions](interactions.md) |
| `engagement` | Product-owned activity/cooldowns; explicit enabled/idle gates; malformed/future/regressed history fails closed; no sentiment input or platform request side effects | [Engagement](engagement.md) |

The scaffold installs all four through `--only-packs` while preserving the existing shell. Drafts and import review use the existing baseline async helper; the other two have no dependency on React, Expo or a vendor SDK. Documentation mirrors ship with the installed skill. Existing motion/reduced-motion, navigation, storage and UI primitives were retained rather than counted again.

## Runnable reference

Run `npm run example:ux` from Blueprint after installing the repository dependencies. The journal at the printed localhost address uses the actual four capability sources. It includes draft persistence/recovery, explicit import review, an accessible native discard dialog, prompt eligibility and controlled storage/commit failures. Port 8769 is stable by default; another port can be selected explicitly. The owned temporary build is removed on shutdown. `npm run example:ux:check` provides strict compile verification.

The example contains no real accounts, external telemetry or backend. It establishes browser composition outside golf; it is not a second production consumer. [Integration guide](../../docs/product-workflow-capabilities.md), [example source](../../examples/product-workflows/README.md), [browser evidence](../../output/playwright/product-workflows-qa.md).

## Golf App improvements

- Overlay restoration no longer steals deliberate focus from a destination link/heading or attempts to restore into hidden, inert, aria-disabled or disabled-fieldset ancestry. Actual DOM regression tests showed eight failures before the fix and all nine passing afterward. Existing overlay caller APIs are preserved.
- Review prompt eligibility now rejects malformed current time and history before calculating cooldowns. Four reproduced failures now pass; existing product thresholds are preserved.

These are small source changes with focused regressions. Golf App has not been migrated wholesale to the extracted packs. The phase 1 OTA/account lease fixes and unrelated existing marketing changes remain intact. The phase 2 patch and a separate source/destination fingerprint record accompany this report.

[Source/destination fingerprints](../golf-ux-extraction-provenance.json) distinguish committed donor bytes from local corrections. The [five-file donor patch](golf-ux-engineering.patch) was checked against the current working tree using a reverse-apply dry run. All 13 extracted-source/test/example fingerprints were verified after the final code changes.

## Verification

Final verification: **179 Blueprint tests passed, zero failures**. This includes 56 focused tests across the four new packs, installed-app adoption, strict compilation of the real example and process-level shutdown cleanup. No tests were skipped on this macOS run.

| Check | Result / scope |
| --- | --- |
| Blueprint complete `npm test` | **179 passed**: reference parity, toolkit tests, generated-app adoption, strict copied-layout compilation, actual example build and shutdown cleanup |
| Draft/import/interaction/engagement contracts | **22 / 16 / 13 / 5 passed**, respectively; faults, races, ownership, review revisions, immutability, lifecycle and policy boundaries |
| Golf App focused Vitest | **19 passed**: nine actual DOM focus tests and ten prompt-policy tests |
| Golf App adjacent Jest component tests | **15 passed** across overlay return focus, FilterSheet, ContextActionSheet and ContextActionSheetMorph |
| Golf App full mobile TypeScript + five changed-file ESLint checks | Passed |
| Browser reference | Draft reload, failed-save retry, read retry, review without writes, failed-import retry, malformed/stale source, discard focus return and back-navigation continuity passed |
| Responsive check | Desktop 1360 px and mobile 390 px; no mobile horizontal overflow; visible buttons at least 44 px high; reduced-motion preference exercised |

Three agents worked on distinct files. Cross-review caught stale draft persistence receipts after storage disappeared, accessor-based snapshot mutation, permissive malformed prompt flags, missing retry after draft read failure, teardown on persisted pagehide, and incomplete import-busy gating. These were corrected before final verification. The reference uses a fixed storage origin and deliberately treats editing and reviewing as busy states.

## Limits and next acceptance

1. Reverse-adopt a selected capability into Golf App and a real non-golf project, including UI, storage and identity. Demonstrate that one shared fix reaches both before settling package distribution.
2. Verify real native storage, platform accessibility/focus, actual account changes and concurrent writers. DOM tests and a browser reference do not prove these.
3. For imports, the host must provide atomic writes, server authorization, target revision checks and recovery for uncertain acknowledgements. Controller ownership predicates are not backend security.
4. Continue targeted discovery of undo with new arrivals, notification preference transactions, contextual discovery and account recovery. Their persistence/permission contracts need inspection before extraction.
5. Phase 1 real Sentry/analytics ingestion and compatible native OTA delivery remain unverified; phase 2 does not close those gates.

Both repositories retain their pre-existing branches. All changes are local and uncommitted. No push, merge, package publication, deployment or real engagement request occurred.

The cleanup check caught a demo-server bug: npm interruption could terminate the process before asynchronous temporary-build cleanup completed. A process-group regression failed before the fix and passed after synchronous, idempotent shutdown was added. It also verifies that the listening port can immediately be reused. This signal test is POSIX-specific; Windows shutdown remains unverified.

Cleanup complete: the owned `blueprint-ux` browser session and local server were stopped. The four known pre-fix builds were explicitly removed and their absence verified; the regression test confirms subsequent npm interruption removes its own build. Screenshots and the QA record are retained under `output/playwright/`. Transient Playwright CLI logs are ignored by Git. No shared browser sessions, user storage or unrelated application processes were closed.

## Token usage notes

Most context went to the source state machines, race/failure contracts and browser integration. A few combined document reads returned more than needed; narrower section reads would reduce that. Agents used separate ownership and cross-review to avoid duplicate broad audits. The inventory, exact file fingerprints and runnable reference now support continuation without another repo-wide survey. Exact billing/token totals were unavailable.
