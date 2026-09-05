# Quality foundation for the next app

Boilerplate the decisions, conventions, and checks that repeatedly save work. Keep the brand, user journey, business rules, and target surfaces specific to the new product.

## Use at kickoff

1. Read BLUEPRINT.md and keep the required Expo/Router/modules architecture. Choose the surfaces: public website, private web app, native app, or a combination. State which pages should be discoverable in search.
2. For a brand-new project, use the runnable Expo starter through `scripts/create-app.mjs`; for an existing app, install instructions only and preserve its work. Complete the installed `docs/project-index.md` and `docs/app-quality-contract.md`. The installer seeds both even with `--no-docs`; copying the toolkit alone does not complete them.
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

## Operational setup is part of the shell

Carry release knowledge forward as well as code conventions: reproducible commands, separated environments, identifiable artifacts, compatible updates, useful failure diagnostics and tested recovery. For distributed native apps, OTA is the default before external beta, with an owner-approved alternative where needed. Follow the [build and release workflow](build-and-release-workflow.md#ota-delivery-is-part-of-native-setup); leave readiness pending until an installed build has applied an update and recovery has been checked. The toolkit does not publish releases on installation.

## Development setup

Use [Expo development and web setup](expo-development-and-web.md) for repeatable local commands, minimal Metro configuration, exported-web checks and optional MCP debugging. When product analytics is selected, use [analytics setup](product-analytics-setup.md) for platform adapters, explicit collection policy and delivery evidence. Neither guide authorizes adding an unused service.

## Platform architecture

For Expo Router, use the [Expo folder and file architecture](expo-project-structure.md) before choosing the initial tree. It distinguishes routing requirements from feature-ownership conventions and documents why code belongs in each location. Keep one feature/module naming convention per app.

Maintain a concise system map in the project index, or link `docs/architecture.md` as the app grows. Use `docs/foundation-templates/architecture-system-map.md`, also available as the installed skill reference `architecture-system-map.md` with `--no-docs`. Capture data authority, the critical workflow, failure/protection boundaries and measured tradeoffs; omit capabilities the product does not use. Update affected sections alongside architecture changes.

## Correctness and delivery details

- [Code correctness](code-correctness.md): unknown versus zero, IDs, units, time, shared parsing, async ordering and truthful side effects.
- [Verification and review](verification-and-review.md): assess findings, cover shared packages, reproduce device behavior and keep evidence current.
- [Build and release workflow](build-and-release-workflow.md): select the right artifact, measure pipeline delays and verify actual remote completion.

When applicable, use the integration-inventory template to track real service readiness and the review-findings template to reconcile a review without duplicating an existing tracker. Keep detailed patterns conditional on the work; they do not justify adding unused services or subsystems.

## Readiness map: use the blueprint without relying on memory

Start here after BLUEPRINT.md. Work through the applicable stages, loading the linked guide when needed. Record actual commands, owner and evidence in the app's project index/quality contract; this map is an index, not a second status tracker. The toolkit supplies a runnable Expo starter for new apps and an instruction-only installer for existing apps. Native/store/backend rows apply to selected surfaces and services.

| Stage | What should exist in the new project | Guide / completion evidence |
| --- | --- | --- |
| Scope and adoption | First workflow, non-goals, surfaces, toolkit revision and approved exceptions | [Kickoff](kickoff-checklist.md); completed project index |
| Architecture | Thin routes, module public APIs, service boundaries and a maintained system map | [Expo structure](expo-project-structure.md); structural and applicable import checks |
| Local development | Reproducible commands, SDK/tool versions and identified dev/test targets | [Expo tooling/web](expo-development-and-web.md); verified commands |
| UI and navigation | Shared controls/tokens, gallery fixtures, safe areas and predictable Back | [Design primitives](design-system-primitives.md), [shell](app-shell-and-navigation.md); representative rendered and behavior checks |
| Accessibility and states | Applicable empty/loading/error states, text scaling, focus and assistive navigation | [Accessibility](accessibility-baseline.md), [UI states](ui-states-and-forms.md); manual and focused test evidence |
| Assets and public web | Owned sources, reproducible derivatives, delivered-size budgets and indexing policy | [Images](images-and-performance.md), [SEO](seo-and-discoverability.md); generated-file and exported/live checks |
| Configuration and integrations | Validated environment config; only selected services, with readiness evidence | [Config](runtime-config-and-environments.md), [service boundaries](service-boundaries-and-stubs.md); integration inventory if useful |
| Reliability | Usable startup recovery, truthful state, sanitized diagnostics; data recovery where needed | [Resilience](data-resilience-and-capabilities.md), [correctness](code-correctness.md); targeted failure checks |
| Verification and CI | Disposable fixtures, reviewed baselines and every required job wired to a real gate | [Verification](verification-and-review.md), [release workflow](build-and-release-workflow.md); passing applicable checks |
| Native delivery | Update-enabled build, runtime/channel/environment mapping and verified OTA recovery or approved alternative | [OTA setup](build-and-release-workflow.md#ota-delivery-is-part-of-native-setup); installed-device evidence |
| Distribution | Deployment preflight, shipped dependency record and applicable store metadata/captures/support | [Release workflow](build-and-release-workflow.md); actual artifact and destination checks |
| Review and maintenance | Prioritized findings, fixed/remaining evidence, updated decisions and toolkit lessons | [Review](verification-and-review.md), [learning loop](continuous-learning-loop.md); current records |

Do not mark a stage complete because its folder or document exists. A configured integration is not verified, an unexecuted test is not passing, and a generated preview is not a device capture. Add new product-specific work to the product brief rather than expanding this map into a feature backlog.
