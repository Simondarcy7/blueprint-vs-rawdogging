# Account recovery extraction

Implemented 30 October 2026. Two provider-neutral workflows were extracted from Golf's existing email/recovery and interrupted local-removal behavior. They are optional source modules; no Golf workflow, Supabase project, auth setting, database, or deployment was changed by this phase.

## Executable scope

`services/account-recovery/accountRecovery.ts` exports `createAccountRecovery`. The host provides authoritative `read`, `request`, and `verify` operations plus `getScope()` returning an account owner and a session/lease generation. The controller provides `refresh()`, `request(destination)`, `verify(destinationId, proof)`, cancellation, disposal, subscription, and frozen snapshots.

- Initial account state must load before a mutation. Returned owner, destination IDs, expiry and shape are validated; displayed state is detached/frozen. Labels should be masked where appropriate.
- Accepted request/verification and the following status refresh are separate outcomes. If verification succeeds but refresh fails, the controller retains that acknowledgement and requires refresh rather than silently submitting the credential again.
- Definite rejection allows explicit retry. A thrown or ambiguous mutation outcome requires an authoritative refresh first. Mutation inputs, proofs and raw provider errors are not copied into snapshots or a journal. Provider-supplied display labels may contain personal data and remain subject to the host privacy policy; access/refresh tokens must never be used as labels or destination IDs.
- Generation fencing covers account A → B → A transitions. A cancelled request may still have sent an email; a cancelled verification may still have changed provider state. Mutations keep their in-flight exclusion until the provider settles, return the actual accepted outcome with `current: false` when necessary, and do not pretend to roll back provider effects.
- Only observational reads have a bounded deadline. A provider that never settles a mutation leaves it pending; the host must supply an appropriate provider/transport contract. Do not race a mutation with a timeout and treat that as proof of failure.
- Resend cooldown is local UX policy, not backend abuse prevention. It survives cancellation and a late accepted/unknown result followed by refresh in the same account generation. Server rate limiting and credential policy remain with the provider.

This controller models authenticated account settings/recovery and challenge follow-up. It is **not** a universal login, password-reset, OAuth/PKCE, MFA or token storage implementation. Provider-specific identity verification, redirect allowlists, safe return paths, challenge type, credentials, secure storage and session installation stay in the host adapter. `accepted` means the adapter accepted that operation, not that all inboxes, credentials or account recovery steps are complete; the refreshed provider state determines that.

`services/account-recovery/localAccountCleanup.ts` exports `createLocalAccountCleanup`. `start(owner, authorize)` requires an explicit authorization callback returning an accepted receipt for that exact owner. `recover()` resumes only journalled **local cleanup** and never invokes remote sign-out, credential verification or account deletion again.

The host supplies a dedicated durable journal, a journal lock shared across every writer, an exclusive fresh owner lease, and ordered idempotent cleanup steps. Cleanup steps receive the pinned owner, cancellation signal and live lease assertion. They must assert the lease again at the actual storage commit and operate on that owner's namespace. The lease must remain exclusive across tabs/processes/recoverers until all callbacks and acknowledgements settle; a disposed screen repository is not an adapter.

The journal validates version, bounded unique owner entries, known step IDs and prefix progress. Corrupt records are retained and fail closed. Each completed step is acknowledged durably before the next; a failed step or lost progress acknowledgement remains recoverable. If a write never committed, the step may run again, which is why idempotence is mandatory. Cancellation pauses before later steps but still records a step or authorization that already succeeded. Separate controllers serialize journal updates and acquire fresh owner leases; progress acknowledgements are additionally idempotent.

A remote authorization and a local journal write are **not one transaction**. If authorization succeeds but the journal write fails, `start` returns `unrecorded`, with no cleanup started. The same live controller retains that owner for `recover()` to retry recording without repeating authorization. A process crash before durable intent is recorded loses this volatile knowledge: the host must reconcile the provider outcome or require an explicit local-removal recovery action. Products needing a stronger guarantee need a durable provider receipt/operation identity and reconciliation adapter. This implementation does not invent that backend guarantee.

## Golf source mapping

