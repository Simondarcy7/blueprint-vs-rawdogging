# Optional infrastructure packs

Select these only when the app needs the capability. They are TypeScript source with injected adapters; installation creates no accounts, collects no telemetry, requests no permissions and schedules no notifications.

```sh
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root . --with storage,device,flags,diagnostics --dry-run
```

Use `.claude/skills/` for a Claude-only install. Remove `--dry-run` to copy after reviewing. The command always includes the default baseline and refuses **all** writes if any destination already exists. It has no force flag. For an existing baseline, copy/merge only selected pack files manually after review. Source directories must not be symlinks; use a trusted project directory and avoid concurrent file mutations during scaffolding.

## Storage

`adapterContract.ts` runs Unicode/empty-value, instance-reopen, key-isolation and removal checks against an injected adapter. Use a unique disposable namespace with no concurrent writers; existing contract keys cause refusal. It cleans up only its two keys. This is not a crash/atomicity, real process restart, encryption or quota test. Add injected-write-failure and actual platform lifecycle checks for the host's persistence promises.

- `ports.ts`: storage adapter, collision-resistant namespace encoding and owner-generation tickets. Check tickets **before committing/applying** async results. Namespace separation is not encryption or server authorization.
- `backup.ts`: UTF-8 size limit, application/schema identity, mandatory snapshot parser and validate-before-replace flow. Choose limits from the product. `replaceAtomically` must be implemented by the host database transaction or a durable operation journal. No cloud backup or schema migration is implied.
- `recoveryJournal.ts`: bounded, deduplicated local snapshots and newest-valid fallback. The journal uses atomic single-key writes and serializes one instance. A malformed journal is surfaced, not discarded. Use a bounded backup codec, appropriate protected storage, one instance per key, and explicit retention/deletion policy. Local history does not survive losing its storage.
- `chunkedStorage.ts`: UTF-8-safe chunks, manifest-last commit and serialized operations. Supply atomic single-key storage and globally unique generation IDs (not timestamps). This supports adapters with per-value size limits; it does not itself encrypt. Set chunk limits and test real secure-store overhead. A crash before manifest commit can leave orphan chunks. The adapter must support namespace enumeration/purge or an equivalent cleanup mechanism if complete erasure is promised. Cleanup failures after commit are reported separately; do not misreport a committed write as unsaved. Removal can be interrupted; retry it before resuming private storage.
- `installBoundStorage.ts`: separate ordinary installation identity from secure-store session data that may survive reinstall. Identity failure is retryable; malformed envelopes are preserved and reported. Old-installation data is inaccessible through this adapter but not automatically deleted. Explicit device/account cleanup must purge it. Platform backups can restore the identity too: this is an installation-lifecycle convention, not device attestation.

All storage wrappers assume a single owning instance per scope. They are not a multi-process sync protocol. Guest claims, provider identity linking, server revisions and shared-record deletion remain application/backend integration work. Test those against the actual authorization rules.

## Device

- `actions.ts`: neutral sharing, clipboard, file-picker and confirmation results. Cancellation, denial, absence and failure remain distinct. Opening a share sheet is not proof of delivery. On confirmation, proceed only for `status === 'ready' && value === true`.
- `browserAdapters.ts`: clipboard, Web Share and browser confirmation with SSR-safe capability checks. Invoke from a real user gesture. Browser confirmation uses browser-provided labels; use your existing accessible dialog when custom labels are necessary.
- `imageBudget.ts`: configurable bytes/dimensions/pixel validation. Inspect actual bytes, MIME/content and decoded dimensions in the upload service too; client validation is not server validation.
- `temporaryFileLease.ts`: serial replacement and retryable cleanup. The deletion adapter must reject arbitrary paths and restrict work to resources owned by the app. If adoption fails, the old lease remains owned and the caller must clean up its unadopted new resource.
- `permissions.ts`: request only undetermined permissions from explicit actions and keep haptics non-blocking. Re-read permission on foreground; denied permissions normally need OS settings. Add Expo adapters only for the selected capability and installed SDK.

## Flags

`featureStore.ts` supplies typed local feature overrides, stable external-store snapshots, serialized writes and explicit reset. Defaults remain visible on read failure; loading can retry. Unknown stored flag names fail validation, so a renamed/removed flag requires an app-owned migration or deliberate reset. Never use local flags for access control, subscription authorization or server-side rollout guarantees.

## Diagnostics

`safeTelemetry.ts` constructs fresh allowlisted payloads and starts disabled. Event properties must match explicit allowed values. Diagnostics discard messages, URLs and arbitrary context; stack file names must match an app-generated allowlist. Put release metadata in trusted transport configuration, not user-supplied context. Add a source-map-aware vendor adapter if needed and test the resulting wire payload.

The adapter must disable vendor auto-capture/replay and SDK-added identity, or sanitize those paths too. Enable collection only after the app's privacy/consent policy is hydrated. Disabling prevents new captures; it cannot retract a request already handed to a provider or delete previously collected data. Transport failure returns false and never blocks a primary workflow; callers should not await analytics before saving or navigation.

## Optional reliability extensions

- `diagnostics/.../safeTelemetry.ts` also exports `createDiagnosticTrail(policy, limit)`: a bounded, in-memory list of allowlisted events. Starts disabled; disabling clears history. Record static screen/action categories after policy hydration, clear on account changes, and attach `snapshot()` through a sanitized provider adapter. No URLs, record IDs, raw exception text or automatic capture. Snapshots are defensive copies; this helper does not send, persist or retract provider data.
- `storage/.../saveAcknowledgement.ts` tracks whether the latest local revision has a verified save receipt. Call `changed()` for every committed local mutation, capture a ticket beside the immutable outgoing snapshot, and acknowledge only after confirmed persistence. Reset on identity/data replacement or lost writer ownership. A failed write leaves the state pending. Serialize remote writes or use server compare-and-swap: this helper cannot prevent an older request overwriting a newer server snapshot.

See the reliability recipes guide for integration and failure cases. Both helpers are optional and require no vendor SDK.
