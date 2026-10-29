# Staged import and review capability

Status: local extraction and contract verification. This is a reusable workflow controller with a host-owned parser, summary, identity scope and atomic commit; it does not implement OCR, a file picker, a domain schema or a database.

## Provenance and product decisions

Source: `Simondarcy7/golf-scoring-app` at `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df`, inspected 29 October 2026.

| Source | Preserved decision |
| --- | --- |
| `mobile/src/modules/backup/useBackupImport.tsx` | Picking and parsing never writes; show a review first; keep the original source; invalidate async work after identity changes/unmount; retry failed restoration without making the user select the file again |
| `mobile/src/modules/backup/BackupImportReview.tsx` | Explain what changes, show current/incoming counts, distinguish replace from merge, and offer cancellation before destructive confirmation |
| `mobile/src/services/backup/backupFormat.ts` | Validate the portable shape before restoration and distinguish malformed data from persistence failure |
| `mobile/src/services/backup/backupContract.ts` | Bound import size and represent failure/cancellation separately |

This extraction generalizes the controller from synchronous golf backup restoration to injected asynchronous atomic commits. It adds immutable reviewed payloads, explicit revision-bound confirmation, revalidation comparison, cancellation fencing and duplicate-confirm coalescing. The existing baseline `src/lib/asyncWork.ts` supplies validation deadlines; it is not copied into this pack.

`mobile/src/modules/scorecard-import/review.ts` was inspected but only re-exports visual feedback; it supplies no parser or confidence model. No OCR correctness claim is derived from it. No donor defect is asserted from this bounded inspection, and no donor source was changed by this work.

## Public API

Implementation: `app-capabilities/import-review/src/services/import-review/importReview.ts`.

```ts
const imports = createImportReview({
  parse: (contents, signal) => parseAndValidateCollection(contents, signal),
  summarize: collection => ({ incomingCount: collection.items.length, mode: 'replace' }),
  getOwner: () => `${session.ownerKey}:${session.generation}`,
  commit: async (collection, context) => {
    await database.transaction(async transaction => {
      if (!context.isCurrent()) throw new Error('Import scope changed');
      // Check the reviewed target's revision here too if it can change concurrently.
      await transaction.replaceCollection(collection);
    });
  },
});

await imports.stage(selectedText); // No writes.
const snapshot = imports.getSnapshot();
// Render snapshot.review.value and snapshot.review.summary for the user.
// A confirmation button uses that displayed revision, never a freshly looked-up revision:
if (snapshot.review) await imports.confirm(snapshot.review.revision);
```

The transaction example describes the host contract; the concrete database must provide its own serialization/authorization and make the ownership check effective at the durable write. A client-side predicate alone is not database authorization or multi-process fencing.

- `stage(contents)` validates UTF-8 size, parses the source and creates a frozen review. A newer stage cancels the earlier validator and invalidates old confirmation revisions. Returns `review`, `invalid`, `cancelled` or `busy`.
- `confirm(reviewRevision)` revalidates the **same source bytes**, compares canonical validated data with the displayed payload and commits that original frozen payload. It coalesces duplicate confirmation of the same revision; a mismatched or consumed revision cannot apply. Returns `committed` (with `current`), `retryable`, `stale`, `busy`, `cancelled` or `invalid`.
- `cancel()` invalidates the review and signals active validation/commit. During a handed-off commit it shows `cancelling`, not a false promise that data was unchanged. If the commit already succeeded, the eventual result remains `committed` with `current: false`.
- `dispose()` cancels and prevents future staging. `subscribe`/`getSnapshot` provide a stable immutable external-store snapshot for React or other UI hosts.

Snapshot fields are `{status, revision, review, error}`. Status is `idle`, `validating`, `review`, `committing`, `cancelling`, `committed`, `invalid` or `cancelled`. A review contains `{revision, value, summary}`. Error is a static code (`invalid-source`, `validation-failed`, `commit-failed`, `owner-changed`, `stale-review`) or `null`; raw parser/storage exception strings are never displayed by this controller.

## What the host still decides

- **Domain validation:** schema version, application identity, required fields, valid units/ranges, allowed partial coverage, forward-version rules, and replacement/merge semantics. The controller cannot decide these generically.
- **Factual correctness:** valid JSON and valid schema do not prove that OCR text matches a source, a score is correct, a measurement uses the right unit, or imported content is authentic/licensed. Show meaningful review evidence and confidence/unknown states where the workflow needs them.
- **Review UX:** current/incoming comparison, irreversible consequences, backup offer, keyboard/focus handling, accessible error text and deliberate confirmation label. Use the existing host design system. If target data changes while a review is visible, refresh/re-stage the review or reject the commit using a target-version check.
- **Identity:** `getOwner` must be an opaque stable scope plus a generation that changes on sign-out, account replacement or reacquiring ownership—even if the user returns to the same account. Call `cancel()` promptly on identity changes so old previews disappear; the controller checks scope again at async boundaries and confirmation.
- **Atomicity and retry:** `commit` may reject only when the outcome is definitely uncommitted, or when retrying the same reviewed operation is idempotent. A dropped server acknowledgement needs an application-owned operation ID/receipt lookup. `reviewRevision` is local to this controller and is not a globally unique idempotency key. Do not implement multi-store replacement with a sequence of unprotected writes.
- **Cancellation:** the signal requests cancellation. It cannot roll back a write that crossed an irreversible commit point. A non-cooperative commit remains pending; there is intentionally no timeout that would convert uncertain write success into a misleading retryable failure. Implement cancellable transactions or durable outcome recovery in the host.

Failed commit or transient revalidation retains the exact review and reports `retryable`; retries validate again. Changed parsed content clears the review and requires a new review. The controller never automatically retries a destructive action.

## Data and limits

The parser returns plain JSON-shaped data. The controller defensively copies and deeply freezes both data and summary, rejecting getters, non-plain objects, cyclic structures, non-finite numbers, sparse arrays and unsupported values instead of silently converting them. Object key order is normalized for comparison; array order is meaningful.

Default source/parsed/summary limit: 5 MiB each, configurable up to 100 MiB. Maximum structure: 100,000 nodes and depth 64. Validation defaults to 15 seconds, configurable from 1–60,000 ms. Synchronous CPU work cannot be interrupted by a timer; heavy parsing belongs in an appropriate worker with its own resource budget. The public readonly type expands eight levels to keep recursive JSON schemas tractable in TypeScript; runtime freezing covers every accepted level.

No contents, summaries, owner tokens or raw errors are sent to analytics/reporting. The host may record a static `import_reviewed`/`import_committed` outcome using its own allowlisted event policy.

## Verification

`node --test tests/import-review-capability.test.mjs` covers: selection without writes; explicit matching confirmation; consumed revisions; size/schema failures; immutable data; stale async selection; cancellation of non-cooperative validators; validation deadlines; owner changes; changed revalidation output; normalized object ordering; double-confirm coalescing; failed commit retry; host atomic fencing; truthful cancellation after commit; observer cancellation; invalid budgets and owner failures.

Strict TypeScript/browser composition is checked by the root product-workflow example build. These checks prove controller contracts and example integration, not production storage atomicity, backend authorization, real OCR correctness or native review-dialog accessibility.
