# Optional product feature recipes

Select from the product brief, not from this catalogue. No row is mandatory and selecting a row does not install a backend, request permissions or authorize publication. Most recipes below are guidance, not finished components.

| Pattern | Reusable behavior | App-owned decisions | Current implementation |
| --- | --- | --- | --- |
| Resumable drafts | Keep unfinished work; resume/discard explicitly | Sensitivity, retention, completion/logout cleanup, device scope | Guidance; example editor preserves failed-save input, not restart drafts |
| Favourites, recents, shortcuts | Stable IDs, deduplication, explicit ordering and removal | Capacity, unavailable targets, customization, account scope | Guidance |
| Search/filter/sort | Query context, no-results/reset, stale-result protection | Ranking, pagination, filter semantics, saved preferences | Runnable notes search; generic async/cache helpers |
| Planned/active/completed work | Explicit transitions, completion validation, resume destination | Allowed transitions, cancellation/reopening, historical snapshots | Guidance; keep domain state machines local |
| History and summaries | Stable record identity, compatible comparisons, unknown values | Measures, units, windows, sample exclusion, retention | Guidance |
| Import → review → confirm | Parse into draft, show uncertainty, validate before commit | Formats, limits, correction UX, authorization, asset rights | Backup codec validates before replacement; review UI app-owned |
| Export and restore | Explain coverage, validate identity/schema, restore safely | Included data, credentials, atomic commit, deletion scope | Optional storage pack |
| Accounts and guest migration | Preserve eligible guest work, isolate identities, handle expiry | Merge policy, ownership, authorization, deletion, recovery | Owner-scope helpers; full identity integration app-owned |
| Offline sync | Durable intent, stable IDs, revisions, explicit conflict choice | Transport, transactional outbox, server idempotency, tombstones | Guidance and acceptance scenarios; not a supplied sync engine |
| Group sessions | Invitations, participant roles, shared state and expiry | Authorization, revocation, moderation, conflict rules | Guidance |
| Notifications and inbox | Preferences separate from OS permission and delivery | Categories, timing, scheduling, cancellation, retention | Controller contract; delivery/inbox adapters app-owned |
| Sharing and summaries | Preview, privacy-safe content, honest share result | Public/private links, token expiry, imagery and layout | Optional device actions; card/link generation app-owned |
| Personal defaults | Explicit choices override derived defaults | What persists/syncs, reset and migration behavior | Preference store and runnable appearance/motion settings |
| Contextual shortcuts | Pin a destination, show saved feedback, offer safe undo | Capacity, stale targets, gesture/menu alternatives, identity/data replacement | Guidance; keep the product's shortcut registry local |
| Contextual guidance and prompts | Relevant, dismissible help after useful moments | Eligibility, cooldown, suppression, accessible return path | Guidance; no default review/newsletter solicitations |
| Recommendations and achievements | Explain relevant next steps and measured progress | Evidence, rules, fairness, sensitive advice, opt-out | Product-specific; no default engine or gamification |

## Acceptance recipe

For each selected pattern, record purpose, non-goals, authority, public API, platform adapters, data lifecycle and relevant failure checks in the app's baseline/feature specification. Keep source models local; extract only common behavior.

- Drafts: failed save preserves text; restart resumes only if promised; explicit discard clears the correct scope.
- Saved items: rename does not break identity; removed/unavailable targets have a usable outcome; reorder has a non-drag alternative.
- Shortcut undo: only revert the change represented by the receipt; an old notice cannot overwrite newer personalization. Long press has a visible alternative and does not change ordinary tap navigation.
- Lifecycle/history: incomplete work cannot silently become complete; old records retain the intended meaning when current configuration changes.
- Import: malformed, ambiguous or future-version input cannot replace good data; cancellation cleans up owned temporary resources.
- Identity/sync: lost replies reuse operation IDs; later edits survive acknowledgement; account A → B → A rejects old work; conflicts retain both versions until resolution; deletion cannot be resurrected by delayed retries.
- Groups/sharing: unauthorized/expired/revoked links fail at the server boundary; opening a share sheet is not proof of delivery.
- Prompts: dismissal and cooldown persist where promised; returning users are not repeatedly interrupted; essential work remains reachable.

See [data resilience](data-resilience-and-capabilities.md), [UI states](ui-states-and-forms.md), [content trust](content-trust.md), [portable infrastructure](portable-infrastructure.md) and [verification](verification-and-review.md). Choose integration tests against actual authorization/storage when the promise depends on them.

## Detailed behaviour recipes

For selected capabilities, use [discovery/personalization](discovery-and-personalization.md), [import/export/sharing](import-export-and-sharing.md), [identity/collaboration](identity-and-collaboration.md) and [engagement/support](engagement-and-support.md). Forms/drafts/undo live in [UI states](ui-states-and-forms.md). The [product behaviour map](product-behavior-map.md) connects the whole set. These expand guidance and acceptance cases; they do not change the implementation status in the catalogue above.
