# ADR Templates

Use concise ADRs. Record the decision, the context, the tradeoff, and what would make the team
revisit it.

## ADR File Template

```md
# ADR NNNN: Title

Date:
Status: Proposed | Accepted | Superseded

## Context

What problem are we solving? What constraints matter?

## Decision

What are we choosing?

## Consequences

- Positive:
- Negative:
- Follow-up:

## Revisit When

- 
```

## Baseline ADRs For A New App

### Stack And Platform Choice

- Target platforms.
- App framework.
- Default preference: TypeScript + Expo React Native + Expo Router for native and web; exceptions require explicit user direction and an ADR.
- Alternatives considered, including newer or simpler options.
- Hosting/deployment target.
- Why this stack is sufficient for the first serious version.
- What complexity is intentionally deferred.

### App Structure And Module Boundaries

- Route/page/screen ownership.
- Feature module boundaries.
- Shared UI promotion rule.
- Service boundary rule.
- Config/env rule.

### Backend And Data Strategy

- Current backend state: stubbed, local-only, managed backend, custom API, or existing API.
- Data sensitivity level.
- Storage and retention assumptions.
- Migration strategy if applicable.
- Export/deletion expectations if applicable.

### Auth And Permissions

- Whether identity is needed for the first workflow.
- User roles.
- Recovery path.
- Permission checks and ownership model.

### Testing Strategy

- Typecheck/lint standard.
- Unit test targets.
- Component test targets.
- End-to-end timing.
- Manual verification expectations.

### Analytics And Observability

- Error reporting choice.
- Analytics event boundary.
- Typed wrapper shape for analytics and error reporting.
- Privacy constraints.
- Event naming convention.
- Production monitoring threshold.

### Sensitive Data Handling

- Data classes.
- Where sensitive data is stored.
- Secrets management.
- Consent, retention, audit, and deletion assumptions.
- Expert review required, if any.
