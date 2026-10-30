# Overlay focus and scroll recovery — 29 October 2026

## Value preserved

A dismissed overlay returns to its invoking control without jumping the underlying vertical or horizontal scroll. Restoration waits for the closing frame, respects a newer modal and a still-open parent, and yields to a deliberately focused destination. This is reusable across menus, filters, confirmation sheets, document editors and settings; it carries no golf rules, palette or React dependency.

## Implementation

Canonical capability: `codex/skills/mature-app-starter/assets/app-capabilities/interactions/src/services/interactions/overlayFocus.ts`.

```ts
const focus = createOverlayFocusManager({ document });
const stopWatching = focus.watchTriggers();

// Capture before opening the semantically marked overlay.
const restore = focus.captureReturnFocus();
// ... open the dialog, then remove/hide it on close ...
restore(); // the helper schedules the next frame

// If navigating away before that frame, cancel this pending restoration.
restore.cancel();
// Permanent app/component host teardown:
stopWatching();
focus.dispose();
```

Create one manager per document/app, outside individual overlay render calls. Concurrent `watchTriggers` registrations share two listeners and release independently. `restore` is single-use; its `.cancel()` cancels the pending frame. Disposal removes listeners, clears pending work and makes future captures inert. Omitting `document` uses the browser global when present; `document: null` is an explicit SSR/no-DOM mode.

`now` and `triggerWindowMs` are injectable; default capture freshness is 1,500 ms, inherited from the donor. Expired, invalid or future-dated trigger captures fall back to current focus. Modifier keys and held-key repeats do not replace the trigger. Pointer events on unrelated elements invalidate the previous trigger. No global CSS is installed.

The pack also rejects detached/cross-document targets; native disabled controls (including disabled fieldsets); inert, hidden, aria-hidden or aria-disabled ancestors; and CSS-hidden ancestry. It restores saved scroll only if focus actually reaches the target.

## Donor fixes made during extraction

Donor source: `mobile/src/components/overlayReturnFocus.ts` at commit `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df`.

Actual DOM regression tests reproduced **8 failures and 1 pass** before the fix:

- Focus deliberately moved to a native link or a focusable heading was stolen because the old code only recognised a limited control selector.
- Destination focus set before the close callback was also stolen.
- Inert, hidden, aria-hidden and aria-disabled ancestors were ignored.
- A button disabled by its fieldset was still sent a focus request.

A small donor patch preserves these destinations and prevents restoration to unavailable controls. Existing component-test selectors were made accurate (the old mock returned itself for every selector). No overlay callers were changed. Earlier OTA/lease edits and unrelated marketing work were preserved.

The new pack additionally supplies per-document ownership and explicit cancellation/disposal; converting existing donor callers to this manager is a later reviewed integration, not claimed complete here.

## Verification

- Blueprint: `node --test tests/interactions-capability.test.mjs` — **13 tests passed**, including strict TypeScript with DOM libraries and no runtime/React imports.
- Golf App `mobile/`: `node node_modules/vitest/vitest.mjs run --config vitest.config.mts src/components/overlayReturnFocus.web.test.ts` — **9 actual DOM tests passed** using the project's existing jsdom setup.
- Golf App: focused Jest run of `overlayReturnFocus.component.test.tsx`, `FilterSheet.component.test.tsx`, `ContextActionSheet.component.test.tsx`, and `ContextActionSheetMorph.component.test.tsx` — **15 tests passed** across four suites.
- Golf App: ESLint on the three changed focus files — passed.
- Golf App: full `tsc --noEmit` — passed.
- Golf App: `git diff --check` for changed focus files — passed.

The Jest Expo preset cannot use the jsdom environment directly without colliding with its `window` setup; direct jsdom 29 import also conflicts with Jest's ESM bridge. The separate `.web.test.ts` file uses the existing Vitest jsdom support without dependencies or config changes. The Blueprint unit suite uses an explicitly labelled lightweight DOM model; jsdom does not establish browser layout, screen-reader or focus-trap correctness. The root reference app browser checks supply separate integration evidence.

## Host contract and limitations

- Overlays must use semantic dialog/menu/listbox roles. Visible modal layers must be mounted in stack order; arbitrary CSS z-index reorderings are not inferred.
- The helper restores focus and scroll; it does not implement focus trapping, keyboard navigation, Escape handling, modal inertness or an overlay visual component.
- It is for a single document. Iframes, Shadow DOM traversal and cross-window focus need host-specific integration.
- Native apps retain their platform focus/navigation adapters. No native SDK calls or Expo-version changes were introduced.
- The donor remains on Expo 58, Blueprint on Expo 57; this DOM-only module has no Expo dependency but that does not certify broader cross-version compatibility.
- No deployment, remote write or publication occurred.

## Fingerprints

SHA-256 of donor source bytes:

- Original: `31b97ec27788ebf8d650e97a31dd2f59c9de3495cfe95a401d95ef1882c60eee`
- Local corrected source: `2a33c8911273ba7b18cf5c98c07ac00a0386417c431934fbae200698c29b5c91`

Tests added: `mobile/src/components/overlayReturnFocus.web.test.ts`. Pack and tests are local source artifacts, not a published package or claimed production adoption.
