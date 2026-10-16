# Portable infrastructure source

The toolkit includes reusable source, executable checks and an additive scaffold command. Keep application branding, navigation destinations, schemas, business rules, provider credentials and production budgets in the adopting app.

## What is implemented

Async recipes distinguish generation guards, equivalent-work coalescing, deadlines and lossless per-resource serial queues. Choose the required contract; do not use deduplication to discard different write intents. Preference and flag reloads preserve confirmed values but block edits after a failed hydration.

For a runnable integration, use the repository's `scripts/create-app.mjs` and `starters/expo/README.md`. The default recipes also include interruption-safe `Presence`; the optional storage pack includes `adapterContract.ts` for disposable adapter checks. These are separate from product capabilities in [the optional catalogue](feature-recipes.md).

| Area | Source in the installed mature-app-starter skill | Behavior |
| --- | --- | --- |
| Settings and appearance | `assets/app-baseline/src/modules/settings/` | Controlled settings screen, versioned preferences and confirmed durable writes |
| Shared UI | `assets/app-baseline/src/components/ui/` | Text, buttons, fields, selections, panels, responsive screen, notices, state surfaces and recovery |
| Motion and announcements | `assets/app-baseline/src/hooks/` | Live OS motion preferences, paused notices, manual dismissal for screen-reader users |
| Navigation | `assets/app-baseline/src/modules/navigation/` | Focus isolation, web heading focus, focused Android Back handling and bounded scroll memory |
| Async work and caching | `assets/app-baseline/src/lib/` | Duplicate-work coalescing, deadlines, stale-result tickets and bounded in-memory cache |
| Shared contracts | `assets/app-baseline/src/foundation/` | Vendor-neutral results, capability states and data ownership inventory |
| Notifications and SEO | `assets/app-baseline/src/modules/notifications/`, `src/services/seo/` | Preference/permission state, public-route metadata and production sitemap policy |
| Storage and recovery | `assets/app-capabilities/storage/` | Namespaces, owner tickets, validated backups, recovery journal, chunked and installation-bound storage |
| Device actions | `assets/app-capabilities/device/` | Clipboard/share/browser adapters, file-picker contract, image budgets, cleanup, permissions and haptics |
| Feature flags | `assets/app-capabilities/flags/` | Local defaults/overrides, subscriptions and serialized persistence |
| Diagnostics | `assets/app-capabilities/diagnostics/` | Disabled-by-default telemetry and fresh allowlisted diagnostic payloads |

The extraction preserves behavior, not a particular visual design. Use one app-owned primitive vocabulary. Replace or adapt the sample palette rather than copying a fixed brand. The samples do not generate a complete runnable application or implement a production backend.

## Scaffold into the next app

After installing the toolkit and establishing the Expo app:

```sh
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root . --dry-run
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root .
```

For selected optional capabilities, add `--with storage,device,flags,diagnostics` to the initial scaffold. Claude-only projects use `.claude/skills/`. The command preflights every destination, rejects symlinked source directories and refuses existing files. No force/overwrite, dependency installation, route generation or external calls occur. A concurrent filesystem failure can leave a partial additive copy; inspect it before retrying. On an existing app, merge the relevant files instead of replacing `src/`.

Read both asset READMEs. Mount the recovery boundary outside providers, supply the palette from persisted appearance, and use shared primitives in actual screens. Wire safe-area insets, navigator focus and storage adapters deliberately. The UI examples need target-platform verification, not just successful copying.

## Executable quality checks

The toolkit installer places these scripts in `scripts/`, including with `--no-docs`:

```sh
node scripts/verify-blueprint.mjs
node scripts/verify-architecture.mjs
node scripts/verify-accessibility.mjs
node scripts/verify-performance.mjs dist config/performance-budgets.json
```

Architecture/accessibility scripts use the app's installed TypeScript compiler. Run them from the app root or pass the root as their first argument. The architecture check resolves configured TypeScript aliases and relative imports, checks public module entrypoints and foundation/config dependencies, confines ordinary routes to re-exports/static parameters, and rejects direct environment access outside `src/config/env.ts` except the Expo server compiler constant. Router `+` special files are excluded from thin-route checks and need separate review. The check does not prove runtime dependency graphs or catch arbitrary indirect environment access. Pair it with typecheck/lint.

The accessibility check flags missing explicit roles/names/image classification and disabled text scaling. It cannot prove a useful accessible name, correct focus, contrast, keyboard interaction or assistive behavior. Run real UI checks too.

Fill the initially null performance budgets from measured targets before running the export check. Missing budgets or missing HTML/JavaScript fail. It measures gzip bytes across **all** emitted JS files, total font bytes and individual image bytes. This is conservative export accounting, not initial-route download measurement or runtime profiling.

`release-tools.mjs` exports a target assertion and provider-neutral terminal-job monitor. Supply real provider adapters with bounded requests. It never starts a build or publishes. Queued/running, failed/cancelled, timeout and successful artifact evidence are distinct outcomes. Keep credentials and expected project/environment values in host configuration. These helpers are operational checks, not access controls.

## Adoption checklist

1. Complete `docs/app-baseline.md`, choose optional packs and record app-owned adapters.
2. Preserve established controls and integrate the shared behavior without a parallel UI kit.
3. Run the toolkit tests before changing the recipes; run host typecheck/lint and quality scripts after adoption.
4. Test failure scenarios: unavailable storage, malformed/future backups, denied/revoked permissions, duplicate actions, stale account operations and diagnostic privacy.
5. Verify keyboard, screen reader, large text, focus, motion, safe areas and real device sharing/permissions. Verify built/deployed SEO and actual notification delivery separately.
6. Keep account/provider authorization, database schemas/migrations, durable multi-device sync, subscription rules and legal text app-owned. A generic adapter does not implement those policies.

## Maintainer verification

Use Node 22.18+, `npm ci`, then `npm test`. Tests cover pure behavior, scaffold preservation, installer variants, static check fixtures and component behavior with a lightweight React Native mock. Mocked component tests are not browser/device or visual evidence. Typecheck source recipes with the adopting Expo project's dependencies; match React, React Native, Router and TypeScript versions to that app.
