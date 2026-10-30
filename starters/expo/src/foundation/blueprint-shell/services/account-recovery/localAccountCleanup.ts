export type CleanupLease = Readonly<{ owner: string; assertCurrent(): void }>;
export type CleanupContext = CleanupLease & Readonly<{ signal: AbortSignal }>;
export type CleanupStep = Readonly<{ id: string; remove(context: CleanupContext): Promise<void> }>;
export type CleanupAuthorization = Readonly<{ status: 'accepted'; owner: string }> | Readonly<{ status: 'rejected' | 'unknown' }>;
export type CleanupResult = Readonly<{
  status: 'complete' | 'pending' | 'rejected' | 'unknown' | 'unrecorded' | 'blocked' | 'cancelled' | 'busy';
  completedOwners: number;
}>;
export type CleanupSnapshot = Readonly<{
  status: 'idle' | 'authorizing' | 'journaling' | 'cleaning' | 'pending' | 'complete' | 'blocked' | 'cancelled' | 'disposed';
  owner: string | null; step: string | null; busy: boolean;
  error: 'authorization' | 'journal' | 'lease' | 'cleanup' | null;
}>;
type Entry = { owner: string; completed: string[] };
const identifier = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 256;

/** Resume only local cleanup. Authentication/server deletion is never replayed by recover(). */
export function createLocalAccountCleanup({ journal, withJournalLock, withOwnerLease, steps: suppliedSteps, maxPendingOwners = 32 }: {
  /** Dedicated, protected durable key. Rejection never authorizes overwriting a corrupt record. */
  journal: { read(): Promise<string | null>; write(raw: string): Promise<void> };
  /** Must serialize this journal across every writer/tab/process, including write acknowledgement. */
  withJournalLock<T>(operation: () => Promise<T>): Promise<T>;
  /** Exclusive across every owner writer/recoverer until operation settles, including acknowledgements. */
  withOwnerLease<T>(owner: string, operation: (lease: CleanupLease) => Promise<T>): Promise<T>;
  /** Stable ordered IDs; operations must be idempotent, including after a lost acknowledgement. */
  steps: readonly CleanupStep[];
  maxPendingOwners?: number;
}) {
  const steps = suppliedSteps.map(step => ({ id: step.id, remove: step.remove }));
  const stepIds = new Set(steps.map(step => step.id));
  if (!Number.isSafeInteger(maxPendingOwners) || maxPendingOwners < 1 || maxPendingOwners > 256 || steps.length < 1 || steps.length > 64
    || stepIds.size !== steps.length || steps.some(step => !identifier(step.id) || typeof step.remove !== 'function')) throw new Error('Invalid cleanup policy');
  let disposed = false;
  let active: AbortController | null = null;
  // Only used to retry a failed journal write in this still-live controller.
  const unrecorded = new Set<string>();
  let snapshot: CleanupSnapshot = Object.freeze({ status: 'idle', owner: null, step: null, busy: false, error: null });
  const listeners = new Set<() => void>();
  function publish(patch: Partial<CleanupSnapshot>) {
    if (disposed) return;
    snapshot = Object.freeze({ ...snapshot, ...patch });
    for (const listener of listeners) { try { listener(); } catch { /* Observers do not own the removal journal. */ } }
  }
  const outcome = (status: CleanupResult['status'], completedOwners = 0): CleanupResult => Object.freeze({ status, completedOwners });
  async function read(): Promise<Entry[]> {
    const raw = await journal.read();
    if (raw === null) return [];
    if (typeof raw !== 'string' || raw.length > 262_144) throw new Error('Cleanup journal exceeds limits');
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error('Invalid cleanup journal');
    const record = value as Record<string, unknown>;
    if (record.version !== 1 || !Array.isArray(record.entries) || record.entries.length > maxPendingOwners) throw new Error('Invalid cleanup journal');
    const owners = new Set<string>();
    return record.entries.map(entry => {
      if (!entry || typeof entry !== 'object' || !identifier(entry.owner) || owners.has(entry.owner) || !Array.isArray(entry.completed)
        || entry.completed.length > steps.length || new Set(entry.completed).size !== entry.completed.length
        || entry.completed.some((id: unknown) => typeof id !== 'string' || !stepIds.has(id))) throw new Error('Invalid cleanup entry');
      // Progress is a prefix of this installed cleanup policy, not an arbitrary bypass list.
      if (entry.completed.some((id: string, index: number) => steps[index]?.id !== id)) throw new Error('Cleanup policy changed; migration required');
      owners.add(entry.owner);
      return { owner: entry.owner, completed: [...entry.completed] };
    });
  }
  async function update(change: (entries: Entry[]) => Entry[]) {
    return withJournalLock(async () => {
      const next = change(await read());
      if (next.length > maxPendingOwners) throw new Error('Cleanup journal is full');
      await journal.write(JSON.stringify({ version: 1, entries: next }));
    });
  }
  async function clean(owner: string, controller: AbortController): Promise<boolean> {
    let phase: CleanupSnapshot['error'] = 'lease';
    publish({ status: 'cleaning', owner, step: null, error: null });
    try {
      return await withOwnerLease(owner, async lease => {
        if (lease.owner !== owner) throw new Error('Wrong cleanup lease');
        const assertCurrent = () => { if (lease.owner !== owner) throw new Error('Wrong cleanup owner'); lease.assertCurrent(); };
        const ctx = Object.freeze({ owner, signal: controller.signal, assertCurrent });
        for (const step of steps) {
          if (controller.signal.aborted) return false;
          phase = 'lease'; assertCurrent();
          phase = 'journal';
          const entry = await withJournalLock(async () => (await read()).find(entry => entry.owner === owner));
          if (!entry) return true;
          if (entry.completed.includes(step.id)) continue;
          if (controller.signal.aborted) return false;
          phase = 'lease'; assertCurrent();
          phase = 'cleanup'; publish({ step: step.id });
          if (controller.signal.aborted) return false;
          await step.remove(ctx);
          // A completed step remains completed even if its caller closed while it ran.
          phase = 'lease'; assertCurrent();
          phase = 'journal';
          await update(entries => entries.map(entry => entry.owner === owner && !entry.completed.includes(step.id)
            ? { owner, completed: [...entry.completed, step.id] } : entry));
        }
        phase = 'lease'; assertCurrent();
        phase = 'journal';
        await update(entries => entries.filter(entry => entry.owner !== owner));
        return true;
      });
    } catch {
      publish({ status: 'pending', owner, error: phase });
      return false;
    }
  }
  function run(work: (controller: AbortController) => Promise<CleanupResult>): Promise<CleanupResult> {
    if (disposed) return Promise.resolve(outcome('cancelled'));
    if (active) return Promise.resolve(outcome('busy'));
    const controller = new AbortController();
    active = controller;
    return Promise.resolve().then(() => work(controller)).finally(() => {
      active = null;
      publish({ busy: false });
    });
  }
  function start(owner: string, authorize: (context: Readonly<{ owner: string; signal: AbortSignal }>) => Promise<CleanupAuthorization>) {
    if (!identifier(owner) || typeof authorize !== 'function') return Promise.resolve(outcome('blocked'));
    return run(async controller => {
      if (controller.signal.aborted) return outcome('cancelled');
      publish({ status: 'authorizing', owner, step: null, busy: true, error: null });
      try {
        await withJournalLock(async () => {
          const entries = await read();
          if (entries.length >= maxPendingOwners && !entries.some(entry => entry.owner === owner)) throw new Error('Cleanup journal is full');
        });
      } catch { publish({ status: 'blocked', error: 'journal' }); return outcome('blocked'); }
      if (controller.signal.aborted) return outcome('cancelled');
      let approved: CleanupAuthorization;
      try { approved = await authorize(Object.freeze({ owner, signal: controller.signal })); }
      catch { approved = { status: 'unknown' }; }
      if (!approved || approved.status !== 'accepted' || approved.owner !== owner) {
        publish({ status: controller.signal.aborted ? 'cancelled' : 'blocked', error: 'authorization' });
        return outcome(approved?.status === 'rejected' ? 'rejected' : 'unknown');
      }
      // Confirmation already succeeded. Even cancellation must retain a durable cleanup intent.
      publish({ status: 'journaling', error: null });
      unrecorded.add(owner);
      try { await update(entries => entries.some(entry => entry.owner === owner) ? entries : [...entries, { owner, completed: [] }]); }
      catch {
        publish({ status: 'blocked', error: 'journal' });
        return outcome('unrecorded');
      }
      unrecorded.delete(owner);
      if (controller.signal.aborted) { publish({ status: 'pending' }); return outcome('pending'); }
      const complete = await clean(owner, controller);
      publish({ status: complete ? 'complete' : 'pending', step: complete ? null : snapshot.step });
      return outcome(complete ? 'complete' : 'pending', complete ? 1 : 0);
    });
  }
  function recover() {
    return run(async controller => {
      publish({ status: 'journaling', owner: null, step: null, busy: true, error: null });
      let entries: Entry[];
      try {
        for (const owner of unrecorded) {
          await update(entries => entries.some(entry => entry.owner === owner) ? entries : [...entries, { owner, completed: [] }]);
          unrecorded.delete(owner);
        }
        entries = await withJournalLock(read);
      }
      catch { publish({ status: 'blocked', error: 'journal' }); return outcome('blocked'); }
      let completedOwners = 0;
      for (const entry of entries) {
        if (controller.signal.aborted) { publish({ status: 'pending' }); return outcome('pending', completedOwners); }
        if (!await clean(entry.owner, controller)) { publish({ status: 'pending' }); return outcome('pending', completedOwners); }
        completedOwners++;
      }
      publish({ status: 'complete', owner: null, step: null });
      return outcome('complete', completedOwners);
    });
  }
  function cancel() {
    active?.abort();
    if (!active) publish({ status: 'cancelled' });
    // Do not report rollback while an authorization, write or cleanup step may still commit.
  }
  return {
    start, recover, cancel,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { if (!disposed) listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { if (disposed) return; cancel(); disposed = true; snapshot = Object.freeze({ ...snapshot, status: 'disposed', busy: false }); listeners.clear(); },
  };
}
