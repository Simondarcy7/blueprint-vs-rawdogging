# Golf App engineering improvements — 29 October 2026

## Scope and evidence

Focused review of OTA startup lifecycle and account write leases. This is not a repo-wide audit or a production-readiness certification. Source checkout is `/Users/simondarcy/Documents/Golf App`, branch `codex/release-1016-record`. Before and after commit remains `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df`; all changes below are local/uncommitted. Existing dirty marketing files were preserved. No deployment, backend mutation, package upgrade, or publish occurred.

The current donor pins Expo `~58.0.19`, React Native `0.88.0`, and `expo-updates ~58.0.18`; Blueprint's starter is on SDK 57. Its `mobile/AGENTS.md` still directs reading v57 docs. Those required docs were read; this change adds no SDK calls or dependencies. The extracted capability must not imply the donor and Blueprint have identical dependency compatibility.

## Fixed: stale writer bypass after account lease registration

`accountLeaseWriteGuard` captured whether the namespace was managed at construction. A writer created before `registerAccountLease` permanently bypassed subsequent lease ownership, including waiting and reacquisition. The new regression test failed against the original implementation at the first post-registration write check.

The guard now checks current registration on each write while retaining the originally captured grant token. Native namespaces that never register remain writable. Old or waiting repositories cannot inherit a later grant, and a stale revoke cannot clear the new grant. This is defence against lifecycle ordering at the local storage boundary; it is not server authorization or a cross-process locking protocol.

## Fixed: OTA eligibility reopened after an interactive remount

The original gate shared only a six-second deadline. If an initial mount finished early and showed the app, a new mount during that interval could check/download/reload again after user work had begun. A small observable launch session now permanently closes automatic reload eligibility when any gate opens the app, and remounts reuse that state. Expired startup windows also skip redundant update checks. A failure from a reload requested by a prior mount updates the currently mounted gate.

The existing safety property is retained: after native reload is requested, the app stays non-interactive until reload or explicit failure. Expo documents that `reloadAsync` resolves immediately before asynchronously scheduling native reload; the call is not cancellable. A timeout that reopened user work could allow a late restart to interrupt it. Therefore a hung native reload is **not** falsely called fixed here; a user-facing force-close/relaunch recovery design would need separate platform validation. Source: [Expo SDK 57 Updates reload contract](https://docs.expo.dev/versions/v57.0.0/sdk/updates/#updatesreloadasyncoptions).

## Verification

From `mobile/`:

- `node node_modules/vitest/vitest.mjs run --config vitest.config.mts src/services/account/accountLeaseGuard.test.ts` — pre-fix regression: 1 failed, 3 passed, confirming the late-registration bypass.
- `node node_modules/vitest/vitest.mjs run --config vitest.config.mts src/modules/app-updates/launchUpdate.test.ts src/services/account/accountLeaseGuard.test.ts src/services/account/browserAccountLease.test.ts src/services/account/accountStorageScope.test.ts` — 4 files, 20 tests passed.
- `node node_modules/jest/bin/jest.js --config jest.component.config.cjs --runInBand src/modules/app-updates/LaunchUpdateGate.component.test.tsx` — 8 component tests passed after final changes.
- `node node_modules/typescript/bin/tsc --noEmit` — full mobile typecheck passed.
- `node node_modules/eslint/bin/eslint.js src/modules/app-updates/launchUpdate.ts src/modules/app-updates/launchUpdate.test.ts src/modules/app-updates/LaunchUpdateGate.tsx src/modules/app-updates/LaunchUpdateGate.component.test.tsx src/services/account/accountLeaseGuard.ts src/services/account/accountLeaseGuard.test.ts` — passed.
- `git diff --check` — passed.

Component tests use mocked native APIs; no actual OTA release, signed-device reload, browser tab handover, or backend/auth session was exercised.

## Reusable value beyond the named examples

- Account lease grant tokens and generation fencing preserve ownership across asynchronous work and tab handovers. The lease guard fix should inform a future ownership capability.
- Startup eligibility is a lifecycle decision, not just a timer: once a workflow is interactive, a previously allowed background action may no longer be safe.
- The source explicitly separates native and web authentication refresh ownership (`authLifecycle.ts` versus `.web.ts`), avoiding removal of the provider's browser visibility listener. This is a useful integration recipe, not a universal interchangeable auth service.
- The existing cooperative browser lease requests handover rather than stealing a writer lock; statuses distinguish waiting, paused, unresponsive, and failed. Preserve those product states if extracting multi-tab ownership.

## Exact source fingerprints

SHA-256 of file bytes, before at the commit above and after local edits. New tests have no original committed blob.

| File | Before | After |
| --- | --- | --- |
| `mobile/src/modules/app-updates/launchUpdate.ts` | `1c2f05e69e2ff170f2d3852bdd039262bfef5c509a0ba0bd669ce5667fa35668` | `188004d3f1a9b6f0367be06e7515f7061f8033c90215d0a5198df0291dbf2aad` |
| `mobile/src/modules/app-updates/LaunchUpdateGate.tsx` | `14983fd9b98920e88e6926e6329b97a324f8a507e37d87529bef1f7506d07788` | `9d8f2f153beb0e62b117e94dc7e8aa352bead32b99ced90cd345a3b5ae57c896` |
| `mobile/src/modules/app-updates/launchUpdate.test.ts` | `f8df4e90451f938455bc1ef5be326f698fad8000c22bc307cc11a94381336792` | `1a19f4e0a8be73c83d6966b9c468023459d43b7fb1f3af89cbd854aebafef22b` |
| `mobile/src/modules/app-updates/LaunchUpdateGate.component.test.tsx` | `afdc015ec518e61a2af7bf1a295aeeca1d2ceb0139c42020c6485ee0394d8606` | `1a115f71085774286481843ca6403bc57f0be9a0a57fd77510d8964f5c0e3483` |
| `mobile/src/services/account/accountLeaseGuard.ts` | `0177e2f26f605c94f98832d0320a822f57cd94388f5f5f62857d0a1b8d1fe755` | `52f0c94fafe0c4aff7bfa29c13ecf61a2aa1ba1580658479aa452f1e4904f934` |
| `mobile/src/services/account/accountLeaseGuard.test.ts` | `new file` | `7b0fb9f4cb6f9b138852202c43e67fc91c1a0d6527737649a9cb42656e1cf4bd` |
