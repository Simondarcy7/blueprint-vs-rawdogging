# Blueprint: decision memo and delivery plan

Revision 3, 29 October 2026. This rewrites revisions 1 and 2 from the same day; Appendix G lists what changed. Evidence about the code refers to [`blueprint-vs-rawdogging`](https://github.com/Simondarcy7/blueprint-vs-rawdogging/tree/0d770675750ab62da417aee0fd230e9b7811415f) at `0d770675` and [`fullstack-app-foundation`](https://github.com/Simondarcy7/fullstack-app-foundation/tree/742ca725ff82ba84903c0c711ee0641676b34619) at `742ca725`. Nothing was built or run for this revision.

## The question

The repository’s name states the thesis: a maintained blueprint produces better apps than “rawdogging”, meaning a coding agent prompted from scratch. This plan answers two questions, in order:

1. **Is the thesis true?** Does an agent working inside Blueprint deliver more correct, accessible and resilient features than the same agent working from `create-expo-app`, at an acceptable cost in tokens and time?
2. **If it is, what is the cheapest structure that keeps that advantage** as several apps diverge and the foundation keeps changing?

Revisions 1 and 2 assumed the answer to the first question and spent most of their effort on the second. Their design copied everything into each app and then needed a custom upgrader to get fixes back out. This revision tests the thesis first, and replaces copying plus a custom upgrader with standard distribution channels.

## Recommendation

1. **Test the thesis before investing.** Run a small agent evaluation (Appendix B): five fixed tasks, each run five times with Blueprint and five times with a bare agent on `create-expo-app`. It takes 4–6 days plus a token budget, and decides whether the remaining 15–23 days are worth spending.
2. **Ship each kind of asset through the channel built for it.** Reliability code, checks and native capabilities become npm packages and Expo config plugins, upgraded through Renovate pull requests. The app shell is a thin template the product owns from day one. Editable UI comes from a copy-on-demand registry. Agent skills install once per machine as a plugin. This removes the hash manifest, ownership tiers and 3-way-merge upgrader that revisions 1 and 2 proposed (Appendix A).
3. **Make the executable quality contract the product.** Agents respond to failing checks more reliably than to prose. Ship the checks, shell journeys and resilience tests as packages so every app gets updates to them. Every rule in `AGENTS.md` either has a check behind it or is labelled as a judgment call.
4. **Keep agents’ best guide: working code.** The notes demo leaves the generated app, but stays in the foundation repository as a reference module agents can read and copy.
5. **Keep what revisions 1 and 2 got right:** one canonical starter; Fullstack App Foundation folded into Blueprint; lean product repositories; two real consumers before any new shared abstraction; full-cost accounting; explicit stop conditions; and honesty about what the evidence shows.

## Decisions required before Phase 1

1. **Product family and surfaces.** Expo apps with native and web surfaces (the assumption here), or a web-first pilot with native deferred.
2. **Two pilot consumers.** Named products with real workflows. With only one, the plan stops after the Phase 2 creation fixes.
3. **Maintainer and backup,** with an agreed support budget.
4. **Evaluation budget.** Model, effort settings and a spend cap for about 125 agent runs: 50 for the Phase 1 comparison, up to 50 for doc ablation and 25 for the Phase 3 rerun.
5. **Publishing.** An npm scope (written `@scope` below) and agreement to publish the foundation packages publicly, which matches the public repository and spares every consumer a private-registry setup.
6. **Declared OS and platform matrix.** For example Windows and Linux in CI, Android builds on Linux, and iOS on a macOS runner only where iOS is claimed.
7. **Existing Fullstack App Foundation users,** which decides whether archiving it needs a migration note.
8. **Repository name.** Rename before the first package release if the name is going to change.

## Plan and cost

| Phase | Outcome | Engineering days |
| --- | --- | --- |
| 1. Test the thesis | Evaluation harness built; Blueprint as it stands compared with a bare agent; go or stop | 4–6, plus token budget |
| 2. Fix creation and restructure distribution | Cross-OS creation; demo isolated; packages, template, registry and plugin published | 8–12 |
| 3. Two consumers and one upgrade cycle | Two product slices on the packages; a compatible fix and a breaking change delivered through Renovate; evaluation rerun | 5–8 |
| 4. Non-author trial and decision | Six gates scored; go, narrow or archive | 2–3 |
| 5. Observe | 4–6 weeks of normal maintenance logged; six-month economic check | Logging only |

Total: **19–29 engineering days**, a planning hypothesis to refine after Phase 1. Revision 2 estimated 20–31. The difference is in shape rather than size: the first 4–6 days can stop the programme, and the custom upgrader, which would have been the largest ongoing maintenance burden, is gone.

## How the pilot is judged

Six gates: five falsifiable tests and one recorded judgment. Thresholds are in Appendix D.

1. **Thesis:** Blueprint beats the bare agent on hidden acceptance tests by a large margin, without a large cost penalty.
2. **Creation and capabilities:** a new app is created, stripped of the demo, branded and given two capabilities on every declared OS in 30 minutes or less, with no file collisions and no help from the author.
3. **Boundary integrity:** two products ship slices with no foundation code copied in or patched, and an adapter swap touches no domain module.
4. **Upgrade:** a compatible fix and a breaking change reach both products as Renovate pull requests, the breaking one with a codemod, without data loss or lost customization.
5. **Self-service:** a developer who didn’t write the foundation completes creation, a feature PR and a handoff with no rescues.
6. **Economics (judgment):** the break-even forecast is positive for committed apps, or the owner records a reason to subsidize quality.

## Stop rules

- **After Phase 1:** if Blueprint does not clearly beat the bare agent, don’t build the platform. Keep any check or reliability code that measurably helped as a small package, keep `AGENTS.md` short, and archive the rest.
- **If only one real consumer exists:** do the Phase 2 creation fixes and stop. Packages are overhead for a single app.
- **If upgrades still need the author’s help, or product-named switches appear in shared code:** narrow the shared scope rather than adding tooling.
- **Defer** private registries, developer portals and multi-agent orchestration until four or more active apps, or repeated upgrade bottlenecks, prove the need.

---

# Appendix A: Target design

## A1. One channel per kind of asset

The design rule: never copy into a product anything the foundation intends to keep fixing, and never try to auto-upgrade anything the product owns.

| Asset | Ship it as | How fixes reach apps | Owner |
| --- | --- | --- | --- |
| Reliability code | npm packages with `react`, `react-native` and `expo` as peer dependencies | Renovate pull requests, semantic versions, changelog | Foundation |
| Native capabilities | Expo config plugins inside those packages | Version bump; applied when Expo generates the native projects, so files never collide | Foundation |
| Checks and test fixtures | `@scope/check`, `@scope/eslint-config` and `@scope/journeys` (Playwright fixtures) | Version bump | Foundation |
| App shell | Thin template rendered by `create-app` | Not upgraded; release notes and an occasional codemod | Product, from day one |
| UI primitives and recipes | Copy-on-demand registry, shadcn-style (`add button`) | Never merged automatically; upstream changes are advisory | Product |
| Reference module | The notes feature, kept in a reference app in the foundation repository | Read or copied on demand | Foundation |
| Agent skills and playbooks | A plugin or skill set installed once per machine | Plugin update | Foundation |

With this split, several of revision 2’s problems disappear rather than needing machinery. “Zero edits to foundation files” becomes structural, because edits to installed packages don’t survive `npm ci`. Capability packs stop colliding with baseline files, because a capability is a dependency plus a config plugin entry. And the tripled documentation goes, because skills and guides install once instead of being copied into every repository.

## A2. Package map from the current code

The candidates below already exist, mostly twice: once in `starters/expo` and once under `codex/skills/mature-app-starter/assets`. Packaging them is how the duplicate baseline gets resolved.

| Package | Current source | Notes |
| --- | --- | --- |
| `@scope/storage` | `services/storage/*` in both trees: `adapterContract`, `ports`, `chunkedStorage`, `installBoundStorage`, `recoveryJournal`, `saveAcknowledgement`, `backup` | Ships the adapter contract test kit so products can prove their own adapters |
| `@scope/core` | `lib/asyncWork`, `lib/resourceCache`, `services/lifecycle`, `hooks/useReducedMotion`, `ThemeProvider`, preference hydration, `RecoveryBoundary` | Behaviour only; theme tokens stay in the template, driven by `brand.json` |
| `@scope/navigation` | `RouteAccessibility`, `scrollMemory`, `useAndroidBackAction`, `services/seo/routePolicy` | Accessibility and platform behaviour the foundation owns |
| `@scope/device` | `app-capabilities/device/*` | Includes a config plugin for permission strings |
| `@scope/notifications` | `app-baseline/src/modules/notifications/*` | Controller plus config plugin |
| `@scope/diagnostics` | `services/diagnostics`, `safeTelemetry` | |
| `@scope/flags` | `featureStore` | |
| `@scope/api-contracts` | Fullstack App Foundation’s `check-api-contracts.mjs`, contract-drift guidance, localhost smoke and recovery patterns, release checklists | Adapted to `src/modules` and `src/services`; replaces the second installer |
| `@scope/check` | `verify-architecture`, `verify-boundaries`, `verify-blueprint`, `verify-accessibility`, `verify-web`, `verify-performance`, `brand-assets`, `release`, `native-smoke` | One command with one rule set (A5) |
| `@scope/eslint-config` | New | Layer, public-API and `process.env` rules expressed as ESLint rules |
| `@scope/journeys` | The shell assertions in `e2e/shell.spec.ts` and the axe helpers | Without the notes steps |

The remaining UI components go to the registry: `Button`, `Card`, `ChoiceGroup`, `ConfirmDialog`, `Field`, `Gallery`, `Presence`, `Screen`, `States` and `Text` from the starter, plus `AppState`, `ContentTransition` and `TransientNotice` from the baseline tree. The two trees implement these differently, so they need one reconciliation pass first. The settings screen becomes a registry recipe.

## A3. Package rules

- **Peer dependencies** on `react`, `react-native`, `expo` and any Expo modules used, so a product never installs a second copy. Duplicate-React and Metro `watchFolders` problems come from linking local packages, not from installing published ones.
- **Compiled output** built with `react-native-builder-bob` or `tsc`, shipped with TypeScript types.
- **A public npm scope,** so consumers need no registry credentials.
- **Changesets** for versions and changelogs, with one GitHub Action in the foundation repository that publishes.
- **The Expo SDK as the compatibility axis.** Moving to a new SDK is a major version of every package that touches native code, and each package states its supported SDK range in `peerDependencies`.
- **A Renovate preset** hosted in the foundation repository that groups foundation packages, so a product receives each foundation release as one reviewable pull request that runs the product’s own checks.
- **Codemods with breaking changes.** When a release changes a config shape or a public API, it ships a `migrate` step in `@scope/check`, named in the release notes, following the Nx migration pattern.
- **An escape hatch.** A product that must change foundation internals copies the package source into its own tree, where it becomes product-owned and leaves the upgrade path. Count this as a Gate 3 failure, not a silent fork.
- **Admission.** New shared code needs two real consumers. Code that already exists in the starter with tests can be packaged now, because packaging changes how it ships, not what it does.

## A4. The thin template

`create-app` produces only what the product owns from the first commit:

- Routes; the home, settings and support screens; and the app-shell layout that composes the foundation providers.
- `brand.json`, `app.config.ts`, `src/config/env.ts`, fonts and theme tokens.
- An ESLint config extending `@scope/eslint-config`, and `package.json` scripts that call `@scope/check`.
- One CI workflow running on Windows and Linux, plus Android and iOS jobs where native support is claimed, with the app’s name templated. The foundation’s current `native-shell.yml` hard-codes `Gather.xcworkspace` and `com.example.gather`.
- A short `AGENTS.md`, a three-line `CLAUDE.md` pointing to it, and `docs/verification.md`.
- An initial Git commit.

The template is rendered in pure Node with no `bash` call, and the foundation repository commits `.gitattributes` (`* text=auto eol=lf`, `*.sh text eol=lf`). Template changes after creation reach products as release notes and, when worth it, a codemod. The `postinstall` dependency patch stays in the template only while needed: each patch names its upstream issue and the release that removes it. If template changes turn out to be frequent, adopt Copier-style recorded answers then; they aren’t needed up front.

## A5. The executable quality contract

This is what an agent iterates against, so it is the most valuable thing the foundation owns.

- `npm run check` calls `@scope/check`. It runs the type check, ESLint with `@scope/eslint-config`, and dependency-cruiser for `tsconfig` path resolution, layer rules and import cycles. Custom code covers only what those tools can’t express, such as thin routes. There is one rule set, used identically by the template, the reference app and CI, with file-and-line messages.
- `@scope/journeys` supplies the shell baseline: appearance and reduced-motion preferences persist, corrupt preference storage is survived without being overwritten, axe reports no violations, and unknown routes reach the 404 screen. Products add their own domain journeys beside these.
- Resilience tests ship with the packages: the storage contract kit, failed-save draft preservation, and injected network failure for `api-contracts`.
- `npm run export:native` runs on every OS without platform SDKs and catches native-only Metro resolution errors that a web build misses. Device proof stays on Android and iOS runners.
- Stable test IDs and accessibility roles are part of the contract, so journeys keep working when products restyle their UI.
- Track check runtime (target under 30 seconds warm) and false blocks. Fix a false positive before adding a new rule.
- Expo inlines `EXPO_PUBLIC_*` values into the shipped bundle, so the configuration rules treat every client-readable value as public and keep API secrets server-side.

## A6. The agent layer

- **`AGENTS.md` stays under about 100 lines:** layout, exact commands, module boundaries, where the reference module is, and what “done” means. Each rule names the check that enforces it or is marked as a judgment call. A prose-only rule is a candidate for a check or for deletion.
- **The reference app is the main teaching material.** Agents copy patterns from working code more reliably than they follow instructions, so keep one complete, tested feature (the notes module) in the foundation repository and expose it through `add recipe notes`.
- **Skills ship as a plugin.** The 11 skills under `codex/skills`, the Claude commands and the custom agents install once per machine instead of being copied into every product. That removes most of the roughly 320 toolkit files that revision 1 measured in a generated app.
- **Each product gets `docs/verification.md`,** adapted from pstack’s verification recipe: launch command, readiness, seed data, build identity, stable handles, observable result, evidence location and cleanup.
- **Risky changes get one focused proof.** Following pstack’s blast-radius recipe, a change to a storage adapter, dependency patch or schema states the assumption that makes it safe and proves it with one test.
- **Planning worksheets are optional.** The doc ablation in Appendix B decides which of the 50 reference guides earn their place.

## A7. Upgrades in this model

1. **Foundation packages.** Renovate opens one grouped pull request per foundation release, and the product’s CI runs its checks and journeys against it. Release notes state whether the release changes the native runtime fingerprint: the starter uses `runtimeVersion: { policy: 'fingerprint' }`, so a native-changing release needs a store build while a JS-only release can ship over the air. A product several releases behind takes them in order, so each release’s codemod runs.
2. **Template changes.** Release notes plus an optional codemod. Nothing merges automatically into product-owned files.
3. **Dependency upgrades** such as a new Expo SDK. Follow Expo’s [incremental upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) one SDK at a time: the foundation first, then products once the foundation release for that SDK exists. Verify a clean `npm ci`, Router query decoding, and web and native export. Retire each lockfile override and dependency patch as soon as its upstream fix lands.
4. **Data migrations.** Specify the supported prior schema versions, write fences on corrupt or unmigrated state, interruption safety and forward-repair rules. Because the starter ships `expo-updates`, a migration delivered over the air can be rolled back to the embedded bundle, which then meets the newer format. Either make the previous reader tolerant of it, or deliver the migration in a store build.

Support the current foundation release and the one before it, with a provisional 90-day window. Longer support is an explicit, costed promise.

## A8. Repository shape

One foundation repository, organized as an npm workspaces monorepo. Expo has configured Metro for workspaces automatically since SDK 52, so the reference app can develop against the packages without manual Metro setup.

```text
packages/          storage, core, navigation, device, notifications, diagnostics,
                   flags, api-contracts, check, eslint-config, journeys
template/          the thin app template rendered by create-app
registry/          copy-on-demand UI components and recipes
apps/reference/    reference app: the notes module, package test bed, agent exemplar
plugin/            agent skills, commands and playbooks
evals/             tasks, hidden acceptance tests, runner and results
```

Product repositories stay separate. Archive `fullstack-app-foundation` once `@scope/api-contracts` is published, after checking whether any app was installed from it.

## A9. Outside the scope

Developer portals, private registries, autonomous schedulers, model routing, multi-agent review panels, signed evidence services and recurring AI status reviews. Each would need its own evidence of need.

---

# Appendix B: Agent evaluation

## B1. Purpose

Revisions 1 and 2 designed a human pilot with one or two developers, which is why they couldn’t use percentages. Blueprint’s main user is a coding agent, and agent runs are cheap and repeatable, so the thesis can be tested properly. The same harness later becomes a regression test for the foundation’s guidance and a tool for pruning it.

## B2. Tasks

Each task has a fixed written prompt, acceptance tests that stay hidden from the agent during the run, and failure tests.

| Task | Prompt in brief | Hidden checks |
| --- | --- | --- |
| T1. Create and brand | Create an app, remove the demo and apply a supplied brand | App runs on web; brand applied; no demo code left; type check passes |
| T2. Persisted workflow | Build a small saved-items feature with failed-save recovery | Data survives reload; a failed save keeps the draft; corrupt storage neither crashes the app nor gets overwritten |
| T3. Adapter swap | Replace the storage adapter with a supplied alternative | Domain modules unchanged; contract tests pass |
| T4. Upgrade | Apply a supplied upgrade that contains one breaking change | Behaviour preserved; customizations kept; data intact |
| T5. Realistic feature | A searchable, filterable list that works offline and has an empty state | Functional tests; no axe violations; offline behaviour; keyboard and reduced-motion support |

In Phase 1 both conditions receive the same third-party breaking upgrade for T4. The foundation-release version of T4 runs in Phase 3, once packages exist.

## B3. Conditions

- **A, bare agent:** `create-expo-app` on the same Expo SDK, no Blueprint files.
- **B, Blueprint today:** an app created from `0d770675` with its full toolkit.
- **C, restructured Blueprint:** run in Phase 3, once the packages exist.

Hold constant the model and its version, effort setting, tools, turn and time limits, machine image, and prompt wording apart from the repository the agent starts in. Run each attempt headless (for example `claude -p` or `codex exec`) in a fresh container, and mount the hidden tests only after the agent finishes.

## B4. Runs and scoring

Run each task five times per condition: 25 runs each for A and B, 50 in Phase 1. Score every run on:

- **Primary:** whether it passed the hidden acceptance tests.
- **Quality:** axe violations, resilience failures, and TypeScript and lint errors under a neutral config, so condition B isn’t scored by its own rules.
- **Cost:** tokens, wall time and agent turns, plus human review minutes on a sample of five runs per condition.

Report counts and ranges, for example 19 of 25 against 11 of 25. At 25 runs per condition, only large differences, around 30 percentage points, stand out from noise. Treat smaller ones as inconclusive, not as wins. Record the actual token cost after the first ten runs and confirm the budget before running the rest.

## B5. Doc ablation

If condition B wins, find out which of the 50 reference guides matter. Remove them in groups of about ten and rerun the two tasks most likely to depend on guidance (T2 and T5) five times each, about 50 runs in total. A group whose removal doesn’t lower results is a candidate for deletion. Testing documents one at a time would need several hundred runs and isn’t worth it.

## B6. Regression use

Rerun condition C on each foundation release that changes guidance or checks, and rerun condition A as well whenever the model changes. Treat a drop of three or more passing runs out of 25 on any task as a reason to investigate before releasing, not as an automatic block.

## B7. Human trial

One developer who didn’t write the foundation runs T1, T5 and a PR handoff using only the repository’s docs. This tests whether the docs and error messages are clear. It is not an effect-size measurement.

---

# Appendix C: Current state at `0d770675`

Rows marked *verified* were checked through the GitHub API for revisions 2 and 3. Rows marked *reported* come from revision 1’s inspection and weren’t re-checked.

| Area | Evidence | Status | Addressed in |
| --- | --- | --- | --- |
| Windows creation | `create-app.mjs` line 52 spawns a bare `bash`. Run from PowerShell or cmd, that resolves to the WSL launcher, or to nothing without WSL. Reproduced on Windows 11 with WSL2: the call exits 127 because the backslashes in the `C:\…` script path are stripped, and WSL would need a `/mnt/c/…` path even with them intact. It works from Git Bash, where Git’s `bash` comes first on `PATH` | Verified (reproduced) | A4, Phase 2 |
| Line endings and CI | No `.gitattributes`; CI runs on Ubuntu plus one macOS iOS job, never on Windows | Verified | A4, Phase 2 |
| Version drift | Node engines `>=22.18.0` at the root and `>=22.13.0` in the starter, with CI on Node 22 and 24; TypeScript `~5.9.3` at the root and `^6.0.3` in the starter | Verified | Phase 2 |
| Provenance | `blueprint-version.json` holds only `starterVersion` (hard-coded `'1.0.0'`) and `toolkitRevision`; no initial Git commit; `create-app.mjs` rewrites `package.json`, `package-lock.json` and `brand.json` | Verified | A4; no longer needed for upgrades (A7) |
| Duplicate baseline | `starters/expo/src` and `codex/skills/mature-app-starter/assets` implement the same areas separately; the storage contract, `asyncWork`, `Presence` and `useReducedMotion` exist in both | Verified | A2 |
| Pack collisions | `scaffold-baseline.mjs` aborts on a `create-app` output because destination files already exist | Reported | A1, A2 |
| Overlapping checks | The starter’s `npm run check` runs `verify-blueprint`, `verify-boundaries` and `verify-architecture`, which disagree on route length, `process.env` scope and layer rules | All three running: verified. Rule conflicts: reported | A5 |
| Demo entanglement | `RootLayout.tsx` mounts `NotesProvider`; `home/screens.tsx` imports `RecentNotes` and links to `/note/new`; `e2e/shell.spec.ts` mixes notes steps with shell checks | Verified | A5, A6, Phase 2 |
| Consumer footprint | A generated app receives about 320 toolkit files on top of 104 app files, including three copies of the 50 reference guides | 50 guides and 104 app files: verified. Totals: reported | A6 |
| Dependencies | Expo 57, React Native 0.86.3, TypeScript 6; `xcode` and `decode-uri-component` overrides; a `postinstall` patch script; 19 advisory entries in `dependency-notes.md` | Pins, overrides and patch: verified. Advisory count: reported | A4, A7 |
| Over-the-air updates | `expo-updates` with `runtimeVersion: { policy: 'fingerprint' }` | Verified | A7 |
| Native CI | `native-shell.yml` builds Android on Ubuntu and iOS with Maestro on macOS, hard-coding `Gather.xcworkspace` and `com.example.gather` | Verified | A4 |
| Fullstack overlap | 48 matching paths (15 identical); installs `src/features/` guidance that Blueprint’s verifier rejects | Reported | A2 (`api-contracts`) |

---

# Appendix D: Delivery detail

## Phase 1. Test the thesis (4–6 days plus token budget)

**Work:** settle the owner decisions; name the two consumers; write the five task prompts and their hidden tests; build the runner (container image, headless agent invocation, scoring script and results table); run conditions A and B. If B wins, run the doc ablation.

**Deliverable:** a results table with counts, ranges and cost per condition, plus a short findings note.

**Exit:** a go or stop decision against Gate 1. A stop ends platform work, as set out in the stop rules.

## Phase 2. Fix creation and restructure distribution (8–12 days)

**Work:**

- Replace the `bash` call with pure-Node rendering; commit `.gitattributes`; add Windows CI; align Node and TypeScript versions.
- Convert the repository to workspaces with the layout in A8.
- Move the notes module into `apps/reference`. In the template, remove `NotesProvider` from the root layout and `RecentNotes` from the home screen, and split the notes steps out of the shell journeys.
- Reconcile the two baseline trees into packages (A2) and the registry.
- Build `@scope/check` and `@scope/eslint-config`, replacing the three overlapping verifiers with one rule set (A5).
- Build `@scope/api-contracts` from Fullstack App Foundation’s four distinct assets.
- Publish the skills as a plugin and thin the template (A4).
- Set up Changesets, the publish workflow and the Renovate preset, and publish 1.0.0 of every package at the end of the phase, so Phase 3’s breaking change is a real major version.

**Deliverable:** published packages, a template that generates a lean app, a registry, a plugin and a reference app, all green in CI on Windows and Linux.

**Exit:** Gate 2 passes in CI. `npm run check`, `npm run build:web`, `npm run export:native` and `npm run test:e2e` pass in the reference app and in a freshly generated app.

## Phase 3. Two consumers and one upgrade cycle (5–8 days)

**Work:** build thin vertical slices in the two products, for example an offline-capable local workflow on `@scope/storage` and a remote-API workflow on `@scope/api-contracts`. Stub authentication behind the adapter: no package supplies it, and real sign-in is product work outside this allowance. Then release one compatible fix and one breaking change with a codemod, and let Renovate deliver both. Rerun the evaluation with condition C.

**Deliverable:** two products on published packages; two foundation releases adopted; recorded upgrade minutes; condition C results.

**Exit:** Gates 3 and 4 pass. Count the slice work as consumer hours, not foundation hours.

## Phase 4. Non-author trial and decision (2–3 days)

**Work:** run the human trial in B7 and score the six gates once.

**Deliverable:** a gate scorecard and a go, narrow or archive decision.

## Phase 5. Observe (4–6 weeks of normal work)

Log upgrades, support interventions, false check blocks, regressions and maintainer hours from PRs and CI. Review after the first real post-pilot upgrade and again at six months.

## Gate thresholds

These are proposals. Confirm them in Phase 1, before any results exist.

| Gate | Test | Pass |
| --- | --- | --- |
| 1. Thesis | Phase 1 evaluation, conditions A and B | B passes at least 7 more of 25 runs than A on hidden acceptance tests (about 30 percentage points); B is not worse than A by 3 or more runs on any single task; B’s median tokens and wall time are no more than 1.5 times A’s |
| 2. Creation and capabilities | Generate an app, remove the demo, brand it, add two capability packages and run every check | Passes on every OS in the declared matrix in 30 minutes or less per OS; no file collisions; no author help |
| 3. Boundary integrity | Two products ship slices | No foundation source copied into or patched in either product; an adapter swap edits no domain module |
| 4. Upgrade | One compatible fix and one breaking change, delivered by Renovate | Routine upgrade in 2 hours or less, breaking upgrade in 1 day or less; no data loss, overwritten branding or lost customization; fingerprint change reported |
| 5. Self-service | A non-author runs creation, a feature PR and a handoff | No undocumented rescues; an illegal import, a raw `process.env` read and a failed save are each caught |
| 6. Economics | Break-even forecast (Appendix E) | Positive within 6–12 months for committed apps, or the owner records a reason to subsidize quality; routine support of 1 hour per app per month or less |

---

# Appendix E: Economics

```text
Net labour benefit =
  sum over committed apps (comparator hours - Blueprint hours)
  - foundation build hours
  - foundation maintenance, release and support hours
```

Keep consumer and foundation hours separate. When converting to money, include token spend on agent work and evaluations, and CI and macOS runner time.

An illustrative check, to be replaced by Phase 3 measurements: Phases 1, 2 and 4 take 14–21 days (112–168 hours), and six months of maintenance takes 48 hours, so shared cost is 160–216 hours. At 48 hours saved per app, break-even needs four or five committed apps; at 80 hours saved, two or three.

Hours miss two things. The evaluation may show quality gains, such as fewer escaped defects or better accessibility, that never appear as saved hours; Gate 6’s recorded-judgment option exists for that case. And packages cut each product’s cost per upgrade to reviewing one pull request, which Phase 3 measures directly.

---

# Appendix F: Research basis

## Approaches

| Approach | What the adopter gets | After customization |
| --- | --- | --- |
| Starter or template | An initial app | The app owns its copy; improvements need deliberate adoption |
| Source distribution | Editable components or recipes | High local freedom; merging later changes is the adopter’s job |
| Shared package | A versioned dependency with a public interface | Improvements arrive through upgrades |
| Generator and migrations | Repeatable creation and controlled transformations | Structure evolves through tested changes |
| Software product line | Managed common assets for a defined product family | Commonality and variation are designed together |
| Internal developer platform | A supported way to create and run software | Has users, owners and a lifecycle |

Revisions 1 and 2 leaned mainly on the first and fourth rows. This revision uses each approach for what it does best: packages for what the foundation keeps fixing, a template for what the product owns, and source distribution for what the product restyles.

## Repositories and documentation worth studying

All were checked through GitHub on 29 October 2026 and are active.

- [Ignite](https://github.com/infinitered/ignite): starter ergonomics and demo removal. Its navigation differs from Blueprint’s Expo Router, so treat it as a design reference, not a drop-in. Latest push June 2026.
- [react-native-reusables](https://github.com/founded-labs/react-native-reusables): shadcn-style copy-on-demand components for React Native, and the closest model for Blueprint’s registry.
- [shadcn ui](https://github.com/shadcn-ui/ui) and its [registry documentation](https://ui.shadcn.com/docs/registry): publishing your own copy-on-demand registry.
- [Expo config plugins](https://docs.expo.dev/config-plugins/introduction/) and the [monorepo guide](https://docs.expo.dev/guides/monorepos/): packaging native capabilities, and developing packages beside an app.
- [react-native-builder-bob](https://github.com/callstack/react-native-builder-bob): building React Native libraries.
- [Changesets](https://github.com/changesets/changesets) and [Renovate](https://github.com/renovatebot/renovate): releasing packages and delivering upgrades as pull requests.
- [Create T3 Turbo](https://github.com/t3-oss/create-t3-turbo): which responsibilities live in shared packages and which stay in each app.
- [Nx migration generators](https://nx.dev/docs/kb/migration-generators): shipping a codemod with the release that needs it.
- [Copier](https://copier.readthedocs.io/en/stable/updating/): template updates from recorded answers, if template changes ever become frequent.
- [JHipster upgrades](https://www.jhipster.tech/upgrading-an-application/): treating upgrades as a core user journey.
- [Backstage software templates](https://backstage.io/docs/features/software-templates/): an option for many teams and many templates later, not a next step.
- [pstack](https://github.com/cursor/plugins/tree/1ba91fc25c0977741dd0e267849e6234b037ed0a/pstack) (MIT licence): verification, blast-radius and benchmark recipes for agent work. Keep its notice when copying substantial material.

## Principles

- **Parnas on modular decomposition** ([1972](https://doi.org/10.1145/361598.361623)): hide the decisions likely to change behind interfaces, and test a boundary by swapping an implementation.
- **SEI on [variability in product lines](https://www.sei.cmu.edu/library/variability-in-software-product-lines/):** support a few explicit variations, such as brand, platform, persistence adapter and selected capabilities. Ten independent switches make 1,024 combinations nobody can test.
- **Sandi Metz, [The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction):** extract shared code from repeated real needs, and pull it back out when product-named conditions accumulate.
- **The CNCF [platform maturity model](https://tag-app-delivery.cncf.io/whitepapers/platform-eng-maturity-model/) and [DORA’s platform guidance](https://dora.dev/capabilities/platform-engineering/):** treat developers, and here agents, as users; maturity costs investment and is not a goal in itself.
- **[SPACE](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/) and [DevEx](https://www.michaelagreiler.com/wp-content/uploads/2024/06/DevEx-WhatDrivesProductivity.pdf):** judge speed alongside quality, cognitive load and maintenance cost, never on one number.
- **[DORA metrics](https://dora.dev/guides/dora-metrics/):** once products deploy, track lead time, deployment frequency, change failure rate, recovery time and rework per app as context, not as quotas.

---

# Appendix G: Revision history

- **Revision 1:** the original research and delivery plan. A single starter, manifest-tracked source with a custom hash-and-merge upgrader, packages deferred until two consumers existed, and a human pilot judged by six gates.
- **Revision 2:** corrections verified against the repository (Windows failure cause, footprint arithmetic, first-pass rate, unsourced percentages, Gate 6 wording), plus gaps in the upgrader design and missing native and over-the-air proof.
- **Revision 3 (this one):** rewritten as a decision memo with appendices. The main changes:
    - Tests the “blueprint vs rawdogging” thesis first, with an agent evaluation, before any platform work.
    - Replaces copying everything plus a custom upgrader with one distribution channel per kind of asset. The hash manifest, ownership tiers and `upgrade-app.mjs` are dropped.
    - Removes revision 1’s reason for deferring packages. Duplicate-React and Metro problems come from linking local packages, and Expo has configured Metro for monorepos automatically since SDK 52.
    - Makes the executable quality contract the core product, and ties every `AGENTS.md` rule to a check or a judgment label.
    - Keeps the notes module as a reference for agents instead of only tearing it out.
    - Adds a package map drawn from the current code, a doc-ablation method for pruning the 50 guides, and a re-estimate of 19–29 days with a go or stop point after the first 4–6.
    - Carries forward revision 2’s verified findings in Appendix C, with verified and reported rows marked.
