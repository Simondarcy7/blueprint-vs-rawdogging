# Optional product analytics setup

Use only when product analytics has been selected. PostHog is a supported option, not a required dependency or account. The shell must run with analytics absent or disabled. Installing this guide does not activate collection.

## Define the question before the events

Record the product question, the few events needed to answer it, property types, environment, platform and retention/identity decisions. Use stable event and screen names. Avoid raw URLs, search parameters, free text, email addresses and record contents; they can contain sensitive data. Typed event names alone do not prevent a transport from adding automatic properties.

Keep one app-owned analytics contract behind `src/services/analytics/`, with platform adapters and a disabled implementation. Business modules emit app events; they do not import vendors. Do not add another vendor merely to mirror an existing app. Separate product analytics from crash diagnostics and from optional replay/feature-flag capabilities.

## PostHog adapter option

For native use, consult [PostHog React Native](https://posthog.com/docs/libraries/react-native); for browser use, consult [PostHog JavaScript](https://posthog.com/docs/libraries/js). Keep native and web SDK imports inside their adapters and initialize once at the correct lifecycle boundary. SDK APIs and defaults differ by platform; do not copy one platform's options into another. Expo Router screen tracking needs deliberate route integration.

Use one SDK entrypoint consistently per platform. Treat slim/experimental bundles as optimizations to verify against the selected capabilities, not a universal starter default. An import succeeding does not prove events are being captured or delivered.

## Explicit collection and identity behavior

Until a product has selected and verified its collection policy, keep collection disabled. Record the intended user choice/consent behavior and honor saved preferences before capture. Configure automatic page/screen tracking, clicks, replay, profiles, geolocation and remote features explicitly; do not inherit a provider's defaults without reviewing them.

Choose one owner for page/screen events to avoid duplicate automatic and manual tracking. Use an allowlist at the final event boundary, including SDK-added fields. Review actual payloads with disposable data. Do not copy another product's default-on/default-off policy, region or project configuration as a universal requirement.

Define anonymous identity, sign-in association, logout/account switching and reset behavior only for identity flows the product supports. A provider reset must not silently re-enable a saved opt-out. Opting out of future capture does not erase previously collected data; document any separate deletion process that applies.

## Configuration and verification

Validate host/project configuration centrally as a pair. Use the correct provider region and isolate test/preview traffic from production reporting. Client ingestion keys are distinct from privileged management credentials; management secrets never belong in client variables or bundles.

Verify the selected native and web adapters with these checks:

- Unconfigured or disabled analytics leaves the main workflow usable.
- Collection matches policy before and after preference hydration, restart and account reset where supported.
- One intended action generates the expected event once, with allowed properties only.
- A representative event reaches the intended project/environment; a local capture call alone is insufficient evidence.
- Slow, offline or failed analytics does not block navigation or saving.
- Automatic capture/replay and SDK-added properties match disclosures in the actual release configuration.

Record evidence in the existing integration inventory and selected-capability section of the quality contract. Use sanitized diagnostics for transport failures, not recursive analytics calls. Recheck SDK defaults and payloads when upgrading.
