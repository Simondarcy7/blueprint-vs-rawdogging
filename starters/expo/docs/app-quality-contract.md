# Shell quality contract

This is the implemented starter baseline. A generated app must record its own product scope, budgets and verification after customization; copied checks do not prove its release readiness.

| Concern | Shell decision | Acceptance evidence |
| --- | --- | --- |
| Architecture | Expo Router + TypeScript; thin `src/app` routes, module public APIs, typed storage boundary | Structural/import guards, including violating-fixture tests |
| Navigation | Three tabs plus deep-linkable editor/support; visible Back; unsaved-change decision | Browser workflow tests; native smoke and device matrix |
| Brand and appearance | Central palettes, semantic type/space roles, bundled-font registration; persisted System/Light/Dark | Palette contrast tests; keyboard and reload/OS-change browser tests; native device review |
| Shared controls | Text, buttons, card, field, choice group, confirmation, notice, loading shell, screen | Used by real example screens; development gallery at `/_preview` |
| Accessibility | At least 48-unit controls, scalable text, explicit labels/state, focus visibility, reduced motion | Axe on exported routes; keyboard/discard tests; screen-reader/device checks remain required |
| Data and failure | Versioned local example notes; serialized durable writes; no silent corruption reset; no cloud claims | Overlap/failure/retry/corruption/restore unit tests; failed-save and corrupt-storage browser tests |
| Web | Static export; only configured production support page may be indexed; real 404 | Built metadata/budget checks; local host CSP and browser smoke; deployed-host validation per app |
| Performance and assets | Numeric limits in `budgets.json`; neutral generated PNG icons; no remote fonts or heavy hero media | Actual initial gzip bytes per exported route; generated-asset freshness; native bundle sizes separately |
| Privacy | No analytics, accounts or remote diagnostics by default; allowlisted diagnostic adapter | No credentials configured; review privacy copy when introducing a provider |
| Tooling | Lockfile, formatting, types, lint, unit/browser tests and generated-app CI | Fresh installation and applicable commands in `docs/verification.md` |
| Native/OTA | Build profiles, runtime fingerprint, explicit environments, safe launch-time update handling | Exports and native CI; app-specific signed build, update/recovery and distribution checks remain pending |

## New product decisions

- Users / first useful workflow / non-goals:
- Platforms and representative devices:
- Brand assets and font rights:
- Public routes and production origin:
- Data sensitivity, deletion/export and selected service boundaries:
- Revised workload and performance budgets, with reasons:
- Account/project/store owners and environment separation:
- Verification record and outstanding exceptions:

No optional service is selected by this template. Add acceptance rows only for the actual product.
