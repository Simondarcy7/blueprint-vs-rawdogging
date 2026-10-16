# Verification and remaining release work

Local refresh verified on 2026-10-17, Node 24.13.1 on macOS, from toolkit base `ba02e4b` plus uncommitted refresh changes. These results are local evidence; no GitHub Actions run or native distribution approval is claimed. Generated products must replace this record after customization.

## Local baseline

- Node 24 on macOS; Expo SDK 57 / Router 57. Declared versions are locked in package-lock.json.
- TypeScript, ESLint, formatter, structural/import guards and generated-asset freshness are executable through `npm run check`.
- Unit tests cover durable-write ordering, failed writes and retries, corruption/newer schema rejection, restore/delete, palette contrast, dependency compatibility and release preflight.
- Browser tests use the production static export with the supplied script CSP at desktop, 390px and 320px widths. They cover create/save/reload/search/edit/delete, discard confirmation, failed writes, corrupt storage, explicit/system appearance, persisted motion preference, preference-read failure/retry, keyboard choice, loaded-page offline saving, automated accessibility and true 404 responses.
- iOS/Android bundle export and Expo doctor are separate checks. These are not native compilation, simulator interaction, physical-device testing or OTA verification.
- The final local shell measured 322,356 initial JavaScript gzip bytes, below its configured 650 KB cap. A prior fresh generated example measured 321,528 bytes. Re-measure after product changes rather than copying either number as a new result.
- Automated rendered checks do not establish manual design quality, physical-device ergonomics, assistive-technology acceptance or custom-font readiness.

## Commands executed in this refresh

- Toolkit: `npm test` passed 68 tests, including installer/scaffold preservation, copied-reference parity, interrupted motion, lossless write ordering and failed-reload write protection.
- Shell and a freshly generated app: clean install, `npm run check` (15 app tests plus type/lint/format/structural/architecture/static accessibility/assets), `npm run doctor` (21/21) and `npm run build:web` passed.
- Fresh generated app: `npm run test:e2e -- --workers 1` passed 27 cases across three viewport projects. The runner owns and closes its contexts and local server.
- Final shell: `npm run export:native` passed for iOS and Android. No native compilation, simulator interaction or signed-device acceptance was performed.
- Dependency audit still has 19 high-severity affected-package entries from two upstream advisory families after compatible fixes. See `dependency-notes.md`; this is a release-review gap, not a passing audit.

Fresh generation exposed copied-script formatting conflicts and route implementations rejected by the installed architecture guard. The source now ships formatted checks and thin re-export routes so generated apps satisfy the same rules as the toolkit instructs.

## Native checks

The toolkit's manually dispatched native workflow compiles an Android release with local test signing and an unsigned iOS simulator release, then attempts an iOS Maestro workflow. It is optional and does not consume native-runner minutes on every source push. Its logs/artifacts identify what ran; until the workflow succeeds, these items remain pending. Generated apps can run `npm run test:native` against an installed identified build after installing Maestro; the app identifier comes from brand.json.

No store credentials, EAS project, external beta release or OTA update was created by the starter. For each new product, record installed binary/build ID, commit, device/OS, environment, runtime, update ID and recovery result before beta. Native simulator evidence cannot substitute for physical-device or signed OTA checks.

## Recheck after customization

Run `npm ci`, `npm run check`, `npm run doctor`, `npm run build:web`, browser installation plus `npm run test:e2e`, and `npm run export:native`. Review a narrow layout and both themes, keyboard and screen reader, interrupted workflows and the intended native builds. Link CI and device evidence here; leave unexecuted work pending.
