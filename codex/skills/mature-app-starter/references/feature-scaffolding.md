# Feature scaffolding

Use the optional dependency-free Node script to create a feature ownership boundary. It writes only `README.md`, `types.ts` and `index.ts`; add a screen using the chosen framework and keep routing thin. No dependencies, route registrations, vendor code or placeholder tests are installed.

From an app with the Codex toolkit installed:

```sh
node .agents/skills/mature-app-starter/scripts/create-feature.mjs --root . --name saved-items
```

For Claude, use `.claude/skills/mature-app-starter/scripts/create-feature.mjs`. From the toolkit source, use `codex/skills/mature-app-starter/scripts/create-feature.mjs`.

The default destination is `src/features/saved-items`. Pass `--layout modules` for `src/modules/saved-items`. The project root must already exist. Names must be lowercase kebab-case starting with a letter. The command rejects existing destinations and symlinked source/layout directories; it never overwrites an existing feature.

The starter state is deliberately minimal. Add only states the workflow needs, describe them with the screen-behavior template, and write tests for real transitions or validation. Create components/hooks/services folders only as work requires them. The generated public API exports types initially; explicitly export supported feature entrypoints as they are implemented.

Use this for TypeScript apps with feature/module ownership. Other stacks can copy the convention without running the generator.
