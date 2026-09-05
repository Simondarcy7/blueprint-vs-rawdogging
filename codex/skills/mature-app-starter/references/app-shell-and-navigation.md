# App shell and navigation

Give every screen a predictable home: title, navigation, content region, and primary action. Keep domain-specific layouts inside features. Decide these conventions once per app and test them on the smallest supported viewport.

## Shell defaults

- Use a consistent content width, spacing scale, safe-area handling and page title placement. Let dense tables or creative canvases opt into wider layouts.
- On web, use meaningful header/nav/main landmarks and a working skip link. Distinguish labels for multiple navigation regions. On native, use platform navigation semantics.
- Choose navigation by task: tabs for peer destinations, a stack for drill-down, and a sidebar when destination count and available width justify it. Keep labels and destination meaning consistent across breakpoints.
- Prefer one obvious primary action per task surface. Place secondary actions consistently and keep help/recovery discoverable.

## Sticky headers and action bars

Use a sticky header when long scrolling would otherwise hide useful context, search, or frequently used controls. Short screens may benefit from a normal header instead.

- Prefer CSS sticky positioning on web when it fits the layout. Identify the owning scroll container; ancestor overflow can change sticky behavior.
- Define stacking layers centrally. Give pinned surfaces an opaque background and restrained separation so content does not bleed through.
- Account for header height when jumping to anchors or focusing invalid fields (`scroll-padding` / `scroll-margin` where appropriate). Do not leave focused content behind a header or footer.
- Test enlarged text, zoom, landscape, safe-area insets and the on-screen keyboard. Unpin or simplify chrome when it consumes too much usable space.
- For fixed bottom actions, reserve content space and test the final field/item can scroll fully into view. Do not put the only recovery action behind the keyboard.

## Navigation behavior

- Direct links, reload and browser Back/Forward must reach the expected screen. Unknown routes need a useful not-found path.
- Keep shareable search/filter/sort state in the URL on web where appropriate; keep sensitive or bulky drafts out of URLs. Native apps need an explicit equivalent state owner.
- Restore list position and filters when returning from detail. Define when a new query or tab selection intentionally resets position.
- Preserve unfinished input during routine navigation where practical. Ask about leaving only when unsaved work would actually be lost; a browser unload dialog is a limited fallback.
- Set selected navigation state, update titles, and manage route focus. Keep inactive mounted screens out of keyboard and screen-reader navigation.
- Authenticate private deep links and retain a safe internal return destination. Do not allow arbitrary external redirect URLs.

## Acceptance walkthrough

Open a deep link → navigate to a long filtered list → open an item → go Back → submit an invalid form → focus the error → open and dismiss a dialog. Repeat on a narrow screen with keyboard/text enlargement. Confirm position, filters, focus, safe areas and primary actions remain usable.

References: [WAI landmarks](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/) and [adapting sticky headers/footers](https://www.w3.org/WAI/WCAG21/Techniques/css/C34). Sticky positioning is a layout choice, not a universal requirement.
