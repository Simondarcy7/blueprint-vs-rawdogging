# Draft recovery: implemented extraction

## Source and product judgment

Donor: `Simondarcy7/golf-scoring-app`, inspected from the working checkout originating at `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df`, 29 October 2026. No donor files were changed for this extraction.

- `mobile/src/state/holeDrafts.ts` and `mobile/src/modules/rounds/holeDrafts.ts`: owner-scoped draft identity, bounded records, separate draft and saved data, baseline matching before recovery, honest persistence receipts.
- `mobile/src/modules/rounds/completedDraftStore.ts` and `completedRoundDraft.ts`: keep input across editors, staged work separate from committed records, retain failed work, detect changed baselines, and scope removal by account.
- Nearby `holeDrafts.test.ts`, `holeDrafts.web.test.ts` and `completedRoundDraft.test.ts` informed failure and recovery cases. The source tests are not claimed as verification of this new controller.

The reusable capability is a complete local draft lifecycle, not the golf patch/score model. It preserves input and makes recovery a user choice when incoming saved work conflicts with local edits. Corrupt/future/foreign-scope data blocks replacement until explicit discard. This is deliberately stricter than the donor's silent fallback for some malformed drafts.

## API

`src/services/drafts/draftController.ts` exports `createDraftController<T extends object>` with:

- `owner`, `draftId`: immutable scope metadata. Use a matching owner-specific storage key; metadata alone is not authorization or encryption.
- `initial`: the saved/empty product value that the editor starts from; it is copied, never mutated.
- `parse(unknown)`: validate and reconstruct plain JSON object/array data. Represent dates as strings, not mutable class instances.
- `storage.read/write/remove`: one owning instance per scope; writes/removals resolve only when the operation's actual outcome is known.
- `assertOwner?`: a live lease/identity check, also required inside an asynchronous adapter at its commit boundary.
- `baselineRevision?`: the source-record revision. Without it, the initial value's serialized content is used as the baseline.
- `maxBytes?`: maximum UTF-8 bytes for payloads and the entire versioned envelope, default 256 KiB.

The methods are `getSnapshot()`, `subscribe(listener)`, `load()`, `set(value)`, `save()`, `clear()`, `recover()`, `keepCurrent()` and `dispose()`.

`getSnapshot()` returns a stable object between transitions. The snapshot and its nested `value`/`recovery` are detached copies and frozen. Codec output is inspected through property descriptors before serialization: getters/setters, hidden/symbol fields, sparse arrays and mutable class instances are rejected instead of exposing externally changeable values. Create a replacement value for `set()`; mutating the snapshot cannot bypass revision tracking. `set()` throws for invalid data, loss of ownership or disposal and retains the previous value.

Snapshot fields:

| Field | Meaning |
| --- | --- |
| `value` | Current editor input, separate from the application's saved domain record |
| `revision` | Local edit sequence; not a server revision or cross-tab lock |
| `saved` | Exact current input has verified local draft persistence and ownership remains valid |
| `dirty` | Current input needs local draft persistence; empty initial state is not dirty |
| `status` | `unloaded`, `loading`, `ready`, `blocked`, or `disposed` |
| `busy` | Hydration or queued/in-flight save/discard work exists |
| `recovery` | Stored work awaiting explicit selection, otherwise null |
| `error` | `read`, `corrupt`, `conflict`, `save`, `clear`, `ownership`, or null; no raw exception text |

`load(): Promise<boolean>` coalesces concurrent calls. It recovers a compatible draft automatically only when no edits exist. If typing occurred before/during loading, or the saved-record baseline changed, it retains current input and exposes `recovery`. The host should offer “Recover stored draft” and “Keep current input”; saves remain blocked until `recover()` or `keepCurrent()`. Recovering work against a changed baseline stages it as unsaved and does not write any product record.

A fresh successful read supersedes earlier persistence acknowledgements. If storage is now empty after ownership recovery, current input is retained but no longer marked saved; non-initial input becomes dirty and can be saved again.

`save(): Promise<boolean>` captures the exact input at invocation and serializes persistence. It returns true only if that snapshot committed and remains current. A false result can mean newer input superseded a successfully persisted older version: inspect the snapshot instead of assuming every false is a storage error. Failed saves keep input and the prior stored state. Calling save before hydration, while blocked, or while recovery awaits a decision returns false without writing.

`clear(): Promise<boolean>` is an explicit discard action. It waits behind an active write, fences its stale receipt and removes the stored draft. If input changed while removal was pending, the newer input survives and remains dirty; otherwise the editor resets to `initial`. An old queued save cannot resurrect a cleared draft. Removal failure preserves live input. Offer a deliberate discard action when corrupt storage is blocked, and never call clear merely because loading failed.

`dispose()` fences late hydration/save results and preserves stored drafts. Create another controller for another owner or document; do not reuse this instance after an identity switch.

## Example host wiring

```ts
const drafts = createDraftController({
  owner: 'guest',
  draftId: 'feedback-composer',
  initial: { title: '', tags: [] as string[] },
  parse: parseFeedbackDraft,
  storage: scopedDraftStorage,
  assertOwner: assertCurrentWriter,
});

// React: useSyncExternalStore(drafts.subscribe, drafts.getSnapshot, drafts.getSnapshot)
await drafts.load();
drafts.set({ ...drafts.getSnapshot().value, title: 'Unfinished work' });
await drafts.save();
// Label this “Draft saved locally”. It does not mean feedback was submitted.
```

The source imports only the existing baseline `src/lib/asyncWork.ts`; no storage pack or vendor SDK is required. The host chooses localStorage, sessionStorage or protected native storage and provides owner-scoped namespaces.

## Boundaries

- This is local draft persistence, not remote submission, conflict-free synchronization, database transactions or server-side authorization. Final product saves still need their own validation and revision checks. Combine with the outbox only after the user submits.
- Storage reads must be bounded by the adapter. Writes/removals need commit-aware outcomes; a generic timeout that releases this controller's serial queue while an old write can still commit would risk corruption. Disposal cannot cancel an already accepted write/delete or settle a hung storage adapter.
- `initial` and `baselineRevision` describe one editor session. If a remote record changes, reconcile it at the product boundary and create a new controller; this helper does not subscribe to a database.
- Auto-save scheduling, unsaved-navigation prompts, debounce, TTL, encryption, cross-tab leases, draft listing/eviction, accessibility and product-specific merging are host responsibilities. No polling, timer or side effect begins at construction.
- Existing parse/schema revisions need explicit migrations. Unknown envelope versions and mismatched owner/document metadata are preserved and blocked, not silently overwritten.

## Evidence

`node --test tests/drafts-capability.test.mjs`: **22 checks passed**, including installed-layout strict TypeScript, detached immutable snapshots, accessor rejection without getter execution, failed/retried saves, overlapping writes, edits during hydration, baseline conflicts, corrupt/future/foreign storage, queued clear/save ordering, newer edits during clear, read/delete failures, ownership loss/disposal and absent storage after ownership recovery.

These are controller/codec/storage-contract checks. Browser reference workflow integration and real native storage testing are separate evidence. No claim is made that this replaces Golf App draft handling or has been released to users.
