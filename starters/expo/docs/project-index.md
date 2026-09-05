# Project index

Status: runnable shell baseline; product definition and external release readiness pending. Generated apps record their origin in `blueprint-version.json`. Complete product scope and reverify after customization.

- Product: replaceable local notes example demonstrating capture → save → find → edit/delete.
- Stack: TypeScript, Expo SDK 57, Expo Router; iOS, Android and static web.
- Routes: `src/app`; product ownership: `src/modules` with explicit `index.ts` APIs.
- Brand: `brand.json`; fonts: `src/config/fonts.ts`; visual roles: `src/theme/tokens.ts`.
- Shared UI: `src/components/ui`; adapters: `src/services`; environments: `src/config/env.ts`.
- Architecture and data authority: `docs/architecture.md`.
- No accounts, cloud sync, analytics collection, push, camera or location by default.
- Approved architecture exceptions: none.
- Actual verification and limits: `docs/verification.md`; release procedure: `docs/release.md`.

## Commands

- Start: `npm start`; web development: `npm run web`.
- Checks: `npm run check`; compatibility: `npm run doctor`.
- Web export/budgets: `npm run build:web`; browser tests: `npm run test:e2e`.
- Native bundles: `npm run export:native`; generated app CI: `.github/workflows/check.yml`.
- Brand asset generation/freshness: `npm run assets` / `npm run assets:check`.
- Component gallery: set `EXPO_PUBLIC_SHOW_GALLERY=true` in a local development environment and open `/_preview`. Disable it before release.

## Before product implementation

Record intended users, first useful workflow, platforms, non-goals, public routes, data sensitivity, module owners, budgets and selected services in the quality contract. Replace the example as one coherent module and update its workflow tests. Keep no unused example screens in the final product.

Native OTA readiness remains pending until this app has its own identity, installed update-enabled build and verified update/recovery evidence. Native exports and web tests do not prove that gate.
