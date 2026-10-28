# Engagement, notifications and support

Use this for selected feedback, guidance, notification and support capabilities. The goal is useful assistance with predictable interruption. Do not add review prompts, newsletters, push delivery or analytics merely because these recipes exist.

## Prompt eligibility and coordination

A prompt needs a user benefit, a meaningful trigger, a suppression rule and a dismissal outcome. Prefer contextual help near the relevant action. Avoid interrupting onboarding, active editing, failure recovery or another modal with a promotional request.

Coordinate prompts through an app-owned policy rather than independent component timers. Record eligibility, last shown, dismissal and permanent opt-out separately where applicable. A shared cooldown prevents multiple features asking for attention in one session. Set actual intervals from the product's needs; they are not universal toolkit constants.

Claim eligibility once for the relevant event, and account for concurrent tabs/instances where needed. An in-memory flag alone does not provide durable or cross-tab coordination. Malformed/unavailable history should fail quietly for optional solicitation, not repeatedly prompt. Returning to a summary should not replay a completion-triggered request.

Where the platform supplies an official review-request mechanism, follow its current contract and avoid implying that a request guarantees a displayed prompt or submitted review. Do not condition access or rewards on positive feedback. Make skipped guidance findable again when it helps the user.

## Notifications are several separate states

| Concern | Meaning |
| --- | --- |
| Product preference | Which categories the user wants |
| OS permission | What the platform currently allows |
| Capability/configuration | Whether this platform/build/provider can deliver |
| Scheduling/subscription | What work is actually registered |
| Delivery | Whether the provider/platform has delivered or attempted delivery |
| Inbox/read state | What the app retains and the user has acknowledged |

Do not collapse all six into a single enabled boolean. Ask permission in context; denied/revoked permission needs a usable settings/manual alternative where possible. Refresh permission on appropriate lifecycle events. Persist preference changes with honest pending/failure behaviour; rapid opposite toggles must settle to the latest intended state without orphan schedules.

If reminders exist, define timezone, quiet hours, edit/cancel rules, deduplication, expiry and account/device ownership. An event change or deletion should update/cancel its scheduled work. Do not claim delivery merely because scheduling succeeded. Keep critical product state available inside the app rather than only in push notifications.

## Inbox and links

Define read/unread, archive/delete, retention and bulk action semantics only if an inbox is selected. Keep optimistic changes recoverable and scope undo to the affected notification revisions. Avoid inflating unread counts with duplicates or expired events.

Opening a notification must revalidate access and handle deleted/expired targets. Preserve a safe internal destination across sign-in. Sanitize link parameters and avoid exposing private content in lock-screen previews when the product's privacy policy requires a restrained preview.

## Feedback and support workflow

Offer a clear way to report a problem, make a suggestion or ask for help. Keep required fields minimal. Explain whether contact details are optional and whether a response is expected. Provide app/build information through a deliberate diagnostic boundary rather than asking users to paste raw logs.

Preserve the submission draft after failure. If queued offline delivery is promised, define durable queue ownership, retry limits, deduplication and the difference between queued and received. Do not clear the form after merely starting a request. Attachments require limits, preview/removal, privacy handling and cleanup of owned temporary files.

Use a support reference that identifies the report without encoding private content. Let users copy it and the relevant app version. Reporting failure must not crash the workflow being reported. Define provider access, retention and deletion according to the real product setup; do not invent response-time promises.

## Support/about surface

Include relevant product/version information, a working support path and applicable privacy/legal links. Explain offline storage, backup coverage and limitations where they affect decisions. Keep technical implementation details out of everyday tasks unless they help the user act. Build and update identifiers can live in a support disclosure.

Content needs an owner: support addresses, links and policies must be validated before release, and placeholders must not be presented as live service. Localized copy should remain consistent with action labels and actual capabilities.

## Acceptance cases

- Multiple eligible prompts compete; one appears, dismissal persists and permanent opt-out is respected.
- Reopen a completion screen; the prompt does not repeat without a new eligible event.
- Deny/revoke permission, rapidly change a preference and switch accounts; no false enabled state or orphan delivery work.
- Edit/delete a scheduled event; obsolete reminders are cancelled where promised.
- Open a notification for a removed/private target; access is rechecked and recovery is useful.
- Submit feedback offline, time out after possible acceptance, restart and retry; no silent loss or duplicate report where deduplication is promised.
- Inspect actual diagnostic/attachment payloads using sentinel private text; unapproved content is absent.

See [analytics](product-analytics-setup.md) for optional measurement, [import/sharing](import-export-and-sharing.md) for file ownership, and [identity](identity-and-collaboration.md) for account boundaries.
