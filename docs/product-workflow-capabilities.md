# Product workflow capabilities

These optional packs preserve complete product behaviours from the Golf App: protect unfinished work, review before replacement, restore useful focus, and ask for engagement at appropriate moments. Product models, wording, visual composition and storage/identity policies remain host-owned.

## Install and try

For existing applications that need tracked shared-source updates, use the [consumer sync workflow](shared-capability-adoption.md). It vendors byte-identical modules with a provenance manifest and refuses to overwrite local edits. The scaffold below is still suitable for initial app setup.

Into an existing generated Blueprint app:

```sh
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root . --with drafts,import-review,interactions,engagement --only-packs --dry-run
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root . --with drafts,import-review,interactions,engagement --only-packs
```

Use `.claude/skills/` for a Claude-only install. Omit `--only-packs` when adopting the baseline into an empty source tree. The scaffold never overwrites existing files or installs dependencies. Drafts/import-review require the baseline `src/lib/asyncWork.ts`; interactions/engagement are standalone. Run the host typecheck after copying.

The foundation repository includes a runnable journal example:

```sh
npm ci
npm run example:ux
```

Open the printed localhost URL (port 8769 by default). It compiles the actual capability files into a temporary browser build, serves only on localhost, and deletes the build when stopped with Ctrl+C. `npm run example:ux -- --port 8770` selects another port; use the same port on later runs to retain the browser storage origin. `npm run example:ux:check` performs strict TypeScript/build verification without starting a server. No vendor accounts, external services or analytics are connected. Local browser data is scoped to the example's own keys.

Try: write/save/reload a draft; make storage fail and retry without losing input; stage valid or malformed JSON; fail/retry the import commit; change the source after review; cancel a discard dialog with the keyboard and check focus returns. The workflow is deliberately outside golf. It is a reference integration, not a second production consumer or a native-device acceptance test.

## Drafts: keep input and acknowledge only the saved revision

`src/services/drafts/draftController.ts` exports `createDraftController`.

Construct it once per owner/draft scope with `owner`, `draftId`, `initial`, `parse`, `storage: { read, write, remove }` and a live `assertOwner` fence. Supply `baselineRevision` when editing an existing saved record. Otherwise the serialized initial value acts as its baseline. The codec must validate and reconstruct a JSON-compatible object, including application limits.

Use stable `getSnapshot`/`subscribe` with the host's state binding, `set` for edits, `load` at mount, `save` for explicit local persistence, and `clear` for explicit discard. `dispose` ends that owner session. A saved draft is not a submitted business record.

Preserved behaviour:

- A late load cannot replace edits made while storage was loading. A stored draft based on a different saved-record baseline also requires a choice.
- A recovery candidate exposes `recover()` and `keepCurrent()`. Keep both choices visible; saving is blocked until the ambiguity is resolved.
- A failed save retains the current input and reports failure. A completed write only marks its captured revision saved; edits made during that write remain dirty.
- Save/delete operations serialize within one controller. Clear invalidates older pending writes and does not erase edits made while deletion was underway.
- Invalid/corrupt/future/wrong-owner storage is preserved and blocks saving. The host can retry a read or explicitly discard after user confirmation.
- Snapshots and nested values are frozen so external mutation cannot bypass revision tracking.

Revision counters belong to the live editor session. Persisted counters are validated as metadata but never used to advance the live sequence; even an extreme stored counter must not prevent editing or discarding recovered work.

Present `saved`, `dirty`, `busy`, `status`, `recovery` and `error` honestly. Do not disable typing merely because a save is pending. Never show “saved” for a newer revision than the receipt covers. An empty baseline can be clean without representing a saved draft.

Storage must settle and provide atomic, commit-aware outcomes. Use account-scoped keys and fence the actual adapter commit against current ownership. This controller does not provide encryption, multi-tab coordination, schema migration, automatic submission or cross-device synchronization. Do not time out an uncancellable write and start overlapping writes.

## Import review: selection is not consent to replace

`src/services/import-review/importReview.ts` exports `createImportReview`.

