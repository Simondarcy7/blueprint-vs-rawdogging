# Verification and remaining release work

The shell is under validation. The authoritative automated evidence is the GitHub Actions run for the exact source revision, supplemented by identified local checks. This file must not be read as native distribution approval.

## Local baseline

- Node 24 on macOS; Expo SDK 57 / Router 57. Declared versions are locked in package-lock.json.
- TypeScript, ESLint, formatter, structural/import guards and generated-asset freshness are executable through `npm run check`.
- Unit tests cover durable-write ordering, failed writes and retries, corruption/newer schema rejection, restore/delete, palette contrast, dependency compatibility and release preflight.
- Browser tests use the production static export with the supplied script CSP at desktop and mobile widths. They cover create/save/reload/search/edit/delete, discard confirmation, failed writes, corrupt storage, explicit/system appearance, keyboard choice, loaded-page offline saving, automated accessibility and true 404 responses.
- iOS/Android bundle export and Expo doctor are separate checks. These are not native compilation, simulator interaction, physical-device testing or OTA verification.
- Initial web JavaScript is approximately 320 KB gzip in the measured baseline, below the configured 650 KB cap. Re-measure after product changes rather than copying this number as a new result.
- Manual browser review inspected the actual home and settings layout. Physical-device ergonomics, assistive technology and custom fonts need their own evidence.

## Native checks

The toolkit's native CI compiles an Android release with local test signing and an unsigned iOS simulator release, then attempts an iOS Maestro workflow. Its logs/artifacts identify what ran. Until the run succeeds, these items remain pending. Generated apps can run `npm run test:native` against an installed identified build after installing Maestro; the app identifier comes from brand.json.

No store credentials, EAS project, external beta release or OTA update was created by the starter. For each new product, record installed binary/build ID, commit, device/OS, environment, runtime, update ID and recovery result before beta. Native simulator evidence cannot substitute for physical-device or signed OTA checks.

## Recheck after customization

Run `npm ci`, `npm run check`, `npm run doctor`, `npm run build:web`, browser installation plus `npm run test:e2e`, and `npm run export:native`. Review a narrow layout and both themes, keyboard and screen reader, interrupted workflows and the intended native builds. Link CI and device evidence here; leave unexecuted work pending.
