# MVP Boundary And Screen Map

Use this to keep early products focused and testable.

## MVP Boundary

Define the first useful version by the smallest loop that proves the core value proposition.

Capture:

- Core value proposition.
- MVP scope.
- V1 scope.
- Later scope.
- Explicitly excluded work.
- First beta screens or surfaces.
- Mock/stub requirements for the build phase.
- Future API or backend contract TODOs.

## Scope Rules

- The MVP should prove user understanding and trust before broad automation.
- Exclude monetization, complex personalization, and broad admin tooling until the core loop works.
- Do not require login for the first workflow unless identity is central to value or safety.
- Keep account-gated actions behind later boundaries.
- Treat placeholders as explicit product decisions, not forgotten work.

## Screen Map Template

For each screen or route, capture:

```md
## Screen Name

Purpose:

Primary actions:

- 

Required data:

- 

States:

- Empty
- Loading
- Ready
- Error
- Permission denied
- Offline/degraded
```

## Trust And Error States

Prefer plain-language states:

- Input cannot be read: offer retry or manual entry.
- Data is uncertain: ask for confirmation before acting.
- External provider unavailable: show unavailable, not zero or blank.
- Data is stale: label it clearly.
- Partial result: show what is known and mark what is missing.
- No reliable result: explain why and offer an edit/retry path.

## Beta Metrics

Pick one primary metric that proves the core loop works.

Examples:

- User completes first workflow under a target time.
- User understands result without explanation.
- User returns to repeat the workflow.
- User trusts output enough to act or save it.

## Include quality in the scope

For each included workflow, scope interaction states, context preservation and feedback alongside screens. Separate foundational usability from optional character and later capabilities using [product scope and polish](product-scope-and-polish.md). Name arrival/change/exit treatments, or an intentional static choice, with [the animation playbook](animation-playbook.md). Acceptance covers the whole loop and its failure path, not just the happy-path screen count.
