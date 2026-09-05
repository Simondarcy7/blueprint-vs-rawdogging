# Build, update and web delivery

## Native project bootstrap

1. Replace `brand.json`'s example bundle identifier, scheme and branding. Set appropriate support/privacy information and inspect resolved permissions before distribution.
2. Authenticate to your own Expo account. Use `npx eas-cli@23.2.0 init` to create/link the intended project. Keep the project UUID in `EAS_PROJECT_ID` and account name in `EXPO_OWNER` for local/EAS configuration. Do not put signing secrets in `EXPO_PUBLIC_*`.
3. Configure those same values in the corresponding EAS environment. Keep development, preview and production backend resources separated if you later add services.
4. Run checks, Expo doctor and native exports. Build a preview with `npx eas-cli@23.2.0 build --profile preview --platform android` (or `ios`). Verify the printed destination account/project before confirming credentials or submitting a build.
5. Install that actual build. Verify navigation, keyboard, font scaling, screen reader, safe areas, save/relaunch, storage failures and foreground/resume. Record build ID, source SHA, runtime and device/OS.

The `development` profile produces a dev client; `preview` is internal distribution; `production` is store packaging. iOS signing and simulator/device setup remain platform prerequisites. Native dependencies or config changes require a compatible new binary. The fingerprint policy follows the installed SDK's runtime calculation; do not replace it without reviewing compatibility.

## OTA

With the matching public environment and project identity set, `npm run release:check` validates the preview target without sending anything. `npm run update:preview` uploads through a pinned EAS CLI from a clean checkout. `npm run update:production` requires production environment values. Production is a deliberate command, never a side effect of install or CI.

Default updates are checked on launch and applied on a subsequent launch; no in-app reload interrupts editing. Verify on an installed preview binary that an update was downloaded and then actually launched. Record update ID/channel/runtime/source alongside a rollback rehearsal. Use the official EAS rollback/republish procedure for the selected runtime; restoring code is not restoring a changed database. Retain old-client compatibility when adding a backend. A terminal upload success alone is not rollout evidence.

## Web

Run `npm run build:web` with the intended public environment values. Serve `dist` as a static export with clean-URL lookup, a true 404 using `+not-found.html`, no caching for HTML and immutable caching only for hashed assets. `scripts/serve-web.mjs` is a local verification server, not a public production server.

The export generates robots/sitemap from an explicit production HTTPS origin and allows only `/support` for discovery. Review and extend that allowlist when adding public product content. Keep private routes noindex; implement real authorization if private remote data is introduced. Add host-specific security headers/CSP, test direct links and verify the deployed origin after configuration changes. The supplied `vercel.json` provides the default static-host configuration.

Before external beta, complete `docs/verification.md` with signed-device and OTA evidence. Do not copy a readiness claim from the starter into a new app without rechecking.

Sources: [Expo Router installation](https://docs.expo.dev/router/installation/), [SDK 56+ navigation imports](https://docs.expo.dev/router/migrate/sdk-55-to-56/), [EAS Update](https://docs.expo.dev/eas-update/getting-started/), [static rendering](https://docs.expo.dev/router/web/static-rendering/). Checked for SDK 57 on 2026-09-05.
