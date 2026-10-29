# Blueprint: a reusable product capability foundation

Revised execution proposal · 29 October 2026

Owner: Simon Darcy. Primary donor: Par Pocket / Golf App. Status: implementation started; acceptance evidence is tracked separately in `implementation-notes/`.

## 1. Purpose and decision

Preserve the working implementations, product judgment and engineering lessons accumulated across Simon's products, so each new product inherits mature behaviour instead of rebuilding it. Golf App is the primary donor because it is the most developed implementation available; other projects are future consumers and additional sources, not automatically equivalent foundations.

The unit of reuse is a **capability with its behaviour, boundaries, rationale and verification**. Code volume is not the success measure. A small capability that prevents data loss or repeated design work can be more valuable than thousands of generic lines.

Proceed with an additive, evidence-led extraction into the existing Blueprint repository. Use the working Expo shell and existing primitives; reconcile rather than duplicate them. Keep a reference integration to make behaviour observable. Start with source distribution, explicit ownership and provenance; introduce packages when real consumers establish stable boundaries. No whole-app rewrite, new framework or general-purpose platform is required.

This revises the priorities of [Dave's proposal, PR #3](https://github.com/Simondarcy7/blueprint-vs-rawdogging/pull/3). Keep its separation of shared behaviour, product-owned composition, working examples, focused checks and upgrade evidence. Replace its benchmark-first gate and package-first delivery programme with extraction and adoption first. The original PR remains an independent discussion document.

## 2. What makes the foundation valuable

The asset includes details easy to lose when an implementation is reduced to a generic interface:

- Opening an app even when an optional update service is unavailable; never reloading after the user starts work.
- Keeping a draft after failure and distinguishing an attempted save from a confirmed durable write.
- Fencing stale work when consent, account identity or writer ownership changes.
- Preserving scroll, focus and keyboard context through overlays and navigation.
- Allowing animations to be interrupted without leaving hidden interactive controls.
- Validating imported content before replacement and retaining recovery options.
- Keeping offline submissions durable, ordered and retryable with the same operation identity.
- Respecting declined permissions and making optional enhancements genuinely optional.
- Reporting what actually happened: opening a share sheet is not delivery; an export is not a device test; missing data is not zero.
- Asking for feedback, reviews and engagement at appropriate moments without letting sentiment dictate eligibility.

Every extracted capability carries a short explanation of which decisions it preserves and why. Automated checks enforce testable invariants; human product judgment remains explicit. Guidance about rare events is not deleted merely because a small benchmark does not exercise it.

## 3. Product scope and users

The first user is Simon developing another product with an AI coding agent. The next user is a collaborator adopting the same capability without relying on Simon's memory. The first useful workflow is selecting a capability, integrating it into an existing shell, configuring its product policies and demonstrating its success and failure behaviour.

Initial implementation family: TypeScript, Expo / React Native and web, matching the current Blueprint. Pure logic remains framework-independent where the source boundary permits it. Platform-specific behaviour is verified separately; native capability is not inferred from web success.

The foundation is opinionated about quality and adaptable about product policy. Branding, business calculations, content, provider accounts, authorization, identity and schema ownership stay explicit. An adapter cannot make incompatible business rules identical.

## 4. Four reusable forms

| Form | Contents | Ownership and evolution |
| --- | --- | --- |
| Foundation | Async coordination, UI/accessibility primitives, lifecycle, storage contracts, recovery | Canonical implementations with regression tests; later versioned packages where useful |
| Optional capabilities | Offline outbox, telemetry, updates, drafts, import review, feedback, permissions | Selected per product; typed host ports and explicit activation; complete behaviour contracts |
| Adaptable recipes | Onboarding, searchable lists, invitations, account recovery, settings, review/confirm flows | Product-owned composition; stable shared behaviour below it; changes adopted deliberately |
| Decision playbook | Applicability, UX policy, rejected approaches, real failure cases, operational evidence | Short targeted guidance beside source; load only what a task needs |

Maintain a runnable reference app demonstrating the selected capabilities. It is a test and teaching surface, not a universal app that enables every feature. The current notes workflow is useful as a host but does not prove all capabilities or all domains.

## 5. Discovery beyond the initial examples

The inventory in `golf-capability-inventory.md` spans the source app's feature and service boundaries. The survey includes release operations, observability, identity, offline data, import/review, content trust, collaboration, accessible interaction, engagement, performance and developer verification. OTA, Sentry, login, analytics and animation are examples, not the scope limit.

For each candidate record:

1. Exact donor paths and pinned revision, including local changes when relevant.
2. The behaviour worth carrying forward, with at least one meaningful failure case.
3. Evidence level: filename-discovered, source-reviewed, locally tested, integrated, or device/production verified.
4. Dependencies on branding, domain types, platform, provider and identity.
5. Existing Blueprint equivalent and whether to retain, improve, reconcile or add.
6. Intended reuse form, acceptance criteria and the next consumer.

Do not equate a filename with a proven implementation. Do not copy the source app's secrets, real user data, account identifiers, service configuration or third-party datasets. Course content and branded artwork are outside this code extraction. Keep the foundation local while its distribution/IP choices are unsettled; public npm publication is not an execution prerequisite.

## 6. Extraction method

Work from a pinned donor revision plus explicitly recorded local fixes. Read the implementation and nearby tests together. First identify invariants, then remove domain dependencies. Prefer a small existing boundary over inventing a configurable framework. Use named callbacks and types rather than product-name flags or unbounded configuration.

Each extraction produces source, focused failure tests, integration instructions and a provenance entry. New source must fit the existing architecture checks. A capability is not complete merely because its code compiles: the adopting app must wire identity, lifecycle, persistence, configuration and relevant UI states.

Improve the donor where inspection reveals a reproducible defect or a clear engineering gap in the touched capability. Make the smallest change with a regression test. Keep extraction and donor diffs independently reviewable; do not refactor the whole Golf App or interfere with unrelated work. Propagate a corrected invariant into the extraction when appropriate.

The Golf App is not automatically migrated to every extracted implementation in the first pass. Reverse adoption is a separate integration step with device and account tests where needed. Until then, record the extraction relationship honestly rather than claiming a shared live dependency.

## 7. Initial execution scope

### A. Reliable optional operations

- Add an OTA startup controller derived from `launchUpdate` and `LaunchUpdateGate`. Preserve a bounded startup window, coalescing, background/unmount guards, late-download deferral and failure fallback. Inject the Expo operations; no project/account configuration or publishing.
- Extend the diagnostics pack with consent-aware analytics lifecycle and independent provider delivery. Reuse the current allowlist sanitizer. Prevent pre-consent events, invalidate stale work after revocation/account reset, isolate provider failure and retain product-owned event schemas.
- Add a Sentry bridge with a fresh sanitized event envelope and explicit configuration. SDK and native transport paths require host verification; a generic adapter alone is not proof of native privacy coverage.
- Extract a durable outbox from feedback queue behaviour. Persist before sending, preserve order and stable IDs on retries, retain failed deliveries, validate stored state before writing, and specify host idempotency and single-writer assumptions.

### B. Existing capabilities to retain and assess

Motion presence/reduced motion, async queues, storage recovery, verified save acknowledgements, device permission outcomes and diagnostic trails already have Blueprint implementations. Keep one canonical implementation and inspect differences before adding more. Passing existing tests is local regression evidence, not proof of original-source parity or production adoption.

### C. Donor engineering improvements

Review startup lifecycle and account writer ownership in the touched sources. Reproduce and fix bounded issues with focused tests. Record any issues that require broader native/backend work instead of pretending a pure unit test proves them.

## 8. Following workstreams and gates

| Workstream | Outcome | Exit evidence |
| --- | --- | --- |
| Discovery and baseline | Broad capability inventory, provenance, initial contracts and donor fixes | Reviewed source references; no unsupported claim of universal portability |
| First extraction | OTA, consent-aware observability and durable outbox installable through existing tooling | Focused tests, strict type checks, scaffold preservation and complete toolkit regression |
| Product UX capabilities | Drafts/undo, import review, overlays, accessible transient feedback, prompt policy | Real interaction/failure examples; keyboard, screen-reader and reduced-motion checks |
| Identity and collaboration | Login/recovery, account transitions, guest claims, invitations, ownership and selected sync patterns | Distinct-account tests, stale-work tests, actual server authorization and deletion/recovery evidence |
| Second product adoption | A real non-golf workflow using selected capabilities | Integrated success/failure loop with distinct domain rules; adaptation effort recorded |
| Shared improvement | One compatible fix adopted by source and second consumer | Both consumers retain behaviour/branding; reviewable upgrade and regression evidence |
| Stable distribution | Package only boundaries supported by real adoption | Versioning, compatibility policy and tested upgrade path; explicit publishing choice |

The first execution does not claim to finish these later product/platform gates. Keep the inventory and implementation record usable for continuing them without re-discovery. No 125-run benchmark, registry, custom source merger or eleven-package release is a prerequisite.

## 9. Host contracts

- **Identity:** each instance has one owner scope. Logout/account replacement invalidates pending work and clears private in-memory history. Do not infer server authorization from a client guard.
- **Persistence:** codecs validate schema, ownership and size. Corrupt or future-format data is preserved for deliberate recovery. Single-writer assumptions are documented; additional tabs/processes need a host lease or transactional storage.
- **Offline delivery:** acknowledge only a durable receipt from the adapter. A network timeout may follow server success; retries therefore use the original ID and the server must deduplicate.
- **Configuration:** environment and provider choices enter through typed ports. No imports from Golf App or its runtime configuration remain in extracted source.
- **Analytics/reporting:** independent policies, disabled until applicable policy hydration, no arbitrary event properties, no recursive reporting of reporter failures. Revocation prevents future handoffs but cannot retract already delivered requests.
- **OTA:** the host owns runtime/channel identity, signed builds and rollback compatibility. The controller does not configure or publish updates. Opening the app is not contingent on a remote service succeeding.
- **UX:** use existing app-owned primitives and tokens. Hide exiting controls from interaction immediately; preserve useful focus/context and live preference changes.

## 10. Verification and proof levels

Use focused unit tests for state transitions, ordering, cancellation, corruption and privacy payloads. Typecheck the copied capabilities with strict settings. Exercise installation into an existing generated app, collision refusal and copied imports. Run existing toolkit tests after integration.

A mock transport test establishes a contract, not actual vendor delivery. A two-domain fixture is an integration harness, not two shipping products. Web export is not native compilation; native compilation is not a real-device test. Record these distinctions in the execution report.

Later verification includes actual SDK wire payloads, OTA runtime compatibility and interrupted startup on Android/iOS, login/recovery across accounts, durable storage faults, visual hierarchy, keyboard/screen-reader flows and reduced motion. Use the Golf App's owned QA resource lifecycle for its browser/build checks.

## 11. Economics and decision rules

Record integration time, product-specific edits, defects retained/prevented, token use when available, repeated explanations avoided, maintenance effort and upgrade effort. Compare against the actual previous way of doing the work. Do not invent a reuse percentage or forecast savings from line count.

Keep a capability when its shared behaviour survives another use with reasonable integration effort. Narrow it if product-specific switches accumulate. Keep a recipe product-owned if the composition changes frequently. Retire a capability only with evidence about that capability; failure of today's toolkit is not proof that all reusable product knowledge has no value.

Use agent comparisons later for a concrete question (for example, whether a guide improves an integration or whether a smaller module lowers adoption cost). They should inform a choice, not become the project.

## 12. Operating model and artifacts

Simon owns product decisions. The repository is the source of truth for implementations, provenance and tests. Agents can do bounded parallel work with explicit file ownership; no hidden dependency on chat memory. The reference app demonstrates working compositions. Every accepted change states which consumers and platforms were tested.

Artifacts:

- This full proposal: scope, architecture, sequence and acceptance.
- `golf-capability-inventory.md`: discovery coverage, candidates and exclusions.
- `golf-extraction-provenance.json`: source revision/blob identities and destination mappings.
- `implementation-notes/`: implemented behaviour, commands, donor fixes and remaining gates.
- Optional source packs under `codex/skills/mature-app-starter/assets/app-capabilities/` and focused tests under `tests/`.
- A concise host integration guide in `docs/`, linked from the installed capability README.

Do not put this internal proposal under `docs/`: the installer copies that directory to consumers. Consumer documentation should explain how to integrate the code, not the history of this programme.

## 13. Technical references

- [Expo SDK 57 updates](https://docs.expo.dev/versions/v57.0.0/sdk/updates/): runtime compatibility and check/fetch/reload API boundaries. A matching runtime governs update eligibility; this extraction does not change that policy.
- Source app paths and immutable revisions are recorded in the provenance manifest. Previously reported release status is not evidence of current capability readiness.

Acceptance for this first execution: proposal complete, broad discovery recorded, bounded new capabilities implemented and tested, install path usable, focused donor defects addressed where evidenced, and limitations/remainder reported accurately.
