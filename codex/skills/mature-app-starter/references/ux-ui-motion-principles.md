# UX, UI, And Motion Principles

Use this to raise the baseline quality of early app interfaces.

## Product UX

- Build the real primary workflow first.
- Design for repeated use, not just first impression.
- Make navigation predictable and reversible.
- Include empty, loading, error, success, permission-denied, and offline/degraded states early.
- Keep copy clear, concrete, and close to the action.
- Use progressive disclosure when complexity is necessary.
- Make destructive actions explicit and recoverable where practical.

## UI Quality

- Establish hierarchy before decoration.
- Use consistent spacing, typography, icons, controls, and interaction patterns.
- Prefer familiar controls: toggles for booleans, segmented controls for modes, sliders/steppers for numeric inputs, menus for option sets, tabs for peer views.
- Keep cards for repeated items, modals, or genuinely framed tools; avoid card-inside-card layouts.
- Ensure text fits on small screens and does not collide with controls.
- Use color to communicate state, not only brand.
- Check contrast, touch targets, keyboard flow, and screen-reader labels.

## Character without clutter

Use a compact, mobile-first hierarchy with one primary job, generous enough touch targets and consistent secondary actions. Compact means less competing chrome and repeated explanation, not smaller text or cramped controls. A useful list with dividers often works better than a stack of differently coloured cards.

Keep functional typography for navigation, settings, fields and metrics. Reserve expressive fonts, illustration, mascots and celebrations for deliberate brand moments. Brand choices stay app-owned; do not force every product into the same palette, font, card shape or tone.

Prefer descriptive verbs and familiar affordances. Remove redundant “open”, provenance and status labels users can infer, while keeping decision-changing limits beside the action. Secondary technical/source details can live in Help or an appropriate disclosure. Do not remove an essential warning merely to make the screen quieter.

Use progressive disclosure for advanced choices; avoid prefilled values that look like user-confirmed facts. Keep first use useful, returning use efficient, and signed-out/empty/unavailable states distinct. Choose contextual help over a mandatory tour unless a prerequisite requires one.

Delight can include a small press response, a meaningful reveal, a gentle switch/check transition, avatar movement or a completion moment. It remains optional, short, interruptible and reduced-motion-aware. Avoid repeated prompts, surprise audio or celebration over important work. Gesture shortcuts need a visible keyboard/screen-reader alternative.

Review the actual rendering against the agreed direction, including secondary screens and shared components. Keep a coverage count for a full-screen refresh so “all screens” cannot silently become a sample. Performance work should preserve the approved visual quality and functionality; measure the result before claiming an improvement.

## Animation And Motion

Animation should serve the task.

Good uses:

- Clarify what changed.
- Preserve spatial continuity between states.
- Confirm user action.
- Reveal progress or loading honestly.
- Draw attention to a necessary next step.

Avoid:

- Motion that hides latency without explaining state.
- Decorative motion that competes with the task.
- Long transitions in repeated workflows.
- Animations that block input unnecessarily.
- Motion that makes layout feel unstable.

Defaults:

- Keep most transitions short.
- Respect reduced-motion preferences.
- Animate transform and opacity before layout properties.
- Test on lower-powered devices before treating motion as finished.

## Motion is a kickoff decision

Record where arrival, content change, action acknowledgement and dismissal need feedback. Omit motion deliberately when it adds no clarity; do not leave the decision implicit. Start with short opacity/transform changes, keep tokens app-owned, and preserve immediate data and interaction state. Motion is not a splash timer or proof that work completed.

The copyable `Presence` recipe retains only an exiting visual. Pass the live OS reduced-motion result OR the app's reduced-motion preference; unknown OS state defaults to reduced. Keep the exiting content supplied until removal, hide it from assistive technology and input immediately, and never delay saving/navigation for an animation. It is not a focus trap or modal implementation; the owning control handles focus return.

Verify show → hide → show before completion, unmount during motion, reduced motion enabled during exit, and a late preference read after a newer change. An old completion cannot remove newly visible content. The runnable shell demonstrates reduced-motion-aware screen feedback and persisted motion preference; component tests cover presence interruptions.

## Design Review Checklist

- Can a new user identify the primary action within a few seconds?
- Can a returning user complete the main workflow efficiently?
- Are all core states represented?
- Does the interface still work with long text, empty data, and errors?
- Are accessibility basics handled?
- Does animation clarify the workflow rather than decorate it?

## Plan the interaction scope

Use [product scope and polish](product-scope-and-polish.md) to decide what belongs in the first complete workflow. For animation work, read the [animation playbook](animation-playbook.md): interaction catalogue, suggested timing tokens, immediate state changes, reduced-motion alternatives, interruption and verification. Complete the motion-plan worksheet or the same fields in the feature spec. An intentional static treatment is valid; the catalogue is not a required feature list.
