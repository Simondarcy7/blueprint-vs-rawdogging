# Identity and collaboration

Accounts and shared workflows are optional product capabilities. Add them when identity is necessary for the first useful loop, privacy, ownership or collaboration. These are behaviour and acceptance recipes, not a supplied authentication backend, security certification or universal role model.

## Guest and account boundaries

Define what a guest can do, where guest data lives and why an account adds value. Avoid blocking local work behind sign-in unless the brief requires it. Explain account-only actions at the point they are needed and preserve a safe return destination.

For guest-to-account transition, inventory eligible drafts, records, favourites and preferences. Choose copy, move, merge or leave-on-device per collection. Detect duplicates by stable identity, not similar labels. Do not discard guest work until the promised destination commit is verified. A failed/cancelled sign-in must leave a usable guest state. Existing-account conflicts need an explicit policy, not silent replacement.

## Session and owner lifecycle

| Event | Required decision |
| --- | --- |
| Initial hydration | What can render before identity is known, without exposing another owner's data? |
| Sign-in callback | Validate callback and internal return destination; handle cancellation/expiry safely |
| Session expiry | Preserve eligible edits and offer reauthentication; do not repeatedly retry unauthorized writes |
| Account switch | Fence old requests, subscriptions, caches, drafts, notices and undo receipts |
| Sign-out | Define local data/session cleanup and pending-work handling |
| Account deletion | Explain scope, verify authorization and track completion separately from local sign-out |

Use a generation or equivalent ownership ticket for in-flight work. A → B → A must invalidate the original A task, even though the identifier matches again. Client isolation is not server authorization; enforce ownership on every protected server operation. Do not rely on hidden buttons for access control.

## Deletion, recovery and shared-device privacy

Distinguish local reset, remove-account-from-device and delete-account/server-data. Inventory active, legacy, cached, draft, recovery, attachment and provider-held copies. Stop writers before cleanup so delayed retries cannot recreate deleted records. If cleanup can be interrupted, record and resume required steps before exposing stale private data.

Explain any retention or externally held data according to the real product policy. A local sign-out cannot promise that every provider copy has been deleted. Verify another account's data survives a scoped reset. Reopening or reinstalling the app must follow the actual storage model, not assumptions about token disappearance.

For recovery, show which credential or account is needed without exposing private identifiers unnecessarily. Never present a failed account restore as an empty account or silently replace it with sample data.

## Invitations, roles and group membership

Define actor capabilities in a small matrix: owner/organizer, participant, invited user and viewer are examples, not mandatory roles. Specify who can invite, edit, remove, transfer ownership, view private details and close the shared activity. Check these permissions at the server boundary and recheck when an action is submitted.

Invitations have pending, accepted, declined, expired and revoked outcomes where applicable. Define whether acceptance is single-use/idempotent, whether a link can be forwarded and what happens when the target account differs. Capacity changes and acceptance must be checked atomically when oversubscription matters. Revocation must affect access, not only the invitation list.

Handle removed members and deleted groups while their screens are open. Preserve organizer/recovery capabilities deliberately; do not leave a group ownerless through an ordinary exit without an explicit transfer/closure policy.

## Shared activity and conflicts

Choose an authority for shared records, valid state transitions and who may perform each transition. Define how updates arrive, how stale views are labelled, and what remains editable offline. A realtime subscription does not establish ordering or conflict safety by itself.

For concurrent edits, use the selected backend's revision/transaction/idempotency contract. Prevent stale writes from silently overwriting later changes. Preserve recoverable user intent on conflicts, and explain whether retry, merge or a deliberate choice is required. Deletion/tombstones must dominate delayed retries according to the product's rules.

Threads/messages, moderation, rankings, scheduling and payments are separate capabilities, not automatic additions to a group feature. If user-generated content exists, scope reporting, permissions, retention and moderation responsibilities before opening it to users.

## Acceptance cases

- Guest creates work, cancels sign-in, then signs into a populated account with a collision.
- Expiry during save and sign-out during a fetch; no false success or stale private rendering.
- A → B → A while the original request resolves; old work is rejected.
- Interrupted deletion/restart; cleanup resumes and another identity remains intact.
- Invitation accepted twice, after revocation, by the wrong identity and concurrently at capacity.
- Role removed while editing; the backend denies the write and the UI offers a useful outcome.
- Concurrent change, offline reconnect and delete followed by a delayed retry.

Keep authentication providers, database schemas, role names and domain conflict rules app-owned. See [data resilience](data-resilience-and-capabilities.md), [content trust](content-trust.md) and [reliability recipes](reliability-recipes.md).
