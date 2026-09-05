# ADR Templates

Use concise ADRs. Record the decision, the context, the tradeoff, and what would make the team
revisit it.

## Baseline ADRs

- Stack and platform choice.
- App structure and module boundaries.
- Backend and data strategy.
- Auth and permission model.
- Testing strategy.
- Analytics, observability, and error reporting.
- Sensitive-data handling.

## Stack And Platform Choice

- Target platforms.
- App framework.
- Default preference: TypeScript + Expo React Native + Expo Router for native and web; exceptions require explicit user direction and an ADR.
- Alternatives considered, including newer or simpler options.
- Hosting/deployment target.
- Why this stack is sufficient for the first serious version.
- What complexity is intentionally deferred.

## Analytics And Observability

- Error reporting choice.
- Analytics event boundary.
- Typed wrapper shape for analytics and error reporting.
- Privacy constraints.
- Event naming convention.
- Production monitoring threshold.

See `templates/adr-template.md` for the copyable template.
