# Architecture and system map

Status: draft — replace placeholders with inspected facts. Keep a small app's map in its project index if that is clearer; otherwise maintain `docs/architecture.md` and link it there. Do not create components or services to fill this template. Omit irrelevant sections with a short reason.

## Snapshot and evidence

- Product / supported surfaces:
- Source commit / date / relevant uncommitted changes:
- Inspected scope and exclusions:
- Artifact identity / source provenance / environment, if inspected:
- Owner / last checked:

Separate present in source, configured, deployed and verified behavior. Name the evidence for each claim; leave unknowns explicit. A version declaration or old passing test is not current runtime evidence. Never include credentials or personal records.

## Purpose and boundaries

Describe the first useful workflow and the few ownership rules that explain the system. State which dependencies are essential and which can fail while the workflow remains usable. Record deliberate non-goals.

| Surface or entry | User outcome | Owning module / public API | Platform difference | Source |
| --- | --- | --- | --- | --- |
| {{entry}} | {{outcome}} | {{module}} | {{difference or none}} | {{path}} |

Link the actual folder map and relevant ADRs. Explain responsibility and allowed dependency direction; do not duplicate the full repository tree. Link authoritative dependency/config files rather than maintaining another version inventory.

## Data authority and lifetime — if data exists

| Data category | Authority and identity | Readers / permitted writers | Storage and lifetime per platform | Derived copies / invalidation | Source |
| --- | --- | --- | --- | --- | --- |
| {{category}} | {{owner and stable key}} | {{boundaries}} | {{location, scope, retention}} | {{cache/projection rules}} | {{path}} |

Distinguish in-memory state, durable local writes and server acknowledgements. Name the authority per workflow; do not assume every app is local-first. State whether a diagram describes conceptual entities or actual tables/documents. Record schema compatibility and deletion ownership where applicable.

Derived screens, caches and optional OS surfaces must not silently become competing authorities. Route their commands back through the owning validation and persistence boundary. Identify public content that should remain available if private data or account initialization fails.

## One critical workflow

Show an annotated sequence or a short numbered flow from user action through validation, state/service boundaries and the result the user sees. Label calls and returned outcomes. Include:

- The point at which success is safe to report, including which write or acknowledgement it depends on.
- What happens after interruption, rejection, timeout or dependency failure.
- Where identity and authorization are checked, if applicable.
- Retry/duplicate/conflict behavior only if the workflow needs it.

Separate implemented paths from proposed arrows. For a read-only workflow, describe loading, freshness and failure instead of inventing a save operation.

## Protection and recovery scope — only selected mechanisms

| Mechanism | Included data | Excluded data | Credential / device / origin dependency | Restore and deletion behavior | Evidence |
| --- | --- | --- | --- | --- | --- |
| {{existing mechanism}} | {{categories}} | {{explicit exclusions}} | {{requirements}} | {{failure and scope}} | {{test/source or pending}} |

A local recovery copy, portable export and remote backup have different coverage and loss boundaries. Do not infer complete restoration from a schema or service name. Link detailed procedures and verification instead of repeating them here.

## Delivery and trust boundaries

Link the environment/integration inventory and release runbook. Record which client, backend, data migrations and updates ship independently, their compatibility constraints, and which checks gate release. Mark automated versus manual steps explicitly. Include unavailable consoles or unverified destinations as limits; naming environments does not prove resource isolation.

## Tradeoffs and change triggers

| Current approach and reason | Known cost / failure limit | Measurement and evidence status | Trigger for reconsideration | Linked decision |
| --- | --- | --- | --- | --- |
| {{choice}} | {{limitation}} | {{measured, estimated or not verified; workload}} | {{observable condition}} | {{ADR/issue}} |

Document why today's simpler approach is sufficient and what evidence would justify changing it. Distinguish a configured budget, a capacity estimate and a measured result. Do not prescribe queues, realtime services or shared packages without a demonstrated need.

## Source map and maintenance

Link each important boundary to its implementation, applicable test and authoritative procedure. Link unresolved decisions to the existing issue/review tracker; do not duplicate its live status.

Update affected sections in the same change that alters data authority, workflow guarantees, service/platform boundaries or delivery compatibility. Record the inspected revision/date and superseded decisions. At handoff, spot-check the critical flow against source and fresh evidence; an architecture document does not replace an audit or release validation.
