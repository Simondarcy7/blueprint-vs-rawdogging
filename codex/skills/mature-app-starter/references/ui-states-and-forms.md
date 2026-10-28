# UI states and forms

Design the states that can actually occur, including transitions between them. Use the copyable `screen-behavior.md` template to make these decisions part of implementation and review.

## State behavior

| State | Default behavior | Verify |
| --- | --- | --- |
| First load | Render the shell/title immediately; use a layout-matched skeleton for substantial content or a spinner for a compact action | Stable geometry; no artificial wait for cached content |
| Refresh | Keep usable prior content, indicate refresh and label stale data when relevant | A background request does not blank the screen |
| First-use empty | Explain what belongs here and provide one useful creation/import action | User can begin without guessing |
| No search results | Show the query/filter context and a clear reset/edit action | Existing data is not described as absent |
| Partial | Show trustworthy results and identify missing information | Missing values are not fabricated as zero |
| Offline / unavailable | Explain what is saved locally, queued, or unavailable | Never label a change saved if persistence failed |
| Saving | Show pending feedback near the action and prevent duplicate in-flight submission | Rapid clicks/Enter do not repeat the operation |
| Success | Confirm at the relevant surface; offer Undo when supported | Success corresponds to the promised persistence level |
| Error | Preserve input/content, explain the issue, offer retry or an alternative | Recovery works without re-entering unrelated fields |

## Loading shells

Match the eventual layout with a few stable shapes. Avoid skeletons that flash for fast operations; choose any reveal delay through observation rather than slowing real results. Hide decorative placeholders from assistive technology, expose busy/status semantics once, and reduce animation with user motion preferences. Never keep an indefinite spinner after a terminal failure; show a recoverable state.

## Forms and actions

- Use persistent labels, suitable input types/autocomplete, explicit required/optional fields and examples only when useful. Validate at the service/server boundary as well as in the UI.
- Validate at helpful moments; do not announce errors on every keystroke. Associate inline errors with fields and use an error summary/focus strategy for longer forms.
- Preserve drafts after failed requests. Decide whether a draft should survive restart based on sensitivity; clear it at the intended completion/logout boundary.
- Disable duplicate in-flight actions, but keep their purpose/status understandable. For retryable server mutations, define an idempotency contract when duplicate execution could cause harm; disabling a button alone is insufficient.
- Cancel obsolete reads or ignore stale responses when query/selection changes. An older response must not overwrite a newer result.
- Use optimistic updates only when rollback/reconciliation is defined. Distinguish saved locally, syncing and saved remotely when those promises differ.
- For destructive actions, state the affected scope. Prefer Undo when real recovery is available; require deliberate confirmation for consequential irreversible loss. Do not add confirmations to harmless navigation.
- Use inline feedback for field/action errors. Toasts suit noncritical transient acknowledgement; critical failures must remain findable after a toast disappears.
- Dialogs need a name, usable focus/return behavior and dismissal appropriate to the action. Avoid stacking dialogs for an ordinary workflow.

## Content that survives real use

Test long names, large counts, missing images, user text, localized dates/numbers, and an empty dataset. Keep user-visible strings easy to locate; add full localization infrastructure only when needed. Show time zones when ambiguity matters. Make sample/demo data visibly distinct from real records.

Use deterministic fixtures for slow, partial, empty, failed and offline states in a UI workbench or focused tests. A polished happy-path screenshot does not verify these transitions.

## First use and interrupted work

Onboarding, demonstrations and resumable workflows are product choices. The checks below apply only when those behaviors exist; they do not require adding them to the shell.