Inject `parse(contents, signal)`, `summarize(value)`, `getOwner()` and an atomic `commit(value, context)`. Parsed values and summaries are immutable JSON-shaped data; raw source, parsed structure and summaries have bounded sizes. The application decides the schema and what information is sufficient for a person to review.

Call `stage(contents)` after source selection. It validates and prepares a snapshot; it never writes application data. Render the immutable review and its `revision`. Only an explicit action calls `confirm(review.revision)`. Editing the source should cancel/invalidate the old review, as the reference app demonstrates.

Confirmation revalidates the original source and compares the result with what was reviewed. If it has changed, a new review is required. A stale revision or different owner cannot commit. Duplicate confirmation shares the same in-flight operation. Failed, definitely-uncommitted writes retain the review for retry; malformed input never reaches `commit`.

The host transaction must enforce `context.isCurrent()`/owner and any target-record revision inside the actual write boundary. Client checks alone are not server authorization or conflict detection. Commit rejection must mean definitely uncommitted, or the receiver must support idempotent retry with a durable receipt. The review revision is session-local and must not be used as a globally unique operation ID.

Cancellation stops validation and invalidates future handoffs. Once a commit has been handed off, the controller cannot roll it back. It blocks new staging until that operation settles, and reports actual committed outcomes even if the review was cancelled meanwhile. A destructive commit is not raced against a timeout that could falsely report “nothing changed.” An unknown/hung storage outcome needs host reconciliation.

Accessible UI requirements: label the selected source and replacement effect, show the reviewed content/coverage, keep failure copy with the review, disable repeat confirmation while committing, and preserve the current collection until the actual transaction succeeds. Schema validity is not evidence of factual accuracy or source rights.

## Interactions: return focus without stealing it

`src/services/interactions/overlayFocus.ts` exports `createOverlayFocusManager` for web document integration. No React or SDK dependency is introduced. Supply a document or use the SSR-safe default.

Create one manager for a document/application. Hold `watchTriggers()` while the host is active and call its release function on teardown. Just before opening a modal/menu, capture a `restore` function with `captureReturnFocus()`. Call it after closing; it schedules the restoration for the next frame. Cancel unused restore work with `restore.cancel()` and dispose the manager on permanent teardown.

It preserves the original scroll containers and both axes, avoids disconnected/hidden/inert/disabled targets, respects a newer modal, and does not steal focus deliberately placed on a destination link or heading. Queued restoration and shared listeners are cleaned up explicitly. This helper complements the host modal's focus trap and accessible name; it does not implement those or native accessibility focus.

The interaction code is behaviour only. Use the host's dialog/sheet design and existing navigation, not a parallel UI library.

## Engagement: relevance, consent and interruption

`src/services/engagement/promptPolicy.ts` exports `createPromptPolicy` with product-owned minimum activity and cooldown thresholds. Evaluation requires explicit `enabled`, `workflowBusy`, `completedActivities`, `now` and validated history.

It returns a reason: eligible, disabled, busy, insufficient activity, prompt cooldown, request cooldown or invalid history. Missing/malformed/future history and regressed counts fail closed. `null` means no timestamp; epoch zero is a real timestamp. An eligible decision does not show a prompt or request a platform review.

The input deliberately has no sentiment, rating or performance score. Eligibility should reflect completed use and appropriate timing, not whether the person gave positive feedback. Persist history only for actions that actually occurred; an attempted SDK review request does not prove the OS displayed a review UI. The host owns consent, shared prompt coordination, persistence and platform limits.

## Evidence and reuse boundaries

The toolkit verifies state machines, failure races, immutable snapshots, copied-layout strict TypeScript and installation preservation. The reference example exercises browser composition using the same modules. Donor overlay regressions run against a real DOM implementation as well as existing mocked component tests. These checks do not establish screen-reader announcements, all native platforms, backend authorization or two real consumer upgrades.

Each capability's source provenance and remaining checks are in the repository's proposal implementation notes. Keep them attached when promoting a stable boundary to a shared package. Do not infer that every workflow in the discovery inventory is already implemented.
