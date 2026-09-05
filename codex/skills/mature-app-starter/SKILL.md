---
name: mature-app-starter
description: Use when a greenfield app needs a mature foundation plan before implementation.
---

# Mature App Starter

Use this skill to establish a strong baseline before building a new app. Keep the output practical:
decisions, tradeoffs, file structure, verification, and next actions.

## Scope guard

Apply this toolkit as a consistent quality shell. The current product brief owns features and integrations. Do not add capabilities, dependencies or screens because a reference guide mentions them. Load optional guides only for work already in scope; keep kickoff acceptance focused on the shell and explicitly selected capabilities.

## Required contract

Read `references/required-blueprint.md` first and follow the project's `BLUEPRINT.md`. For new apps, use Expo + Expo Router + TypeScript with src/app and src/modules. Detailed references cannot authorize departures. Complete planning records and run the installed structural check plus applicable verification before handoff. Report conflicts in an existing app and obtain explicit user direction before changing its architecture.

## First Pass

Start by identifying:

- Target users and their high-stakes moments.
- Core job-to-be-done and first valuable workflow.
- Platform target: web, mobile, Expo, native, desktop, or API-first.
- Domain risk: privacy, safety, compliance, accessibility, payments, identity, user-generated content, regulated data, or sensitive workflows.
- Current stage: idea, prototype, MVP, beta, production, or rebuild.

If the user has not provided enough context, make conservative assumptions and label them.

## Product And UX Baseline

- Build the real primary workflow first, not a landing page.
- Keep information architecture simple: primary nav, main task surface, settings/account, and support/legal when needed.
- Design for repeated use: dense enough to scan, clear states, predictable navigation, and low-friction recovery.
- Include empty, loading, error, offline, permission-denied, and success states early.
- Prefer accessibility by default: semantic controls, readable contrast, scalable text, keyboard/screen-reader paths, and touch targets.
- For sensitive domains: avoid overclaiming, protect user data, clarify escalation paths where relevant, and design for trust and auditability.

## Technology Baseline

- Prefer boring, well-supported technology unless the product need justifies complexity.
- Choose one app architecture and document it early.
- Keep route/screen files thin; put product logic in feature modules.
- Keep external systems behind typed service boundaries.
- Centralize environment config and never scatter secret or environment reads across UI code.
- Use structured domain types close to the feature first; promote to shared types only after reuse is real.
- Add observability, analytics, and error reporting behind wrappers before calls spread.

## Engineering Setup

Recommend a starter structure like:

```text
src/
  app/
  modules/
  components/
  services/
  lib/
  config/
  types/
  test/
docs/
  adr/
  project-index.md
  engineering-workflow.md
```

Create or recommend:

- Root `AGENTS.md` for project-wide rules.
- Domain `AGENTS.md` files for `src/modules/`, `src/services/`, and backend/schema folders when they exist.
- ADRs for stack choice, backend strategy, testing strategy, analytics/observability, and sensitive-data handling.
- A focused task workflow skill only when the project has a repeated task process.

## Verification Baseline

- Typecheck and lint from the start.
- Unit-test domain logic, calculations, parsing, permissions, and state transitions.
- Component-test critical UI states where practical.
- Add end-to-end smoke tests after the first stable workflow exists.
- Manual UX checks are required for responsive layout, accessibility, and mobile ergonomics.

## Security And Data Baseline

- Classify data by sensitivity before modeling storage.
- Keep secrets server-side and out of app bundles.
- Add auth only when the product workflow needs identity; when added, design roles and recovery paths deliberately.
- For sensitive or regulated domains, treat privacy, audit trails, consent, retention, and export/deletion as first-class requirements.
- Avoid collecting data that is not needed for the first useful workflow.

## Blueprint Reference

For deeper guidance, read `references/index.md` first and then load only the specific referenced
file needed for the user's request.

## Output Shape

For a new app plan, return:

1. Recommended product scope.
2. Suggested architecture and stack.
3. Starter folder structure.
4. UX principles and key states.
5. Security/privacy assumptions.
6. Testing and verification plan.
7. Suggested `AGENTS.md` layers.
8. Next 3 to 5 implementation tasks.

If implementation begins, keep changes small and create the foundation before feature breadth.

## Reusable quality baseline

At kickoff, read `references/quality-foundation.md` and use its readiness map to find applicable setup guidance. Record the adopted toolkit revision in the project index. Create an app-owned quality contract with platform applicability, public/private route policy, accessibility acceptance checks, image and bundle budgets, privacy decisions, actual verification commands, and pending evidence. Load the linked specialist guides only when implementing or deciding that area. Use generic, platform-appropriate defaults and set project-specific budgets. Keep subagents opt-in: use them only when the user asks.

## First workflow behavior

At kickoff, record shell/navigation and applicable screen-state behavior in the quality contract. When implementing screens, read `references/app-shell-and-navigation.md` and `references/ui-states-and-forms.md`; choose sticky surfaces by task rather than imposing them universally. For persistence/device work read `references/data-resilience-and-capabilities.md`; for tuning read `references/runtime-performance.md`. `references/feature-scaffolding.md` describes the optional dependency-free `scripts/create-feature.mjs` generator. Keep source-product names and examples out of public toolkit output.

## Expo architecture profile

When planning or documenting an Expo Router app, read `references/expo-project-structure.md` before proposing its folder tree. Use `src/app` for routing and `src/modules` for product ownership. Report an existing conflicting convention and follow the contract exception process. Explain folder responsibilities and dependency direction, not just names. Use `references/architecture-system-map.md` to maintain a short source-backed system map in the project index or a linked document; include only applicable boundaries and update them with implementation changes. Separate Expo requirements from toolkit conventions; avoid copying an App.tsx entry assumption into a Router app. Preserve established architecture unless the user requests a migration.

## Correctness and evidence references

For data/state work, read `references/code-correctness.md`; for reviews or disputed verification, read `references/verification-and-review.md`; for builds/releases, read `references/build-and-release-workflow.md`. Apply only the relevant patterns. Keep detailed history, source-product references and private provenance out of public toolkit guidance.

## Optional formal product review

Only when a formal product review is requested, read `references/product-review-brief.md` and complete its Inputs from the user's scope. Keep the review separate from implementation, preserve full-versus-sampled coverage, and report evidence and limits. The review does not authorize feature creation, fixes, external publication or subagents. Ordinary tasks continue to use focused verification.

## Expo toolchain and optional analytics

For local Expo/Metro setup, web export or MCP debugging, read `references/expo-development-and-web.md`. For analytics already selected by the product brief, read `references/product-analytics-setup.md`. Keep MCP development-only and analytics vendor-optional; verify real connections without installing tools or enabling collection merely because the guides exist.

## Native operational baseline

For distributed native apps, plan OTA delivery before external beta as required by BLUEPRINT.md. Read `references/build-and-release-workflow.md`, record readiness in the project index and quality contract, and keep it pending until installed-build and recovery evidence exists. Record an owner-approved alternative when applicable. This is release setup; it does not authorize automatic publication or add a mandatory update screen.
