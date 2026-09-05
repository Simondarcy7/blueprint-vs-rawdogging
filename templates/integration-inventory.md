# Integration inventory

Use when external services or device integrations exist. Track configuration locations and evidence, never credential values. An SDK in dependencies or a linked dashboard alone is not a working integration.

| Capability / purpose | Provider and environment | State | Typed adapter / config location | Data and consent behavior | Failure fallback / disable path | Verification evidence / owner |
| --- | --- | --- | --- | --- | --- | --- |
| | | Not selected | | | | |

Possible states: not selected, configured, authorized, instrumented, verified, disabled, blocked. Define the reached state explicitly; do not assume these are interchangeable or a universal linear sequence.

- Does a user workflow require this service, or is it speculative infrastructure?
- Have real calls/events been observed in the intended environment using safe test data?
- Are development/preview/production isolated as intended?
- Are credentials public client identifiers or privileged secrets? Where is access controlled?
- Have automatic collection, consent/opt-out, deletion and error payloads been checked?
- What happens when configuration, initialization, permissions or the provider fail?
- Do support/privacy documentation and the actual enabled SDKs agree?
- Is there a safe disable/rollback path, and does it leave the core app usable?

Retire unused providers and obsolete flags through a scoped review. Do not activate a service merely to complete every row.
