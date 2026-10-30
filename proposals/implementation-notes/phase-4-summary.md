# Phase 4 — account recovery, notification preferences and undo

30 October 2026. Continues the real-consumer adoption recorded in [phase 3](phase-3-summary.md).

## Purpose

Expand Blueprint with complete reusable workflow logic from Golf rather than count documentation, tests or copied domain code as production extraction. The previous extraction added 1,170 production TypeScript lines in 11 capability files relative to baseline `0d770675`; that was a narrow initial slice of the intended foundation.

## Deliverables

- Account recovery: provider-neutral verification challenge coordination plus separate resumable local account cleanup. Provider authentication and remote deletion remain authoritative host operations.
- Notification preferences: durable preference intent, device reconciliation and explicit failure/recovery outcomes.
- Undo: restore removed items into current data without losing later arrivals, preserving recovery after failures and requiring reconciliation for uncertain commits.

Each pack has executable TypeScript, fault/lifecycle tests and a source-mapping note. The installer supports all three with additive collision protection. Generated-app acceptance compiles the installed files, including dependencies, rather than only testing source in the repository.

## Adoption boundary

These packs are new Blueprint implementations. Golf and OddsBasket's earlier PRs continue to exercise the phase-3 capabilities; they are not silently counted as consumers of these new workflows. App-owned adapters must implement authorization, atomic persistence and device/provider behaviour before adoption. No production data, credentials or provider configuration are bundled.

The four-pack `sync-product-capabilities` manifest remains compatible with its existing consumers. Install these new packs through the documented additive scaffold and review adapter integration; this phase does not silently widen existing sync manifests.

## Source and contract notes

- [Account recovery](account-recovery.md)
- [Notification preferences](notification-preferences.md)
- [Undo](undo.md)
- [Installation guide](../../docs/account-and-notification-workflows.md)

## Token usage notes

Most context is spent on ownership, persistence and asynchronous failure contracts. Three agents own separate packs and cross-review each other; root owns installation and publication. Reusing the existing inventory avoids another repository survey. Future adoption should load the individual contract and its tests first. Line counts separate executable production source from tests and documentation; they measure volume, not reliability or time saved.

## Final verification and size

`npm test`: **255 passed, zero failed or skipped**. This includes 29 account recovery/cleanup tests, 18 notification preference tests and 18 undo tests, strict installed-layout TypeScript and the generated-app installation checks. Independent review found and closed duplicate cleanup-progress acknowledgment and resend-cooldown cancellation races. Undo and notification preferences passed cross-review under their explicit adapter contracts.

New production TypeScript: **851 physical lines across four files** (account recovery/cleanup 387, notifications 271, undo 193). Combined with the previous 1,170 extracted lines, the programme has added **2,021 production TypeScript lines**. Comments and blank lines are included; tests, documentation and consumer glue are excluded. [Per-file hashes and counts](phase-4-source-size.json) make the measurement inspectable. This remains a bounded capability library, not extraction of the full Golf app shell or tens of thousands of domain-independent application lines.

Published through existing Blueprint PR #4; Golf PR #45 and OddsBasket PR #51 receive scope updates linking this phase without claiming new runtime adoption. No donor application source, production data, provider configuration, deployment or merge is changed in this phase. Native/provider acceptance remains outstanding. Existing account-level GitHub Actions restrictions on the private app repos are not bypassed.
