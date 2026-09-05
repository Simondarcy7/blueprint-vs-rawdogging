# Intentional Expo project structure

Use this profile for an Expo application with Expo Router and TypeScript. The goal is feature ownership: a change to one capability should be understandable mostly within that module, while routes, shared infrastructure and branding remain easy to locate.

`src/app` follows Expo Router conventions. `src/modules`, public module APIs and the other boundaries below are toolkit choices, not requirements imposed by Expo. This blueprint requires `src/modules`. If an existing project uses a different structure, report the conflict and agree an adoption/migration or exception with the user before changing it. Record that decision in `docs/project-index.md` and an ADR.

## Folder map

This is a growth map, not a command to create every directory. Start with the first workflow, its route, config, theme and required services. Add other folders only when they own real code.

```text
project/
├── app.config.ts                  # Expo build/application configuration
├── package.json                   # Dependencies, scripts, Router entrypoint
├── tsconfig.json                  # TypeScript; @/* maps to ./src/*
├── eas.json                       # EAS build profiles, if used
├── .env.example                   # Documented inputs; no real secrets
├── assets/                        # Bundled images, fonts and icons
├── public/                        # Web static files, if needed
├── scripts/                       # Generation and focused verification
├── docs/
│   ├── project-index.md           # Orientation, ownership and commands
│   ├── app-quality-contract.md
│   └── adr/                       # Decisions and their reasons
├── e2e/                           # Stable cross-feature journeys, if needed
└── src/
    ├── app/                       # Routes and Router special files only
    │   ├── _layout.tsx            # Root navigation/provider composition
    │   ├── +not-found.tsx         # Unknown-route entrypoint
    │   ├── (tabs)/
    │   │   ├── _layout.tsx        # Tab configuration
    │   │   ├── index.tsx          # Home route
    │   │   └── saved-items.tsx    # Thin module-screen entrypoint
    │   └── items/
    │       └── [id].tsx           # Dynamic detail route
    ├── modules/                   # Product capabilities
    │   ├── home/
    │   ├── saved-items/
    │   │   ├── index.ts           # Deliberate public API
    │   │   ├── types.ts           # Feature-owned types
    │   │   ├── constants.ts       # Feature-owned values, if needed
    │   │   ├── screens/
    │   │   │   └── SavedItemsScreen.tsx
    │   │   ├── components/        # Feature UI, not global primitives
    │   │   ├── hooks/             # React orchestration/selectors
    │   │   ├── services/          # Feature operations and payload mapping
    │   │   ├── store/             # Feature state, only if required
    │   │   ├── helpers/           # Pure feature calculations/transforms
    │   │   ├── navigation/        # Feature navigation helpers, if needed
    │   │   └── __tests__/         # Or co-located *.test.ts(x)
    │   └── navigation/            # Shared shell/layout composition if it grows
    ├── components/
    │   └── ui/                    # Accessible shared primitives
    ├── theme/                     # Semantic colors, spacing, typography
    ├── config/                    # Brand, product, navigation, env, data policy
    ├── services/                  # Shared platform/vendor adapters
    │   ├── api/                   # Transport/auth headers/error normalization
    │   ├── storage/
    │   ├── analytics/
    │   └── notifications/
    ├── foundation/
    │   └── contracts/             # Optional vendor-neutral reusable interfaces
    ├── state/                     # Truly app-wide providers/composition only
    ├── lib/                       # Small domain-independent utilities
    └── test/                      # Shared fixtures/setup, not all product tests
```

