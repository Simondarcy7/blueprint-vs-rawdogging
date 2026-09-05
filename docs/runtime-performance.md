# Runtime performance

Set a representative device/network and measure the first useful view plus the most frequent interaction. Use production builds. Record baseline, change, result and tradeoff in the app quality contract; tune the observed bottleneck instead of adding caches or memoization everywhere.

## Useful defaults

- Keep the first route's dependencies small. Defer optional SDKs, editors, maps and other heavy features until needed. Review third-party script work as well as application code.
- Load data without avoidable request waterfalls. Deduplicate equivalent reads when the chosen data layer supports it. Scope caches by identity and clear/isolate them on account changes.
- Set freshness/invalidation rules. Show usable cached data during refresh where appropriate; never allow caching to leak private records across users.
- Cancel obsolete requests or ignore their results. Debounce expensive search when useful without delaying basic typing feedback.
- Paginate or incrementally fetch growing datasets. Virtualize large lists only when measurement justifies it, and verify keyboard access, focus, search and screen-reader behavior.
- Keep input responsive. Break up long work or move appropriate CPU-bound work to a worker/platform facility; avoid repeated synchronous layout reads/writes.
- Profile rerenders before memoizing. Narrow subscriptions and avoid rebuilding expensive derived data unnecessarily.
- Reserve image/font/content space; use the separate image budgets. Animate transform/opacity when suitable and test reduced motion.
- Remove subscriptions, observers and timers when no longer needed. Pause optional polling for hidden/background surfaces and use sensible retry limits.

## Web and native evidence

For web, track load experience, interaction responsiveness and layout stability (LCP, INP and CLS) on important routes. Lab tools help diagnose; field measurements reflect real use when enough data is available. Record conditions instead of claiming a single synthetic score proves performance.

For native, additionally inspect startup/resume, scroll responsiveness, memory growth and background work on representative hardware. A fast web build does not establish native performance.

## Acceptance loop

1. Record the slow action, representative data volume, environment and baseline trace.
2. Identify whether delay is network, JavaScript/CPU, rendering/layout, assets or a provider.
3. Change the smallest relevant cause and repeat the same measurement.
4. Check correctness, accessibility, memory and data freshness have not regressed.
5. Add a budget/regression check only where it can reliably detect recurrence.

Reference: [web.dev INP optimization](https://web.dev/articles/optimize-inp?hl=en). Pair runtime measurements with built image, font and JavaScript budgets.
