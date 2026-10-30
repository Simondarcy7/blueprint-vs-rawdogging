# Durable outbox extraction

Source behaviour: Golf App `mobile/src/services/feedback/queue.ts` and `model.ts`, starting revision `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df`. Exact source/destination fingerprints are in `../golf-extraction-provenance.json`.

The reusable decision is to preserve a submission locally before network work, keep revisions in order, and retain stable operation IDs across retries. The destination is `app-capabilities/outbox/src/services/outbox/durableOutbox.ts`; it has no golf vocabulary, analytics identity, React or SDK dependency. It reuses the existing baseline serial queue/deadline utilities.

Adaptations beyond the donor: required payload validation on ingress/reload; schema/count/byte validation; snapshot input and transport payloads; reject duplicate identities; finite flush batches; explicit disposal/ownership checks; distinguish pending delivery/storage outcomes; and preserve corrupt/future data rather than silently replacing it. These are deliberate engineering changes, not byte-for-byte extraction.

Host obligations: one writer instance per account-scoped key, atomic storage replacement, commit-aware write outcomes, reads that settle, receiver deduplication by operation ID, appropriate data protection and explicit retention/removal. A timed-out network attempt may have succeeded remotely. A storage write already handed off cannot be safely cancelled by this controller. Naive write timeouts followed by new writes would risk stale overwrite, so the controller intentionally does not implement that pattern. Disposal fences future handoffs/acks but cannot force a stalled local storage call to settle.

Focused verification: `node --test tests/outbox-capability.test.mjs` contains 13 behavioural tests covering reopen/retry ordering, snapshot isolation, stable IDs, coalesced flushing, acknowledgement failure, concurrent arrival, corrupt/future data, quota/identity checks, ownership/disposal, and stalled transports. Two different validated payload shapes exercise reuse in a fixture; they are not two shipping consumers. `tests/capability-adoption.test.mjs` installs the pack in a generated Expo app and strict-typechecks the copied imports.

Independent review found no data-loss issue under the stated single-writer/atomic-store assumptions; it prompted the explicit bounded-read and commit-aware storage documentation. Real host storage, receiver idempotency, offline UI and cross-process coordination remain adoption gates.
