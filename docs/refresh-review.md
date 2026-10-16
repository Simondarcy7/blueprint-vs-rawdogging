# Foundation refresh review

## Scope and evidence

This refresh reviewed the toolkit's contract, installer, skill routing, public/reference duplication, templates, source recipes, scaffold/generator, CI and tests. A mature Expo product supplied source examples across shell/navigation, shared UI/motion, persistence/recovery, identity/sync, imports, notifications, sharing, discovery/content, analytics and release tooling.

The follow-through review inventories every repository path, traverses all recognized text, examines all reachable commit subjects and file-change history, and gives every feature/module family a reusable-foundation disposition. It covers 11,756 tracked source-product paths plus 19 working-tree candidates, 336 reachable commits from June through October, all 22 toolkit commits including the existing shell branch, 83 relevant local archive files spanning 80 conversation IDs, and all 58 accessible turns of an earlier quality conversation. See [the coverage ledger](review-coverage.json) for counts, method, findings and limitations.

This is an exhaustive reusable-foundation extraction review, not a claim that all three million source/artifact lines or every historical screenshot were manually inspected for correctness. Automated traversal, historical decision review, implementation review and exclusions are recorded separately. Domain datasets, fixtures, artwork and marketing artifacts are inventoried but not copied into the baseline. Some historical conversations are unavailable locally; the review does not claim access to every deleted or cloud-only chat. Work-in-progress interactions remain candidates until their portable behavior is verified.

The runnable shell was adapted from the existing `codex/runnable-expo-shell` work (revision `3765ec0`), preserving current main's contracts and infrastructure. This avoids maintaining a second competing shell. Validation results and remaining platform gaps are recorded in `starters/expo/docs/verification.md`.

## Disposition

| Area reviewed | Existing coverage | Refresh decision |
| --- | --- | --- |
| Kickoff and architecture | Extensive guides, thin-route/module checks | Add one start-here decision checklist and connect installed entry points |
| Shared UI and appearance | Copyable primitives, settings, palettes | Integrate runnable branded shell; preserve failed preference hydration |
| Motion | Reduced-motion hook and content transition | Add presence behavior, interruption tests, explicit motion acceptance and working feedback |
| Navigation and overlays | Focus/Back/scroll helpers and guidance | Retain helpers; document context and modal return-focus acceptance, avoid copying app-specific experiments |
| Persistence/recovery | Backup, journal, scoped/chunked storage | Retain optional packs; add reusable adapter conformance harness and worked failed-save/restart checks |
| Product workflows | Some first-use/import/sync guidance | Add conditional catalogue with honest code-versus-guidance readiness |
| Identity/collaboration/sync | Ownership contracts and guidance | Add failure scenarios; keep server policy and distributed sync product-owned |
| Permissions/notifications/device | Typed states, controller and device pack | Retain selected adapters; no unsolicited permissions or delivery activation |
| Content/discovery/history | Generic correctness rules | Add identity, capability, freshness, rights and bounded-provider checklist |
| Analytics/privacy/support | Allowlisted diagnostics and optional analytics | Preserve disabled-by-default behavior; include support/build identity in working shell |
| Performance/assets | Budgets, output and architecture checks | Exercise runnable app/export, avoid copying production thresholds or large assets |
| Release/CI | Templates and release helpers | Connect generated-app checks; keep upload, deployed and signed-device proof distinct |
| Maintenance and portability | Duplicated guides and parity on a subset | Add canonical reference synchronization/check across all mirrored guides |

Historical follow-through also added lossless serial task ordering, failed-reload write fences for preferences and flags, preservation of distinct notification intents, bounded pagination/restore guidance, browser write ownership, complete deletion scope, temporary-resource ownership and compact product-character principles. These extend existing guides instead of adding another product framework.

## Excluded from the baseline

Domain calculations, scoring and ranking rules; geographic/provider catalogues; branded assets, mascots and copy; marketing operations; monetization; account/group/notification backends; full sync or recommendation engines; product histories and production identifiers. These do not become default features because a mature product uses them.

## Ongoing admission rule

Every new recipe must state two plausible uses, applicability, dependencies, limits and a meaningful acceptance check. Guidance stays guidance until implemented and tested. Prefer extending an existing recipe. No shared package until real apps prove the API, and no global/user skill installation as part of repository maintenance.

## Verification and limits

The 2026-10-17 refresh passed 68 toolkit tests, 15 app tests, fresh-app generation/installation/checks, all 21 Expo Doctor checks, web metadata/performance export checks and 27 browser cases across desktop, 390px and 320px. iOS and Android bundle exports passed. Fresh-app verification caught and corrected thin-route and copied-script formatting inconsistencies that source-only checks had missed. Changed hydration/ordering helpers received focused rechecks after the historical review.

The final local shell measured 322,356 initial JavaScript gzip bytes; an earlier fresh generated example measured 321,528 bytes. These are measured examples, not universal app budgets. Guide/source parity and shell script syntax/diff checks also passed.

Local results do not imply GitHub CI, native compilation, physical-device, deployed-host or OTA acceptance. The delivery report identifies the pushed commit and actual CI separately. Compatible dependency fixes removed the critical audit finding, but 19 high-severity affected-package entries from two upstream advisory families remain; see `starters/expo/docs/dependency-notes.md`. No distribution/security clearance is implied. Optional native compilation is manually dispatched. Temporary generated apps and owned test processes are cleaned up after verification.
