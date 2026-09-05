# New Project Kickoff Checklist

Use this before or during the first repo setup.

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
- Create `src/features/`, `src/components/`, `src/services/`, `src/lib/`, `src/config/`, `src/types/`, `src/test/`.
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

- Create `docs/app-quality-contract.md` from the installed template, or record equivalent decisions using the mature-app-starter quality-foundation reference.
- Classify public/private web routes and choose rendering/indexing behavior.
- Name the first keyboard/screen-reader workflow and required recovery states.
- Set image-variant, JavaScript and font budgets for the actual platform and device/network target.
- Decide data collection, telemetry sanitation and consent behavior.
- Map applicable checks to real commands/manual steps; mark pending and N/A honestly.
- Carry these checks into the first workflow and CI; recheck after framework/hosting migrations.
