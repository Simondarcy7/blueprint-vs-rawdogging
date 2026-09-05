# Mature App Foundation

A practical startup app foundation toolkit for product thinking, UX/UI, architecture, testing,
AI-agent setup, and token-efficient software engineering.

This is not a template app. It is a playbook and installable toolkit you can use before building
any serious app, whether you are a founder, designer, product operator, or developer.

## Consistent quality, product-owned features

Use this blueprint for a consistent Expo app shell: folder structure, shared UI and theme tokens, navigation, accessible states, configuration, image/performance budgets and verification. Each new product supplies its own workflows and capabilities. Optional reference guides must never become an automatic feature checklist.

The toolkit currently supplies instructions and checks; the runnable shell is implemented in each new project.

## Carry your learnings into the next build

Start with the [quality foundation](docs/quality-foundation.md) and copy the [app quality contract](templates/app-quality-contract.md). The toolkit now carries explicit defaults for:

- [SEO](docs/seo-and-discoverability.md): public/private routes, metadata, sitemap and migration checks.
- [Accessibility](docs/accessibility-baseline.md): semantics, keyboard and screen-reader workflows, focus and reduced motion.
- [Images and performance](docs/images-and-performance.md): WebP variants, loading, asset rights and measurable budgets.
- [Release checks](docs/release-quality-gates.md): architecture, recovery, privacy and deployed evidence.

