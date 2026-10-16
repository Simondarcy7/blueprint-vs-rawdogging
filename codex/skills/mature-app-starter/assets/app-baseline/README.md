# Generic app baseline source

For a new runnable app use the toolkit's `scripts/create-app.mjs` and `starters/expo/README.md`. These recipes remain the integration path for existing apps. `Presence` supports interruption-safe visual exits; keep child content supplied during exit, pass the live reduced-motion preference and handle focus at the owning control.

Copyable TypeScript/React Native modules for an existing Expo Router app. These are integration building blocks, not a complete generated app or a published package. No backend, storage provider, notification SDK, analytics vendor or extra production dependency is installed.

## Adopt

1. Read the installed `references/generic-app-baseline.md` and complete `docs/app-baseline.md`.
2. Review this `src/` tree against the app. Use `scripts/scaffold-baseline.mjs --root APP --dry-run` from the installed skill to preview copying the baseline into missing paths, or copy missing files individually; merge existing components and public APIs deliberately. Never overwrite an existing `src` tree. Use the app's theme and shared primitives instead of maintaining two UI kits.
3. Mount `RecoveryBoundary` above the providers that might fail. Keep async startup failures in explicit state: a React error boundary does not catch rejected promises or event-handler errors. Pass a sanitized category-only reporter; await/catch errors inside any asynchronous reporting adapter.
4. Inject a `PreferenceStorage` adapter with atomic single-key writes and an app-owned, versioned namespace. Create one preferences store per scope; call `load()` before rendering editable settings. On read/parse failure, show usable defaults with retry while preserving the original bytes; do not silently reset storage. Use a new store when switching scopes.
5. Keep the confirmed preferences in app state. `onChange` awaits `store.update(patch)` before updating that state. Resolve the palette with `resolveAppearance(preferences, useColorScheme())`; explicit appearance must survive OS changes. Feed reduced-motion state into transitions, treating unknown OS state as reduced. Subscribe to platform motion changes and unsubscribe on unmount. Never let an app preference override the OS request to reduce motion.
6. Render `SettingsScreen` inside the existing safe-area/navigation shell. Supply real support/privacy links and the build version. Keep labels unique. Omit the notification section until its adapter is selected; don't publish a dead toggle. Routes re-export a module-owned screen/container, not the injected component directly without its required props.
7. For notifications, instantiate one controller per identity and inject a real platform adapter. Refresh on foreground and after returning from OS settings. Copy `controller.current()` to UI state immediately after starting an operation (for pending feedback), then apply its awaited result. `status: error` is a failure; do not show success. A denied OS permission and a persisted enabled preference are distinct. The adapter owns registration, cancellation, scheduling, retry/idempotency and reconciliation after partial failures. The supplied unavailable adapter intentionally cannot enable delivery.
8. `pageMetadata` returns noindex for previews and routes outside an explicit public allowlist. Apply it through the current Expo metadata API; serialize `sitemapUrls` using a proper XML encoder. The conservative sample supports plain ASCII static paths; extend validation deliberately for localized or dynamic URLs. Add public social images, robots headers, status/redirect rules and generated-output checks in the host. Private content still needs authorization.
9. Use `AppState` for initial loading, empty and recoverable failure states. Keep previous content mounted during refresh; show errors near the failed action. `ContentTransition` performs a short optional opacity transition, not a loading delay. Keep decorative skeletons hidden from assistive technology. Measure and tune with the host UI.

## Verify in the host

Run typecheck, lint, module-boundary checks and behavioral tests. Review keyboard focus/selection on web, screen-reader announcements, safe areas, large text, contrast, slow and failed storage, rapid actions, permission revocation and motion changes on supported platforms. Test native permissions/delivery on a signed device. Inspect exported and deployed SEO responses. Source helpers do not prove any of those platform outcomes.

Toolkit maintainers: on Node 22.18+, use `npm ci && npm test` for pure TypeScript, mocked component, installer/scaffold and quality-check tests. TSX integration still needs the target Expo toolchain; no dependency versions are pinned by these recipes.

References: [React Native accessibility APIs](https://reactnative.dev/docs/accessibilityinfo), [Expo web rendering](https://docs.expo.dev/router/web/static-rendering/).

## Extended default modules

- `components/ui/primitives.tsx`: palette provider, semantic text, async button, labeled field, selection group, panel and responsive screen. Use these in real screens and adapt the appearance once at the token boundary. Selection buttons are individual buttons, not a radio widget requiring unimplemented arrow-key behavior. Supply external pending state when a group mutation must disable every option.
- `hooks/useReducedMotion.ts`: live OS motion preference; OR it with the app's reduced-motion choice.
- `hooks/useTransientNotice.ts` / `TransientNotice.tsx`: redundant status feedback, pause on focus/hover/background, explicit dismiss, native screen-reader persistence. Web screen-reader detection is limited by the platform; important notices must remain persistent.
- `modules/navigation`: pass actual navigator focus to `RouteAccessibility`, supply a boolean-returning Android Back handler only when overriding navigation, and explicitly bind scroll memory to the host scroller. Clear ephemeral positions on identity/data replacement. Do not combine this focus handler with another screen-focus owner.
- `lib/asyncWork.ts`: generation tickets, coalesced work and cancellation-aware deadlines. Check tickets before side effects; a timeout cannot undo a remote mutation.
- `lib/resourceCache.ts`: bounded TTL cache. Use immutable values, identity/configuration-scoped keys and deliberate invalidation. This is not offline persistence.
- `foundation/contracts.ts`: neutral service results/capability states/data inventory; business schemas remain local.

The optional storage, device, flags and diagnostics packs live beside this directory in `app-capabilities/`. Their README records protection, concurrency and cleanup limits.
