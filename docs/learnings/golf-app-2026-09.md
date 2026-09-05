# Golf App extraction — September 2026

Inspected 2026-09-05. Source: the owner's local Golf App checkout, based on commit `874206dfc32377d48f6806737daffdff29bc66a0`, with substantial modified and untracked work. Paths below are relative to that source repository. This records inspected implementations and design intent, not successful test runs or a completed release audit. No app source/assets or private user data are bundled here.

| Source evidence | Reusable lesson | Toolkit destination |
| --- | --- | --- |
| `docs/reusable-app-foundation.md`; `mobile/src/foundation/`; `mobile/scripts/verify-module-boundaries.mjs` (modified) | Thin routes, feature APIs, config isolation, vendor-neutral contracts; promote packages after a second app proves reuse | `release-quality-gates.md` |
| `legacy/web-vite/scripts/finalize-seo.mjs` and `verify-seo.mjs` (retired client) | Central public-route policy and verify built metadata/sitemaps; carry checks across migrations | `seo-and-discoverability.md` |
| `mobile/scripts/verify-accessibility.mjs`; `mobile/src/modules/navigation/RouteAccessibility.web.tsx` and `mobile/src/modules/web-document/Html.tsx` (latter two untracked) | Semantic checks plus actual focus management, hidden-screen isolation and visible focus | `accessibility-baseline.md` |
| `scripts/prepare-mobile-images.mjs` (untracked); `mobile/scripts/verify-performance-budget.mjs` (modified) | Generated thumbnail/hero variants, WebP compression, placeholders, byte budgets and unused-asset detection | `images-and-performance.md` |
| `mobile/src/services/device/imageBudget.ts` | Bound decoded dimensions/pixels as well as input bytes | `images-and-performance.md` |
| `mobile/src/services/analytics/webProductAnalytics.ts` (untracked); `mobile/src/services/observability/crashReportingSanitizer.ts` (modified) | Typed telemetry boundary, explicit collection policy and payload sanitation | `release-quality-gates.md` |
| `mobile/scripts/finalize-web-export.mjs`; `mobile/package.json` (modified) | Verify the actual deployable export and required assets, not merely source presence | `release-quality-gates.md` |

## Limits and corrections during promotion

- The canonical product is now Expo; the detailed SEO verifier inspected is in the retired Vite tree. Active `export:web` runs asset/CSP/performance/backend-export checks, but that command does not establish SEO parity. Preserve the SEO approach and require new evidence after migration.
- The static accessibility guard checks prop/role presence and selected source conventions. It cannot prove correct labels, contrast, focus behavior or screen-reader usability.
- Golf's pixel sizes, compression settings and bundle limits reflect that app. Future apps must set their own budgets and review actual visuals.
- Sitemap dates should represent meaningful content changes, not be refreshed automatically for every release.
- Source-code presence is evidence of an approach, not proof that it worked in production. Candidate worktree patterns need verification in the next implementation.

Keep scoring rules, course catalog/images, names, service credentials, app identifiers, and exact vendor/framework versions outside the reusable starter. The portable outputs are the quality contract, guides, and agent defaults.
