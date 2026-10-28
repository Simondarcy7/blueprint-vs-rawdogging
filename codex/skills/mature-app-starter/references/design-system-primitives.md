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

## Keep the shared system from splitting

Give each shared control one documented import path and behavior contract. Check new modules for parallel button/input/selection kits before promoting their designs. A platform adapter may implement the same contract differently; a second undocumented component vocabulary increases drift. Avoid ambiguous file/folder entrypoints that resolve to different implementations across tools.

Keep a small gallery or fixture set for the primitives actually used by the first workflow: normal, disabled, pending, error, selected, long-content and enlarged-text states where applicable. Reuse those fixtures for visual review and focused behavior checks. Review changes to the shared control first, then its consumers. Keep one-off product layouts local. A gallery is a development aid; it need not become a public route or require another service.

## Shared motion contracts

Centralize purpose-based duration, distance and easing tokens with the theme. Shared controls own press, selected, pending and presence behavior; feature modules supply meaningful triggers. Keep preference resolution centralized and combined with the app choice. Avoid multiple effects owning the same route or property. Use the [animation playbook](animation-playbook.md) for suggested values and interruption/reduced-motion checks; adopt them through existing primitives rather than a parallel animation kit.

## Choose components by the user's decision

| Need | Prefer | Avoid |
| --- | --- | --- |
| Scan similar records | Consistent rows, sections or a repeated card when each item needs framing | Every label in its own nested card |
| Choose one of a few peer modes | Segmented control or tabs with clear selected state | Unlabelled icons or a switch representing several modes |
| Enable a boolean preference | Labelled switch with immediate/pending semantics | Ambiguous action wording that changes meaning after selection |
| Reveal secondary information | Inline disclosure | A new navigation level for a short explanation |
| Choose among many options | Searchable list/picker appropriate to the data | A very long horizontal chip rail as the only path |
| Make a consequential decision | Clear action and affected scope | Colour or iconography as the only warning |

Keep hierarchy consistent: screen title → task/section → content → supporting explanation. Reduce redundant chrome before shrinking text or targets. One dominant action per task surface is a useful starting point; secondary actions should remain visible and recognizable. Use whitespace and separators before adding another background or border.

## Typography, icons and personality

Use named text roles and an explicit vocabulary. Functional labels should use familiar words; metrics need units and context. Expressive type, illustration and mascots belong to selected brand moments, not every field and navigation item. The product owns palette, fonts, icon style and tone.

Use one icon family or a deliberate mapped system. Specify icon size, alignment, stroke/weight and selected/disabled treatment. Icon-only actions need an accessible name and an understandable visible affordance; ambiguous or consequential actions usually benefit from text. Tooltips are enhancements, not the only mobile explanation. Decorative images/icons should not repeat spoken labels.

## Charts and trustworthy summaries

Define each metric, unit, date window, denominator and exclusions before styling it. Distinguish no observations, missing observations and a real zero. Show relevant sample size or incomplete coverage when it changes the conclusion. Compare compatible periods/entities; do not imply improvement from incomparable samples.

Keep numerical meaning immediate while any visual feedback animates. Handle negative, zero, equal and extreme values. Avoid misleading axes or truncation that exaggerates differences without explanation. Give charts a readable summary or equivalent data access, avoid colour-only series identification, and check themes, enlarged text and long labels. A sparkline alone should not carry a critical conclusion.

## Small state gallery and coverage

Build fixtures for the shared controls actually used: default, pressed, focused, selected, disabled, pending, error, long label and enlarged text as applicable. Add representative screen fixtures for empty, populated, partial, offline and failed states. Include both supported appearances and meaningful motion/reduced-motion conditions.

Keep fixtures deterministic and independent of production accounts. Use them to review token/control changes before checking affected consumers. Record what was checked rather than calling a handful of screenshots a full-app review. The gallery is a development aid, not a new public destination or a requirement to add another hosted service.

Use the product-behaviour worksheet to record visual direction and coverage; use [verification and review](verification-and-review.md) for evidence and [animation](animation-playbook.md) for temporal behaviour.
