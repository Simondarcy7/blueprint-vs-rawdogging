# Data resilience and optional capabilities

Use these decisions when the app stores work or depends on external/device capabilities. A simple read-only app does not need a recovery journal, sync engine or permission subsystem by default.

## Persistence promises

Name the source of truth and what “saved” means. Validate unknown input at storage/import boundaries; version persistent schemas and define upgrade compatibility. Apply a multi-record restore atomically where supported, or use a staged/recoverable procedure with a clear failure boundary. Never replace valid current data with a partially validated import.

When user-created data matters, provide an appropriate export/delete path. Consider a bounded last-known-good recovery history before destructive replacement. Define retention and protection for recovery data too; backups must not silently outlive a deletion policy.

For historical transactions, decide whether a record needs a snapshot of names, prices, rules or configuration as they were at completion. A live reference alone can silently change the meaning of history. Snapshot only the fields required and honor retention/redaction requirements.

## Protection coverage and platform boundaries

For each selected export, recovery or backup mechanism, list included and excluded data, required credentials, restore behavior and deletion scope in the system map. Do not label a partial backup as complete protection. A local recovery copy can be lost with its device/storage; a remote copy may not include drafts, settings or all collections. Test the promised coverage by restoring representative data into an identified clean target, including a missing-credential case where relevant.

Document storage scope separately for native and web: installation, browser profile and origin may change what remains accessible. Confirm the selected adapter's availability, quota and loss behavior. Where applicable, distinguish deleting local data, an account, server records and provider-held data in both implementation and user copy. Test upgrade and rollback compatibility against populated data before promising recovery through an older client.

Treat caches and optional OS surfaces as projections of an explicit authority. Their commands must pass through the owning validation and persistence boundary; invalidation and refresh must not overwrite newer authoritative data. This does not require adding widgets, a sync engine or another store.

## Offline and retries

- Decide which workflows work offline and which require a network. Do not promise offline support merely because the shell is cached.
- If durable sync is necessary, persist pending work with its local mutation, use stable operation IDs, and make acknowledgement/retry behavior explicit.
- Bound retries with backoff; distinguish transient failures from validation/authentication errors. Preserve pending work across restarts where promised.
- Define conflict, deletion and account-switch behavior before enabling multi-device writes. Client timestamps alone do not provide a universally safe ordering scheme.
- Expose useful sync state without logging record contents or tokens. Avoid adding a distributed sync system before a demonstrated product need.

## Device and external capabilities

Model unsupported, unconfigured, permission-undetermined, denied, ready, pending and failed states where they are distinct. Typed adapters should expose these states rather than return fake success or an empty result for every failure.

Ask for a device permission in context when the user invokes its value. Provide a manual or reduced-capability path where possible. Handle later revocation, OS settings changes, app foregrounding, and platform differences. Cancelling a picker or permission flow is not necessarily an error. Core workflows should remain usable when an optional analytics, notification or enhancement provider is unavailable.

## Focused failure checks

Choose the relevant scenarios: malformed import; interrupted save; failed database initialization followed by retry; previous-version upgrade; corrupt-current recovery; export and restore into a clean install; duplicate delivery; account switching; denied/revoked permission; unsupported browser/device. Verify actual stored values and continued editing after recovery, not only the presence of a success message.

Keep destructive test fixtures disposable and identified. Unit tests prove logic; signed-device or deployed verification is still needed for platform persistence and lifecycle claims.

## Existing data lifecycle

For accounts or multiple browser writers, choose one write owner per scope. A generation ticket protects in-flight results, but is not a cross-tab lock. If using a browser lease, define handover, suspended-tab timeout and retry without forcing an unsafe unlock. Fence writers after release and reacquisition, including account A → B → A. A single-writer example must not be advertised as multi-tab or multi-device safe.

For paginated restore/import, enforce a total item/byte limit before accumulation grows without bound. Require a stable cursor/snapshot policy, detect repeated or non-progressing cursors, validate every page and require a trustworthy completion condition. A short page alone may reflect a provider cap rather than completion. Failed or malformed pages cannot apply a partial dataset as a complete restore.

For deletion, inventory current, legacy, recovery, draft, cache and provider-held copies. Stop writers that could recreate deleted local records; distinguish local reset from cloud deletion. Journal required account/device cleanup when interruption is possible, and keep guest recovery separate from blocked account cleanup. Verify another identity remains untouched.

Temporary resources have per-operation ownership: use collision-resistant names, clean partial creation, retain the original actionable error if cleanup also fails, and make failed cleanup retryable where needed. Never delete a user-selected original or let one concurrent export remove another operation's file. Opening a picker/share sheet is not proof that its operation completed.

When a product already supports replacing or resetting data, invalidate selections, caches and any undo history belonging to the previous dataset. Verify that failed validation leaves current data and its valid editing context intact. This is a correctness rule for an existing capability, not a requirement to build import, restore or Undo features.

## Startup failures need a usable recovery surface

The app must have a comprehensible outcome when an essential startup dependency fails. Place a minimal recovery boundary so it can render without the database, account state or provider that failed to initialize. Offer a meaningful retry or restart where supported, handle failure of that recovery action itself, and avoid indefinite automatic retry loops. Handle asynchronous operation failures explicitly as well as render failures.

Do not silently erase data or replace it with a demo to recover startup. Claim that data is unchanged only when the failed operation's boundary establishes that. For persistent apps, distinguish unavailable storage from invalid stored data and preserve diagnostic evidence without exposing record contents.

Keep crash diagnostics behind a typed boundary: stable operation/error categories and release/platform metadata with deliberate field and value allowlists. Inspect SDK-added fields, URLs, stack filenames and attachments too. Test with sentinel personal text and tokens to prove they are excluded; a key-name allowlist alone does not sanitize arbitrary string values. A reporting failure must not make recovery fail. Retain enough sanitized location and release information to diagnose the problem.

## A persistence state vocabulary

Choose terms that match actual guarantees. A typical workflow may distinguish edited in memory, saved on this device, pending remote upload, verified remote commit, conflict and failed persistence. Not every app needs every state. Use the same meaning across editor, summary, account and backup surfaces.

Track the version of work that a completion acknowledges. An older receipt cannot cover newer edits. Failed or uncertain writes retain user intent and expose a retry/reconcile path; do not automatically erase a draft because a transport returned. The optional save-acknowledgement helper is local bookkeeping, not server conflict control. See [reliability recipes](reliability-recipes.md).

If a durable outbox is needed, persist mutation intent with the local change, use stable operation identity, and specify ordering, retry classification, conflict and tombstone behaviour. Avoid implementing multi-device sync for a product that only promises local storage. A timeout does not prove a server mutation failed; reconcile or retry idempotently.

## Recovery must preserve trust

Decide which failure boundaries can safely claim data is unchanged. A startup error before opening storage differs from a partially applied migration. Never automatically delete user data as a generic retry strategy. Keep the minimal recovery UI independent of the failed provider and make recovery-action failure itself understandable.

Verify populated-version upgrades, corrupt-current/valid-recovery cases, quota exhaustion, unavailable storage and interrupted replacement where those promises exist. After recovery, verify actual values and continued editing. Keep backup retention and deletion policies aligned; extra hidden recovery copies are not harmless if they violate the intended removal boundary.

Account lifecycle, guest migration and group ownership have separate acceptance recipes in [identity and collaboration](identity-and-collaboration.md).
