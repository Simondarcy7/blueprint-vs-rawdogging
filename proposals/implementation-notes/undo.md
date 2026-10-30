# Merge-safe undo extraction — 30 October 2026

## Behaviour preserved

Golf's inbox undo retains a cleared collection for the current session, restores by identity without deleting new arrivals, keeps read acknowledgements, offers retry after failed restoration, and discards recovery when local data is deleted. The notification screen removes its Undo action only after a successful restore.

The canonical `undo` pack provides `createUndoController<T>` at `src/services/undo/undoController.ts`. It is standalone TypeScript with no runtime dependencies or baseline helper imports. The public API is `clear()`, `restore()`, `getSnapshot()`, `subscribe()`, `discard()`, `dispose()` and `resolveUnknown(committed)`. There is one undo level, held in memory for one owner/lease generation. It is not crash recovery or a durable action history.

## Integration contract

- Supply a codec that validates and reconstructs plain JSON item objects, a stable identity, and a live owner token that includes the account/lease generation. Key the controller's host UI by that scope and dispose it on teardown. Account ID alone cannot distinguish sign-out followed by sign-in to the same account.
- Supply `storage.transact(update, context)`. It must read the latest collection, run the updater and commit its output atomically. Recheck `context.isCurrent()` at the commit boundary. Transaction conflict retries may rerun the updater; the last successful invocation supplies the cleared snapshot. An asynchronous `list()` followed by a separate `replace()` does not satisfy this contract.
- Return `'committed'` only after commit acknowledgement. Return `'not-committed'` only when no mutation took place, including a confirmed rollback. The controller then retains the offer for retry. A thrown error or invalid receipt is treated as an unknown outcome and blocks further clear/restore actions.
- After an unknown outcome, inspect/reconcile the actual transaction before calling `resolveUnknown(true/false)`. Its `operationId` is a local diagnostic sequence, not a globally unique server idempotency key. An adapter that cannot determine the outcome must keep the operation uncertain. `discard()` deliberately forgets the offer; it does not establish rollback.
- Bound adapter work appropriately, but never release a write queue through a timeout while a non-cancellable accepted write could still commit. The controller coalesces the same pending action and refuses the opposing action until the adapter settles. It cannot cancel a database or provider commit already accepted.
- Default collision policy keeps the entire current item, preserving newer edits. A pure domain merge can retain monotonic fields: `merge: (current, removed) => ({ ...current, readAt: current.readAt ?? removed.readAt })`. It must keep identity unchanged. Collection display sorting remains a product decision; the shared result keeps current item order and appends absent restored items.
- Default limits are 1,000 items and 256 KiB. Invalid data, duplicate identities and overflow refuse the transaction. Restore never truncates arrivals to make space. Choose product limits and surface a retry/error outcome instead of claiming that every removed item was restored.

On successful clear, show the offer when `snapshot.canUndo` is true. On restore failure keep it visible. A successful empty clear keeps the previous useful offer. A subsequent successful nonempty clear replaces it, consistent with a single undo level. `discard()` fences pending work after local-data deletion. A commit already accepted before cancellation/owner change is reported as `status: 'committed', current: false`; callers must not announce success in the new session.

Snapshots have stable identity until state changes and expose only counts/status, not private recovery contents. Codec output is defensively cloned and frozen; getters, cycles, non-JSON values and sparse collections are rejected.

## Runnable adapter shape

This is a real in-memory transaction example, not a durable integration claim. Replace the transaction body with the host's actual atomic persistence boundary.

```ts
type Entry = { id: string; title: string };
let entries: readonly Entry[] = [{ id: 'old', title: 'Keep me' }];
let owner = 'guest:session-1';
const undo = createUndoController<Entry>({
  owner, getOwner: () => owner,
  parse(value) {
    if (!value || typeof value !== 'object') throw new Error('Invalid entry');
    const item = value as Record<string, unknown>;
    if (typeof item.id !== 'string' || typeof item.title !== 'string') throw new Error('Invalid entry');
    return { id: item.id, title: item.title };
  },
  getId: item => item.id,
  storage: {
    async transact(update, context) {
      if (!context.isCurrent()) return 'not-committed';
      try {
        const next = update(entries);
        if (!context.isCurrent()) return 'not-committed';
        entries = next;
        return 'committed';
      } catch {
        // No assignment occurred; this example has a known uncommitted outcome.
        return 'not-committed';
      }
    },
  },
});
await undo.clear();
entries = [{ id: 'arrival', title: 'Arrived after clear' }];
await undo.restore(); // Both entries are present.
```

## Source provenance and changes from the donor

Reviewed donor commit: `bf2210235e1f091afc7f4bbc15ba2baa6c3a50f6` in Golf App. All eight inspected files matched that commit. No donor files were edited for this extraction.

| Donor path | SHA-256 of inspected bytes |
| --- | --- |
| `mobile/src/services/notifications/inboxUndo.ts` | `00949c59a2574330352e2999bccc7377173fffe2001419612a054dd24be358f3` |
| `mobile/src/services/notifications/inboxUndo.test.ts` | `971336bcc36fb5901db11126925a0afb931b915ba6db069eb7a6940246575540` |
| `mobile/src/services/notifications/notificationRepositoryContract.ts` | `36637fe0233d72c87329018f2377658ad404b278affa8f5085bd1d20160461d8` |
| `mobile/src/services/notifications/notificationRepository.ts` | `13ff1cdfc4f2acf976b0a9337dc25bdc102ac4b37e5c5987df71e46f9f324caa` |
| `mobile/src/services/notifications/notificationRepository.web.ts` | `c1c393f0c7f82d31c52355ac7895d08edb4380ad9db0c3bf78db583858b2013d` |
| `mobile/src/services/notifications/notificationRepository.native.test.ts` | `8a03e3822396e110b7a19234fa2b380d1255c8ea1f5ddd34f085261edb356873` |
| `mobile/src/state/NotificationContext.tsx` | `7d7f0159cca9c554f69efc323b35f22f3d098698f9890054f7c246c7066b5cc6` |
| `mobile/src/modules/notifications/screens/NotificationsScreen.tsx` | `82ca24b3e96e98e26c49422225f966cabc31e2ed40d3256dd454e8b709f364c3` |

The donor uses synchronous `list/clear/upsert` methods. Its native per-item upserts preserve `readAt` and cap the inbox; they do not make the whole restore one transaction. Its collision policy restores old content except existing read acknowledgement. The extracted boundary instead requires an atomic collection operation, defaults to current-content preservation, refuses silent capacity truncation and treats ambiguous acknowledgements separately. These differences prevent asynchronous adapters from inheriting assumptions valid only for the original synchronous repository. No existing Golf caller is silently replaced by this pack.

## Verification and limits

`node --test tests/undo-capability.test.mjs`: **18 passing tests**, including strict TypeScript compilation after copying the standalone installed layout. Tests exercise arrivals during asynchronous waits, collision/read-state merge, retry, repeated clear, reentrant/coalesced actions, cancellation, disposal, owner changes before commit, accepted commits after owner change, unknown-outcome reconciliation, immutable recovery, corrupt data/limits, and transaction conflict retries.

Evidence is controlled in-memory adapters plus strict compilation. Real database transactions, multiple browser tabs/processes, server authorization, native lifecycle teardown, persistence across process death and adoption into a consumer are not established by these tests. The host must provide the actual transaction and owner enforcement; this controller is not a backend authorization boundary.
