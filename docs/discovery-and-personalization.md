# Discovery and personalization

Apply these recipes when the product brief needs search, saved items, shortcuts or personal defaults. They are optional behaviour specifications, not a backend or a complete component pack. Reuse the shell's existing controls and the async/owner-scope helpers where their contracts fit.

## Search, filter and sort form one query

Define the searchable fields, matching/ranking rules, supported sort orders and pagination boundary. Distinguish a first-use empty dataset from no matches and from a failed search. Keep the active query and applied filters visible enough to explain why results are shown. Provide a clear reset and a useful outcome for zero results.

Treat a result request as belonging to the full query, filter, sort and owner identity. Abort obsolete reads where supported and reject stale results regardless. A late result for an older query cannot replace the current list. Debouncing should reduce unnecessary requests without making text entry lag; do not prescribe a universal delay. Decide minimum query length and behaviour while typing from real data/provider constraints.

For pagination, define stable ordering and cursor semantics. Reset accumulated pages when the query changes. Deduplicate by stable identity, preserve usable prior content on a page failure, and avoid representing an incomplete page set as a complete dataset. Bounded cache entries need owner scope, freshness and invalidation rules.

## Filter interaction contract

| Decision | Specify |
| --- | --- |
| Apply immediately or on confirmation | Immediate controls affect results at once; draft sheets do not until Apply |
| Cancel/dismiss | For draft sheets, discard uncommitted choices and restore applied values |
| Clear | Define whether it clears draft filters, applied filters, query, or all; label accordingly |
| Selected count | Count actual applied predicates/options using a consistent rule |
| Unavailable option | Preserve with explanation or remove deliberately; do not silently change meaning |
| Returning from detail | Restore applied query, sort, filters and useful list position |
| Persistence | Decide session, restart and account scope separately; keep sensitive queries out of URLs |

Use the same query model in chips, sheet controls and result counts. A displayed count must not lag behind the state it describes. Clear should remain reversible through normal selection, not require a hidden navigation reset. On web, shareable state may belong in the URL; transient/private state needs another owner.

## Favourites, recents and pinned shortcuts

Use stable IDs, not labels or array indexes. Rename must not break saved identity. Choose explicit ordering: recent use, manual order, alphabetical or a documented default. A favourite, a recent item and a pinned navigation shortcut are different promises; avoid silently treating them as the same list.

Define capacity only when there is a reason, explain a reached limit and provide removal/replacement. An unavailable target should offer a useful outcome, not crash or silently disappear if its absence would confuse the user. Resolve routes from an app-owned registry and validate targets before navigation. Never store arbitrary executable actions as shortcut configuration.

For manual ordering, provide Move up/down or an equivalent non-drag path. Keep ordinary tap behaviour unchanged when adding long-press options. Pin/remove feedback can include scoped Undo; invalidate old receipts after a newer personalization change or dataset/account replacement.

Recents may expose private activity. Define retention, clear-history behaviour, storage scope and whether recording can be disabled. Do not sync this history merely because account storage is available.

## Personal defaults

Separate explicit user choices from inferred suggestions and system defaults. Explicit values remain authoritative until reset. Show inferred values as suggestions where confirmation matters. Define when a preference applies to new work versus changing existing records; defaults should not rewrite historical meaning.

Version preference data, validate hydration, serialize updates and preserve confirmed state on failures. Explain save failure where necessary. Define per-device versus per-account settings, export/delete scope and reset semantics. An account change must not briefly render another person's defaults.

## First useful action and contextual help

Make the initial empty state a route into the real workflow. Add mandatory onboarding only for a real prerequisite. Optional tips should be relevant, dismissible and recoverable from Help when useful. Demonstrations are explicitly labelled and cannot contaminate personal history or aggregate metrics.

Prompts share attention with notifications, errors and ongoing tasks. Coordinate timing and suppression with [engagement and support](engagement-and-support.md), rather than letting every feature independently show a tooltip or request.

## Acceptance cases

- Type two different queries and resolve the older request last; only the latest results remain.
- Change filters during pagination; old pages cannot append to the new query.
- Edit a draft filter sheet, cancel, reopen, apply and clear; counts and visible results agree.
- Open a detail and return; context survives. Change the dataset; stale context is invalidated appropriately.
- Rename/delete a saved item; favourites/recents remain understandable and stable.
- Reorder without dragging; reverse a pin with Undo after another change and verify no newer state is overwritten.
- Restart, change account and fail preference persistence; no false success or cross-owner data appears.

Keep ranking formulas, category vocabularies, shortcut destinations and recommendation rules product-owned. See [navigation](app-shell-and-navigation.md), [forms and undo](ui-states-and-forms.md) and [data resilience](data-resilience-and-capabilities.md).
