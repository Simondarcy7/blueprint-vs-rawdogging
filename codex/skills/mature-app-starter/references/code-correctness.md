# Code correctness across app features

Use these rules when implementing data, state or integrations. They strengthen the required module/service boundaries without prescribing a new state library or backend. Keep product calculations and validation in small pure functions; keep React hooks and services responsible for orchestration and effects.

## Preserve the meaning of data

| Decision | Rule | Useful regression case |
| --- | --- | --- |
| Missing values | Distinguish unknown/untracked from a measured zero, false or an empty result | Imported data with an absent measurement stays unknown |
| Provenance | Separate observed, user-reported, estimated and sample values when their meaning differs | Estimated detail cannot silently become an observed metric |
| Identity | Use stable IDs for relationships; names are mutable presentation | Rename and duplicate-name records retain distinct histories |
| Comparability | Compare compatible units, time windows, categories and denominators | Mixed record types do not create a misleading average |
| Units | Choose a canonical stored representation and convert explicitly at input/output boundaries | Changing units updates parsing, validation and display, not only labels |
| Time | Store instants in an unambiguous representation; distinguish date-only values and time zones | Ordering remains correct across locale changes and tied timestamps |
| Preferences | Distinguish an explicit choice from a locale-derived default when restore/sync depends on intent | A device default cannot overwrite an intentional remote preference |

Avoid reconstructing unknown detail from an aggregate merely to fill a screen. Label uncertainty and exclude incompatible records where necessary. Use legacy name fallbacks only for records without IDs and only when the match is unambiguous.

## One contract through the data path

- Parse untrusted input as `unknown`; a TypeScript assertion is not runtime validation. Use one authoritative contract for local storage, remote payloads and import/export where they represent the same data.
- Keep migrations explicit, repeatable where required, and non-mutating until validation succeeds. Preserve the recovery copy; do not guess ambiguous historical values.
- Restore already validated domain objects through a typed storage boundary instead of serializing them into a portable backup file and immediately parsing them again.
- Separate developer-chosen defaults for a new draft from facts imported about an existing record. Apply defaults at a named creation boundary, not opportunistically during rendering.
- Keep source-of-truth state small. Derive summaries/selectors from it instead of persisting multiple copies that can disagree. Split subscriptions by responsibility when measurement shows unrelated rerenders.

## Async operations must have an owner

Choose behavior per operation. Reads often need cancellation or latest-result-wins handling; writes may need ordering, idempotency or explicit conflict handling. Do not serialize every request globally.

- When several actions mutate the same resource, define their ordering. Read current state when queued work executes rather than relying on a stale captured value. A rejected operation must not permanently block later work.
- For a setting that also changes storage or device state, define the commit point and rollback/reconciliation behavior. Do not show “enabled” after the underlying operation failed. If rollback itself fails, expose uncertainty and retry/reconcile deliberately.
- Share initialization/migration ownership for a resource such as a database. Cache a handle only after successful initialization; close/discard failed handles and allow a controlled retry.
- Bound loading states with success, failure or cancellation paths. Always release pending state; contain rejected promises at event/provider boundaries and avoid updates after a view is no longer active.
- Keep optional provider failures local. A telemetry or reminder outage should not replace the core app with its root error screen. If falling back to memory, communicate any reduced persistence guarantee where it affects the user.
- Separate independent capabilities: one denied permission must not disable unrelated functionality. Give subscriptions, timers and background work explicit cleanup and foreground reconciliation where needed.

Test ordering with controlled promises, including failure followed by success, repeated rapid actions, stale responses and rollback failure. Test actual outcomes and persisted values rather than only button text or callback invocation counts. React's [effect lifecycle guidance](https://react.dev/reference/react/useEffect) explains cleanup and stale-result handling; use the app's data layer where one already exists.