These guides are included in Codex and Claude installs and connected to kickoff skills and instruction templates. Use the [starting prompt](docs/quality-foundation.md#starting-prompt) for your next app. Framework-specific code and checks still need implementation in each new app.

## Give this blueprint to a new project

[BLUEPRINT.md](BLUEPRINT.md) is the required contract: **TypeScript + Expo + Expo Router**, with routes in **src/app** and capabilities in **src/modules**. The installer adds that contract, matching Codex/Claude instructions, planning records and a structural verifier even with `--no-docs`.

Paste this into a new project's task:

> Adopt https://github.com/Simondarcy7/blueprint-vs-rawdogging and follow BLUEPRINT.md strictly. Read it before implementation, install the project instructions, complete the project index and quality contract, then build the first useful workflow. Use Expo + Expo Router + TypeScript with src/app and src/modules. Do not change the stack or required architecture without my explicit direction. Add the structural check to app checks/CI and report actual verification. Preserve existing work and report conflicts before migration. Apply the quality shell only; add features and services only when required by this product brief.

Run `node scripts/verify-blueprint.mjs` from the new app after foundation setup. An instruction-only install should fail. Passing this structural gate does not prove behavior, accessibility or full conformance; the contract requires those checks separately. Existing installs skip customized files and need reviewed updates. See [installation](docs/installation.md).

## Who This Is For

- Founders who want a better starting point than a blank repo.
- Developers who want mature defaults without over-engineering.
- Product and UX people who want reusable startup app planning structure.
- Teams using Codex, Claude Code, or similar AI coding agents.

## What You Get

- App/startup blueprint.
- New-project kickoff checklist.
- MVP boundary and screen-state map.
- UX, UI, and motion principles.
- Design-system primitive guidance.
- Default technical preferences with explicit override rules.
- Runtime config and environment separation guidance.
- Service-boundary and typed-stub strategy.
- Testing strategy by risk.
- PR and handoff playbook.
- Token-utilization guidance.
- Codex and Claude-compatible skills.
- Copyable `AGENTS.md` and `CLAUDE.md` templates.
- Optional custom agents for planning, UX, architecture, and review.

## One-Command Install

Install into an existing or new project:

```sh
curl -fsSL https://raw.githubusercontent.com/Simondarcy7/blueprint-vs-rawdogging/main/install.sh | bash -s -- --target my-new-app --agent both
```

Safer clone-first option:

```sh
git clone https://github.com/Simondarcy7/blueprint-vs-rawdogging
cd blueprint-vs-rawdogging
./install.sh --target ../my-new-app --agent both
```

Dry-run first:

```sh
./install.sh --target ../my-new-app --agent both --dry-run
```

Agent options:

- `--agent codex`: installs `AGENTS.md` and `.agents/skills/`.
- `--agent claude`: installs `CLAUDE.md`, `.claude/skills/`, and `.claude/commands/`.
- `--agent both`: installs both sets.

See `docs/installation.md` for details.

## Recommended Defaults

Follow [BLUEPRINT.md](BLUEPRINT.md). Expo + Expo Router + TypeScript is the required starting stack; departures require explicit user direction and a recorded ADR.

- TypeScript by default.
- Expo Router for the product web surface, sharing the Expo application.
- Expo React Native + Expo Router for native and web.
- Framework-native routing with thin route/page/screen files.
- Feature modules for product capabilities.
- Typed service boundaries for APIs, analytics, auth, storage, AI, and backend integrations.
- Centralized runtime config.
- Typed analytics and error-reporting wrappers.
- Typecheck/lint from day one.
- ADRs for stack, backend, testing, analytics/observability, and sensitive-data handling.

## Start Here

For non-developers:

1. Read `docs/app-startup-blueprint.md`.
2. Read `docs/mvp-boundary-and-screen-map.md`.
3. Use `docs/kickoff-checklist.md` to prepare the first build.
4. Share the repo with a developer or AI coding agent.

For developers:

1. Run `./install.sh --target <project> --agent both --dry-run`.
2. Run it again without `--dry-run` when the output looks right.
3. Create first ADRs from `templates/adr-template.md`.
4. Use the installed skills to run kickoff, ADR, handoff, and learning-loop workflows.

## Repository Map

```text
docs/        Human-readable playbook
  installation.md
  agent-compatibility.md
  ecosystem-addons.md
  optional-integrations.md
  custom-skills.md
templates/   Copyable AGENTS.md, CLAUDE.md, and ADR templates
codex/       Codex-compatible skills and custom agents
claude/      Claude Code slash-command templates
notion/      Notion page map
install.sh   Installer for Codex, Claude, or both
```

## Optional Integrations

The toolkit works without external services. Useful optional integrations include:

- Notion for the readable playbook and reusable learnings log.
- GitHub for issues, PRs, source control, and public sharing.
- Sentry for error reporting.
- PostHog or Amplitude for product analytics.
- Vercel for web deployment and preview environments.

See `docs/optional-integrations.md`.

## License

MIT.

## Everyday app behavior

Use the [app shell and navigation guide](docs/app-shell-and-navigation.md) for sticky headers, safe areas, deep links, Back behavior and scroll restoration. Use [UI states and forms](docs/ui-states-and-forms.md) for loading shells, empty/partial/offline states, validation and duplicate-submit handling. Add [data resilience and capability patterns](docs/data-resilience-and-capabilities.md) when the app saves work or requests device access, and [runtime performance checks](docs/runtime-performance.md) for measured tuning.

Copy the [screen behavior worksheet](templates/screen-behavior.md) for important screens and the [experiment brief](templates/experiment-brief.md) when evaluating a change. The optional [feature scaffold](docs/feature-scaffolding.md) creates a TypeScript feature boundary without adding dependencies. These are adaptable conventions, not mandatory infrastructure for every app.

Maintainer checks: `node --test tests/*.test.mjs` verifies the optional generator. The installer includes its script with the mature-app-starter skill.

## Expo folder and file architecture

For an Expo Router app, start with the [intentional Expo project structure](docs/expo-project-structure.md). It includes a full folder tree, ownership rules, module anatomy, thin route/public API examples, state and service placement, platform adapters, and the reasons behind each boundary. Use the [module instruction template](templates/src-modules-AGENTS.md) when choosing `src/modules/`. This is the required starting architecture. Other stacks require explicit user direction and a documented exception.

## Correctness and reliable delivery

The [code correctness guide](docs/code-correctness.md) covers trustworthy data, stable identity, units/dates, shared validation, async ordering and recoverable side effects. The [verification and review guide](docs/verification-and-review.md) helps reconcile findings and prove the right behavior on the right build/device. The [build and release workflow](docs/build-and-release-workflow.md) covers pipeline timing, update compatibility and accurate artifact/completion reporting.

Optional worksheets: [integration inventory](templates/integration-inventory.md) and [review findings](templates/review-findings.md). Load these when applicable; the blueprint's required stack and module boundaries remain unchanged.

## Optional product assurance review

Use the [product review brief](templates/product-review-brief.md) before a beta, major release or owner handoff when you want a formal review. The blueprint establishes the quality shell; the brief checks the implemented product using pinned evidence, selected areas and actionable findings. It is not a mandatory full audit for every change and does not add features or apply fixes. See [verification and review](docs/verification-and-review.md#optional-product-assurance-review).

## Expo tooling, web and optional analytics

The [Expo development and web guide](docs/expo-development-and-web.md) covers repeatable commands, Metro defaults, production web verification and optional Expo/Metro MCP tools. The [analytics guide](docs/product-analytics-setup.md) documents a vendor-neutral contract with PostHog as an optional native/web adapter. Both install with the skill references, including `--no-docs`; they do not install servers, create accounts or activate collection.

## Native updates as a release default

The shell includes operational foundations. For distributed native apps, [OTA delivery](docs/build-and-release-workflow.md#ota-delivery-is-part-of-native-setup) is a required pre-beta setup gate unless the owner approves an alternative. The guide covers compatible runtimes, channels and environments, preview verification, rollout, safe restart timing, signing decisions and recovery with existing user data. The installer creates no cloud resources and publishes no updates.
