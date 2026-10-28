# New Project Kickoff Checklist

Use this before or during the first repo setup.

Use the mature-app-starter `references/start-here.md` as the compact entry point (repository: `docs/start-here.md`). Record motion purpose and interruption/reduced-motion behavior alongside navigation, data and recovery decisions in the app baseline. Optional patterns belong in its `references/feature-recipes.md` catalogue, not the default backlog.

## Product Clarity

- Problem:
- Target user:
- First valuable workflow:
- Why now:
- Non-goals:
- Riskiest assumption:

## UX Shape

- Primary task surface:
- Navigation model:
- Core screens:
- States needed: empty, loading, error, success, permission-denied, offline/degraded.
- Accessibility constraints:
- Trust and safety concerns:

## Technical Direction

- Platform:
- Framework:
- Backend approach:
- Data model maturity:
- Auth requirement:
- Deployment target:
- Observability:

## Repo Setup

- Create root `AGENTS.md`.
- Create `docs/project-index.md`.
- Create `docs/adr/`.
- Create `src/modules/`, `src/components/`, `src/services/`, `src/lib/`, `src/config/`, `src/types/`, `src/test/`.
- Add domain `AGENTS.md` files only where useful.
- Add typecheck, lint, format, and test scripts.
- Add `.env.example` if runtime config exists.

## First Implementation Slice

- Build the app shell.
- Stub the first real workflow.
- Add one typed service boundary.
- Add one focused test around product logic.
- Add the first ADRs.
- Run the narrowest verification that proves the setup.

## Quality contract

At handoff report what exists, what is stubbed, commands/results, known gaps and the next useful task.

- Create `docs/app-quality-contract.md` from the installed template, or record equivalent decisions using the mature-app-starter quality-foundation reference.
- Classify public/private web routes and choose rendering/indexing behavior.
- Name the first keyboard/screen-reader workflow and required recovery states.
- Set image-variant, JavaScript and font budgets for the actual platform and device/network target.
- Decide data collection, telemetry sanitation and consent behavior.
- Map applicable checks to real commands/manual steps; mark pending and N/A honestly.
- Carry these checks into the first workflow and CI; recheck after framework/hosting migrations.

## First-screen behavior

- Decide shell, primary navigation, useful sticky surfaces, safe areas and Back/deep-link behavior.
- Record loading versus refresh, first-use versus no-results, form validation and input-preservation states.
- Name the first persistence/capability failure to verify, where applicable.
- Set a runtime performance baseline and realistic data-volume fixture.
- Use the screen-behavior template; run the optional feature generator only when it fits the chosen stack.

## Generic starting features

- Read the generic-app-baseline guide and complete `docs/app-baseline.md`.
- Integrate settings, persisted appearance/motion, support/about and shared loading/recovery behavior using the app's design system.
- Record notification applicability and public-web SEO policy. Keep delivery providers and other external services disabled until selected and verified.
- Review the installed skill's `assets/app-baseline/README.md` before copying source; preserve existing code and verify host adapters.

## Scope and motion decisions

- Read product-scope-and-polish for a first complete loop, included quality work and explicit exclusions.
- For interaction/motion work, read animation-playbook and record included effects or deliberate static treatments.
- Name the shared token/component owner, immediate state changes, cancellation and reduced-motion alternatives.
- Use the motion-plan worksheet or equivalent feature-spec fields; record deferred owner/trigger and actual screen/platform coverage.
- Select optional haptics, audio and celebration deliberately; they never imply another product capability.

## Carry mature product behaviour into the first workflow

- Use product-behavior-map to select applicable topic guides without loading the entire library.
- Record the workflow's failure, interruption and return paths as well as happy-path screens.
- Use product-behavior-spec or equivalent feature-spec fields for navigation, input, data, feedback, identity and evidence decisions.
- Classify optional capabilities explicitly; keep domain rules, brand and provider policy app-owned.
- Name the relevant state/gallery fixtures and actual platform/backend checks. A populated worksheet does not mean acceptance passed.
