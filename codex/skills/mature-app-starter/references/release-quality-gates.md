# Release quality gates

Turn repeatable mistakes into focused checks. Record actual commands in the app quality contract; the installed structural verifier checks the required Expo foundation, while framework behavior and release readiness require additional checks.

| Concern | Reusable check | When to run |
| --- | --- | --- |
| Architecture | Thin routes, public feature APIs, no private cross-feature imports, centralized environment reads | Relevant changes / CI |
| Product correctness | Calculations, validation, permissions, critical state transitions | Relevant tests / CI |
| Recovery | Reload/resume, failed save, denied permission, retry, interrupted import/export where applicable | First workflow and affected changes |
| Accessibility | Semantic/static checks, rendered interaction checks, manual keyboard and screen reader | UI changes; manual review before beta |
| Images/performance | Actual export size, expected assets, unused originals/fonts | Production build / CI |
| Public SEO | Route policy, HTML/metadata, sitemap, status and robots behavior | Build and deployment; migrations |
| Privacy | Analytics opt-out, payload allowlist/redaction, absence of secrets/private content | Integration changes and release |
| Deployment | Expected account/project/domain, required assets, representative deep links, rollback path | Before and after deployment |

## Architecture that remains portable

Keep brand, product, navigation, environment and data-policy config separate from feature implementation. Features expose small public APIs. Put storage, identity, analytics, errors and notifications behind typed contracts with explicit platform adapters. Shared foundation contracts must not import an app's business rules.

Copy conventions first. Extract a shared package only after two apps need substantially the same contract; keep branding, navigation, monetization and domain data app-owned. Adapt module paths and route conventions to the chosen framework.

## Privacy and recovery

Make analytics collection an explicit product decision. Where consent is required by the app's policy, test no collection before opt-in and after opt-out. Inspect automatic page views and error payloads as well as manually emitted events: URLs, invitation tokens, personal text and storage contents can escape through defaults.

Test persistence failures and interrupted workflows where data matters. Local-first operation, accounts and backups are optional capabilities, not mandatory infrastructure for every app. When restore/import exists, validate schema/version and prove failed imports cannot silently replace good data.

## Release evidence

Record commit/build, environment, commands, results, manual coverage, known gaps and rollback procedure. Checks should fail on missing expected output. Keep browser, native and backend evidence distinct; a successful web export does not verify a native device or deployed database.

When changing a framework, hosting provider or primary client, inventory existing checks and map each to the new pipeline. Explicitly retire inapplicable checks and port applicable ones. Never infer that a previous release's SEO, focus behavior or asset handling survived migration.
