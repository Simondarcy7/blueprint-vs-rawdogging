# Quality foundation for the next app

Boilerplate the decisions, conventions, and checks that repeatedly save work. Keep the brand, user journey, business rules, and platform choice specific to the new product.

## Use at kickoff

1. Choose the surfaces: public website, private web app, native app, or a combination. State which pages should be discoverable in search.
2. Copy `templates/app-quality-contract.md` to the new app's `docs/app-quality-contract.md`. After installation, the template is in `docs/foundation-templates/`. With `--no-docs`, create the equivalent record from this guide.
3. Record the first workflow, applicable quality checks, chosen budgets, and verification commands. Mark irrelevant checks N/A with a reason; leave unimplemented checks visibly pending.
4. Build one complete workflow, including its recovery and accessibility states. Wire relevant automated checks into CI before beta.
5. Check the deployed artifact, then capture any new reusable lesson with its evidence and limits.

## Defaults and optional capabilities

| Apply by default | Add when the product requires it |
| --- | --- |
| Thin routes, feature public APIs, typed services, centralized config | Shared packages after two apps prove the same contract |
| Accessible primitives, visible focus, reduced motion, recovery states | Platform-specific screen-reader and permission adapters |
| Sized and compressed images, explicit performance budgets | Upload limits, OCR, maps, image CDN, offline media |
| Public/private route classification | SEO on public web content; app-store discovery for native distribution |
| Minimal data collection, sanitized diagnostics | Accounts, cloud sync, analytics, payments, notifications |
| Focused tests and release evidence | Broader test suites when complexity or risk justifies them |

## Guides to load only when relevant

- [SEO and discoverability](seo-and-discoverability.md): public routes, metadata, rendering, redirects, migrations.
- [Accessibility](accessibility-baseline.md): interaction, navigation, semantics, manual verification.
- [Images and performance](images-and-performance.md): WebP, variants, loading strategy, asset budgets.
- [Release quality gates](release-quality-gates.md): architecture, privacy, recovery, CI and deployed checks.

## Starting prompt

> Use the installed mature-app-starter skill and quality-foundation reference to start this app: [idea, users, platforms]. Carry forward the toolkit's SEO, accessibility, image-performance, privacy, and verification defaults where applicable. Create docs/app-quality-contract.md with explicit decisions, budgets, and acceptance checks, then implement the first useful workflow. Keep product rules and branding app-owned. Ask only for information that materially blocks progress. Keep reads targeted and use no subagents unless I ask.

## How this compounds

After a milestone, capture: problem → evidence → reusable rule → check that prevents recurrence → exceptions. Update the relevant guide, its installed skill reference, and any instruction template that must change agent behavior. Measure whether this saves setup time or avoids repeated defects on the next app; do not grow the toolkit just to grow it.

The first extraction is recorded in `docs/learnings/golf-app-2026-09.md` in the toolkit repository (installed under `docs/foundation/learnings/`). This is a reusable approach, not a claim that every Golf App release has passed every check.
