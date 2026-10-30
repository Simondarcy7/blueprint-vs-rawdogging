# Execution record — 29 October 2026

This is the phase 1 snapshot. The subsequent [phase 2 execution record](phase-2-summary.md) adds four UX/product capability packs, a runnable browser reference and two further donor fixes; its test totals supersede this historical count.

## Outcome

The revised full proposal and broad source inventory are complete. The first extraction tranche is implemented locally in Blueprint. Two targeted Golf App engineering defects are fixed locally. This is execution of the initial tranche, not completion of every candidate in the inventory or a production release.

Blueprint checkout: `/Users/simondarcy/Documents/ChatGPT/Blueprint`, branch `codex/golf-foundation-extraction`, base `0d770675750ab62da417aee0fd230e9b7811415f`. Golf App remains on its pre-existing `codex/release-1016-record` branch and commit `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df`; its six task-related source/test changes are uncommitted. Existing marketing work was preserved. Neither repository was pushed, merged or deployed; no vendor accounts or npm packages were published.

## Implemented

- New `updates` pack: shared startup controller, permanent interaction latch, coalesced attempts, deadlines/cancellation, foreground checks and injected Expo adapter. Accepted native reload remains gated because it is not cancellable.
- Extended `diagnostics` pack: consent-aware analytics, independent provider fanout, stale-event fencing, bounded optional SDK waits, and separate explicit Sentry bridge with fresh final-event sanitization.
- New `outbox` pack: validated durable pending work, ordered at-least-once delivery, stable retry identities, ownership checks, disposal and bounded batches.
- Scaffold `--only-packs`: installs selected capabilities into an existing generated shell without colliding with/replacing the baseline. Validates the required helper path and preserves existing destinations.
- Consumer integration guide, installed skill reference, source fingerprints, failure-contract notes and a broad candidate inventory.
- Golf fixes: late lease registration now fences stale writers; OTA remounts cannot regain reload eligibility after content became interactive. Details and donor fingerprints are in `golf-engineering.md`.

The existing motion, recovery, storage and UI primitives were retained. They were not copied again or counted as new implementation.

## Verification

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Blueprint `npm test` | **121 passed, 0 failed** | Complete toolkit suite, reference parity, fixtures and local component tests |
| Generated-app adoption | Passed in toolkit suite | New packs installed using the generated app's installed scaffold; existing helper/branding preserved; repeat collisions refused |
| Copied capability strict TypeScript | Passed in toolkit suite | OTA, analytics, Sentry and outbox entry points in the generated layout; not a full Expo build |
| New OTA tests | 17 passed in toolkit suite | Controlled adapters/clocks; no native update delivery |
| New observability tests | 16 passed in toolkit suite | Fake transports and final-envelope checks; no provider ingestion/native crash proof |
| New outbox tests | 13 passed in toolkit suite | Memory/fault-injected adapters and two payload domains; no real backend deduplication proof |
| Golf focused Vitest | 20 passed | Startup and account ownership/storage-adjacent cases |
| Golf OTA component tests | 8 passed | Mocked native APIs, remounts and failure recovery |
| Golf full mobile TypeScript + changed-file ESLint | Passed | Static correctness of local donor changes |
| Reference synchronization and diff checks | Passed | Canonical guide mirrors and whitespace |

Three agents worked with distinct file ownership. Independent cross-review found and corrected an extracted OTA recheck failure that could leave `reloading` visible without invoking native reload. Outbox review clarified the uncancellable local-write contract; unsafe timeout-and-resume writes were deliberately avoided. Root reviewed the observability boundary and donor diffs.

## Remaining acceptance gates

1. Select a real non-golf consumer and wire complete workflows, including identity, persistence, UI and failure states. Fixture consumers are not real adoption evidence.
2. Connect actual analytics/Sentry adapters and inspect wire payloads. Native crash setup, source maps, account policy and consent UI are not supplied by the bridge.
3. Verify native OTA behaviour in a compatible preview build, including offline startup, remounts and SDK58 donor versus SDK57 starter compatibility. A hung accepted native reload still needs a platform recovery design.
4. Review and extract the next complete draft/import/review and interaction capabilities from the inventory. Login, guest claims, deletion/recovery and collaboration require backend/multi-account proof before being described as reusable complete features.
5. Reverse-adopt selected shared code into Golf App and a second real consumer; demonstrate one shared fix reaching both. Only then settle package boundaries and distribution.

## Token usage notes

Most context went to source implementations, proposal revision and integration contracts. A few early combined file reads returned more text than needed; verified paths and section-limited reads would avoid that next time. Parallel work used isolated ownership, with focused cross-review rather than duplicate broad audits. The inventory and provenance files let future sessions continue from exact source pointers instead of rescanning the app. Exact token billing was not available.
