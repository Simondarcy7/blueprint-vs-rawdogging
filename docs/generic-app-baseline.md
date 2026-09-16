# Generic app baseline

Start with reusable everyday app behavior, then add the product's unique workflow. Settings, consistent states and recovery should not be redesigned for each app. Keep brand tokens, content, navigation destinations and business rules app-owned.

## Default starting feature set

Build these into each new interactive app unless the target surface makes an item inapplicable. Record omissions with a short reason in `docs/app-baseline.md`; ordinary applicability decisions do not need an approval round. Notification delivery, account systems and other external services still require an actual use case and configuration.

| Area | Reusable starting behavior | App-owned decisions / verification |
| --- | --- | --- |
| Settings | Appearance, reduced motion, support/privacy/about and app version; persisted preferences | Real URLs, supported modes, restart and failed-read/write behavior |
| Notifications | Preference surface and typed capability states; permission requested only from a relevant user action | Hide unavailable controls; choose local/push/browser delivery, useful categories, permission/revocation and cancellation checks |
| SEO and sharing metadata | Public route allowlist, titles/descriptions, canonical URLs, social preview metadata, sitemap and preview noindex | Public web only; meaningful content, real origin/assets, response/status checks; private data requires authorization |
| Startup and recovery | Minimal recovery UI above providers, bounded initialization, retry, sanitized diagnostics | Never silently erase data; test dependency failure and failure of retry itself |
| Loading and transitions | Layout-stable initial loading, retained content on refresh, local pending feedback, short reduced-motion-aware transitions | No artificial splash delay; actual completion controls UI state |
| Shared screen states | First-use empty, no results, partial, offline, permission denied, error and success | Clear next action and honest saved/queued/remote status for supported workflows |
| Navigation and shell | Safe areas, consistent headers, Back/deep links, usable keyboard/focus, responsive width | Destinations, tabs versus stack, scroll ownership and restoration |
| Shared controls and theme | Semantic text, buttons, fields, panels, notices and disabled/selected/pending states | Brand palette, typography, one control vocabulary, accessibility review |
| Forms and async work | Validation, input preservation, duplicate-submit prevention, stale-result protection | Idempotency and cancellation appropriate to each operation |
| Images and performance | Stable dimensions, fallbacks, appropriate variants, measured bundle/font/image budgets | Asset rights, representative workload and actual device measurements |
| Privacy and diagnostics | Minimal collection, sanitized failures, explicit consent/preferences when collection exists | No analytics collection by default; SDK payloads and policies verified if enabled |
| Release and maintenance | Environment validation, build identity, CI checks, support details and recovery plan | Real targets, native update policy, deployed/device evidence |

Use existing [UI states](ui-states-and-forms.md), [design primitives](design-system-primitives.md), [SEO](seo-and-discoverability.md), [resilience](data-resilience-and-capabilities.md) and [release](build-and-release-workflow.md) guides for detailed behavior. Do not copy arbitrary screens or branded layouts.

## Copyable source included

The installed mature-app-starter skill includes `assets/app-baseline/` even with `--no-docs`. Its README is the integration guide. In this repository, open `codex/skills/mature-app-starter/assets/app-baseline/`.

- `modules/settings`: controlled settings screen, versioned preference parser, serialized durable writes, appearance and motion resolution.
- `modules/notifications`: adapter contract, explicit permission/configuration states, deduplicated actions and a truthfully unavailable adapter.
- `components/ui`: loading/empty/error action surface, provider-independent render recovery boundary and reduced-motion-aware content transition.
- `services/seo`: explicit public-route metadata policy and production-only canonical sitemap URLs.
- `theme`: replaceable semantic light/dark palettes.

These are source recipes to integrate into an existing Expo app, not a full app generator. The installer does not copy them over application code or install dependencies. Settings persistence and notification delivery require host adapters. SEO helpers require rendering/hosting integration. Existing controls should absorb the behavior instead of creating a parallel design system.

## Optional feature recipes

Enable only when relevant: accounts and sessions; guest migration; export/import and backups; offline sync; notification inbox/history; search/filter/sort; sharing/referrals; onboarding and resumable drafts; localization; feature flags; analytics; payments/subscriptions; native widgets and live activities. Document purpose, data ownership and acceptance checks before selecting one. Notification preferences do not imply a social feed, remote push provider or marketing campaigns.

For persistent products, include schema validation, migrations and recovery tests. For accounts, include storage isolation, stale-operation rejection after account switch, session expiry, sign-out scope and deletion cleanup. An export of personal data and a restorable backup are different promises.

## First implementation slice

1. Establish Expo/Router modules and the app-owned theme/shell.
2. Integrate settings and shared state/recovery components alongside the first useful workflow.
3. Connect a preference adapter; verify restart, failure and OS appearance/motion changes.
4. Add applicable notification and public-web adapters; keep unavailable services explicit.
5. Wire focused checks into CI and record platform evidence. Continue with product-specific features after the baseline works.

## Acceptance examples

- A failed preference write leaves the confirmed setting unchanged and offers retry; overlapping writes cannot lose an earlier change.
- Corrupt or future-version preferences are preserved, not overwritten with defaults.
- Startup remains recoverable without the failed database or provider; retry failure remains actionable.
- Refresh never removes useful content or input, and reduced motion never delays completion.
- Notification permission is not requested on startup; duplicate actions do not duplicate registration, and revocation changes the displayed capability.
- Preview and private routes are absent from the sitemap; noindex metadata is not mistaken for access control.
- Settings and shared states are checked with keyboard, screen reader, enlarged text, light/dark appearance and supported native devices.
