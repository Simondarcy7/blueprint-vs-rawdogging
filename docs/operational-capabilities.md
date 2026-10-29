# Adopt the operational capabilities

These optional source packs preserve reusable product behaviour: startup-only OTA application, explicit-consent observability and durable offline submissions. They are integrated through typed host ports; installing them does not activate an SDK, publish an update or send data.

## Add to the runnable starter

Create the normal app first. Then use its installed scaffold to add only the selected capabilities, preserving its existing shell:

```sh
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root . --with updates,diagnostics,outbox --only-packs --dry-run
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root . --with updates,diagnostics,outbox --only-packs
```

Use `.claude/skills/` for a Claude-only install. An older installed toolkit needs a reviewed update to its scaffold and assets first. `--only-packs` requires an explicit selection, refuses existing destination files, and requires the baseline `src/lib/asyncWork.ts` for updates/outbox. It does not overwrite or migrate customized source. File presence is only a preflight; run the host typecheck to verify the actual helper exports and versions.

For a fresh app with no existing baseline source, omit `--only-packs`. The default scaffold copies the baseline and selected packs together. Run host typecheck, focused tests and architecture checks after integration. TypeScript imports use `.ts` extensions; a custom host tsconfig must support them (`allowImportingTsExtensions` with `noEmit`).

## Updates: startup is the only automatic reload opportunity

The updates pack exports `createLaunchUpdateController` and `createExpoUpdateAdapter`. Create one controller per JavaScript launch outside React components, inject the installed Expo Updates SDK and foreground state, and observe `getSnapshot`/`subscribe` from the existing root gate. Show content only for `ready`; use an accessible, app-branded opening surface for `waiting`/`reloading`.

```ts
const controller = createLaunchUpdateController({
  adapter: createExpoUpdateAdapter(Updates),
  isActive: () => AppState.currentState === 'active',
});
// Root effect: void controller.start(); root state: useSyncExternalStore(...).
// Call before any alternative path exposes interactive content:
controller.markInteractive();
```

The last line illustrates an alternative opening path, not a required call at bootstrap. An ordinary component unmount should unsubscribe, not dispose this session controller. Use a disabled web adapter; do not import native Updates into a web bootstrap solely for this capability.

Defaults retain the donor's 6-second startup opportunity and 15/60-second check/download bounds. A completed/expired startup permanently closes eligibility, including remounts. Downloads may finish for next launch. Checks/download failures open the app.

**Native reload cannot be cancelled once requested.** A pending accepted reload remains non-interactive rather than allowing a late restart to interrupt user work. Rejection opens the app; a hung native reload requires host/device recovery design. The network-work promise returned by `start()` is not the UI readiness promise.

