# Product scope and polish

Use this to transfer mature-app quality into a new product without inheriting another app's feature count. Scope includes behavior and feedback, not just a screen list. The product brief remains the authority for capabilities, platforms and audience.

## Plan a complete useful loop

Describe entry → setup/input → action → result → repeat/return. For each step name the user decision, necessary data, state to preserve and outcome. Include the failure/retry path in the same slice. A polished empty screen is not a completed loop; a successful demo with no failed-save behavior is not complete either.

Separate these decisions:

| Scope layer | Usually include for the first workflow | Conditional or later |
| --- | --- | --- |
| Product value | One real action and understandable result | Extra modes, social features, rankings, automation |
| Shell and orientation | Clear current location, Back, appropriate safe areas, useful context on return | More navigation destinations without content |
| Interaction quality | Shared controls, immediate press/selected/pending feedback, valid input, readable states | Bespoke gestures or a second control library |
| Continuity | Relevant draft/filter/scroll preservation and explicit save behavior | Full offline sync or cross-device continuity unless promised |
| Motion and character | Deliberate state-change and dismissal behavior, reduced motion | Elaborate entrances, mascots, celebrations, marketing choreography |
| Trust | Clear limits, unknown versus zero, honest success, recovery | Provider integrations not needed for the loop |
| Readiness | Applicable accessibility, failure and platform checks | Exhaustive audit of features that are not in scope |

Mark Included, Deferred or N/A with a reason. Deferred work needs a trigger and owner; N/A is not an unfinished task. Keep baseline accessibility, truthfulness and data integrity in the accepted workflow rather than placing them in a cosmetic-polish bucket.

## A practical first-loop example

For a generic saved-item app: open an empty list → create an item → validate → save → see it in the list → reopen/edit. Include a useful empty action, pending button, failed-save input preservation, consistent Back behavior and a short optional saved-state acknowledgement. Add filtering only when finding existing items is part of the brief. Accounts, cloud sync, groups and achievements remain separate decisions.

The motion plan might include static press feedback, a small changed-state fade and instant reduced-motion behavior. It can explicitly exclude list cascades and completion confetti. This is a complete small scope, not a requirement to make every app a saved-item app.

## Design scope before implementation

Record the desired hierarchy, density, tone and role of expressive elements. Keep functional text legible and consistent; reserve expressive type and illustration for chosen moments. Define a small set of shared control variants. Specify first-use, returning-user, empty, pending, error, partial and unavailable behavior where relevant. Respect existing features when a request is visual polish: do not remove filters, actions or data merely to match a simpler mockup.

Separate product-app scope from public marketing scope. A marketing hero can support richer storytelling when requested; it is not a reason to animate repeated in-app data entry. Set motion intensity per surface, with the same accessibility and truthful-state principles.

For a redesign, inventory the affected routes, shared components and supported themes/platforms before promising “all screens”. Review one representative complete workflow, apply accepted shared changes, then track every included surface. Preserve exceptions deliberately rather than forcing every layout into a card.

## Deliver in bounded slices

1. Functional slice: real loop, shared controls, state ownership, failure recovery and basic interaction feedback.
2. Consistency slice: typography, spacing, long text, keyboard, empty/pending/error states, return context and chosen motion treatments.
3. Character slice: selected brand moments only after readability and repeated-use efficiency are sound.
4. Acceptance slice: check the affected shared primitives and screens with realistic content; record outstanding platform or integration gaps.

These are planning slices, not mandatory separate projects or agents. Do not delay essential accessibility until the last slice. Match each change to an acceptance case, and stop expanding when the agreed scope is met.

## Scope-change rule

For a new capability, state the user problem, smallest useful behavior, data/permission implications, affected surfaces and acceptance case. Add it only if it belongs to the current brief; otherwise record a proposed follow-up. A reusable catalogue, competitor screenshot or animation example does not authorize a feature.

For an existing capability, refinements such as interruption-safe transitions or preserving failed input normally belong to its quality scope. Distinguish those from adding new service dependencies, account systems or large redesigns. Keep reasonable implementation choices moving while seeking direction for material scope changes.

Use the [motion playbook](animation-playbook.md), the screen-behavior worksheet, and the [MVP screen map](mvp-boundary-and-screen-map.md). The motion-plan template is a lightweight optional worksheet; its decisions may live directly in the existing feature spec instead.
