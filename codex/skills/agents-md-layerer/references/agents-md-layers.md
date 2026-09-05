# AGENTS.md Layers

Use layered instructions so Codex gets the right context without loading a giant rulebook.

## Recommended Layers

- Global personal rules: token discipline, collaboration preferences, safety defaults.
- Project root `AGENTS.md`: app-wide architecture, workflow, verification, dependency, and subagent policy.
- Domain files: `src/modules/AGENTS.md`, `src/services/AGENTS.md`, backend/schema `AGENTS.md`.
- Repo skills: reusable project workflows once the work pattern repeats.

## Rule Of Thumb

Add a nested `AGENTS.md` only when that folder has repeated rules that differ from the project root.
Too many instruction files create maintenance noise.

See `templates/AGENTS.md` for a copyable root template.
