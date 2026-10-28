# Product behaviour map for the next app

Use this map at kickoff to carry mature product thinking into a small new product. The toolkit provides a quality foundation, optional source recipes and guidance. It does not implement every capability described here. The new product brief decides what exists; the applicable behaviour contract decides how well it works.

## Working principles

- Build one complete useful loop, including failed action and return use, before adding destinations.
- Keep repeated work efficient: preserve useful context, use familiar controls and avoid repeated explanation.
- Show truthful state: unknown is not zero, a pending write is not saved, and an opened share sheet is not delivery.
- Prefer recoverable actions: preserve input, provide useful retry, and scope undo to the actual change.
- Use a consistent visual language with restrained personality. The next app owns its brand.
- Make optional features truly optional: denied permissions or unavailable enhancements should not disable unrelated work.
- Treat interruption, identity changes, large text, reduced motion and slow data as normal conditions.
- Verify the real promise on the intended platform. Copied source and checklists are not integration evidence.

## Choose the layer

| Layer | Contents | Adoption rule |
| --- | --- | --- |
| Default foundation | Shared controls, relevant states, navigation, accessible interaction, config/service boundaries, recovery and verification | Include what the first workflow needs; record N/A where genuinely inapplicable |
| Optional capability | Search, drafts, favourites, importing, sharing, accounts, notifications or groups | Select from a real product need; define ownership, failure and lifecycle before implementation |
| Product-specific logic | Calculations, domain lifecycle, recommendation rules, roles, provider schemas, branding and legal decisions | Keep in the adopting app; a generic recipe cannot decide these |
| Delivery and maintenance | Release evidence, performance, privacy checks, support and regression fixtures | Match product stage and distribution; no publication or provider activation implied |

## Where each decision lives

| Area | Read when needed | Main output |
| --- | --- | --- |
| Scope and first useful loop | [Product scope and polish](product-scope-and-polish.md), [MVP boundaries](mvp-boundary-and-screen-map.md) | Included/excluded surfaces, first loop and failure path |
| Navigation and overlays | [App shell and navigation](app-shell-and-navigation.md) | Destination hierarchy, Back, context, focus and keyboard rules |
| Forms, drafts, undo and states | [UI states and forms](ui-states-and-forms.md) | State transitions, persistence, validation and recovery contract |
| Visual system and metrics | [Design primitives](design-system-primitives.md), [UX principles](ux-ui-motion-principles.md) | Component choices, hierarchy and state gallery |
| Animation and feedback | [Animation playbook](animation-playbook.md) | Purpose, tokens, interruption and reduced alternatives |
| Search and personalization | [Discovery and personalization](discovery-and-personalization.md) | Query, filter, favourites, shortcuts and default semantics |
| Import and sharing | [Import, export and sharing](import-export-and-sharing.md) | Review/confirm, ownership, coverage and privacy rules |
| Accounts and collaboration | [Identity and collaboration](identity-and-collaboration.md) | Identity, roles, guest migration and conflict boundaries |
| Prompts, notifications and support | [Engagement and support](engagement-and-support.md) | Eligibility, cooldowns, permissions, submission and recovery |
| Trust and persistence | [Content trust](content-trust.md), [Data resilience](data-resilience-and-capabilities.md) | Authority, unknowns, history, privacy and verified saves |
| Measurement and operations | [Analytics](product-analytics-setup.md), [Runtime performance](runtime-performance.md), [Build/release](build-and-release-workflow.md) | Questions, budgets, artifact identity and acceptance evidence |
| Review coverage | [Verification and review](verification-and-review.md) | Surface/state/platform coverage, observed gaps and next check |

## First kickoff pass

1. Name user, job, first successful outcome and the reason they would return.
2. Map entry → input/setup → action → result → repeat, plus cancellation and failure.
3. Select optional capabilities only where that loop requires them. Mark Included, Deferred or N/A, with an owner/trigger for deferrals.
4. Agree visual character, density, navigation and meaningful motion or deliberate static choices.
5. Complete the relevant fields of the product-behaviour worksheet or existing feature spec. Use the screen and motion worksheets only where they reduce ambiguity.
6. Implement a vertical slice with one shared control vocabulary and explicit data/service boundaries.
7. Verify the loop, failure recovery and relevant platform behaviour; record pending evidence honestly.

Load this map, then only the selected topic guides. Do not load the whole library into every task. A ten-screen product does not need ten competing specifications: baseline records hold decisions, feature specs hold behaviour, and the quality contract holds evidence.

## What is source versus guidance

The [portable infrastructure guide](portable-infrastructure.md) lists implemented recipes and integration limits. The [feature catalogue](feature-recipes.md) distinguishes optional code from app-owned implementation. The topic guides extend those contracts; they are not additional functioning screens, backend services or a feature-complete starter. Native/browser/backend verification remains the adopting app's responsibility.

Use the product-behaviour template as a copyable worksheet. It is also installed as references/product-behavior-spec.md with the skill, including --no-docs. Existing customized installs require a reviewed update; reinstalling while files are skipped does not adopt new guidance.
