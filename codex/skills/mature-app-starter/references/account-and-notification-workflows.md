# Account and notification workflows

These optional source packs extend the product-workflow foundation. Select only the capabilities required by the product:

```sh
node .agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs --root . --with account-recovery,notification-preferences,undo --only-packs --dry-run
```

Remove `--dry-run` after inspecting the planned destinations. Installation is additive and refuses existing files. It does not wire routes, configure identity providers, schedule notifications or change account data. Keep host storage and device adapters outside the canonical modules. Account recovery and notification preferences require the existing baseline `src/lib/asyncWork.ts`; undo is standalone.

## Boundaries

Account recovery must distinguish provider authentication from recovery of local account state. Never store credentials, recovery links or tokens in ordinary workflow journals. Server authorization and identity verification remain provider responsibilities.

Notification preferences coordinate durable intent and device effects. Permission denial, scheduling failure and persistence failure require different outcomes. Reconcile on foreground through the host's existing platform lifecycle.

Undo restores a reviewed snapshot into the latest collection, preserving later arrivals. The host must provide an atomic transaction and enforce current ownership at commit. A session-only undo buffer is not durable recovery after a crash.

Implementation contracts, source mappings and verification are recorded in the corresponding account-recovery, notification-preferences and undo notes under `proposals/implementation-notes/`. Read those before implementing an adapter; do not substitute asynchronous list-then-replace for an atomic merge.

## Entry points

- `src/services/account-recovery/accountRecovery.ts`: verification challenge lifecycle; see the account recovery note for the provider contract.
- `src/services/account-recovery/localAccountCleanup.ts`: resumable, journaled local cleanup, separate from remote account deletion.
- `src/services/notification-preferences/notificationPreferences.ts`: authoritative revisions, explicit write receipts, rollback and device reconciliation.
- `src/services/undo/undoController.ts`: atomic merge-safe session undo with explicit uncertain-outcome resolution.

For a new UI, subscribe to the controller snapshot, map its status to the host's accessible loading/error/retry states, and invoke mutations only from explicit user actions. Dispose controllers on ownership changes and recheck account generation at each adapter commit boundary. Test the real adapter before treating the workflow as operational.
