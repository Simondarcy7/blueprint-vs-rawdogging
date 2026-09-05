# Product module instructions

Read BLUEPRINT.md at the project root. These instructions apply to src/modules for both Codex (AGENTS.md) and Claude (CLAUDE.md). Product modules are required; report an existing conflicting hierarchy instead of creating a second one.

- Each module owns one capability: screens, local components, hooks, services, state, helpers, types and tests as needed. Do not precreate unused folders.
- Expose supported entrypoints from `index.ts`. Other modules and routes use that public API; internal files use direct relative imports instead of their own barrel.
- Keep Expo Router files in `src/app/` focused on routing and layout composition. Put normal UI and business rules here, outside the route tree.
- Keep reusable accessible primitives under `src/components/ui/`, theme values under `src/theme/`, and shared vendor/platform adapters under `src/services/`.
- Feature services may map product operations onto shared adapters. Do not scatter vendor SDK calls through screens.
- Keep feature state/types local until a real cross-feature need emerges. Keep config declarative and foundation contracts independent of product implementation.
- Keep platform variants near their common interface and verify all supported platforms.
- Test real validation, calculations, transitions and error recovery. Co-locate tests or use a module-local `__tests__/` directory; never place ordinary tests in `src/app/`.
- Use the installed mature-app-starter `references/expo-project-structure.md` for the ownership map and Router-specific exceptions.
