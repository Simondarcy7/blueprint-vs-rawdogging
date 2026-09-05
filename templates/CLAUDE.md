# Project Instructions

## Project orientation

- Read `BLUEPRINT.md` first, then `docs/project-index.md`. The blueprint is required for new apps; detailed guides do not override it.
- Run `git status --short --branch` before modifying files.
- Preserve user changes already present in the worktree.
- Keep work focused on the current task; avoid unrelated refactors.

## Source of truth

- Issues and PRs are the live task tracker.
- Planning docs are context, not live status.
- Repo docs are stable reference.
- Do not duplicate live task status across systems.

## Architecture

- Use TypeScript for the app; require explicit user direction for departures from BLUEPRINT.md.
- Use Expo React Native + Expo Router for the product app on native and web.
- Do not substitute a framework or mandatory architecture rule on your own. Record user-approved exceptions in an ADR; an ADR alone is not approval.
- Keep routes/pages focused on routing and screens focused on UI orchestration; move business rules and integration details into feature modules. For Expo Router, read the installed mature-app-starter `references/expo-project-structure.md` before choosing the folder tree.
- Put product capabilities in `src/modules/` with explicit `index.ts` public APIs; routes belong in `src/app/`. Report existing conflicts without silently migrating them.
- Put shared UI under `src/components/` only after reuse is clear.
- Put external integrations behind typed modules in `src/services/`.
- Put framework-agnostic helpers in `src/lib/`.
- Centralize runtime config in `src/config/`.
- Prefer feature-local types until reuse is real.

## Product UX

- Apply the blueprint as a quality shell. The product brief owns features, screens and services; reference guides are not a feature backlog.
- Build the real primary workflow before marketing or decorative pages. Verify first use with representative initial content.
- Use the shared design primitives in real screens. Decide supported appearance modes and verify startup across the target platforms. Test persisted preferences and system changes when those behaviors are supported.
- Include applicable empty, loading, error and success states early. Add permission-denied and offline/degraded handling only for capabilities the product uses.
- Prefer clear hierarchy, predictable navigation, accessible contrast, scalable text, and obvious recovery paths.
- Use animation to clarify state, continuity, feedback, and progress; avoid motion that hides latency or distracts from the task.

## Data and integrations

- Do not scatter direct vendor, database, analytics, auth, or storage calls through UI code.
- For integrations the product requires, start with typed service boundaries and stubs until contracts are concrete. Do not scaffold unused services.
- If analytics is in product scope, use a typed wrapper; do not call vendors directly from screens/components.
- Add error reporting behind a wrapper before beta, external testers, or production usage.
- Treat privacy, consent, retention, deletion/export, and audit needs as first-class when data is sensitive.

## Quality defaults

- At kickoff, create `docs/app-quality-contract.md` with applicable checks, numeric budgets, actual verification commands, and pending evidence. Use the installed mature-app-starter `references/quality-foundation.md`; the copyable template is under `docs/foundation-templates/` when docs are installed.
- Classify public/private web routes; verify public content, metadata, canonical URLs, sitemap, robots policy and status codes in the built/deployed output. Recheck after framework or host migrations.
- Build accessible primitives: semantic names/roles/states, visible focus, hidden-screen isolation, scalable text, reduced motion, and manual keyboard/screen-reader checks.
- Use appropriately sized image variants, WebP where suitable, stable layout, and explicit image/JavaScript/font budgets. Do not lazy-load the likely LCP image. Track asset rights.
- Keep product rules and branding app-owned; extract shared packages only when a second app proves the contract.
- Keep generated outputs reproducible and verify freshness without silently rewriting them. Use disposable fixtures and review visual baseline changes.
- Static checks supplement manual and deployed verification. Never report an unrun check as passed.

## Screen and runtime behavior

- Keep shell/navigation predictable: safe areas, useful sticky controls, usable Back/deep links, restored list state and unobscured focus.
- Distinguish first load, refresh, first-use empty, no results, partial, offline, saving and failure. Preserve useful content and input during recoverable failures.
- Define duplicate-submit, stale-response and retry behavior for affected operations. Add persistence/recovery and permission states when the feature requires them.
- Measure runtime bottlenecks on representative workloads before adding caches, memoization or virtualization. Clean up background work and scope caches by identity.
- Use the screen-behavior worksheet for important screens; keep feature scaffolding and experiments optional.

## Correctness and evidence

- Preserve unknown versus observed values, stable IDs, explicit units/time semantics and deliberate defaults. Reuse authoritative parsing/config contracts across storage, imports and services.
- Define ordering and failure behavior for overlapping async actions. Optional provider failures must not break unrelated core workflows; reflect rollback/reconciliation uncertainty honestly.
- Include shared domain code in verification. Reconcile requested review findings and reproduce reported device behavior before claiming fixes.
- Report integration readiness and build/deployment milestones precisely; configured or queued does not mean verified or released.
- Keep startup recovery usable when an essential provider fails. Validate release targets before external work and require every applicable CI job, including shared/backend code when present.

## Native delivery

- For distributed native apps, prepare and verify OTA before external beta, or record an owner-approved alternative. Use the installed build-and-release-workflow guide for compatible runtimes, explicit channels/environments, safe apply timing and tested recovery.
- Record the installed binary and running update identity. An upload or Expo Go session does not prove OTA readiness. Do not publish a live release merely because setup instructions exist.

## Verification

- Run `node scripts/verify-blueprint.mjs` before implementation handoff and include it in app checks/CI. Also run the lightest relevant behavioral verification. The structural check alone does not establish full conformance.
- Docs-only changes do not require tests/builds.
- Product logic changes should run typecheck and relevant tests.
- UI changes should include a relevant manual check when practical.
- Dependency or config changes should run the narrowest command that proves the change.
- If verification is skipped, explain why.

## Dependencies

- Ask before adding new production dependencies.
- Prefer existing platform APIs and current dependencies before adding packages.
- Keep dependency changes scoped and explain why they are needed.

## Token use

- Before implementation, briefly estimate context cost and the lower-token plan.
- Prefer targeted reads and `rg` over broad scans.
- Summarize findings instead of pasting large files.
- Do not spawn subagents unless the user explicitly asks.

## Subagent policy

- Do not use subagents for normal small implementation tasks.
- Use subagents only when the user explicitly asks; independent tracks alone do not authorize delegation.
- Avoid subagents when token cost, coordination, or merge conflicts would outweigh speed.
