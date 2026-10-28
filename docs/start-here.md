# Start every project here

The toolkit supplies a working quality foundation, not a product feature backlog. Start with the first useful workflow. Make the decisions below explicit so accessibility, motion, recovery and release work are not remembered only at the end.

## Choose an entry path

- New Expo app: `node scripts/create-app.mjs --target ../my-app --name my-app`. This creates the runnable shell, installs project instructions and dependencies, and generates neutral brand assets. Use `--skip-install` to inspect before dependency installation.
- Existing app: run `bash install.sh --target /path/to/app --agent both --dry-run`, review collisions, then install. Preserve customized instructions and code; adopt recipes selectively.
- Planning only: read `BLUEPRINT.md`, complete the project index and the kickoff decisions below. Do not scaffold unused services.

The runnable shell lives in `starters/expo/`. Its notes module is a replaceable example, not a required product feature. The source recipes inside the installed skill support deliberate adoption into other apps.

## Kickoff decisions

Record decisions and evidence in `docs/app-baseline.md`; keep detailed verification in the quality contract. Use Included, Deferred or N/A with a reason. Deferred work has an owner and trigger. A checklist decision is not proof of implementation.

| Consider for every project | Decision to make | First acceptance check |
| --- | --- | --- |
| Value and scope | User, first useful action, non-goals; identity only if needed | Empty install reaches the real workflow |
| Architecture | Routes, module APIs, service boundaries, config owner | Structural/import checks and typecheck |
| Visual language | Brand tokens, text roles, controls, density, supported appearance | Real screen at narrow width and enlarged text |
| Product character | Functional versus expressive type, deliberate illustration and bounded delight | Personality does not compete with the primary action or hide essential limits |
| Motion and feedback | Purposeful arrival/change/exit feedback; reduced motion; cancellation | Rapid reversal and preference change cannot hide or block controls |
| Navigation and context | Back/deep links, focus, keyboard, safe areas; state worth preserving | Detail → Back preserves useful query/filter/position |
| States and actions | Initial load versus refresh, empty versus no results, errors, success | Failed action keeps input and offers a working retry |
| Data and trust | Authority, save promise, unknown values, stable IDs, retention | Failed write cannot claim success or replace good data |
| Capabilities | Actual permissions, network and platform dependencies | Denial or optional-provider failure leaves core work usable |
| Privacy and support | Minimum collection, secrets, safe diagnostics, support/version | Private sentinel text absent from diagnostics |
| Performance and assets | Representative workload, rights, dimensions, measured budgets | Built output passes budgets; interaction measured on target |
| Verification | Applicable logic, UI, browser, backend and native checks | First workflow has success and meaningful failure evidence |
| Delivery and maintenance | Environments, artifact identity, CI, updates, recovery | Verify the intended artifact; record platform gaps |

Read only the guide needed for the current decision: [quality foundation](quality-foundation.md), [motion](ux-ui-motion-principles.md), [optional features](feature-recipes.md). Installed skills also provide `references/index.md` for targeted lookup.

## Three delivery slices

1. First workflow: app-owned branding, shared controls, settings where applicable, navigation and durable work if promised. Include real empty/loading/failure states and one useful motion treatment.
2. Reliability: verify restart, failed save/retry, rapid actions, keyboard/focus, reduced motion and target widths. Add selected capability checks only when in scope.
3. Release: run applicable CI/build checks, verify deployed and installed artifacts, record gaps and recovery. A source example or browser pass is not signed-device acceptance.

Do not wait for a full audit before implementing the first slice. Revisit affected decisions as scope changes.

## Prevent toolkit bloat

An addition needs two plausible uses, a clear owner/boundary, no hidden product/vendor activation, and an acceptance check. Choose a small default behavior, an optional code recipe, conditional guidance, or exclusion. Prefer extending an existing guide/helper to adding another overlapping one. Promote shared packages only after real reuse proves the API.

Keep business calculations, branded assets/copy, provider catalogues, credentials, production identifiers, arbitrary budgets and historical artifacts app-owned. Never copy an entire mature app into a new project.

For the compact/mobile-first style and purposeful personality defaults, read [UX, UI and motion principles](ux-ui-motion-principles.md). These describe behavior and visual roles, not a compulsory brand.

For a comprehensive scope or polish pass, use [product scope and polish](product-scope-and-polish.md). For animation decisions, use [the animation playbook](animation-playbook.md) and the optional motion-plan worksheet. Keep the first loop complete, effects interruptible, and optional character separate from required product capabilities.
