# Reusable reliability recipes

These optional patterns generalize problems encountered in a stateful mobile/web app. They are independently tested toolkit recipes, not a claim that their originating app is released or fully validated. Install the `diagnostics` or `storage` capability pack only when the product needs it. No account, backend, analytics collection or sync engine is created.

## A useful diagnostic trail without user content

`createDiagnosticTrail` in the diagnostics pack's `safeTelemetry.ts` keeps the latest 25 events by default (configurable from 1 to 100). Define a static policy such as `{ navigation: { screen: ['home', 'settings', 'other'] } }`. Map routes to those categories locally; never put route strings, query parameters, names, search text or IDs in the policy. Field names and values are both allowlisted.

Enable only after the app's diagnostic policy/consent is hydrated. Record navigation, modal or lifecycle categories where they help reproduce a failure. Clear on sign-out/account changes; disable to clear and stop collection. Attach a defensive `snapshot()` to a sanitized error payload. The helper has no disk storage or network transport, and provider adapters must separately disable or sanitize automatic breadcrumbs, replay, user identity and native crash attachments. Clearing local history does not delete provider-held records.

Verify unknown events/fields/values are excluded, the oldest entries are dropped, returned snapshots cannot mutate retained history, and hostile input cannot interrupt the main workflow. Use sentinel personal strings in wire-payload tests when integrating an SDK.

## Honest “saved” and “backed up” state

`createSaveAcknowledgement` in the storage pack starts unacknowledged. After every successful local mutation call `changed()`. Capture a ticket alongside an immutable snapshot before starting its remote write. On verified commit call `acknowledge(ticket)`; its result indicates whether the latest local revision is acknowledged. An older completion cannot cover edits made after capture. Repeated, foreign and reset-invalidated tickets are rejected.

Reset on owner change, dataset replacement/deletion or loss of writer ownership, including account A → B → A. Keep one owning instance per scope. After restart the helper intentionally knows nothing about previous receipts; reverify or perform a save before claiming current backup. Do not use it to decide whether local data is durable: it tracks only the persistence boundary you explicitly acknowledge.

The adapter must confirm the exact intended snapshot committed. HTTP success alone is insufficient if server validation, triggers or conflict checks can skip records. Serialize writes or implement server-side compare-and-swap with an expected revision and atomic receipt. Never fall back to a weaker write endpoint after a conflict. A transport timeout can mean an unknown commit outcome; reconcile through an idempotent operation/receipt before retrying. This helper is not that server protocol and does not implement multi-tab locks or a durable outbox.

Test edits during an in-flight save, reversed completion order, failed writes, owner changes, deletion and restart. Verify backend contents separately before claiming multi-device safety.

## Temporary QA resources have owners and lifetimes

Wrap one-off exports in a task-owned temporary directory. Keep the server/test consumer inside the wrapper's lifetime and remove the build in `finally`, including export/test failures and handled interrupts. Preserve screenshots, traces and reports outside that temporary directory. A wrapper must wait for child processes to stop before deleting their build. If the process is forcibly killed, reclaim only positively identified abandoned resources; never sweep arbitrary folders by age.

Reuse an owned QA browser when identity, origin and tool policy match. Use isolated contexts for different accounts because ordinary tabs share storage. Record ownership before launching extra instances and close owned pages/contexts in teardown. Preserve user browsers, account-recovery sessions and other tasks' resources. No global process kill or profile deletion. Resource reuse must not bypass denied browser actions.

This guide deliberately provides a lifecycle contract rather than a universal Expo export script: integrate with the host app's existing export finalizers, validation, process supervision and platform support. Verify cleanup after success, export failure, test failure and interruption, and verify unrelated resources survive. Retain custom builds only when needed for review and record their cleanup owner.
