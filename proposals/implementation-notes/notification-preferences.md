# Notification preference transaction and device reconciliation

The optional `notification-preferences` pack provides
`src/services/notification-preferences/notificationPreferences.ts` and imports the baseline
`src/lib/asyncWork.ts`. It has no SDK, backend, notification content, account ID or scheduling
singleton. The host supplies the preference schema and actual storage/device adapters.

## Source mapping

Inspected Golf App commit `bf2210235e1f091afc7f4bbc15ba2baa6c3a50f6`:

- `mobile/src/modules/notifications/notificationPreferenceTransaction.ts` and its `.test.ts`:
  save the preference, publish it, apply device schedules; restore the previous preference and
  device plan if application fails. A failed repair is retried later by foreground reconciliation.
- `mobile/src/state/NotificationContext.tsx`: serialize scheduling work, request permission only
  when enabling delivery, and reconcile on foreground. Notification preferences remain separate
  from inbox messages, badges, analytics and optional confirmation messages.
- `mobile/src/services/notifications/deviceNotificationService.ts`: replace owned schedule groups,
  carry account generations through asynchronous work, and cancel a late schedule after account
  ownership changes. Those platform-specific safeguards remain adapter responsibilities.
- `mobile/src/services/notifications/notificationRepository.ts`,
  `notificationRepository.web.ts`, and `notificationRepositoryContract.ts`: the donor uses
  synchronous SQLite/localStorage persistence and an explicit memory fallback. The portable pack
  does not label a memory fallback as durable storage.

No donor files changed. The extraction generalizes the workflow rather than copying golf reminder
types, timing policy, identifiers or delivery copy.

## Public workflow

Create one `createNotificationPreferencesController<P>` for one stable owner and storage/device
scope. Supply `parse(unknown)`, `requiresPermission(current, next)`, `getOwner()`, `read`, `write`,
`getPermission`, `requestPermission`, and idempotent `apply` adapters.

1. Subscribe to `getSnapshot()` and call `reconcile()` at startup. Until the authoritative read
   succeeds, updates are blocked; there is no automatic default write.
2. Call `update(next)` only for an explicit user change. Validate and detach input, read permission,
   and request permission only when the host's domain rule requires it. Denial leaves preferences
   unchanged. Disabling can still save and clear the effective plan without granted permission.
3. Await an acknowledged write before showing the new value or applying the device plan. Device
   failure attempts a compare-and-set rollback against that exact new revision, then repairs the
   previous plan. External changes cannot be overwritten by a stale rollback.
4. On background or owner transition call `suspend()` before exposing another owner's UI. On
   foreground call `resume()` then `reconcile()`. Neither resume nor reconciliation prompts for
   permission. Dispose the old controller on account replacement.

Snapshots expose `value`, `revision`, `requested`, `permission`, `device`, `busy`, `status` and a
bounded error code. Preference objects are detached and deeply frozen at runtime. `value` means
the last acknowledged durable record, not proof of delivery. `device: applied` means the effective
plan for the observed permission has been reconciled; denied permission must result in no delivery.
An unknown write clears the asserted durable value/revision and blocks further updates until read
reconciliation succeeds. Concurrent work returns `busy`; the UI should disable or deliberately
retry controls rather than assuming the input was queued.

## Storage and device contract

`read(context)` returns `{ value, revision }`. It must be owner-scoped and authoritative, ordered
after all earlier writes, including any underlying effect whose response was lost. A read must not
declare an uncertain operation settled merely because a stale cache still contains the old value.
The host may need server operation IDs or a durable write queue to implement this guarantee.

`write(value, { owner, expectedRevision, signal, isCurrent })` must compare the revision and enforce
ownership inside the actual transaction. Its explicit outcomes are:

- `saved` with a distinct nonempty revision: the write is durably acknowledged.
- `not-saved`: definitely no write, partial commit or later side effect; safe to keep the old value.
- `conflict`: definitely no write because the expected revision no longer matched.
- `unknown`: outcome cannot be established. A rejection or malformed receipt also means unknown.

In-memory state alone cannot satisfy this contract for a durable adapter. The package does not
provide a pretend backend or use a local revision counter as a substitute for atomic persistence.

`apply(value, permission, context)` must idempotently replace only this owner's notification plan,
including clearing scheduled delivery when permission is not granted. It must fence ownership at
the side effect and compensate for a schedule that finishes after cancellation. A resolved promise
must mean the owned plan is reconciled; partial SDK failure must reject. It must also serialize
with other application scheduling callers. The controller serializes its own operations only.

Storage reads and permission work have bounded deadlines. Writes and device effects deliberately
remain pending until the adapter settles: a timeout would not establish that a write or schedule
did not occur. Suspension/disposal requests cancellation, hides stale owner state, and prevents
subsequent effects; it cannot undo an effect already handed to the host. A durable write that
finishes after suspension is acknowledged as such and leaves device reconciliation pending.
The host must coordinate old and replacement controllers when they share the same device SDK.

Rollback failure is explicit. If rollback was definitely not saved, the new durable value remains
visible with a pending device state. If its outcome is unknown or conflicted, the durable value is
unknown until reread. A failed device repair retains the acknowledged rollback and can be retried
by reconciliation. Raw SDK errors are not exposed in snapshots or forwarded to telemetry.

## Verification and remaining work

`node --test tests/notification-preferences-capability.test.mjs` tests the installed layout and
strict TypeScript, async acknowledgement, permission denial/grant/failure, rollback and failed
repair, unknown outcomes, concurrent updates, CAS conflicts, bounded reads, owner changes,
lifecycle loss, observer failure, invalid payloads and disposal after a device handoff.

This phase extracts the workflow only. Platform permission UX, notification channels, actual
schedule replacement, timezone/DST policy, ownership reset, storage adapter atomicity, and native
device acceptance still belong to each consuming app. No push delivery or backend capability is
implied by the unit tests.
