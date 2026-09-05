---
name: agents-md-layerer
description: Use when creating, reviewing, or restructuring AGENTS.md, CLAUDE.md, or scoped instruction files for a project, including root, feature, service, backend, or domain-level guidance.
---

# Agents Layerer

Use this skill to create layered project instructions without bloating context.

Read the project BLUEPRINT.md first, or `../mature-app-starter/references/required-blueprint.md` when planning from the installed skills.

## Workflow

1. Inspect existing project structure.
2. Use `references/agents-md-layers.md`; fall back to `docs/foundation/agents-md-layers.md` and `templates/AGENTS.md` when installed.
3. Create a root instruction file for project-wide behavior.
4. Add nested instruction files only where folder-specific rules reduce repeated mistakes.
5. For Claude Code, emit `CLAUDE.md` with equivalent root guidance.

## Recommended Layers

- Root: architecture, workflow, verification, dependency, token, and subagent policy.
- `src/modules/`: feature boundaries and product-logic testing.
- `src/services/`: integration boundaries, typed stubs, and vendor isolation.
- Backend/schema folder: migrations, data policy, permissions, and verification.

Avoid creating instruction files for every folder by default.