Use the config files appropriate to the existing project (`app.json` or dynamic config, for example); do not duplicate configuration unnecessarily. Build/tool config and `public/` remain at the project root. Choose one active route root: `src/app`, not a parallel second `app/` tree. See [Expo's src-directory guidance](https://docs.expo.dev/router/reference/src-directory/).

## Why these boundaries exist

| Location | Owns | Keep out |
| --- | --- | --- |
| `app/` | URL structure, route groups, Router entrypoints and layout wiring | Business rules, ordinary helpers, tests and general components |
| `modules/<name>/` | One user capability and its private implementation | Unrelated features and global dumping grounds |
| `components/ui/` and `theme/` | Reusable accessible behavior and visual tokens | Domain rules or a dependency on feature state |
| `config/` | Validated environment inputs and declarative app choices | Runtime feature/service implementation; client secrets |
| `services/` | Reusable external-system adapters | Screen rendering and feature UI dependencies |
| `foundation/contracts/` | Stable interfaces that can serve multiple products | Concrete SDKs, app branding, feature imports |
| `state/` | Cross-feature provider wiring and genuinely shared state | Every feature's drafts and duplicate copies of server caches |
| `lib/` | Small pure general utilities | A catch-all for unclassified product logic |

Feature service code may call shared adapters: for example, `modules/saved-items/services/` maps item operations while `services/api/` owns transport. An established `api/` name inside a feature is also reasonable; choose `api/` or `services/` deliberately rather than making both mean the same thing.

Keep types/models local until multiple consumers need the same contract. Keep draft state in the feature and view state in the component when possible. A top-level `models`, `store`, or `common` folder is not a prerequisite; precise ownership is more useful than a large shared bucket.

## A thin route and public module API

Once the screen exists, export it deliberately:

```tsx
// src/modules/saved-items/index.ts
export { SavedItemsScreen } from './screens/SavedItemsScreen';
export type { SavedItem } from './types';

// src/app/(tabs)/saved-items.tsx
export { SavedItemsScreen as default } from '@/modules/saved-items';
```

This is an illustrative pair of files, not the output of the minimal generator. Routes may also adapt/validate route parameters or provide supported Router exports; the rule is minimal routing work, not a universal one-line limit. `_layout.tsx` can compose providers and navigators; move growing implementations into a shell/navigation module. Group folders such as `(tabs)` organize navigation without adding that segment to URLs. A `[id]` route must handle missing/invalid parameters and missing records. Follow [Router concepts](https://docs.expo.dev/router/basics/core-concepts/) and [navigation layouts](https://docs.expo.dev/router/basics/navigation-layouts/).

Expo Router normally uses `expo-router/entry` as the package entrypoint and the root `_layout.tsx` for initial composition; do not copy an `App.tsx` entry convention from a differently configured React Native app. Use a custom entry only when justified and follow the [installation instructions](https://docs.expo.dev/router/installation/).

## Imports, naming and platform differences

- Other modules and routes import a module's `index.ts` public API, not private screen/store/helper paths. Inside a module, prefer direct relative imports so internal files do not cycle back through their own barrel.
- Keep public exports small and intentional. If cross-feature dependencies form cycles, move orchestration upward or extract the genuinely shared contract; do not hide cycles behind more barrels.
- Use kebab-case module names, PascalCase component/screen files, and descriptive hooks such as `useSavedItems.ts`. Match existing project conventions instead of renaming unrelated files.
- Keep `.web`, `.native`, `.ios` or `.android` adapters beside their common interface outside `app/` where practical. Provide compatible exports and supported-platform fallbacks. Platform-specific route files require a non-platform route counterpart; check [Expo's platform-module rules](https://docs.expo.dev/router/advanced/platform-specific-modules/).
- Root-level `modules/` can also hold local native Expo Modules in some projects; that is a different concept from product features in `src/modules/`. Document both explicitly if present.
- Keep backend/server code and credentials outside client-importable modules. Intentional Router server endpoints need their own trust boundary and SDK-specific configuration.

## Starting and checking the structure

With the toolkit installed, create the initial module files using:

```sh
node .agents/skills/mature-app-starter/scripts/create-feature.mjs --root . --name saved-items --layout modules
```

Use `.claude/skills/` for the Claude installation. This creates `README.md`, `types.ts` and `index.ts` only. Add the screen, real domain types and route as the workflow is implemented; add a focused behavior test rather than testing placeholder values.

The installer places module instructions directly in `src/modules/AGENTS.md` for Codex and `src/modules/CLAUDE.md` for Claude. It never creates `src/features/`. Existing instructions are preserved unless deliberately replaced; reconcile conflicts before claiming blueprint adoption. Keep route guidance in root/module instructions, not a Markdown file inside `src/app`.

At kickoff, check file placement, alias resolution and the selected convention. As the app grows, add focused lint/dependency checks for private cross-module imports, cycles, environment reads outside config and foundation-to-feature coupling. Verify supported platform imports, typecheck, relevant tests and a deep-link/navigation smoke path. The installed `scripts/verify-blueprint.mjs` checks structural requirements only; import-graph, behavioral and platform checks remain necessary.

Checked against Expo documentation on 2026-09-05. Read the documentation matching the installed SDK/Router versions before implementing version-sensitive APIs. Feature packaging, names and ownership rules remain project decisions.