Make the first useful action reachable from the initial product screen. Add onboarding only for a demonstrated prerequisite or comprehension gap; prefer contextual, dismissible guidance when it is sufficient. Separate the native launch splash used during initialization from product onboarding. Do not add a branding timer or wait on optional remote services before showing usable content. Verify native splash behavior in a release build, following [Expo splash-screen guidance](https://docs.expo.dev/versions/latest/sdk/splash-screen/).

Use an empty-install fixture as well as a returning-user fixture. Demonstrations must be clearly labeled, kept out of personal aggregates, and unable to overwrite real work. Avoid realistic placeholder metrics that look like the user's results. Make skipped guidance discoverable again where useful.

For an ongoing workflow, expose an obvious resume destination and preserve its meaningful position. Show the same truthful save state in every editing surface. Warn on exit only when transient unsaved work would be lost; an untouched draft or successfully persisted edit should not trigger an unnecessary confirmation. Test leaving, returning and restarting with both saved and pending work.

## Form lifecycle contract

| Phase | Behaviour | Exit condition |
| --- | --- | --- |
| Untouched | Show labels and useful defaults; avoid premature error noise | User changes a field or explicitly submits |
| Editing | Keep raw input where intermediate values are valid during typing | Validate on the agreed blur/submit boundary |
| Invalid | Explain the correction beside the field; retain other values | Input becomes valid; do not move focus on every keystroke |
| Submitting | Capture the intended payload, show pending status and prevent equivalent duplicate work | Verified success, actionable failure or reconciled unknown outcome |
| Successful | Reflect the committed value; show only the persistence level actually established | Next edit creates a new pending revision |
| Failed | Preserve edits and the last confirmed state; provide retry or correction | Retry succeeds or the user explicitly discards |

Separate raw form strings from parsed domain values. Do not turn an empty numeric input into zero or reject every partial date while someone types. Preserve user-entered spacing/text where it matters; normalize only through an explicit rule. Validate at the trusted boundary too. A disabled submit button needs an understandable reason; validation must remain discoverable.

For long forms, associate errors with inputs and choose an error-summary/focus strategy after submission. Avoid focus jumps while the user is correcting another field. If edits remain enabled during an in-flight save, a late success must not clear the newer draft. If edits are locked, make that deliberate and keep cancellation/navigation behaviour clear.

## Resumable drafts and multi-step work

Define draft identity, scope (device/guest/account), schema, retention and fields allowed to persist. Sensitive transient values may need to remain memory-only. State explicitly whether restart recovery is promised; retaining input after one failed request is not the same as a durable draft.

- Show an understandable resume destination and last meaningful step; allow explicit discard.
- Preserve data when moving Back through steps. Revalidate dependent choices when earlier answers change.
- Display progress based on real steps. Optional branches should not make the user appear to lose completed work.
- Keep validation and final commit distinct. Reviewing a draft is not completing the operation.
- On completion, clear the draft only after the promised write succeeds. On failure, keep it available.
- Define handling of schema upgrades, changed permissions, expired external selections and sign-out.
- For a new record versus editing an existing record, use different identity so drafts cannot overwrite one another.

Verify restart mid-step, failed save, edits while saving, explicit discard, account switch and a previously valid dependency becoming unavailable. Ask about leaving only when real unsaved work would be lost. Do not prompt on every Back action when the draft is already safely retained.

## Confirmation and safe undo

Choose based on actual consequences: ordinary navigation needs no confirmation; a reversible local change may use Undo; irreversible or consequential actions need a clear affected scope and deliberate confirmation. Do not offer Undo when the underlying action cannot be reversed.

An undo receipt identifies the mutation and any expected revision. Undo must not replace a whole current dataset with an old snapshot or revert another user's later work. Define receipt lifetime, owner scope, server support and failure presentation. Invalidate receipts on account/data replacement. If undo is unavailable after restart, do not imply durable recovery.

Keep the original outcome and undo outcome distinct. A failed undo must not announce restoration. Do not make a disappearing toast the only way to recover important data; choose a suitable recovery surface and accessible notice lifetime.

## Dates, time and formatting

Decide whether a value is a calendar date, local wall-clock appointment, duration or absolute instant. A date-only value should not shift day through implicit UTC conversion. An appointment may need a named timezone and a daylight-saving ambiguity rule. Show the relevant timezone when the user's locale could change the interpretation.

Store canonical values separately from display formatting; use one app-owned formatter and parsing contract. Specify minimum/maximum values, unknown values, locale and units. Provide keyboard entry or another accessible alternative when a custom picker is used. Test midnight, timezone changes, leap dates, invalid input and long localized labels for the actual domain.

## Notices, banners and deferred screens

Give notices severity, owner, deduplication key and persistence rules. Inline validation belongs beside input; page-wide failures belong where the affected task can recover. Coordinate banner priority so offline, update, permission and promotional notices do not consume the entire screen. Essential errors remain findable after transient feedback disappears.

When an optional screen loads lazily, keep a stable destination title and an actionable loading/failure surface. Retry the failed module/load without erasing unrelated work. Do not fetch heavyweight optional content merely because its navigation icon is visible. A terminal failure must leave loading state. See [runtime performance](runtime-performance.md) for measurement and [engagement/support](engagement-and-support.md) for submission-specific behaviour.
