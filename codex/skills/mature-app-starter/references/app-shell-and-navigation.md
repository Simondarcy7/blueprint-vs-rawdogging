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

## Destination and context contract

Give each primary destination a distinct user job. Tabs are peer destinations; detail/edit screens belong beneath their owning job. Avoid adding a tab for every optional feature. Keep the meaning of navigation stable across narrow and wide layouts even when its visual container changes.

For each route specify entry paths, access requirement, Back target, direct-link fallback and state worth retaining. If sign-in interrupts a private link, validate an internal return destination and recheck access after sign-in. A removed or unauthorized target needs an explanation and a useful way back, not an endless loader.

Choose context keys deliberately: list identity, query, filters, sort, owner and dataset revision may affect whether a saved position is still meaningful. Preserve state on detail → Back; reset it when the user intentionally starts a different query or dataset. If the remembered item has disappeared, recover to a valid nearby position. Clear private context on the relevant account boundary.

## Choose the right secondary surface

| Surface | Good use | Contract |
| --- | --- | --- |
| Inline disclosure | Optional detail that belongs in the current reading flow | Label and expanded state; no trapped focus |
| Menu/action sheet | A short set of contextual actions | Clear target; disabled reasons; dismiss without mutation |
| Dialog | A bounded decision requiring attention | Accessible name, focus containment, dismissal policy and return focus |
| Sheet | A contained task such as choosing filters | Scrolling, keyboard and draft/apply semantics; avoid an endless nested flow |
| Full screen | Long editing, complex review or meaningful deep-link destination | Back, draft preservation and independent loading/error states |

Treat an overlay as a lifecycle: capture invocation → open → interact → commit/cancel → dismiss → restore context. Return focus to a valid invoking control only if navigation or a newer overlay has not intentionally moved it elsewhere. Preserve scroll where focus restoration would otherwise jump the page. If the trigger disappears, choose a meaningful fallback. An exiting animation cannot keep hidden content interactive.

## Keyboard, safe areas and responsive structure

Identify one main scroll owner. Keep the focused field, its error and the relevant action reachable above the keyboard; avoid double-counting keyboard and safe-area padding. Test keyboard dismissal, landscape and small-height windows, not only narrow width. Decide whether sticky actions remain useful or should become normal flow when vertical space is limited.

At wider sizes, change layout according to content needs: one column for a focused form, extra columns for independent comparable items, wider space for a genuinely dense table. Preserve semantic and keyboard reading order. Do not hard-code column count solely from device names. Verify long titles, wrapped actions, right-sized content widths and the last item below a fixed footer.

## Navigation regression scenarios

- Direct link without prior history; unknown/deleted destination; signed-out return flow.
- Filtered long list → detail → Back with the same useful position and query.
- Open sheet from a sticky control → dismiss with keyboard → correct focus and scroll.
- Close one overlay while another opens; removed/disabled invoking control.
- Unsaved edit → Back, saved draft → Back, and app restart where resume is promised.
- Narrow/wide layout, enlarged text, browser Back/Forward and native Back on supported platforms.

These are behavioural recipes; the existing navigation helpers still need integration with the host router and accessible overlay implementation.
