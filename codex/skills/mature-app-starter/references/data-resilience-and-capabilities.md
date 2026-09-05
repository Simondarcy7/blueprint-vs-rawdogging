# Data resilience and optional capabilities

Use these decisions when the app stores work or depends on external/device capabilities. A simple read-only app does not need a recovery journal, sync engine or permission subsystem by default.

## Persistence promises

Name the source of truth and what “saved” means. Validate unknown input at storage/import boundaries; version persistent schemas and define upgrade compatibility. Apply a multi-record restore atomically where supported, or use a staged/recoverable procedure with a clear failure boundary. Never replace valid current data with a partially validated import.

When user-created data matters, provide an appropriate export/delete path. Consider a bounded last-known-good recovery history before destructive replacement. Define retention and protection for recovery data too; backups must not silently outlive a deletion policy.

For historical transactions, decide whether a record needs a snapshot of names, prices, rules or configuration as they were at completion. A live reference alone can silently change the meaning of history. Snapshot only the fields required and honor retention/redaction requirements.

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

## Assisted extraction and replacement boundaries

For OCR or other machine-assisted imports, use a staged flow: capture/select source → extract candidate values → validate → review/correct → commit. Treat extracted values as draft suggestions, not authoritative records. Show relevant source context, flag uncertainty with text or semantics as well as color, allow unknown values, and offer manual entry when extraction fails. Confidence is evidence for review, not proof of correctness.

Require review before promoting uncertain extracted data into canonical records. Preserve corrections while retrying extraction; define whether a re-import creates, merges or replaces data, and show the affected scope. Retain source images or raw extracted content only for a stated need and retention policy; disclose any external processing before sending user content.

After a committed restore, reset or dataset/account replacement, invalidate undo history, selections and derived caches that belong to the previous state. Otherwise Undo can resurrect deleted records or apply an edit to the wrong dataset. Define this boundary centrally, and verify failed validation leaves both current data and its valid editing context intact. Also test repeated imports and missing media where those inputs are supported.
