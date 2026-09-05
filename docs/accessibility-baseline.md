# Accessibility baseline

Build accessibility into shared primitives and real workflows. Automated checks catch recurring omissions; they do not establish conformance by themselves. Use WCAG 2.2 AA as the web design target and test native behavior with the platform's accessibility tools.

## Component defaults

- Prefer semantic buttons, links, headings, labels, and landmarks. Custom controls need a name, role, state, and the expected keyboard interaction.
- Give inputs persistent labels and associate validation/help text with them. Announce useful status changes without repeatedly interrupting the user.
- Describe meaningful images; mark decorative images appropriately (`alt=""` on web, the native equivalent on mobile). Do not repeat nearby text unnecessarily.
- Provide visible focus, readable contrast, scalable text, and clear selected/disabled/error states that do not depend on color alone.
- Aim for comfortable 44–48 logical-unit touch targets as a product convention. The web WCAG AA minimum has a different 24 CSS-pixel size/spacing rule with exceptions; do not conflate these.
- Respect reduced-motion preferences. Preserve feedback and understanding when animation is reduced.

## Navigation and recovery

- After client-side navigation, manage focus intentionally and update the page title. Confirm browser Back and nested navigation still behave correctly.
- Inactive mounted screens must not leave invisible controls in the tab order or screen-reader tree. Test actual hidden-screen behavior; `aria-hidden` alone does not remove keyboard focusability.
- Dialogs need an accessible name, appropriate focus containment and return, and a usable dismissal path.
- Include empty, loading, error, permission-denied, offline and success states. Preserve user input where possible and make retry, undo, or manual alternatives clear.

## Evidence required for the first workflow

1. Complete it with a keyboard: logical order, visible focus, no trap, no hidden-screen controls.
2. Complete it with a representative screen reader: meaningful names/states, usable navigation, announced results/errors.
3. Check narrow layouts, enlarged text/zoom, contrast, reduced motion, and touch ergonomics.
4. Run applicable automated accessibility checks against rendered critical states. Add small static rules for repeated codebase mistakes, but document what they cannot detect.

Record the tested browser/device, assistive technology, workflow, result and unresolved issues in the app quality contract. A screenshot proves layout only, not interaction accessibility.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), and [WAI evaluation tools and manual evaluation](https://www.w3.org/WAI/test-evaluate/).
