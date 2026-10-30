import { withDeadline } from '../../lib/asyncWork.ts';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';
export type PreferenceWriteResult =
  | { status: 'saved'; revision: string }
  | { status: 'not-saved' } | { status: 'conflict' } | { status: 'unknown' };
export type PreferenceContext = Readonly<{
  owner: string;
  signal: AbortSignal;
  /** Enforce ownership again at the actual storage/device side effect, not just at dispatch. */
  isCurrent(): boolean;
}>;
export type PreferenceError = 'invalid' | 'read' | 'permission' | 'save' | 'conflict'
  | 'unknown-write' | 'device' | 'rollback' | 'inactive' | 'owner-changed' | null;
export type PreferenceSnapshot<P> = Readonly<{
  status: 'unloaded' | 'reading' | 'permission' | 'saving' | 'applying' | 'rolling-back' | 'ready' | 'blocked' | 'disposed';
  /** Last acknowledged durable value; null when storage is unknown. Runtime deep-frozen. */
  value: Readonly<P> | null;
  revision: string | null;
  requested: Readonly<P> | null;
  permission: NotificationPermission;
  device: 'pending' | 'applied';
  busy: boolean;
  error: PreferenceError;
}>;
export type PreferenceResult = { status: 'updated' | 'reconciled' | 'rolled-back' | 'not-saved'
  | 'permission-denied' | 'invalid' | 'busy' | 'blocked' | 'inactive' | 'disposed' | 'reconciliation-required' };

