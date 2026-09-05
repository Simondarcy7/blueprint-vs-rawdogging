# Runnable Expo shell

A small, brandable Expo Router application for iOS, Android and web. It includes navigation, System/Light/Dark appearance, accessible shared controls, loading/empty/error states, a persistent example workflow, tests and release setup. It runs without service accounts.

```sh
npm ci
npm run web
# Or: npm start, then open a compatible Expo Go client.
# For native modules/dev-client validation: use your own development build.
```

## Make it yours

| Change | Edit |
| --- | --- |
| App name, native scheme/identifier, copy and both colour palettes | `brand.json` |
| Fonts | Put licensed files in `assets/fonts`, register `fontSources` and choose families in `src/config/fonts.ts` |
| Spacing, corners, type roles and content width | `src/theme/tokens.ts` |
| Tab labels and destinations | `src/config/app.ts`, `src/modules/navigation`, thin `src/app` routes |
| Business intent | Replace `src/modules/notes` and the home/support copy with your actual workflow |
| App icon and splash | Run `npm run assets` after palette changes, or replace the asset generator with your own licensed brand artwork |
| Public site origin and environments | `.env.example`, `src/config/env.ts` |

System fonts are the working default, with no font download. Custom fonts load before the native splash is hidden. Generated icons are neutral starter artwork; review safe zones and real-device appearance after replacing them.

The notes example is isolated but fully functional: create, validate, save, reload, edit, search, delete and preserve text on a failed save. It stores ordinary data locally, without backup or accounts. Replace its module and references; retain shared shell components and quality checks. No demo records are inserted into user storage.

## Daily commands

- `npm run check`: types, lint, structural/import guards, generated assets and unit tests.
- `npm run build:web`: static export, metadata/route checks and asset/initial-JavaScript budgets.
- `npx playwright install chromium` then `npm run test:e2e`: interactions and automated accessibility against the export, at desktop and mobile widths.
- `npm run export:native`: iOS and Android bundles; this is not native compilation or a signed-device test.
- `npm run doctor`: Expo compatibility checks.
- `npm run assets`: regenerate default brand assets; `assets:check` never rewrites them.

The app CI runs these checks. Budget changes require measured reasoning in the quality contract. Update visual/behaviour expectations deliberately as the example becomes your product.

## Native and delivery setup

Read `docs/release.md`. Each app still needs its own bundle identifier, Expo project/account, store credentials, domain and support/privacy content. The starter cannot supply those identities. OTA infrastructure is present but stays disabled until your project ID is set. Never describe a passing export as a tested native release.

## Optional capabilities

See `docs/foundation/` for permission/device adapters, PostHog, Expo/Metro MCP, authentication, sync and other selected integrations. Add these only when the product needs them. The starter configures no MCP server, analytics collection, live backend or paid resource automatically.

## Maintenance

`blueprint-version.json` records the originating toolkit revision in generated apps. Follow `BLUEPRINT.md`; keep `docs/project-index.md`, `docs/app-quality-contract.md` and `docs/architecture.md` current. Review starter upgrades as diffs—never overwrite a product with a newer shell.
