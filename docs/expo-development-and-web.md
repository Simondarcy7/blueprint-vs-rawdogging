# Expo development and web setup

Use this alongside the required Expo architecture. Standardize the development and verification workflow; add native services, monorepos and debugging integrations only when selected. Commands below are starting points to register and verify in the new project's package scripts, not commands run by the blueprint installer.

## Repeatable local workflow

Record the app directory, package manager/lockfile, Node version, environment names, supported devices and actual commands in the project index. Give developers explicit commands for:

| Purpose | Starting point / decision |
| --- | --- |
| Start Metro | `npx expo start` |
| Develop web | `npx expo start --web` |
| Connect an installed development build | `npx expo start --dev-client` |
| Export web | `npx expo export --platform web` |
| Check SDK/dependency alignment | `npx expo install --check` and `npx expo-doctor` |
| Verify the shell | Structural check, typecheck, lint and relevant behavior checks |
| Preview built web | Serve the export with the chosen host's routing behavior |

Document when Expo Go suffices and when selected native dependencies require a development build. A working Metro session does not prove a release build works. Keep build profiles and runtime compatibility in the [release workflow](build-and-release-workflow.md).

## Metro configuration stays small

Start from Expo's defaults. If a custom file is needed, extend `getDefaultConfig` from `expo/metro-config`; document each deviation and its affected platforms. Prefer standard workspace support to copied watch/resolver overrides. Do not introduce shared packages solely to match another app's tree. Expo's [Metro reference](https://docs.expo.dev/versions/latest/config/metro/) and [monorepo guide](https://docs.expo.dev/guides/monorepos/) describe the supported configuration.

Add WASM handling, custom headers, transformers or cache keys only for demonstrated requirements. Cross-origin isolation can affect popups and third-party resources; test the workflows affected by any header change. Custom development-server headers do not configure a deployed host. After a configuration change, use one deliberate cache reset to investigate stale transforms rather than making every development launch discard its cache.

## Expo web is a supported product surface

Decide the rendering/output mode and hosting behavior explicitly. For indexable content, static output can generate HTML ahead of time; dynamic paths must be enumerated or handled through a supported alternative. Static output does not provide request-time server rendering. Keep browser-only APIs out of build-time rendering, and initialize browser SDKs at an appropriate client boundary. See [Expo static rendering](https://docs.expo.dev/router/web/static-rendering/).

Verify the exported artifact, not only the development server:

- Direct-load and refresh nested routes; exercise Back and not-found behavior with the intended host rules.
- Check console/hydration errors, first-use state, keyboard/focus and narrow layouts.
- Inspect public metadata/canonical URLs, indexing policy and generated assets. Preview builds must retain their intended indexing policy after hydration.
- Test the platform adapters used by the workflow. An unavailable native capability needs honest web behavior, not fake success.
- Measure delivered JavaScript, fonts and images; avoid copying native-only SDKs into browser startup.

Keep origin, environment and indexing values consistent through export and deployment. Client `EXPO_PUBLIC_*` values are embedded in the bundle; changing host variables after export does not rewrite that artifact. Validate a small allowlist of nonsecret markers in the output. Isolate environment-sensitive custom caches and test consecutive preview/production exports when stale transforms are suspected. Never dump a full environment or credential values to prove configuration. See [Expo environment variables](https://docs.expo.dev/guides/environment-variables/).

Use the existing [SEO](seo-and-discoverability.md), [image](images-and-performance.md) and [runtime performance](runtime-performance.md) checks; do not build a parallel web quality system.

## Optional Metro / Expo MCP tools

Metro MCP and Expo MCP are distinct tools. Choose based on the debugging work needed, and record the exact package/server, version, supported SDK/runtime and connection procedure. Inspect existing agent configuration before adding another connection.

- [Expo MCP](https://docs.expo.dev/mcp/) provides official Expo/EAS context; local simulator/DevTools capabilities require additional setup and a running development server. Follow its current SDK-specific setup. Server authentication alone does not prove local capabilities work.
- [Metro MCP](https://metromcp.dev/) connects to a running React Native/Expo app through Metro/CDP for inspection and profiling. Check compatibility and available tools against the installed build; do not assume it can inspect a production binary.

These belong to the development toolchain. Do not bundle debugging servers into production, copy account credentials into the blueprint, install globally for every agent, or silently upgrade an app SDK to enable a tool. Connect to the intended project/device, verify one useful read such as logs or component inspection, and record the result. Tool access does not authorize production writes or release actions. Keep CLI logs, DevTools and manual verification usable when MCP is unavailable. MCP output supplements, rather than replaces, tests and device evidence.