/** Preference persistence and device scheduling are separate commits, with explicit recovery states. */
export function createNotificationPreferencesController<P extends object>(options: {
  owner: string;
  getOwner(): string;
  parse(input: unknown): P;
  requiresPermission(current: Readonly<P>, next: Readonly<P>): boolean;
  /** Authoritative scoped read, ordered after all earlier writes including unknown outcomes.
   * A missing record must be returned as explicit validated defaults with a revision. */
  read(context: PreferenceContext): Promise<{ value: unknown; revision: string }>;
  /** Compare-and-set atomically. A rejection is an UNKNOWN outcome, never proof that nothing was saved. */
  write(value: Readonly<P>, context: PreferenceContext & { expectedRevision: string }): Promise<PreferenceWriteResult>;
  getPermission(context: PreferenceContext): Promise<NotificationPermission>;
  /** Called only by an explicit update that requires permission, never by foreground reconciliation. */
  requestPermission(context: PreferenceContext): Promise<NotificationPermission>;
  /** Idempotently replace this owner's device plan. Non-granted permission must produce no delivery plan. */
  apply(value: Readonly<P>, permission: NotificationPermission, context: PreferenceContext): Promise<void>;
  readTimeoutMs?: number;
  maxBytes?: number;
}) {
  const { owner } = options;
  if (typeof owner !== 'string' || !owner || owner.length > 256) throw new Error('Invalid notification preference owner');
  const timeoutMs = options.readTimeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? 65_536;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000
    || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1_048_576) throw new Error('Invalid preference limits');
  function copy(input: unknown): Readonly<P> {
    let nodes = 0;
    const path = new Set<object>();
    function visit(value: unknown, depth: number): unknown {
      if (++nodes > 10_000 || depth > 32) throw new Error('Preference structure too large');
      if (value === null || typeof value === 'boolean' || typeof value === 'string'
        || (typeof value === 'number' && Number.isFinite(value))) return value;
      if (!value || typeof value !== 'object' || path.has(value)) throw new Error('Expected JSON preferences');
      const proto = Object.getPrototypeOf(value);
      if ((!Array.isArray(value) && proto !== Object.prototype && proto !== null)
        || Object.getOwnPropertySymbols(value).length) throw new Error('Expected plain preferences');
      const fields = Object.getOwnPropertyDescriptors(value);
      if (Object.values(fields).some(field => field.get || field.set)) throw new Error('Unexpected preference accessor');
      path.add(value);
      try {
        if (Array.isArray(value)) {
          if (Object.keys(value).length !== value.length) throw new Error('Unexpected array fields');
          return Object.freeze(Array.from({ length: value.length }, (_, index) => {
            const field = fields[index];
            if (!Object.hasOwn(fields, index) || !field) throw new Error('Sparse preferences');
            return visit(field.value, depth + 1);
          }));
        }
        return Object.freeze(Object.fromEntries(Object.entries(fields).map(([key, field]) => {
          if (!field.enumerable) throw new Error('Unexpected preference field');
          return [key, visit(field.value, depth + 1)];
        })));
      } finally { path.delete(value); }
    }
    const value = visit(options.parse(input), 0);
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || new TextEncoder().encode(JSON.stringify(value)).byteLength > maxBytes) throw new Error('Invalid preferences');
    return value as Readonly<P>;
  }
  const validRevision = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 256;
  const validPermission = (value: unknown): NotificationPermission =>
    value === 'granted' || value === 'denied' || value === 'undetermined' ? value : 'unavailable';
  let state: PreferenceSnapshot<P> = Object.freeze({ status: 'unloaded', value: null, revision: null,
    requested: null, permission: 'unavailable', device: 'pending', busy: false, error: null });
  let active = true;
  let disposed = false;
  let generation = 0;
  let operation: AbortController | undefined;
  let busy = false;
  const listeners = new Set<() => void>();
  const hidden: PreferenceSnapshot<P> = Object.freeze({ ...state, status: 'blocked', error: 'owner-changed' });
  const sameOwner = () => { try { return options.getOwner() === owner; } catch { return false; } };
  function publish(patch: Partial<PreferenceSnapshot<P>>) {
    if (disposed) return;
    state = Object.freeze({ ...state, ...patch, busy });
    for (const listener of listeners) { try { listener(); } catch { /* Observers do not own the transaction. */ } }
  }
  function unavailable(): PreferenceResult | null {
    if (disposed) return { status: 'disposed' };
    if (!sameOwner()) { publish({ status: 'blocked', value: null, revision: null, requested: null, device: 'pending', error: 'owner-changed' }); return { status: 'blocked' }; }
    if (!active) return { status: 'inactive' };
    if (busy) return { status: 'busy' };
    return null;
  }
  function start() {
    busy = true;
    const ticket = generation;
    const abort = new AbortController();
    operation = abort;
    const alive = () => !disposed && active && sameOwner() && generation === ticket;
    const context: PreferenceContext = Object.freeze({ owner, signal: abort.signal,
      isCurrent: () => alive() && !abort.signal.aborted });
    return { context, abort, alive };
  }
  function finish() { busy = false; operation = undefined; publish({}); }
  function interrupted(): PreferenceResult {
    if (!disposed) publish({ status: 'blocked', value: sameOwner() ? state.value : null,
      revision: sameOwner() ? state.revision : null, requested: null, device: 'pending',
      error: sameOwner() ? 'inactive' : 'owner-changed' });
    return { status: disposed ? 'disposed' : 'reconciliation-required' };
  }
  async function bounded<T>(work: () => Promise<T>, abort: AbortController) {
    return withDeadline(signal => {
      const onTimeout = () => abort.abort();
      signal.addEventListener('abort', onTimeout, { once: true });
      return Promise.resolve().then(work).finally(() => signal.removeEventListener('abort', onTimeout));
    }, timeoutMs);
  }
  async function permission(context: PreferenceContext, abort: AbortController, request = false) {
    try { return validPermission(await bounded(() => {
      if (!context.isCurrent()) throw new Error('Inactive permission request');
      return request ? options.requestPermission(context) : options.getPermission(context);
    }, abort)); }
    catch { return 'unavailable' as const; }
  }
  async function write(value: Readonly<P>, expectedRevision: string, context: PreferenceContext): Promise<PreferenceWriteResult> {
    if (!context.isCurrent()) return { status: 'not-saved' };
    try {
      const result = await options.write(value, { ...context, expectedRevision });
      if (result?.status === 'saved' && validRevision(result.revision) && result.revision !== expectedRevision) return result;
      if (result?.status === 'not-saved' || result?.status === 'conflict') return result;
    } catch { /* Rejection cannot establish whether an asynchronous write committed. */ }
    return { status: 'unknown' };
  }
  async function apply(value: Readonly<P>, allowed: NotificationPermission, context: PreferenceContext) {
    if (!context.isCurrent()) throw new Error('Inactive device reconciliation');
    await options.apply(value, allowed, context);
  }
  function uncertain(result: PreferenceWriteResult) {
    publish({ status: 'blocked', value: null, revision: null, device: 'pending',
      error: result.status === 'conflict' ? 'conflict' : 'unknown-write' });
    return { status: 'reconciliation-required' as const };
  }
  async function reconcile(): Promise<PreferenceResult> {
    const stopped = unavailable(); if (stopped) return stopped;
    const { context, abort, alive } = start();
    publish({ status: 'reading', requested: null, device: 'pending', error: null });
    try {
      let value: Readonly<P>; let revision: string;
      try {
        const record = await bounded(() => {
          if (!context.isCurrent()) throw new Error('Inactive preference read');
          return options.read(context);
        }, abort);
        value = copy(record.value); revision = record.revision;
        if (!validRevision(revision)) throw new Error('Invalid preference revision');
      } catch {
        if (!alive()) return interrupted();
        publish({ status: 'blocked', value: null, revision: null, error: 'read' });
        return { status: 'blocked' };
      }
      if (!alive()) return interrupted();
      publish({ value, revision, status: 'permission' });
      const allowed = await permission(context, abort);
      if (!alive()) return interrupted();
      publish({ permission: allowed });
      if (context.signal.aborted) { publish({ status: 'blocked', error: 'permission' }); return { status: 'blocked' }; }
      publish({ status: 'applying' });
      try { await apply(value, allowed, context); }
      catch {
        if (!alive()) return interrupted();
        publish({ status: 'ready', error: 'device' });
        return { status: 'reconciliation-required' };
      }
      if (!alive()) return interrupted();
      publish({ status: 'ready', device: 'applied', error: allowed === 'unavailable' ? 'permission' : null });
      return { status: 'reconciled' };
    } finally { finish(); }
  }
  async function update(input: unknown): Promise<PreferenceResult> {
    const stopped = unavailable(); if (stopped) return stopped;
    if (!state.value || !state.revision || state.status !== 'ready') return { status: 'blocked' };
    let next: Readonly<P>; let needsPermission: boolean;
    try { next = copy(input); needsPermission = options.requiresPermission(state.value, next); }
    catch { publish({ error: 'invalid' }); return { status: 'invalid' }; }
    const previous = state.value;
    const previousRevision = state.revision;
    const { context, abort, alive } = start();
    publish({ status: 'permission', requested: next, error: null });
    try {
      let allowed = await permission(context, abort);
      if (!alive()) return interrupted();
      if (needsPermission && allowed !== 'granted' && !context.signal.aborted) {
        allowed = await permission(context, abort, true);
        if (!alive()) return interrupted();
      }
      publish({ permission: allowed, device: state.permission === allowed ? state.device : 'pending' });
      if (context.signal.aborted || (needsPermission && allowed !== 'granted')) {
        publish({ status: 'ready', requested: null, device: 'pending', error: 'permission' });
        return { status: 'permission-denied' };
      }
      publish({ status: 'saving' });
      const saved = await write(next, previousRevision, context);
      // Preserve a known receipt even if lifecycle was lost during the actual write.
      if (saved.status === 'saved' && sameOwner()) publish({ value: next, revision: saved.revision, device: 'pending' });
      if (saved.status === 'unknown' || saved.status === 'conflict') return uncertain(saved);
      if (!alive()) return interrupted();
      if (saved.status === 'not-saved') {
        publish({ status: 'ready', requested: null, error: 'save' }); return { status: 'not-saved' };
      }
      publish({ status: 'applying' });
      try {
        await apply(next, allowed, context);
        if (!alive()) return interrupted();
        publish({ status: 'ready', requested: null, device: 'applied', error: null });
        return { status: 'updated' };
      } catch {
        if (!alive()) return interrupted();
      }
      publish({ status: 'rolling-back', error: 'device' });
      const rollback = await write(previous, saved.revision, context);
      if (rollback.status === 'saved' && sameOwner()) publish({ value: previous, revision: rollback.revision, requested: null });
      if (rollback.status === 'unknown' || rollback.status === 'conflict') return uncertain(rollback);
      if (!alive()) return interrupted();
      if (rollback.status === 'not-saved') {
        publish({ status: 'ready', requested: null, error: 'rollback' }); return { status: 'reconciliation-required' };
      }
      try { await apply(previous, allowed, context); }
      catch {
        if (!alive()) return interrupted();
        publish({ status: 'ready', error: 'device' }); return { status: 'reconciliation-required' };
      }
      if (!alive()) return interrupted();
      publish({ status: 'ready', device: 'applied', error: 'device' });
      return { status: 'rolled-back' };
    } finally { finish(); }
  }
  return {
    getSnapshot: () => sameOwner() || disposed ? state : hidden,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reconcile,
    update,
    /** Call on background/owner transition. Already dispatched effects are not undone. */
    suspend() { active = false; generation++; operation?.abort(); publish({ status: 'blocked', requested: null, device: 'pending', error: 'inactive' }); },
    /** Resume does not silently request permission or apply anything. Call reconcile on foreground. */
    resume() { active = true; },
    dispose() {
      generation++; operation?.abort(); disposed = true;
      state = Object.freeze({ ...state, status: 'disposed', value: null, revision: null, requested: null, device: 'pending', busy: false });
      for (const listener of listeners) { try { listener(); } catch { /* Observer failure is isolated. */ } }
      listeners.clear();
    },
  };
}
