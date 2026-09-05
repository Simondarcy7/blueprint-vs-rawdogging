# App Startup Blueprint

Use this as the starting structure for a serious new app. Adapt it to the app's actual stage,
platform, and risk profile.

## Product Foundation

- Problem statement:
- Target user:
- First valuable workflow:
- Primary success metric:
- Explicit non-goals:
- High-risk assumptions:

## UX Foundation

- Primary navigation:
- Core screens or routes:
- Empty states:
- Loading states:
- Error and recovery states:
- Permission-denied states:
- Offline or degraded states:
- Accessibility checks:

## Technical Foundation

- Platform:
- App framework:
- Backend strategy:
- Data storage:
- Auth strategy:
- File/storage strategy:
- Analytics strategy:
- Error reporting:
- Deployment target:

## Default Technical Preferences

These are defaults, not laws. Start here unless the project context clearly points to a newer,
simpler, safer, or more suitable choice. Record meaningful deviations in an ADR.

- Language: TypeScript by default.
- Web frontend: React by default.
- Mobile or cross-platform: Expo React Native by default.
- Routing: use the framework-native router; keep route, page, and screen files thin.
- Styling/UI: use one consistent design system or component approach; avoid one-off styling patterns.
- State: start with local/component state; add shared state only when real cross-feature need appears.
- Backend: start behind typed service boundaries; keep backend details out of UI.
- Data: choose storage based on sensitivity, ownership, sync needs, and query shape.
- Runtime config: centralize environment access in one config module.
- Analytics: use a typed wrapper; do not call vendors directly from screens/components.
- Error reporting: add behind a wrapper before beta, external testers, or production usage.
- Testing: typecheck and lint from day one; unit-test product logic before broad UI tests.
- Documentation: create ADRs for stack, backend, testing, analytics/observability, and sensitive-data handling.
- Agent setup: create root `AGENTS.md`; add domain `AGENTS.md` files only where they reduce repeated mistakes.

## Suggested Structure

```text
app-or-routes/
src/
  features/
  components/
  services/
  lib/
  config/
  types/
  test/
docs/
  adr/
```

## First Tasks

1. Create repo structure and instruction layers.
2. Add app shell and first real workflow skeleton.
3. Add config/env boundary.
4. Add service boundary stubs.
5. Add first focused domain test.
6. Add basic observability/error-handling decision.

## Quality contract

Use `quality-foundation.md` to record public/private route policy, accessibility acceptance checks, image and bundle budgets, data/telemetry decisions, and release verification in `docs/app-quality-contract.md`. Implement relevant checks with the first workflow. Choose platform-specific defaults; mark inapplicable requirements N/A with a reason.

## Expo Router profile

For Expo Router, read `expo-project-structure.md` from the mature-app-starter references (or installed `docs/foundation/`) before applying the generic tree. Prefer `src/app/` plus `src/modules/` for a new project using that profile, preserve an established `src/features/` convention, and document responsibilities, public APIs and dependency direction. Do not create both product hierarchies.
