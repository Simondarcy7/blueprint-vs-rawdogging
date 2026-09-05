# Installation

Use the installer to copy the toolkit into a project.

## Recommended

```sh
git clone https://github.com/Simondarcy7/blueprint-vs-rawdogging
cd blueprint-vs-rawdogging
./install.sh --target ../my-new-app --agent both --dry-run
./install.sh --target ../my-new-app --agent both
```

## One Command

```sh
curl -fsSL https://raw.githubusercontent.com/Simondarcy7/blueprint-vs-rawdogging/main/install.sh | bash -s -- --target my-new-app --agent both
```

When run this way, the installer fetches the latest toolkit source into a temporary directory, then
copies the selected files into your target project.

## Copy The Whole Repo Without History

If you want the whole toolkit as a starting folder rather than installing selected files:

```sh
npx degit Simondarcy7/blueprint-vs-rawdogging my-new-app
```

This is simple, but it copies the toolkit repo itself. For app projects, the installer is usually a
better fit.

## Future npm Initializer

An `npx create-mature-app` initializer may make sense later if this gets frequent public usage. For
now, the shell installer is lower maintenance and easier to inspect.

## Options

- `--target DIR`: project directory to install into.
- `--agent codex`: install Codex files only.
- `--agent claude`: install Claude Code files only.
- `--agent both`: install both Codex and Claude files.
- `--dry-run`: show what would happen without writing files.
- `--force`: overwrite existing files.
- `--no-docs`: skip the optional docs/template library; required project contract, planning records and verifier still install.
- `--install-user-assets`: also install user-level Codex skills and custom agents.

## What Gets Installed

Codex:

- `AGENTS.md`
- `.agents/skills/*`
- optional user-level skills and custom agents with `--install-user-assets`

Claude:

- `CLAUDE.md`
- `.claude/skills/*`
- `.claude/commands/*`
- `.claude/settings.json`

Required baseline for every agent and `--no-docs`:

- `BLUEPRINT.md`
- `docs/project-index.md` and `docs/app-quality-contract.md` (complete these during kickoff)
- `scripts/verify-blueprint.mjs` (requires Node.js)
- `src/modules/AGENTS.md` and `src/services/AGENTS.md` for Codex
- `src/modules/CLAUDE.md` and `src/services/CLAUDE.md` for Claude

Optional shared reference library:

- `docs/foundation/*`
- `docs/foundation-templates/*`

## Safety

The installer skips existing files by default. Use `--force` only when you intentionally want to
replace existing project files.

## Quality defaults and future updates

New installs include the quality guides under `docs/foundation/`, the copyable `app-quality-contract.md` under `docs/foundation-templates/`, and focused references inside each agent's mature-app-starter skill. The installer seeds the app-owned planning records and structural verifier; kickoff must complete the records, create the Expo app and connect verification to app scripts/CI.

With `--no-docs`, the required baseline and self-contained skill references still install. Reinstalling without `--force` skips existing skill/doc directories. To update an existing customized app, install into a disposable directory and review/merge the relevant changes; `--force` replaces customized files/directories. User-level assets are unchanged unless explicitly installed.

## Optional feature scaffold and behavior templates

The mature-app-starter skill includes `scripts/create-feature.mjs`; Node.js runs this command and the required structural verifier. See the bundled `references/feature-scaffolding.md`. Normal installation adds no app dependencies or generated features.

With docs enabled, `docs/foundation-templates/` also contains `screen-behavior.md` and `experiment-brief.md`. Existing installs need reviewed updates: the installer skips existing directories by default, so stale documentation may remain until deliberately removed or replaced.

## Required Expo architecture

New installs directly use src/app routes and src/modules product ownership instructions. The installer does not create src/features, restructure existing apps, or generate an Expo project. An instruction-only install is expected to fail `node scripts/verify-blueprint.mjs` until the foundation exists. Read BLUEPRINT.md and complete setup before claiming adoption.

Existing installations preserve their files by default and may retain older, conflicting instructions. Install into a disposable directory and review/merge the baseline, root and nested instructions, skills, and verification command. Resolve an existing src/features or alternative-stack conflict through the user-approved adoption/exception process. Do not use --force on customized files without intending to replace them.

## Additional focused guides

Code correctness, verification/review and build/release references are bundled with mature-app-starter, including `--no-docs` installs. With docs enabled, `docs/foundation-templates/` also contains integration-inventory and review-findings worksheets. These are used only when relevant; installing them does not activate vendors, run builds or create a second task tracker.
