# Required app blueprint

This is the project contract for new apps adopting this toolkit. Read it before planning or implementation. Detailed guides explain how to satisfy it; they do not authorize a different architecture. Explicit user instructions take precedence.

## Scope: a reusable app baseline

The blueprint standardizes how apps are built: architecture, shared UI, navigation, accessible states, configuration, performance, release operations and verification. The new product brief defines what the app does.

Start interactive apps with the generic app baseline: settings and persisted appearance/motion preferences, support/about details, shared loading and recovery states, navigation and accessible controls. Include notification preferences where a useful notification capability exists and SEO for public web content. Read the installed `generic-app-baseline.md` guide and complete `docs/app-baseline.md`; record inapplicable items with a reason.

Business features and external services remain product-owned. Accounts, payments, sync, analytics collection and notification delivery are not activated by adopting the baseline. Detailed optional guides are not a feature backlog. The source recipes provide reusable behavior without imposing branding or domain logic.

## Required starting architecture

- Use TypeScript, Expo React Native and Expo Router for the product app, including its web surface. Do not substitute Vite, Next.js or another app framework without explicit user approval. A separately approved public content site may use a different stack.
- Use `src/app/` for routes/Router special files and `src/modules/` for product capabilities. Do not create competing `app/` or `src/features/` trees.
- Keep route files focused on routing and supported Router exports. Keep ordinary components, tests, business rules and integrations outside the route tree.
- Each product module has an intentional `index.ts` public API. Other modules and routes use that API; internal implementation uses direct relative imports. Prevent circular dependencies.
- Put accessible shared primitives in `src/components/ui/`, visual tokens in `src/theme/`, validated environment and app configuration in `src/config/`, and shared platform/vendor adapters in `src/services/`.
- Keep feature state, types and helpers local until there is a real shared need. Foundation contracts, when needed, must remain independent of concrete product modules and vendors.
- Use compatible Expo/Router versions and consult matching official documentation. Do not invent version pins or copy stale SDK configuration.

## Native delivery default

For apps distributed to native testers or users, prepare and verify over-the-air (OTA) delivery before external beta. EAS Update is the default Expo approach; record an owner-approved store-only or alternative delivery exception when appropriate. Web-only apps mark native OTA N/A. This is release infrastructure, not a product feature.

The release gate requires an update-enabled installed binary, compatible runtime policy, explicit channel/environment mapping, preview device verification, safe update application, release identification and a tested recovery procedure. Follow the installed build-and-release-workflow guide. Do not infer native OTA readiness from Metro, Expo Go, a web export or a successful upload. Installing this blueprint does not publish an update or authorize a live release.

## Required working behavior

1. Read this contract and the installed mature-app-starter `references/expo-project-structure.md`. If using only a repository link, fetch/read those files before adopting the toolkit. Inspect existing project instructions and changes first.
2. Complete `docs/project-index.md` with product scope, first workflow, platforms, ownership and real commands. Complete `docs/app-quality-contract.md` with applicable checks, measurable budgets and pending evidence.
3. Build the first useful workflow with relevant loading, empty, partial, offline, error and recovery states. Use semantic controls, visible/unobscured focus, usable navigation and reduced motion. Sticky UI and optional infrastructure must be justified by the workflow.
4. Keep SEO/public-route policy, image delivery, performance, privacy and data recovery explicit. Mark conditional requirements N/A with a reason; do not omit mandatory architecture because a feature does not need SEO or persistence.
5. For data/state changes, preserve unknown values and stable identity, use authoritative parsing/config contracts, and define async ordering and failure semantics. Verify the applicable behavior; the installed code-correctness guide provides focused patterns. For integrations and releases, distinguish configured/submitted states from verified/completed outcomes.
6. Before handoff, run `node scripts/verify-blueprint.mjs`, typecheck, lint and the relevant behavioral tests. Include required manual accessibility/device checks when affected. Wire the structural check into the app's normal check command and CI once those exist. Do not claim completion with missing or failed required checks.
7. Report what changed, checks and results, unresolved gaps and approved exceptions. Preserve unrelated user work; keep searches targeted and use no subagents unless the user explicitly asks.

The installer supplies instructions, planning templates, a structural verifier and copyable generic baseline source inside the installed skill. Source recipes require deliberate host integration and do not overwrite app code. It does not generate an Expo application, install dependencies, configure CI, or complete planning records. The verifier should fail on a fresh instruction-only install until the app foundation exists.

## Exceptions and existing projects

For a conflicting stack, folder convention or mandatory rule, explain the conflict and recommend a concrete exception or migration. Obtain explicit user direction before implementing that departure; a self-written ADR is not approval. When the user has already specified the exception, record it without asking again. Continue independent compliant work while a decision is pending.

Record approved exceptions in `docs/adr/` with the affected rule, reason, user decision, verification impact and revisit trigger. If an exception requires changing a structural check, make that change explicit and reviewable; never disable a check merely to get green output. Existing nonconforming projects are not automatically migrated or considered compliant by installing this toolkit.

## Verification limits

`verify-blueprint.mjs` checks package declarations, the standard Router entrypoint, required files, route/module roots, module public entrypoints and obvious misplaced route files. It does not analyze import graphs, prove thin routes, validate semantic accessibility, run the app, or authenticate human approval. Add framework-appropriate lint/import checks and behavior tests as implementation grows. Passing the structural check is one gate, not full blueprint conformance.
