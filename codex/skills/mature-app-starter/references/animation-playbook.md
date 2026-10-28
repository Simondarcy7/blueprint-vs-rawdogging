# Animation and interaction playbook

Use this when scoping or polishing an interactive app. Motion is part of a control's behavior, not a separate decoration pass. This guide supplies design decisions and acceptance criteria; it does not install an animation engine or implement every pattern below.

## Choose the motion scope

First make the workflow usable with motion disabled. Then choose the smallest treatment that explains each important change. Classify each candidate as Included, Deferred or N/A, with a reason. A deliberate instant transition is valid. Use the product scope guide and the motion plan worksheet; do not turn this catalogue into a mandatory animation backlog.

- Foundation: pressed/selected/pending feedback, readable state changes, predictable navigation, intentional dismissal, reduced-motion behavior and cancellation.
- Product-specific polish: one or two meaningful treatments such as a changed metric settling, a saved item appearing or a completed workflow being acknowledged.
- Optional character: illustration, mascot movement, achievement or celebration only when the product brief supports it. Frequency and suppression are part of scope.
- Usually defer: elaborate shared-element transitions, parallax, scroll choreography, looping backgrounds, large staged list entrances and a new animation dependency without a demonstrated need.

## Interaction catalogue

| Surface / trigger | Purpose and suggested treatment | State, interruption and reduced-motion contract |
| --- | --- | --- |
| Button press | Immediate pressed colour/opacity; optional small scale | Activation follows the control's semantics, never waits for release animation; disabled/pending cannot submit again; reduced mode uses a static pressed state |
| Toggle, tab, segment, chip | Clarify the selected item with a small indicator or check change | Selected semantics and value update immediately; rapid reversal settles to the latest selection; static selected state remains clear |
| Number or status change | Brief settle/fade on a meaningful committed change | Render the real value immediately; do not count through invented intermediate results; do not replay on every render, restoration or unrelated fetch |
| Navigation | Preserve hierarchy and Back direction using the router's supported transition | One owner for the route transition; no extra page entrance layered over it; reduced mode is instant or a restrained fade; verify deep links and interactive Back |
| Sheet or dialog | Connect invocation and dismissal with a short reveal/exit | Focus, accessibility and dismissal belong to the dialog; an exiting visual is no longer interactive; closing then reopening cancels stale removal |
| Accordion or disclosure | Explain newly available detail | Expanded semantics update immediately; content remains readable at large text sizes; preserve keyboard focus and use instant expansion in reduced mode |
| Initial loading | Reserve approximate final geometry; optionally delay decorative skeleton display | Busy semantics begin immediately; fast results appear immediately; cancel placeholder timer on completion/unmount; static placeholder and clear loading text in reduced mode |
| Refresh | Keep useful existing content while indicating revalidation | Preserve scroll and selection; distinguish stale content from confirmed fresh content; never replay the full page entrance |
| Insert/remove/reorder | Help locate a changed item, when it matters | Stable item keys; only affected items move; preserve reading/focus position; provide non-drag controls if reordering exists; no automatic reorder beneath an active edit |
| Inline error or notice | Make a result discoverable with persistent text and optional quiet reveal | Do not rely on shaking, colour or motion alone; announce at the appropriate priority; keep retry/undo available for the intended lifetime |
| Completion | Acknowledge verified completion with a brief check or optional celebration | Trigger once for the actual event, not mounting a summary; do not block next work or imply remote success before commit; reduced mode retains the completion message |
| Gesture or swipe | Show the relationship between direct manipulation and its result | Visible alternative action, cancellation and threshold behavior; confirm destructive outcomes where needed; do not invent gestures merely to add motion |

## Starting tokens, not fixed requirements

These values are suggested starting points adapted from a frequently used mobile interface. They are not platform standards, performance guarantees or required brand settings. Tune through the first real workflow and name tokens by purpose in the app's existing theme.

| Token role | Suggested starting value | Use |
| --- | --- | --- |
| Press in / release | 80 / 140 ms | Local control feedback |
| State acknowledgement / disclosure | 180 ms | Small changed-state treatment |
| Dismiss | 120 ms | Quiet inline removal |
| Sheet open / close | 220 / 160 ms | Only when the chosen sheet API supports custom timing |
| Content fade | 150 ms | Small content replacement, without delaying readiness |
| Local travel | 2–4 logical units | Subtle settle, not full-screen movement |
| Decorative skeleton delay | 120 ms | Reduce quick-load flicker while space and busy state exist immediately |

