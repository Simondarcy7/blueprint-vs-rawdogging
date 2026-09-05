# Quality foundation for the next app

Boilerplate the decisions, conventions, and checks that repeatedly save work. Keep the brand, user journey, business rules, and platform choice specific to the new product.

## Use at kickoff

1. Read BLUEPRINT.md and keep the required Expo/Router/modules architecture. Choose the surfaces: public website, private web app, native app, or a combination. State which pages should be discoverable in search.
2. Complete the installed `docs/project-index.md` and `docs/app-quality-contract.md`. The installer seeds both even with `--no-docs`; copying the toolkit alone does not complete them.
3. Record the first workflow, core shell checks, chosen budgets, and verification commands. Add capability checks only for selected product scope. Mark irrelevant checks N/A with a reason; leave unimplemented checks visibly pending.
4. Build one complete workflow, including its recovery and accessibility states. Wire relevant automated checks into CI before beta.
5. Check the deployed artifact, then capture any new reusable lesson with its evidence and limits.

## Shell baseline and product scope

The shell provides consistent architecture, shared UI/theme conventions, predictable navigation, accessible states, centralized configuration, image/performance budgets and focused verification. Public web surfaces also need the SEO baseline.

The product brief determines which screens, data and integrations exist. Do not add a capability because it appears in a guide. Add capability-specific acceptance checks only after the product requires that capability; detailed resilience, integration and release guides explain how to build selected work safely.

## Guides to load only when relevant

- [SEO and discoverability](seo-and-discoverability.md): public routes, metadata, rendering, redirects, migrations.
- [Accessibility](accessibility-baseline.md): interaction, navigation, semantics, manual verification.
- [Images and performance](images-and-performance.md): WebP, variants, loading strategy, asset budgets.
- [Release quality gates](release-quality-gates.md): architecture, privacy, recovery, CI and deployed checks.

## Starting prompt

> Use the installed mature-app-starter skill and quality-foundation reference to start this app: [idea, users, platforms]. Carry forward the toolkit's SEO, accessibility, image-performance, privacy, and verification defaults where applicable. Create docs/app-quality-contract.md with explicit shell decisions, budgets, and acceptance checks, then implement the first useful workflow. Add capabilities only from this product brief; do not turn reference guides into a feature backlog. Keep product rules and branding app-owned. Ask only for information that materially blocks progress. Keep reads targeted and use no subagents unless I ask.

## How this compounds

After a milestone, capture: problem → evidence → reusable rule → check that prevents recurrence → exceptions. Update the relevant guide, its installed skill reference, and any instruction template that must change agent behavior. Measure whether this saves setup time or avoids repeated defects on the next app; do not grow the toolkit just to grow it.

Keep public toolkit material generic: describe the problem, reusable rule, applicability and verification without naming source products or copying their paths, budgets, assets or identifiers. Record private provenance separately only when needed and authorized.

## Everyday behavior to decide at kickoff

- [App shell and navigation](app-shell-and-navigation.md): sticky surfaces where useful, safe areas, Back/deep links, focus and scroll restoration.
- [UI states and forms](ui-states-and-forms.md): first use, resume, initial load versus refresh, useful empty states, input preservation, errors and duplicate submissions.
- [Design system primitives](design-system-primitives.md): actual screen adoption, typography, persisted appearance and system-theme changes.
- [Data resilience and capabilities](data-resilience-and-capabilities.md): applicable persistence, recovery, offline, permission and historical-record decisions.
- [Runtime performance](runtime-performance.md): representative workloads, profiling, freshness, cancellation and background work.
- [Feature scaffolding](feature-scaffolding.md): optional TypeScript feature generator for repeated setup.

Use the installed `docs/foundation-templates/screen-behavior.md` for the first workflow. With `--no-docs`, record equivalent decisions from the guides. Keep experiments optional; use the experiment-brief template to choose evidence appropriate to traffic and risk.

## Development setup

Use [Expo development and web setup](expo-development-and-web.md) for repeatable local commands, minimal Metro configuration, exported-web checks and optional MCP debugging. When product analytics is selected, use [analytics setup](product-analytics-setup.md) for platform adapters, explicit collection policy and delivery evidence. Neither guide authorizes adding an unused service.

## Platform architecture

For Expo Router, use the [Expo folder and file architecture](expo-project-structure.md) before choosing the initial tree. It distinguishes routing requirements from feature-ownership conventions and documents why code belongs in each location. Keep one feature/module naming convention per app.

## Correctness and delivery details

- [Code correctness](code-correctness.md): unknown versus zero, IDs, units, time, shared parsing, async ordering and truthful side effects.
- [Verification and review](verification-and-review.md): assess findings, cover shared packages, reproduce device behavior and keep evidence current.
- [Build and release workflow](build-and-release-workflow.md): select the right artifact, measure pipeline delays and verify actual remote completion.

When applicable, use the integration-inventory template to track real service readiness and the review-findings template to reconcile a review without duplicating an existing tracker. Keep detailed patterns conditional on the work; they do not justify adding unused services or subsystems.