The host owns EAS project/channel/runtime, signing, native compatibility, rollback/data compatibility and preview-device tests. No publishing scripts or source project IDs are included. See [Expo SDK57 Updates](https://docs.expo.dev/versions/v57.0.0/sdk/updates/) and the matching documentation for the adopting SDK.

## Analytics: consent and ownership before providers

The diagnostics pack includes `createAnalyticsClient` and independent `createAnalyticsFanout` transports. Supply a code-owned event/value allowlist, runtime environment and factories that create disabled providers. Providers must disable automatic capture, replay and identity collection; deny advertising collection where applicable before enabling measurement.

```ts
const analytics = createAnalyticsClient({
  environment: config.environment,
  development: config.development,
  policy: { item_saved: { source: ['editor', 'import'], result: ['success', 'failed'] } },
  providers: [loadPrimaryProvider, loadSecondaryProvider],
});
await analytics.setEnabled(resolvedConsent.analytics === true);
void analytics.capture('item_saved', { source: 'editor', result: 'success' });
// On identity replacement, before the next owner can emit:
await analytics.reset();
```

Each factory returns async `setEnabled`, `capture` and `reset`. Events before consent are discarded. Revocation invalidates waiting events immediately. Production-only gating is explicit; previews do not initialize providers. One broken provider does not suppress the healthy peer. Timeouts bound caller waiting but cannot cancel an SDK request; failed lifecycle operations quarantine that provider. Do not repeatedly recreate stuck SDKs.

Classify routes before capture: use static screen names, not paths containing IDs, queries or tokens. Attribution, identity, schema, storage, retention, policy decisions and consent UI stay with the product. A successful return means an adapter accepted the call, not verified server ingestion. Never await telemetry as a prerequisite to save/navigation.

## Error reporting: explicit narrow Sentry bridge

`createSentryReporter` has independent reporting consent. Inject an app-owned bridge with `initialize(options)` and `captureEvent(event)`; preserve the provided final `beforeSend` and privacy options when adding DSN/build settings. The reporter rebuilds a fresh allowlisted event, suppresses breadcrumbs and discards raw messages, request/user data and unapproved metadata.

Provide classified error type and allowed source file/line frames, plus allowed context values. Raw Error stacks are not parsed or forwarded automatically. This intentionally narrow bridge requires deliberate expansion when richer symbolication is needed.

Native auto-initialization and default integrations are disabled. This is **not** a complete unhandled/native crash setup, native config plugin, source-map pipeline or verified privacy policy. The host must validate actual SDK wire payloads and native transport paths. SDK-injected metadata after a bridge call is why the final hook matters.

## Outbox: persist first, retry the same operation

`createDurableOutbox<T>` provides domain-neutral ordered delivery. Its source is the product decision in the Golf App feedback queue: keep pending work durable and preserve an operation identity across retries. The extraction strengthens bounded/validated storage and makes ownership assumptions explicit.

```ts
const queue = createDurableOutbox({
  storage: ownedQueueStorage,
  parsePayload: validateSubmission,
  createId: createUuid,
  assertOwner: assertCurrentAccountWriter,
  send: (item, signal) => api.submit(item.id, item.payload, { signal }),
});
const operationId = await queue.enqueue(submission); // Durable local acceptance only.
const result = await queue.flush(); // Explicit retry on reconnect/user action.
queue.dispose(); // Owner teardown; preserves pending storage.
```

- `parsePayload` must validate and reconstruct domain data; it is not a cast. Store in an account-scoped location with the protection the data requires.
- `storage.write` must atomically replace one value. One instance owns each storage scope; tabs/processes require an external lease or transactional adapter. The host must fence commits inside the adapter too, because a generic controller cannot cancel a storage write already handed off.
- `send` resolves only on durable server acceptance. **Receiver-side deduplication by operation ID is required.** Server success followed by a lost receipt or failed local acknowledgement causes the same operation to be retried. This is at-least-once delivery, not exactly-once execution.
- Corrupt, future-version, over-limit or malformed data blocks mutation/delivery instead of being overwritten. Recovery/deletion is an explicit product decision.
- A flush coalesces concurrent callers and processes at most the configured item limit; newly enqueued work is retained. Defaults: 100 pending items, 256 KiB encoded envelope, 15-second delivery wait. Select appropriate product limits.
- A timeout requests adapter cancellation, retains the item and returns `pending`; an ignoring transport may still finish. Disposal stops future handoffs and acknowledgements, not an already accepted request. Stable IDs and host ownership remain essential.
- Local storage operations must settle; this controller does not time out an uncancellable write and then allow overlapping writes. A stalled local adapter requires host recovery, not blind retry through a new queue.

Display durable local acceptance as “waiting to send” until the product has the needed delivery evidence. This pack adds no UI, background scheduler, server endpoint, encryption, cross-device synchronization or retention/deletion policy.

## Evidence and next adoption step

The toolkit tests failure states and the copied layout, including strict TypeScript of these entry points in a newly generated app. Outbox fixtures use different payload domains to check separation. These are library/installation tests, not two real products or device/provider acceptance.

For a real consumer: wire the complete user workflow; exercise failure, interruption and return use; validate actual vendor/platform behaviour; then record one shared improvement adopted by both consumers. Keep branding and domain policy app-owned. Existing motion, storage, recovery and device primitives remain available without being counted as newly extracted capabilities.
