# Observability extraction: first implementation

Status: local implementation and automated contract verification; no provider connection, native SDK configuration, deployment or production validation.

## Source and preserved decisions

Donor: `Simondarcy7/golf-scoring-app` at `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df` (29 October 2026 inspection).

| Donor implementation | Decision carried forward | Destination |
| --- | --- | --- |
| `mobile/src/services/analytics/productAnalytics.ts` | No events before resolved consent; generation tickets invalidate waiting work on revoke and account change; serialize consent transitions | `diagnostics/src/services/analytics/analyticsClient.ts` |
| `mobile/src/services/analytics/nativeProductAnalytics.ts` | Independent providers, so one provider's initialization or delivery failure cannot disable the others | `diagnostics/src/services/analytics/analyticsFanout.ts` |
| `mobile/src/services/analytics/analyticsPolicy.ts` | Production-only product analytics | `analyticsClient.ts` |
| `mobile/src/services/observability/crashReporting.web.ts` | Lazy reporting; reporter failures must not break the workflow handling the original error | `diagnostics/src/services/observability/sentryReporter.ts` |
| `mobile/src/services/observability/crashReportingSanitizer.ts` | Restrict diagnostic context and remove user text and navigation data | `sentryReporter.ts`, using existing Blueprint `safeTelemetry.ts` allowlists |

These are adapted behaviours, not byte-identical copies. No golf events, campaign attribution, account identifiers, credentials, endpoints, brand strings or donor data are included. The donor is unchanged by this extraction.

## Files and ownership

All additions live in the existing optional `diagnostics` pack. Existing `safeTelemetry.ts` remains unchanged. New runtime modules have no vendor dependency and no imports from product modules.

- `analyticsClient.ts`: product-facing analytics lifecycle and explicit event policy.
- `analyticsFanout.ts`: injected provider contract and independent delivery.
- `sentryReporter.ts`: separate reporting lifecycle and a strict, rebuilt final-event envelope.
- `settleWithin.ts`: optional-SDK outcome/deadline helper. Unlike cancellable network work, it explicitly does not promise SDK cancellation.
- `tests/observability-capability.test.mjs`: deterministic contract tests using controlled promises and inert providers.

## Integration

Install/copy the diagnostics pack into the host using the existing scaffold workflow. Supply the host's environment, resolved consent and code-owned event schema. This example uses a fictional reading application:

```ts
const analytics = createAnalyticsClient({
  environment: config.environment,
  development: config.development,
  policy: {
    item_saved: { source: ['editor', 'import'], result: ['success', 'failed'] },
    screen_view: { screen: ['library', 'editor'] },
  },
  providers: [loadPrimaryAnalytics, loadSecondaryAnalytics],
});

await analytics.setEnabled(resolvedPreferences.analyticsEnabled === true);
void analytics.capture('item_saved', { source: 'editor', result: 'success' });
// On sign-out/account replacement, before allowing the next identity to emit:
await analytics.reset();
```

Each factory must initialize a **disabled** SDK with auto-capture, automatic identity and replay disabled, then return `{ setEnabled, capture, reset }`. Deny advertising collection in any provider that supports it before enabling product measurement. Those vendor-specific options remain the host adapter's responsibility. Factories are invoked only after explicit enable in a production, non-development environment. Events before consent are discarded, never replayed later. Unknown events are rejected; unknown property keys/values are omitted.

Represent screen views as allowlisted static event properties. Classify dynamic routes before calling the bridge, and omit excluded/private routes altogether. Never use raw URLs, free text, document IDs or account IDs as screen labels. The host owns attribution, consent persistence, retention and account policy.

```ts
const reporting = createSentryReporter({
  load: loadDedicatedSentryBridge,
  allowedFiles: ['src/modules/library/save.ts'],
  contextPolicy: { operation: ['save', 'restore'] },
  environment: config.environment,
  release: config.release,
});
reporting.setEnabled(resolvedPreferences.errorReportingEnabled === true);
void reporting.capture({
  type: 'TypeError',
  frames: [{ file: 'src/modules/library/save.ts', line: 42 }],
}, { operation: 'save' });
```

`loadDedicatedSentryBridge` returns `initialize(options)` and `captureEvent(event)`, bound to the app-owned Sentry client. Preserve the provided hooks and privacy options when adding DSN/build configuration. The adapter accepts already classified frames; it never parses or forwards a raw exception stack or message. The final `beforeSend` reconstructs the envelope again after SDK processing, keeping only permitted type/file/line/context, static release metadata and a validated SDK event ID. Breadcrumbs are disabled. This deliberately trades rich diagnostics for a small explicit collection surface; add necessary metadata only with a tested, specific policy.

Reporting is independent of analytics consent. It does not automatically report unhandled native crashes: default integrations and native auto-initialization are disabled. Native Sentry plugin setup, sourcemaps, crash-symbolication checks and store release configuration remain a separate adoption task. An injected bridge is not evidence those integrations are complete.

## Failure and lifecycle contracts

- Consent revocation and account reset invalidate waiting captures synchronously, including a revoke/re-enable cycle while a factory is loading.
- SDK enable/disable/reset transitions are serialized. A failed or stalled lifecycle operation quarantines that provider for this controller's lifetime. A late factory result is disabled and never admitted; a timed-out enabling operation gets another best-effort disable when it eventually settles.
- Provider initialization and requests have bounded waits (15 seconds by default, configurable from 1–60,000 ms). This is a waiting bound, not cancellation of the underlying SDK. No timer-based retry or background loop is installed.
- A provider's transient capture rejection returns failure for that provider without suppressing delivery to healthy peers. A hung capture quarantines the provider. No buffering or automatic retry risks collecting events after consent changes.
- Call `dispose()` when the owner is torn down; future enable requests are ignored. This does not remove server data or retract requests already handed to an SDK.
- A `true` result means at least one analytics adapter accepted the call, or the reporting bridge fulfilled its call. It does not prove ingestion or delivery. Do not await these APIs before saving user work or navigating.
- Use one controller per app/session owner. A permanently stuck SDK must be cleaned up at the host before replacing its controller; blindly constructing new clients can accumulate SDK instances.

## Verification and remaining evidence

Automated coverage includes disabled/non-production startup; immutable policy/input; redaction; unknown events; revoke during lazy initialization; account reset plus immediate re-enable; failed and hung independent providers; late enable cleanup; per-provider payload copies; disposal; separate reporting consent; final Sentry sanitization; coalesced initialization; and malformed diagnostic input.

Focused commands:

```sh
node --test tests/observability-capability.test.mjs
node node_modules/typescript/bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions --lib ES2023,DOM codex/skills/mature-app-starter/assets/app-capabilities/diagnostics/src/services/analytics/analyticsClient.ts codex/skills/mature-app-starter/assets/app-capabilities/diagnostics/src/services/observability/sentryReporter.ts
```

Still required for an actual consumer: real SDK adapters and wire-payload inspection; consent UI and hydration; relevant browser/native lifecycle testing; native build configuration; approved collection policy; and a second real product using the implementation. Mock provider tests establish library contracts, not those downstream claims.