A curve such as cubic-bezier(0.22, 1, 0.36, 1) is an optional starting point for a short settle. Use the chosen engine's equivalent; native router behavior may differ. Do not force every platform to reproduce identical frames. No artificial minimum loading duration, long cascade before controls become available, or completion timer standing in for real work. Keep existing well-tested tokens unless changing them serves an observed need.

## One owner for each effect

Keep app-owned duration/distance/easing tokens in the theme, preference resolution in one hook/service, and generic presence/state feedback in shared components. Feature modules decide semantic triggers such as successful save or changed selection. Do not scatter route matching, timers, preference reads or platform checks across screens.

Prefer the existing router and animation system for supported effects. React Native distinguishes value-based `Animated` effects from layout transactions; the native driver has property limitations. Check the installed version before selecting an API. Transform/opacity are useful starting points; a height/layout effect needs deliberate layout and performance verification. See [React Native animations](https://reactnative.dev/docs/animations).

Cancel old work before starting a new transition. Unmount, replacement, app backgrounding and preference changes must leave a valid final state. Completion callbacks must be guarded against stale transitions. Avoid per-frame React state updates and screen-wide rerenders for local feedback. Limit work to visible items, stop offscreen loops and check real release behavior before claiming smoothness.

## Reduced motion and other feedback

Resolve effective reduction from OS preference OR the app's reduce-motion setting. An app toggle must not override an OS request to reduce motion. Until OS preference is known, use the conservative static state. Observe changes while the screen is mounted; stop an active effect and settle to the current valid state. Do not replay missed animations when motion is enabled again.

Remove spatial travel, parallax, overshoot and decorative loops in reduced mode. Keep the actual state, labels, focus and completion information. A static alternative is always acceptable; assess any remaining opacity transition in context. Keep screen-reader announcements tied to semantic changes, not animation frames. Exiting content must not retain keyboard or touch access merely because it is still painted.

W3C's interaction-animation guidance explains disabling nonessential interaction-triggered motion; SC 2.3.3 is Level AAA, not an AA claim. Automatically running animation has separate pause/stop considerations. See [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). These recipes alone do not establish accessibility conformance.

Haptics and sound are separate optional channels. Keep them behind a device service, respect supported preferences and platform capability, and treat failure as non-blocking. Rate-limit repeated feedback; trigger success only after the intended operation succeeds. Always retain a visual/text alternative. Reduced motion does not itself define the user's haptic or sound preference. Avoid unsolicited sound and repetitive celebratory vibration.

## Scope acceptance and evidence

For each included effect record trigger, owner, states, tokens, cancellation rule, reduced alternative, platforms and evidence. Check:

1. Repeated tap, rapid reversal and a newer value arriving before completion settle correctly.
2. Navigation away, unmount and background/foreground do not leave hidden, blocked or stale controls.
3. Reduced motion before mount, during an effect and after preference hydration gives the right state.
4. Keyboard, focus return, screen-reader reading order and enlarged text remain usable with motion on and off.
5. Fast and slow results, failed operations and retry show truthful values without placeholder flashes or fake success.
6. Long lists and the target lower-powered device remain responsive; scrolling and input work during the effect.

Use focused behavior tests for cancellation and state changes. Review actual rendering for pacing, focus and readability; record platform, build/revision and covered surfaces. Browser evidence does not prove native transitions or haptics. A representative sample must be labelled as a sample. Screenshots alone cannot establish timing or interruption behavior.

## What the toolkit already supplies

`assets/app-baseline/src/components/ui/Presence.tsx` supports retaining a noninteractive exiting visual and guards interrupted removal. `ContentTransition.tsx` supplies a simple content fade; `src/hooks/useReducedMotion.ts` supplies the OS preference boundary, and settings preferences supply the app choice. Integrate the combined preference explicitly and preserve the owning component's focus/state responsibilities.

The catalogue, timing table, skeleton behavior, gesture guidance, haptic policy and celebration rules above are guidance. They are not additional shipped controls. Reuse existing host primitives before copying or building more. See [UX principles](ux-ui-motion-principles.md), [design primitives](design-system-primitives.md) and [scope planning](product-scope-and-polish.md).
