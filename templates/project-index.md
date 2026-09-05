# Project index

Status: setup pending. Read `BLUEPRINT.md` before implementation. Replace this record with actual decisions and commands; installing the toolkit does not complete setup.

- Adopted toolkit revision / date / reviewed local deviations:
- Product / users / first useful workflow:
- Supported platforms and representative devices:
- Non-goals:
- Stack: TypeScript + Expo React Native + Expo Router.
- Route root: `src/app/`.
- Product ownership: `src/modules/`; deliberate `index.ts` public APIs.
- Shared UI / theme / config / services: `src/components/ui/`, `src/theme/`, `src/config/`, `src/services/` as needed.
- Architecture/system map: pending; keep a short map here or link `docs/architecture.md`. Record the critical workflow, data authority, failure boundaries and evidence; update when those decisions change.
- Module owners and purposes:
- Approved exceptions and ADR links: none recorded.

## Commands and evidence

- Structural check: `node scripts/verify-blueprint.mjs` (fails until the foundation exists).
- Typecheck: pending.
- Lint: pending.
- Relevant tests: pending.
- Development / export / supported platform verification: pending.
- Native delivery: OTA readiness pending for distributed native apps; record provider, runtime policy, channel/environment mapping, device/recovery evidence or approved alternative. Web-only: N/A.
- CI entrypoint containing the structural check: pending.
- Quality decisions and evidence: `docs/app-quality-contract.md`.
- Use the installed quality-foundation readiness map to locate applicable setup guides; record progress here and in the quality contract, not in a duplicate checklist.

## Starting request

> Follow BLUEPRINT.md strictly. Use TypeScript, Expo and Expo Router with src/app routes and src/modules features. Complete the project index and quality contract, then implement the first useful workflow. Keep modules and services within their documented boundaries. Do not change the stack or required architecture without my explicit direction. Add the structural verifier to checks/CI and report actual verification results. Do not treat an instruction-only installation as a completed app.