- `AccountEmail.tsx`: separate mutation acknowledgement from refresh failure, inbox selection, resend cooldown and stale UI scope.
- `accountEmail.ts`: verified account identity before changes; code/inbox validation; provider owns credential semantics.
- `modernAccountAuth.ts`: security challenge expiry, fresh account identity, OAuth callback/intent boundaries kept out of the generic controller.
- `accountRemovalRecovery.ts`: startup recovery is deferred until pending work exists.
- `removeScopedAccountData.ts`: journal only confirmed removal, clear scoped stores, retain failed work, finish without the old screen.
- `withAccountRemovalLease.web.ts`: fresh exclusive writer and waiting for the editing tab instead of forcibly deleting data.

Final source audit observed Golf HEAD `bf2210235e1f091afc7f4bbc15ba2baa6c3a50f6`. The selected source files had no local diff then; unrelated work elsewhere was preserved. Exact SHA-256 values identify the donor content independently of its concurrently moving branch:

| Donor file (under `mobile/src/`) | SHA-256 |
| --- | --- |
| `services/account/accountEmail.ts` | `c1cfc19fa826c0395ef26cd224f29e8a2d0440ae8080c839d72f614ea8c88e70` |
| `services/account/modernAccountAuth.ts` | `ee387781ced1afcc4f43ec4ec2dda827f17dd86ae287dee247f6ac1e33480cf8` |
| `services/account/accountRemovalRecovery.ts` | `0ff9a468fb86d06fecdfe6682e7d3a8a33a0ffc87999cf11319e46b9a709b6c9` |
| `services/account/removeScopedAccountData.ts` | `4bae25cb4c8afc64ee4e2dd8eda2e40d8f56e2ba7c35d09343411ef4c20c649e` |
| `services/account/withAccountRemovalLease.web.ts` | `4213600c8631b3e2d2d8e1b953fcb82af1c2ed76c4f28e66027346e630a5a51b` |
| `modules/account/screens/AccountEmail.tsx` | `a0594ce31706410227f70d8106345836a768fbdc79bab91fb0326eb534354a17` |

The extraction reorganizes those invariants around typed ports; it does not copy Golf's SQLite schemas, storage names, account emails, Supabase instance configuration, legal copy or product data. Baseline `lib/asyncWork.ts` supplies the bounded-read helper. The existing storage `recoveryJournal` remains a snapshot-history utility; this account cleanup journal is specifically an authorized, ordered local-removal workflow.

## Verification and review

```sh
node --test tests/account-recovery-capability.test.mjs tests/account-recovery-cleanup.test.mjs
```

29 tests passed, including installed-layout strict TypeScript. Cases cover accepted-but-refresh-failed outcomes; no proof/error leakage; immutable state; account generation changes; duplicate operations; read deadline/cancellation; non-cancellable mutation acknowledgement; invalid scope/expiry/clock; corrupt journals; failed authorization; partial cleanup; commit-before-ack loss; idempotent replay; disposal during authorization; fresh/wrong leases; concurrent recoverers; and full-journal refusal.

Independent review reproduced and closed two defects before completion:

1. Overlapping progress acknowledgements could append a duplicate step. Acknowledgement now merges idempotently; the contract explicitly requires exclusive owner leases and the overlapping-recoverer regression passes.
2. Cancel → late accepted request → refresh could erase the resend cooldown. A separate receipt scope now retains the same-generation acknowledgement/cooldown and its regression passes.

The reviewer independently reran all 29 tests and both original reproductions; no remaining actionable finding under the documented adapter contracts. An independent read-only review of the adjacent undo pack found no actionable defect under its atomic storage/pure codec/ownership contract; its 18 tests, including strict installed-layout compilation, passed.

These are deterministic provider/journal/lease fakes and TypeScript evidence, not live Supabase, native secure-storage, cross-process OS locking, real email delivery, or production account deletion validation. A receiving product must implement and verify its actual adapters. No new real-product adoption is claimed in this phase.

## Provider documentation checked

The Supabase changelog was checked on 30 October 2026. Its relevant [TLS cipher change](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) does not require provider-neutral source changes. [Password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) is a provider flow involving an emailed recovery transition and password update, which this engine deliberately does not substitute. [User management](https://supabase.com/docs/guides/auth/managing-user-data) states that deleting an auth user does not retroactively revoke issued access tokens; strict authorization/session invalidation remains a server concern. No service-role keys, JWT authorization policy or Supabase schema changes were introduced.

## Token usage notes

Most context went to distinguishing accepted provider mutations from stale UI updates and resumable local cleanup. Some combined donor reads were too large; future runs should read one account workflow plus its focused tests at a time. Reusing existing test fixtures and delegating a focused race review kept implementation and verification bounded without sacrificing the important failure paths.
