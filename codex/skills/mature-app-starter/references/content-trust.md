# Trustworthy content and external data

Use this guide when a product displays imported, generated, searched or third-party content. It does not require a content platform or provider integration.

## Identity, evidence and capability are separate

Keep a discoverable record distinct from the capabilities actually available for it. A directory entry does not prove booking availability, navigability, a usable document or offline coverage. Show relevant limitations beside the affected action; do not hide valid records merely because an optional capability is missing.

Use stable source/product IDs and explicit matching evidence. Similar names alone cannot establish identity, attach an image or merge histories. Ambiguous matches stay unresolved. Preserve unknown values; absence of evidence is not a verified negative. Keep estimates, user reports, samples and observations distinct where they change the decision.

## Freshness and rights

Track source, checked/observed time, validity and the rights necessary for display, caching, redistribution and offline use. Do not renew evidence by reserializing a cached record. Avoid redundant provenance on every screen; show it where it affects trust or action.

Use identity-verified, licensed imagery with explicit fallbacks. Missing imagery is preferable to a plausible image of the wrong subject. Source withdrawal and rights revocation need defined invalidation/removal behavior; disabling an importer alone does not retract published content.

## Bounded provider work

Define request/time/payload budgets and supported retry behavior before bulk enrichment. Respect provider rate-limit responses and Retry-After; stop bulk runs at the quota boundary and preserve progress rather than multiplying retries. Client limits are not billing guarantees. Keep keys server-side where required and avoid treating provider permission as data ownership.

## Acceptance examples

- Same-name records remain distinct until identity is verified.
- Missing measurements remain unknown in summaries and imports.
- Expired availability cannot appear as currently verified.
- Unsupported functionality explains its limit and offers an appropriate alternative.
- Fixture/generated content cannot leak into personal history or public production output.
- A rate-limited run stops, preserves its checkpoint and resumes under an explicit budget.

Keep schemas, provider registries, scoring rules and jurisdiction-specific requirements product-owned.

## Data meaning before presentation

For each important field define source authority, unit, valid range, unknown representation and update semantics. A display name is not identity. A missing value is not zero, and a failed fetch is not an empty authoritative dataset. Preserve distinctions between user-confirmed, inferred, estimated and externally verified values when they affect action.

For summaries, define denominator, time window and exclusions. Do not mix demonstration records with personal results. When current configuration can change, decide which completed-record fields need immutable historical snapshots and how correction/redaction works. References to live configuration alone may rewrite the meaning of history.

For merges or enrichment, require identity evidence appropriate to the risk. Same names, nearby locations or plausible images are not sufficient on their own. Ambiguous matches need a pending/manual path. Capability availability can change independently of the underlying record: missing booking, file, image or offline support should not necessarily hide a valid discoverable item.

## Source withdrawal and bounded enrichment

Define provenance, observation time, expiry and rights separately. A refreshed cache timestamp cannot renew the underlying observation. Track whether display, caching, offline use and redistribution are permitted; keep necessary attribution in the right surface. On withdrawal, propagate invalidation to published projections and caches according to the actual rights/data policy.

For bulk provider work, budget requests, pages, bytes, duration and spend where relevant. Honor rate-limit responses and stop at a defined boundary. Checkpoint progress with stable source IDs and revision evidence so a retry does not duplicate or skip work. Validate every page and detect repeated cursors; a partial run is not complete coverage. Keep provider credentials server-side where required.

## Useful contract fixtures

Maintain small fixtures for same-name distinct entities, unknown versus zero, stale evidence, incompatible units, partial pages, duplicate records, withdrawn assets and clearly labelled demo data. Verify the actual rendered interpretation and persisted values, not just parser acceptance. These fixtures should be generic and contain no private source data.

See [design primitives](design-system-primitives.md) for chart/summary presentation and [import/export](import-export-and-sharing.md) for review and commit boundaries.
