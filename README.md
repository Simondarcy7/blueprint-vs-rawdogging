# Mature App Foundation

A practical startup app foundation toolkit for product thinking, UX/UI, architecture, testing,
AI-agent setup, and token-efficient software engineering.

This is not a template app. It is a playbook and installable toolkit you can use before building
any serious app, whether you are a founder, designer, product operator, or developer.

## Carry your learnings into the next build

Start with the [quality foundation](docs/quality-foundation.md) and copy the [app quality contract](templates/app-quality-contract.md). The toolkit now carries explicit defaults for:

- [SEO](docs/seo-and-discoverability.md): public/private routes, metadata, sitemap and migration checks.
- [Accessibility](docs/accessibility-baseline.md): semantics, keyboard and screen-reader workflows, focus and reduced motion.
- [Images and performance](docs/images-and-performance.md): WebP variants, loading, asset rights and measurable budgets.
- [Release checks](docs/release-quality-gates.md): architecture, recovery, privacy and deployed evidence.

These guides are included in Codex and Claude installs and connected to kickoff skills and instruction templates. Use the [starting prompt](docs/quality-foundation.md#starting-prompt) for your next app. They capture approaches from the [Golf App extraction](docs/learnings/golf-app-2026-09.md), including the limits of work-in-progress examples. Framework-specific code and checks still need implementation in each new app.

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

These are defaults, not laws. Use newer, simpler, safer, or more suitable choices when the project
context justifies them, and record meaningful deviations in an ADR.

- TypeScript by default.
- React by default for web.
- Expo React Native by default for mobile or cross-platform.
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
