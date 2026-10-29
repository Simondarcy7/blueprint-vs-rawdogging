# Phase 3 — adoption in two real applications

29 October 2026. Continues the [proposal](../2026-10-29-product-capability-foundation.md) and [phase 2](phase-2-summary.md).

## Outcome

Golf App now calls all four product workflow capabilities through app-owned adapters. OddsBasket, an existing non-golf application, calls the same draft and import-review implementations from its actual builder and screenshot-review flows. These are committed application integrations, not additional scaffold examples. Both applications carry byte-identical shared source from Blueprint commit `65b7ec6a952e28900f2ae806eb71f15a5e084a50`.

Changes are published for review in [Blueprint PR #4](https://github.com/Simondarcy7/blueprint-vs-rawdogging/pull/4), [Golf App PR #45](https://github.com/Simondarcy7/golf-scoring-app/pull/45) and [OddsBasket PR #51](https://github.com/Simondarcy7/oddsbasket-app/pull/51). They are draft PRs; no merge, production deployment, native release or package-registry publication is implied.

## What is actually reused

| Capability | Golf App integration | OddsBasket integration |
| --- | --- | --- |
| Drafts | Feedback composition uses immutable submitted snapshots. New edits survive an older submission's completion; dirty state follows the acknowledged value. Unsent feedback is memory-only and is not retained across reload. | Builder retains selected catalog IDs and raw stake text, including unfinished input. Web storage is tab-scoped; native storage uses the existing AsyncStorage adapter. Current catalog data supplies prices. |
| Import review | Backup selection/review uses the shared controller; the exact selected input is retained privately and parsed again before the existing transactional restore. Account generation and local writer checks stay in Golf. | Extracted selections become a typed, immutable review snapshot. Edits invalidate confirmation; confirmation revalidates the snapshot before local comparison navigation. Raw OCR payloads are excluded from that snapshot. |
| Interactions | Existing overlay APIs delegate to the shared focus manager; destination focus and newer overlays take precedence over a stale return request. | Installed with the fixed source bundle, but not called by this integration. |
| Engagement | Existing Golf activity thresholds, cooldowns and legacy history semantics wrap the shared eligibility policy. | Installed with the fixed source bundle, but not called by this integration. |

App schemas, wording, theme, routes, storage keys, provider access, identity rules and atomic writes remain outside the shared directory. Golf and OddsBasket retain their different products and dependency versions. The dependency-free controller boundary crosses that difference without copying Golf's entire application shell.

## Shared maintenance proof

The new [sync command](../../docs/shared-capability-adoption.md) installs five canonical files with hashes and refuses modified, missing, colliding or symlinked destinations. Updates replace individual files atomically and write the manifest last; the whole directory is not a transaction.

A real shared defect was corrected: a persisted draft revision at `Number.MAX_SAFE_INTEGER` could exhaust the live editing counter. Hydration and explicit recovery now use session-local counters. Both regression tests failed before the correction. The corrected source reached both real consumers, with identical file hashes and the same published source revision. [Machine-readable evidence](phase-3-reuse-proof.json) records source/destination paths, hashes, app commits and runtime consumers. It distinguishes installed files from exercised capabilities.

## Fundamentals improved during adoption

- **Golf:** successful synchronous backup commits remain truthfully committed if the host unmounts before the receipt resolves. Latest callbacks, account ownership and duplicate-confirm handling are preserved. Feedback completion cannot erase subsequent edits or cross account/unmount boundaries. OTA session and prompt-policy construction are lazy, preserving the existing startup budget and module-side-effect rules.
- **OddsBasket:** final draft writes finish before same-owner remounts take a new lease. Failed final saves retain the newest input in an owner-scoped memory recovery slot and expose an explicit retry decision. Successful clearing removes recovery data only after acknowledgment. Compare navigation requires a successful save and unchanged focus/revision. Blur during extraction invalidates stale responses and allows a fresh attempt on return.
- **Blueprint:** the reusable draft counter defect is fixed centrally. Generated starter Expo/Router patch pins were updated to `~57.0.31` / `~57.0.29` after CI exposed drift; unrelated dependency versions were preserved.

Independent review used delayed-write, failed-storage, owner-change and lifecycle reproductions. Reported defects were corrected and regression-tested before the final app revisions were pushed.

## Verification

| Check | Evidence |
| --- | --- |
| Blueprint toolkit | 190 tests passed; the 24 draft tests passed again after the final codec cleanup. CI passed at `06b354b` before this evidence-only update. |
| Generated Expo consumer | Fresh installation; check command including 15 tests; Expo Doctor 21/21; web build with 12 static routes. |
| Golf targeted integration | 59 Jest component tests across seven suites plus 34 Vitest tests across four files: **93 total**. Full mobile TypeScript and focused ESLint passed using physically installed locked dependencies. |
| Golf production web export | Owned `qa:with-export` wrapper passed module-side-effect audit (1,331 modules), export, SEO for 103 public pages, CSP and performance hard limits. Initial JavaScript: 741,965 bytes gzip, below the 750,000 hard limit and above the 620,000 target. |
| OddsBasket full gate | `npm run verify:full`: typecheck, lint with zero warnings, **259 tests across 42 suites**, formatting, web export (nine routes) and SEO audit passed. Includes 22 focused integration tests across seven suites. |
| Source parity | Both consumer sync checks pass; all five shared files match the recorded canonical commit and content digest. |
| Browser | [Final local browser QA](../../output/playwright/phase-3-reuse-qa.md): draft reload/navigation/clear and Golf overlay focus return verified in actual built apps. |

Blueprint's toolkit and generated-app CI passed at `06b354b`. Golf's six Actions jobs at `dcb19e99` and OddsBasket's two jobs at `46b0cb9` **did not start**: GitHub check annotations report recent account-payment failures or a spending-limit restriction. This is an infrastructure block, not a passing CI result or a diagnosed code failure. Resolve the account restriction and rerun [Golf CI](https://github.com/Simondarcy7/golf-scoring-app/actions/runs/40874996864) and [OddsBasket CI](https://github.com/Simondarcy7/oddsbasket-app/actions/runs/40875024283) before merge. No billing settings or workflow protections were changed.

## Limits and next decisions

This proves source reuse and two real application integrations. It does not yet quantify development-time savings, production reliability, native accessibility or real provider delivery. OddsBasket exercises two of the four installed packs. Golf feedback deliberately has no durable draft promise; local production-eligibility gates remain enabled. Native storage, file providers, authenticated account switching, real OCR, Sentry ingestion and compatible OTA delivery still require their appropriate environments.

Golf's locked install reported 15 low-severity advisories; this phase did not upgrade its dependency tree. Its JavaScript target remains unmet despite passing the hard limit. Those are follow-up engineering items, not evidence that this integration failed its stated gates.

Next, review and merge the app changes through each repository's normal workflow, then run device/provider acceptance against those exact revisions. Use the adoption costs and failures found here to refine the adapter contracts before extracting account recovery, notification transactions or merge-safe undo. Promote a package only when its versioning and release process offers a clear advantage over the checked source snapshots.

## Token usage notes

Most context went to application lifecycle integration, delayed-write failure review and build/CI diagnostics. Reusing a dependency symlink for Golf's export was avoidable: its asset finalizer required physical dependencies. Future runs should start from an isolated consumer worktree, install its lockfile once, and use this adoption map plus focused tests rather than repeat discovery. Exact billing/token totals were unavailable.
