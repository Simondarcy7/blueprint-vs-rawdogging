# Build and release workflow

Keep one documented route from source revision to the exact artifact users receive. Align local and CI tool versions, build profiles and environment selection. Apply these practices when release tooling exists; the blueprint does not require paid build services or extra deployment vendors.

## Choose the required artifact

State whether the task needs a web deployment, a native development build, an installable test binary, a store artifact or an over-the-air update. Map each to an explicit profile. A simulator build, debug binary, signed installable build and store submission are different outcomes.

For native OTA, follow the setup and release gate below. Choose the delivery path from the actual compatibility requirements, not merely from whether the edited files are JavaScript.

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

## OTA delivery is part of native setup

Before external native testing, configure and verify OTA delivery or record the owner-approved alternative required by BLUEPRINT.md. EAS Update is the default provider for this Expo foundation. It can deliver compatible JavaScript, styles and assets to an installed update-enabled binary; changes to native code, dependencies, permissions or SDK runtime need a new compatible binary. A changed file extension alone does not establish compatibility. Web deployments and backend releases remain separate. See [EAS Update](https://docs.expo.dev/eas-update/introduction/).

### Setup sequence

1. Record the Expo project/account owner, environment/profile/channel mapping and CLI/SDK versions. Configure `expo-updates` and inspect the resolved native configuration. The update capability must be shipped in a binary before it can receive updates; adding it to source cannot upgrade an already installed binary that lacks it.
2. Choose and document a runtime-version policy. Never reuse a runtime identifier across incompatible native configurations. If using an app-version policy, enforce a version bump for native changes; evaluate fingerprinting against the installed SDK and its support status. Build a release-like preview binary compatible with the runtime being targeted and install it on the supported platform. See [runtime versions](https://docs.expo.dev/eas-update/runtime-versions/).
3. Keep development, preview and production channels explicit. A channel selects update routing; it is not a substitute for choosing build/update environment variables. Record project, platform, runtime, channel, environment and source revision before publishing. Validate them in release scripts/CI rather than relying on a developer remembering a flag.
4. Publish an authorized preview update and verify a known change is downloaded and actually running on the installed app. Reopen offline and verify the first useful workflow. Record embedded binary version/build, runtime and running update ID in sanitized support diagnostics; an extra settings screen is not required.
5. Test recovery in preview before marking the gate complete. Record the commands, last-known-good update, responsible owner and evidence in the release record. Do not trigger production publication or account setup merely by installing this toolkit.

### Promotion and rollout

Promote the exact tested bundle only when runtime, signing and embedded environment values are appropriate for the destination. A preview bundle containing preview service URLs must not be blindly republished to production. If production needs a new export, identify and test that artifact before release. See [Expo deployment](https://docs.expo.dev/eas-update/deployment/) and [EAS environment variables](https://docs.expo.dev/eas/environment-variables/).

Use a staged rollout when audience size and risk justify it. Define advance/stop conditions using observed startup failures, critical-workflow health and update adoption. Record who can halt or revert the release. Publication, download and running adoption are separate milestones; clients can be offline or still running older code. See [rollouts](https://docs.expo.dev/eas-update/rollouts/).

### Apply updates without losing work

Define check, download and apply timing. Prefer the next safe launch or an intentional restart point; do not reload over active forms, pending writes or an important task. Handle failed/interrupted downloads and lack of connectivity without an indefinite startup block. Test cold launch, background/foreground behavior, offline relaunch and persisted work on a release-like installed build. A manual update button is a product choice, not a shell requirement.

### Recovery includes data compatibility

Keep a verified path to republish a compatible known-good update or roll back to the embedded update where supported. Automatic error recovery is a fallback, not proof that a bad release can always be reversed. Users must still reach the service to receive recovery instructions. See [rollbacks](https://docs.expo.dev/eas-update/rollbacks/) and [error recovery](https://docs.expo.dev/eas-update/error-recovery/).

Rolling back JavaScript does not reverse a storage migration, undo a server write or remove a native permission. For apps with persisted data or backends, preserve compatibility with still-supported clients and the chosen recovery version; prefer additive transitions before destructive cleanup. Test rollback with populated disposable data. If an older bundle cannot read the new state, record a forward-fix/new-binary recovery plan rather than promising unsafe rollback.

### Release authority and evidence

Document who can publish, review their least-privilege access and protect release credentials. Make an explicit OTA signing decision, including key custody, renewal and recovery; follow [Expo update code signing](https://docs.expo.dev/eas-update/code-signing/). Keep secrets out of source and reports. Check current platform/store constraints when choosing what to deliver through OTA; it does not replace the native store release process.

Before handoff, record the binary/build ID, source revision, runtime, channel/environment, update group and per-platform IDs, device evidence, rollout state and recovery result. Pending device or recovery checks mean OTA is configured but not verified. The structural blueprint verifier cannot prove this operational gate.

## Preflight before expensive or external release work

Validate the selected project/account, linked host, environment, platform and artifact/action combination before upload or cloud compilation. Check local identity constraints only where the provider requires them; never copy a particular person's email or rewrite published Git history to satisfy a deployment check. Local configuration checks do not prove remote membership. Keep the result and unresolved provider checks explicit.

Expose one documented release entrypoint and reuse its validation in CI. Separate build-only from submit/publish actions, reject impossible combinations early, and verify the orchestrator with stubbed provider responses. Test failure, cancellation, timeout and partial platform completion without starting cloud builds. Record direct commands that bypass the entrypoint rather than pretending a local script is an unbypassable access control.

## CI must cover the release, not just one client

Map each required concern to a job and a required status: client, shared packages, native export and backend checks when present. If using an aggregate gate, include every required job and fail on failed, cancelled or unexpectedly skipped results. Confirm the repository's actual merge/release rules require the intended statuses. A green web job cannot stand in for a failed database job.

Set job timeouts and separate obsolete-check cancellation from release concurrency: cancelling an old PR check can save work, while interrupting an active release may leave partial external state. Start workflow permissions narrowly, pin third-party actions to reviewed immutable revisions, and keep production credentials out of untrusted PR jobs. Pass untrusted workflow values through structured inputs or quoted environment variables rather than interpolating them into shell code. Document how pins are kept current. See [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use).

## Know the dependencies that actually ship

At release, keep a versioned inventory of production dependencies and relevant native/transitive components. Include custom native modules and SDKs that a JavaScript lockfile inventory cannot establish. Associate the inventory with the build and retain it for a stated period. An SBOM is useful when tooling supports it; record its coverage gaps rather than presenting manually declared native metadata as a complete binary inspection. See [npm SBOM](https://docs.npmjs.com/cli/v11/commands/npm-sbom/).

Review new/changed licenses and missing metadata through a project-owned process. An engineering allowlist is not legal clearance, and another product's accepted expressions are not universal approvals. Track overrides with their reason and removal/revisit trigger. Dependency audit success does not prove absence of vulnerabilities or resolve content/font rights.

## Store readiness is a separate release gate

For store distribution, maintain one authoritative listing record and derive copy packs or provider metadata from it where tooling supports that. Check current store field and asset requirements at submission time; do not freeze another release's limits or categories into the shell.

Record each screenshot's source build, platform, locale and capture method. Keep web-rendered/mock review candidates clearly distinguished from actual native release captures; do not silently promote a mock into submission evidence. Verify listing claims against the build being submitted, and confirm public support/privacy pages and a real support owner. Asset generation, binary upload, metadata upload, store review and public availability are separate outcomes. Record console/manual checks that scripts cannot establish. See [Expo store submission](https://docs.expo.dev/deploy/submit-to-app-stores/).
