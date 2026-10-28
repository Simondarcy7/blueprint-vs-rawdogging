/** Local UI bookkeeping, not a server revision, durable outbox or cross-writer lock. */
export function createSaveAcknowledgement() {
  let generation = 0;
  let revision = 0;
  let acknowledged = -1;
  let tickets = new WeakMap<object, { generation: number; revision: number }>();
  return {
    changed() {
      if (revision === Number.MAX_SAFE_INTEGER) throw new Error('Local revision exhausted');
      revision++;
    },
    /** Capture beside the immutable snapshot sent to storage, before awaiting. */
    capture(): object {
      const ticket = Object.freeze({});
      tickets.set(ticket, { generation, revision });
      return ticket;
    },
    /** Call only after the adapter verifies that the exact snapshot committed. */
    acknowledge(ticket: object): boolean {
      const saved = tickets.get(ticket);
      tickets.delete(ticket);
      if (!saved || saved.generation !== generation) return false;
      acknowledged = Math.max(acknowledged, saved.revision);
      return acknowledged === revision;
    },
    isCurrent() { return acknowledged === revision; },
    /** Reset on owner change, replacement, deletion or losing writer ownership. */
    reset() { generation++; revision = 0; acknowledged = -1; tickets = new WeakMap(); },
  };
}
