---
name: stack-decider
description: Use when explicitly choosing a stack or documenting a deviation from toolkit defaults.
---

# Stack Decider

Use this skill to make stack decisions explicit and reversible.

## Defaults

- TypeScript by default.
- Expo Router for the product web surface, sharing the Expo application.
- Expo React Native + Expo Router for native and web.
- Framework-native routing.
- Typed service boundaries.
- Typecheck/lint from day one.

Follow the required BLUEPRINT.md contract; comparing alternatives does not authorize adopting one.

Read the project BLUEPRINT.md first, or `../mature-app-starter/references/required-blueprint.md` when planning from the installed skills.

## Workflow

1. Identify target platforms, team skill, timeline, risk, and deployment needs.
2. Compare default choice against plausible alternatives.
3. Recommend exceptions only when justified; obtain explicit user direction before departing from the required stack. Do not ask again if already directed.
4. Document meaningful deviations with `adr-writer`.
5. Name what complexity is intentionally deferred.

Return a concise recommendation with tradeoffs and revisit triggers.
