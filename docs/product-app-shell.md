# Product app shell and complete workflows

Blueprint's `product-ui` and `product-workflows` packs provide reusable React Native presentation and complete workflow compositions. The generated Expo starter uses the shared shell directly. Keep product routes, brand tokens, data schemas, provider initialization and persistence adapters application-owned.

## Included source

The UI family includes responsive navigation, screen/header/footer composition, settings sections and rows, actions, fields, choices, adaptive columns and explicit loading/error/empty/content states. Components consume `ProductUIProvider` rather than importing a consumer's theme. Supply safe-area insets exactly once; a nested scaffold should not add the shell's bottom inset again.

Workflow compositions connect presentation to explicit controller/adapter contracts: settings load/edit/save/retry, account verification/recovery, notification preference reconciliation, and an inbox with clear/undo. Rendering a panel does not configure an identity provider or device scheduler. Unavailable integrations must remain visible as unavailable.

## Existing applications

Use a separate directory from the earlier four-pack product bundle:

```sh
node scripts/sync-product-capabilities.mjs --bundle app-shell --target /absolute/app/src/foundation/blueprint-shell --dry-run
node scripts/sync-product-capabilities.mjs --bundle app-shell --target /absolute/app/src/foundation/blueprint-shell --write
node scripts/sync-product-capabilities.mjs --bundle app-shell --target /absolute/app/src/foundation/blueprint-shell --check
```

This bundle includes UI/workflow source, account recovery, notification preferences, undo and the async helper. `.blueprint-app-shell.json` records source paths and hashes. Existing files and local modifications are protected. Runtime dependencies are the host's React/React Native versions; no provider is activated. Keep host adapters beside the application's features, outside the checked directory.

For additive initial scaffolding, select `--with product-workflows --only-packs`; required UI and controller packs are included automatically. Existing baseline async support is required. `product-ui` alone is also available. The scaffold refuses collisions and is not an upgrade/merge mechanism.

## Generated starter

The starter uses canonical copies under `src/foundation/blueprint-shell`. From Blueprint, `npm run shell:check` verifies them and `npm run shell:sync` applies a reviewed canonical change. The main test command checks parity. Formatting excludes these copied files so their bytes remain identical; the actual starter TypeScript and ESLint checks still inspect them.

The starter's navigation maps stable domain-neutral keys to Expo Router routes. The shared shell renders navigation and layouts; the host owns navigation history, deep links and unsaved-work policies. A responsive web view does not establish native-device keyboard or screen-reader acceptance.

## Acceptance

Test rendering and lifecycle behaviour, then compile the installed source in the actual consumers. Verify narrow layouts, keyboard focus, loading/failure/retry, saved acknowledgments and ownership changes. Tests using native host mocks prove component contracts, not actual platform accessibility. Keep source-size measurements separate from tests/documentation and count mirrored copies only once.
