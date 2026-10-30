# Notification screen workflows and Golf adoption

The optional `product-workflows` pack now contains a complete virtualized Inbox composition and a controller-backed notification preferences panel. The existing notification-preferences controller remains the provider-neutral transactional core. No notification delivery provider, account backend, or universal preference schema is invented.

`NotificationInbox` combines multiple host-supplied sources without removing useful content during partial loading or failure. It provides a title/action region, all/unread selection, keyboard recovery from an empty unread filter, status and undo actions, read-all activity and a virtualized list. Selection is controlled so a deferred source replacement cannot reset the user's filter or recovery offer. Hosts retain route handling, row content, chronological order and branding. Rows receive their previous visible entry for accurate date grouping.

`NotificationPreferencesPanel` renders typed boolean preference fields against the phase-4 controller. Initial reconciliation does not request permission. Toggles display acknowledged durable values, not requested values. Denied permissions, unknown writes, conflicts, scheduling failure and rollback have separate messages. Unknown writes remove editable controls until an authoritative refresh. The host owns controller scope, foreground/background transitions and disposal; schedule editors can be supplied as children and must use the same controller. It is available and tested, but Golf's mature preference/scheduling provider is intentionally retained in this delivery.

## Actual Golf integration

The isolated PR45 checkout uses the shared Inbox for `/notifications` while preserving Golf colours, typography, mascot empty state, per-round summaries, social feed, dated groups and the existing options modal. The external `Screen` retains safe-area ownership; the shared FlatList is the only scroll owner. No copied alternate demo screen is used.

The real `NotificationProvider` adopts the shared phase-4 undo controller through `createInboxUndo`. Clear/restore now return asynchronous truthful receipts. Native replacement runs inside one real SQLite transaction. Web replacement reads strictly and performs one localStorage commit while the existing account storage writer lease is held; its scoped storage verifies the captured grant at commit. The in-memory fallback also builds a complete candidate before assigning it. Current arrivals win, while a previously known read timestamp remains monotonic. Failed transactions retain the recovery offer. A restore exceeding the existing 100-item limit fails without silently dropping arrivals or older history. Undo remains session-only and local personal notifications only; group updates are not deleted.

Provider teardown and account generation changes fence queued work and prevent stale UI refresh. A local-data deletion discards the offer. Native/device delivery, provider account recovery, multi-device synchronization and production permissions are not certified by these tests.

The only module-side-effects policy addition reviews React `forwardRef` registration for the exact vendored `controls.tsx` file. Those calls allocate component descriptors; their handlers/effects do not execute at import time. The general gate remains enabled.

## Verification

- Canonical `node --test tests/notification-workflows.test.mjs`: 8 passing React composition tests using mocked React Native hosts. These verify state/prop behavior, not native/browser layout.
- Golf Jest: 17 actual React Native component tests across Inbox (14 existing behavior regressions) and NotificationProvider (3 integration/lifecycle tests).
- Golf Vitest: 18 tests across inbox undo, memory/parser, native SQLite and browser repositories. A real SQLite trigger forces failure after a partial insert sequence and proves the entire restore rolls back; a subsequent retry retains new arrivals.
- Full Golf TypeScript and targeted lint pass. The module-side-effects check passes with the reviewed exact-file exception.
- Independent cross-review found no actionable issue under the documented host ownership, transaction and lifecycle contracts.

Golf work was performed only in the isolated checkout based on PR45 `dcb19e99fa589fed82afd736c80bc0e5f5595e85`, with physical locked dependencies installed via `npm ci`. The original dirty Golf checkout was not changed. App-shell copies use the separate hash-protected sync manifest and are never edited in place. Root owns final browser/export evidence and GitHub publication.

The final managed Golf web export passed SEO for 103 public pages, CSP and the 750,000-byte initial-JS hard budget at 746,515 bytes gzip (+4,550 versus the previous adoption baseline). The 620,000-byte target remains unmet. Full Golf TypeScript completed with exit 0 after correcting shared UI ref types for RN 0.88; those declarations were independently checked on RN 0.83 too. The existing 13 import-policy unit checks pass. Browser review and publication remain parent-owned.
