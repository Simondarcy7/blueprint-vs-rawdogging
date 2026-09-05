# Build and release workflow

Keep one documented route from source revision to the exact artifact users receive. Align local and CI tool versions, build profiles and environment selection. Apply these practices when release tooling exists; the blueprint does not require paid build services or extra deployment vendors.

## Choose the required artifact

State whether the task needs a web deployment, a native development build, an installable test binary, a store artifact or an over-the-air update. Map each to an explicit profile. A simulator build, debug binary, signed installable build and store submission are different outcomes.

For EAS Update, verify the installed native runtime is compatible with the update, the target channel/environment is correct, and the update mechanism is already configured. Changes that alter the native runtime need a compatible new binary; a JavaScript-only change is not automatically safe for every installed build. Test in preview and retain a rollback path. See [Expo runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/).

## Measure pipeline delays

- Separate queue time, dependency installation, bundling, compilation, signing and upload. Fix the measured slow stage instead of changing providers on assumption.
- Cache supported dependency/compiler work with keys that account for the relevant lockfiles, toolchain and configuration. Measure a comparable warm build before claiming savings.
- Run independent web, native and backend verification jobs concurrently when useful, but keep their aggregate result required. Do not trade away checks to shorten the reported duration.
- Avoid scheduling duplicate builds for the same intended artifact. Cancel obsolete work only when it is safe and clearly identified.
- Evaluate binary-size or compiler optimizations in preview and test affected native capabilities before promotion. Do not remove supported device architectures just because one download is large.

## Follow work to the real result

A provider accepting a request means submitted or queued, not completed. Capture the build/deployment ID, wait for a terminal result where the task requires completion, and propagate failed/cancelled status. A timeout is unresolved, not successful. CI that only dispatches a remote build must identify itself as dispatch-only or gate release on the remote result.

Report artifact type, source revision, environment/profile, version/build number, terminal status, download/deployment link and remaining device/store checks. Verify the link corresponds to the intended artifact. Never imply a store release from a successful bundle export or simulator build. See [EAS Build](https://docs.expo.dev/build/introduction/) for the distinction between native builds and the surrounding distribution steps.

## Reconcile before release

Check resolved runtime/native configuration against the intended identifiers, permissions, environment and enabled SDKs. Keep privacy disclosures synchronized with actual collection, including automatic vendor defaults. Explain opt-out separately from deletion of data already collected.

Keep resource ownership, signing/key access and rollback procedures documented without storing secrets in the guide. A successful source check does not prove the external service configuration or signed binary matches it; record that verification separately.
