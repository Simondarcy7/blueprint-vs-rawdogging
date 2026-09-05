# Design System Primitives

Create small UI primitives early so product screens stay consistent.

## Recommended Primitives

- Text component with named variants.
- Button component with variants, disabled state, pressed state, icon support, and accessibility label.
- Panel/surface component with a small set of semantic variants.
- Status pill/badge for state labels.
- Screen shell with consistent safe area, header/app bar, content width, and navigation.
- Icon wrapper if the icon library needs normalization.

## Theme Tokens

Keep design values centralized:

- Palette.
- Semantic colors.
- Spacing scale.
- Radius scale.
- Typography variants.
- Opacity states.
- Elevation/shadow tokens.
- Status semantics.

## Accessibility Defaults

- Buttons expose role, label, and disabled state.
- Navigation exposes selected state.
- Touch targets should be large enough for mobile use.
- Text should scale and fit small screens.
- Color should not be the only indicator of state.

## UI State Defaults

Represent these states in components and screens:

- Default.
- Pressed.
- Disabled.
- Loading.
- Empty.
- Error.
- Success.
- Warning.
- Partial/degraded.

## Promotion Rule

Start UI inside a feature when it is feature-specific. Move to shared components only when reuse is
real or the component is part of the app shell/design system.

## Shared behavior contracts

- Screen shell: title, navigation region, safe areas, content width, scroll ownership and optional pinned controls.
- Loading shell: stable layout, appropriate busy semantics, reduced motion and no artificial minimum wait.
- Empty state: distinguish first use from no search matches; provide the corresponding next action.
- Status/error notice: severity, persistence, announcement behavior and retry/undo when supported.
- Form field: persistent label, hint/error association, required/optional and pending states.
- Dialog: accessible name, focus containment/return and intentional dismissal.

Keep these primitives token-driven and test critical states in a small workbench. Choose a framework-appropriate component library before rebuilding complex accessible controls. Document behavior once and keep feature screens focused on their task.

## Adoption prevents design drift

A tokens file and a component folder do not establish a design system until real screens use them. Build the first workflow with the shared text, button, field and shell contracts. During review, check representative screen imports and rendered states for bypasses, duplicate variants and undefined tokens. Keep genuine feature layouts local; avoid turning every unique element into a global primitive.

Name typography by purpose, such as screen title, section title, body, helper and metric. Use tabular numerals when changing values must align; do not make every label monospaced or uppercase. Pick a content locale and vocabulary, and make action labels describe the behavior actually implemented. Preserve control semantics when polishing visuals.

When following a design reference, inspect the actual reference when available and record its hierarchy, spacing, typography and state decisions. Identify unavailable evidence instead of inventing a fidelity claim. Compare the implemented first workflow at representative sizes before multiplying screens. Fix drift through shared tokens or variants where appropriate, with focused changes rather than accumulating screen-specific overrides.

## Appearance is a persisted behavior

Decide supported appearance modes at kickoff. If System / Light / Dark are offered, store the preference separately from the resolved palette. Only System follows later OS changes; an explicit selection must survive restart and remain authoritative. Normalize missing or invalid persisted preferences through one contract.

Apply semantic tokens to charts, overlays, fields, selected/disabled states and navigation as well as the main background. Coordinate supported native system bars and web browser chrome with the resolved appearance. Plan initial preference hydration so startup does not briefly show an unreadable or inconsistent surface; a failed preference read still needs a usable fallback.

Verify explicit modes after reload/relaunch, an OS change while in System mode, an OS change while an explicit mode is selected, and contrast/text scaling in each supported palette. Check the installed Expo SDK's native configuration and test on the relevant build; a web-only check does not establish native behavior. See [Expo color themes](https://docs.expo.dev/develop/user-interface/color-themes/).
