# Service Boundaries And Stubs

Use typed service boundaries when backend, vendor, AI, storage, analytics, or integration details are
not yet settled.

## Rule

Start uncertain integrations as typed service modules, not scattered calls from screens or feature
components.

Good:

- `src/services/api/client.ts`
- `src/services/analytics/index.ts`
- `src/services/storage/client.ts`
- `src/features/<feature>/<feature>-service.ts`

Avoid:

- Direct vendor calls from UI.
- Temporary fetch calls in routes/pages/screens.
- Hardcoded backend assumptions in components.
- Broad shared types before contracts are real.

## Stub Strategy

A useful stub should:

- Match the future contract shape.
- Return realistic success, empty, partial, stale, unavailable, and failed states.
- Be deterministic enough to test.
- Keep mock data close to the feature until reuse is real.
- Make it obvious when the real backend is not configured.

## Runtime Parsing

When a service receives untrusted data:

- Parse `unknown` payloads into typed domain objects.
- Reject incomplete or malformed payloads before UI logic uses them.
- Keep parse errors clear and actionable.
- Unit-test malformed payload handling.

## Backend Promotion Rule

Only add real persistence or migrations when:

1. A user-facing flow needs persisted data.
2. Ownership and permission rules are known.
3. The service boundary is clear.
4. The app has a verification path for schema-dependent code.
5. Retention, deletion/export, and audit needs are understood when data is sensitive.

## Capability and mutation behavior

Distinguish unsupported, unconfigured, permission-denied, cancelled and failed outcomes where they imply different user actions. Define cancellation/stale-response handling for reads and retry/idempotency behavior for consequential mutations. A disabled button does not replace a server-side duplicate-operation policy. Keep optional capabilities from blocking unrelated core workflows.
