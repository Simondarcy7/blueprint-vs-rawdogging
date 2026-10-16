# Token Utilization

Use this to keep AI-assisted development efficient and accurate.

## Before Implementation

Ask Codex to briefly estimate:

1. Files/context likely to be loaded.
2. Whether repo-wide search is needed.
3. Whether subagents are needed.
4. Whether tests/builds are needed.
5. Biggest token risks.
6. Lower-token plan.

## During Work

- Prefer targeted file reads over broad scans.
- Use `rg` for text/file search.
- Read summaries, indexes, and manifests before large files.
- Summarize findings instead of pasting large code blocks.
- Avoid reading generated folders, build artifacts, and dependency trees.
- Stop before broad refactors.
- Ask before spawning subagents unless the user has already requested parallel work.

## Good Defaults

- Read `AGENTS.md`, task docs, package scripts, and only relevant implementation files.
- Use small diffs.
- Run the narrowest verification that proves the change.
- End with commands run, known gaps, and token-use notes.

## Subagent Cost Discipline

Use subagents when:

- The user explicitly asks.
- The task has independent tracks.
- File ownership can be split cleanly.
- Parallelism saves meaningful time.

Avoid subagents when:

- The task is small.
- The work touches the same files.
- The result depends on a single blocking decision.
- Coordination cost exceeds speed benefit.
