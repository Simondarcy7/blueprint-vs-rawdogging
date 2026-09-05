---
name: kickoff-runner
description: Use when a new app plan already exists and needs an interactive kickoff into setup decisions and first tasks.
---

# Kickoff Runner

Use this skill to guide a new app from idea to first implementation slice.

## Workflow

1. Read available project context and any existing repo files.
2. Use `references/app-startup-blueprint.md` and `references/kickoff-checklist.md`; fall back to `docs/foundation/` copies when installed.
3. Identify: problem, target user, first valuable workflow, platform, risk profile, non-goals, and first beta success signal.
4. Recommend default technical choices: TypeScript, React for web, Expo React Native for mobile/cross-platform, typed service boundaries, centralized config, and focused tests unless a better choice is justified.
5. Read `../mature-app-starter/references/quality-foundation.md` (the installer includes both skills). Record platform-specific SEO, accessibility, image budgets, privacy and release checks in `docs/app-quality-contract.md`.
6. Produce a setup checklist: repo structure, instruction files, ADRs, verification commands, and first tasks.

## Output

- Product foundation.
- UX shape and required states.
- Technical direction.
- Instruction layers to create.
- Baseline ADRs.
- First implementation slice.
- Verification plan.

Do not implement unless the user asks.

Include first-screen shell/navigation behavior, loading/empty/refresh/error states, input preservation, applicable recovery and a representative performance fixture in the setup checklist. Load the corresponding mature-app-starter references only when needed.

For Expo Router projects, read `../mature-app-starter/references/expo-project-structure.md` before choosing the tree. Record route root, feature/module convention, public APIs, state/service ownership and supported platform adapters; adapt root and nested instructions consistently.
