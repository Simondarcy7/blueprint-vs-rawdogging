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
