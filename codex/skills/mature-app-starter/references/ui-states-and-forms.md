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
