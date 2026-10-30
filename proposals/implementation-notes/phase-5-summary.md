# Phase 5 — reusable product shell and application workflows

30 October 2026. This phase moves the foundation beyond controller-only packs into shared React Native UI, complete workflow compositions and actual application adoption.

## Delivered source

`product-ui` supplies AppShell, ScreenScaffold, ScreenHeader, ProductUIProvider/ProductText, ActionButton, FormField, SearchField, ChoiceGroup, SettingsSection/Row, AdaptiveColumns and AsyncContent/RetryableContent. The shell adapts between side and bottom navigation. Screens own scroll, sticky rails, footer spacing and keyboard handling with explicit inset ownership. Controls include focus, selected/disabled/busy state, errors and keyboard radio navigation. Theme and route mapping are injected.

`product-workflows` supplies SettingsWorkflow and its save controller, AccountRecoveryPanel, NotificationPreferencesPanel and NotificationInbox. These are rendered workflows with loading, unavailable, failure, retry and acknowledgment states, not just interface definitions. They compose the earlier recovery/preference controllers and preserve host ownership of authorization, storage transactions, device scheduling and provider identity.

## Actual consumers

| Consumer | Runtime adoption | Preserved host responsibilities |
| --- | --- | --- |
| Generated Expo starter | Responsive AppShell navigation; all existing Screen users delegate layout to shared ScreenScaffold/Header; Settings uses shared sections/choices | Expo routes, metadata/indexing rules, theme persistence, motion preferences, note storage and brand |
| Golf App | Complete inbox composition, filters, virtualized rows, status and undo; phase-4 undo controller with atomic native/browser repository adapters | Personal/social row content, account writer leases, permissions, branding and existing notification scheduling |
| OddsBasket | Actual account/settings preference load/edit/save/retry; shared builder recovery actions and upload states | Device-local persistence, current catalog, domain data, branding and existing email-link authentication |

AccountRecoveryPanel and NotificationPreferencesPanel ship with rendered tests and explicit provider/controller contracts. This phase does not claim that Golf's existing notification preference provider or OddsBasket's email-link auth have been replaced by those panels. OddsBasket's challenge model differs from the generic verification controller; incompatible identity semantics were not invented to claim adoption.

## Fundamentals corrected

- Golf inbox restoration uses an atomic transaction instead of a loop that could partially restore. Failure rolls back the whole restore; later arrivals and read state survive; capacity failure is explicit rather than silently dropping restored items. Owner and writer-lease checks remain at commit.
- OddsBasket preference save acknowledgment follows its durable device record. Unconfigured password recovery and resolved provider errors no longer claim that email was sent.
- Real Expo/web testing exposed omitted radio accessibility state in React Native Web. Explicit ARIA properties now accompany native accessibility state. Native registrations receive a narrow reviewed pure-factory exception in Golf's existing module-side-effect gate; the gate remains active.
- Starter metadata and motion remain in an app-owned Screen wrapper around shared layouts. Its export verifier caught the initial metadata omission before publication.
- The shared preference/undo codecs now compile under the starter's `noUncheckedIndexedAccess` without weakening its compiler settings.

## Distribution and provenance

The app-shell sync profile records 17 canonical source files in a separate manifest, preserving the earlier product bundle. Local edits, unexpected files, missing files and symlinks are refused. Consumers keep app-owned adapters outside the checked directory. Root `npm test` checks parity of the generated starter; each real consumer has its own provenance manifest. Mirrored copies count once in source-size reporting.

See [UI contracts and donor provenance](product-ui.md), [installation and architecture](../../docs/product-app-shell.md), and the phase-5 source/evidence records alongside this report.

## Verification and size

Blueprint: 300 tests passed. Expo starter: 15 tests, TypeScript, lint/format and web export/metadata/budgets passed. Golf: 35 focused tests plus 13 policy checks, full TypeScript, targeted lint, SEO/CSP and hard bundle budget passed. OddsBasket: full gate passed with 45 suites / 269 tests, TypeScript, lint, formatting, export and SEO.

The new UI/workflow packs contain **2,551 physical production lines in 12 files**. All canonical capability packs now contain **5,048 lines in 41 files**. This includes authored/generalized implementations, comments and blank lines; it is not a claim that 5,048 original Golf lines were deleted. Consumer/starter mirrors, tests and docs are excluded. See [reproducible file hashes and measurement](phase-5-source-size.json).

Browser acceptance confirmed starter note persistence, retained search across tabs, checked preference semantics and one main landmark; Golf empty Inbox/options/settings navigation; OddsBasket durable default stake and odds format, builder and upload initial states. Responsive DOM checks passed without horizontal overflow at 480 CSS pixels for starter and OddsBasket; the browser backend clamped smaller requests, so this is not 320/390px evidence. Golf was observed at 2560 CSS pixels. Provider delivery, populated real-account Inbox, native accessibility and physical devices were not exercised.

Screenshots: [starter](../../output/playwright/phase-5-starter.png), [Golf](../../output/playwright/phase-5-golf.png), [OddsBasket](../../output/playwright/phase-5-oddsbasket.png). Screenshots are local demo/guest UI only. Golf initial JavaScript is 746,515 gzip bytes: within its 750,000 hard limit but above its 620,000 target.

## Limits

Browser and component tests do not establish native keyboard, VoiceOver/TalkBack, real provider delivery or production rollout. Golf's existing notification preference scheduling policy and OddsBasket's email-link identity remain app-owned. No real account recovery message, OCR request or production data mutation is required for the local acceptance flows.

The starter's unchanged dependency lockfile reported 15 npm audit advisories (5 low, 2 moderate, 8 high); production-filtered audit reported 12 (5 low, 7 high), including Expo tooling/transitives. No blanket audit fix or SDK migration was applied as part of this UI extraction. This needs a separately validated dependency remediation before treating the starter as release-ready.

## Token usage notes

Most context went into consumer persistence/lifecycle contracts and real rendered integration. Targeted ownership and shared test fixtures avoided another broad Golf survey. The first screen substitution omitted host metadata and required a rebuild; keeping the host wrapper from the outset would have been cheaper. Future work can start from these composition contracts and the three adoption paths rather than rediscovering the donor structure.
