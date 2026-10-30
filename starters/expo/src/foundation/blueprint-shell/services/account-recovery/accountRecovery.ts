import { withDeadline } from '../../lib/asyncWork.ts';

export type RecoveryScope = Readonly<{ owner: string; generation: string }>;
export type RecoveryContext = RecoveryScope & Readonly<{ signal: AbortSignal; isCurrent(): boolean }>;
export type RecoveryAccount = Readonly<{
  owner: string;
  pending: boolean;
  /** Opaque inbox/challenge identifiers and user-facing labels; never session tokens. */
  destinations: readonly Readonly<{ id: string; label: string }>[];
  expiresAt: number | null;
}>;
export type RecoveryMutation = 'accepted' | 'rejected' | 'unknown';
export type RecoveryAdapter = {
  read(context: RecoveryContext): Promise<RecoveryAccount>;
  request(destination: string, context: RecoveryContext): Promise<RecoveryMutation>;
  verify(destinationId: string, proof: string, context: RecoveryContext): Promise<RecoveryMutation>;
};
export type RecoverySnapshot = Readonly<{
  status: 'idle' | 'loading' | 'ready' | 'requesting' | 'verifying' | 'cancelling' | 'refresh-required' | 'uncertain' | 'cancelled' | 'stale' | 'disposed';
  busy: boolean; account: RecoveryAccount | null;
  acknowledged: 'request' | 'verify' | null;
  retryAt: number;
  error: 'read' | 'rejected' | 'unknown' | 'owner-changed' | null;
}>;
export type RecoveryResult = Readonly<{
  status: 'ready' | 'accepted' | 'rejected' | 'unknown' | 'busy' | 'invalid' | 'cooldown' | 'expired' | 'refresh-required' | 'cancelled' | 'stale' | 'unavailable';
  current: boolean;
  refreshed: boolean;
}>;
const nonempty = (value: unknown, limit: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= limit;
const timestamp = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

/** Account-settings/recovery orchestration; the adapter owns authentication and session effects. */
export function createAccountRecovery({ adapter, getScope, now = Date.now, readTimeoutMs = 15_000, resendCooldownMs = 60_000 }: {
  adapter: RecoveryAdapter; getScope(): RecoveryScope; now?: () => number; readTimeoutMs?: number; resendCooldownMs?: number;
}) {
  if (!timestamp(resendCooldownMs) || resendCooldownMs > 86_400_000 || !timestamp(readTimeoutMs) || readTimeoutMs < 1 || readTimeoutMs > 60_000)
    throw new Error('Invalid recovery timing policy');
  let disposed = false;
  let revision = 0;
  let accountScope: RecoveryScope | null = null;
  let receiptScope: RecoveryScope | null = null;
  let active: { controller: AbortController; mutation: boolean } | null = null;
  let snapshot: RecoverySnapshot = Object.freeze({ status: 'idle', busy: false, account: null, acknowledged: null, retryAt: 0, error: null });
  const listeners = new Set<() => void>();
  function publish(patch: Partial<RecoverySnapshot>) {
    if (disposed) return;
    snapshot = Object.freeze({ ...snapshot, ...patch });
    for (const listener of listeners) { try { listener(); } catch { /* An observer cannot change provider outcomes. */ } }
  }
  function scope(): RecoveryScope {
    const value = getScope();
    if (!value || !nonempty(value.owner, 256) || !nonempty(value.generation, 256)) throw new Error('Missing recovery scope');
    return Object.freeze({ owner: value.owner, generation: value.generation });
  }
  function same(value: RecoveryScope) {
    try { const live = scope(); return value.owner === live.owner && value.generation === live.generation; } catch { return false; }
  }
  const result = (status: RecoveryResult['status'], current = false, refreshed = false): RecoveryResult => Object.freeze({ status, current, refreshed });
  function context(controller: AbortController): RecoveryContext {
    const selected = scope();
    const ticket = revision;
    return Object.freeze({ ...selected, signal: controller.signal,
      isCurrent: () => !disposed && revision === ticket && !controller.signal.aborted && same(selected) });
  }
  function parseAccount(input: RecoveryAccount, owner: string): RecoveryAccount {
    const plain = (value: unknown) => {
      if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('Expected plain recovery state');
      if (Object.values(Object.getOwnPropertyDescriptors(value)).some(field => !Object.hasOwn(field, 'value'))) throw new Error('Unexpected recovery accessor');
    };
    plain(input);
    if (!input || input.owner !== owner || typeof input.pending !== 'boolean' || !Array.isArray(input.destinations) || input.destinations.length > 8
      || (input.expiresAt !== null && !timestamp(input.expiresAt))) throw new Error('Invalid recovery account');
    const ids = new Set<string>();
    const destinations = input.destinations.map(value => {
      plain(value);
      if (!value || !nonempty(value.id, 256) || !nonempty(value.label, 320) || ids.has(value.id)) throw new Error('Invalid recovery destination');
      ids.add(value.id);
      return Object.freeze({ id: value.id, label: value.label });
    });
    return Object.freeze({ owner, pending: input.pending, destinations: Object.freeze(destinations), expiresAt: input.expiresAt });
  }
  async function read(ctx: RecoveryContext, controller: AbortController) {
    const value = await withDeadline(timeout => new Promise<RecoveryAccount>((resolve, reject) => {
      let settled = false;
      const finish = (complete: () => void) => {
        if (settled) return;
        settled = true;
        timeout.removeEventListener('abort', abort);
        ctx.signal.removeEventListener('abort', abort);
        complete();
      };
      const abort = () => { finish(() => reject(new Error('Recovery read cancelled'))); controller.abort(); };
      timeout.addEventListener('abort', abort, { once: true });
      ctx.signal.addEventListener('abort', abort, { once: true });
      if (timeout.aborted || ctx.signal.aborted) { abort(); return; }
      Promise.resolve().then(() => {
        if (!ctx.isCurrent()) throw new Error('Stale recovery read');
        return adapter.read(ctx);
      }).then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
    }), readTimeoutMs);
    if (!ctx.isCurrent()) throw new Error('Stale recovery read');
    const account = parseAccount(value, ctx.owner);
    accountScope = ctx;
    publish({ account, status: 'ready', error: null });
  }
  function stale(ctx: RecoveryContext) {
    if (!same(ctx)) {
      accountScope = null;
      receiptScope = null;
      publish({ status: 'stale', account: null, acknowledged: null, retryAt: 0, error: 'owner-changed' });
      return result('stale');
    }
    publish({ status: 'cancelled', account: null, error: null });
    return result('cancelled');
  }
  function run(mutation: boolean, operation: (ctx: RecoveryContext, controller: AbortController) => Promise<RecoveryResult>): Promise<RecoveryResult> {
    if (disposed) return Promise.resolve(result('cancelled'));
    if (active) return Promise.resolve(result('busy'));
    const controller = new AbortController();
    let ctx: RecoveryContext;
    try { ctx = context(controller); }
    catch { publish({ status: 'stale', account: null, error: 'owner-changed' }); return Promise.resolve(result('stale')); }
    // Install exclusion before observers can reenter or cancellation can run.
    active = { controller, mutation };
    return Promise.resolve().then(() => operation(ctx, controller)).finally(() => {
      active = null;
      publish({ busy: false });
    });
  }
  function refresh() {
    return run(false, async (ctx, controller) => {
      if (!ctx.isCurrent()) return stale(ctx);
      if (!accountScope || !same(accountScope)) publish({ account: null });
      if (!receiptScope || !same(receiptScope)) { receiptScope = null; publish({ acknowledged: null, retryAt: 0 }); }
      publish({ status: 'loading', busy: true, error: null });
      try { await read(ctx, controller); return result('ready', true, true); }
      catch {
        if (!same(ctx) || disposed || snapshot.status === 'cancelled') return stale(ctx);
        publish({ status: 'refresh-required', error: 'read' });
        return result('unavailable', true);
      }
    });
  }
  function mutate(kind: 'request' | 'verify', destination: string, proof = ''): Promise<RecoveryResult> {
    if (!nonempty(destination, kind === 'request' ? 320 : 256) || (kind === 'verify' && !nonempty(proof, 4096))) return Promise.resolve(result('invalid'));
    if (active) return Promise.resolve(result('busy'));
    if (!accountScope || !same(accountScope)) { publish({ status: 'stale', account: null, error: 'owner-changed' }); return Promise.resolve(result('stale')); }
    if (snapshot.status !== 'ready') return Promise.resolve(result('refresh-required'));
    const time = now();
    if (!timestamp(time)) return Promise.resolve(result('invalid'));
    if (kind === 'request' && time < snapshot.retryAt) return Promise.resolve(result('cooldown', true));
    if (kind === 'verify' && (!snapshot.account?.pending || !snapshot.account.destinations.some(value => value.id === destination))) return Promise.resolve(result('invalid', true));
    if (kind === 'verify' && snapshot.account?.expiresAt !== null && time >= snapshot.account!.expiresAt!) return Promise.resolve(result('expired', true));
    return run(true, async (ctx, controller) => {
      if (!ctx.isCurrent()) return stale(ctx);
      publish({ status: kind === 'request' ? 'requesting' : 'verifying', busy: true, error: null });
      if (!ctx.isCurrent()) return stale(ctx);
      let outcome: RecoveryMutation;
      // A mutation timeout/cancel cannot prove no email was sent or no credential changed.
      try { outcome = kind === 'request' ? await adapter.request(destination, ctx) : await adapter.verify(destination, proof, ctx); }
      catch { outcome = 'unknown'; }
      if (!['accepted', 'rejected', 'unknown'].includes(outcome)) outcome = 'unknown';
      if (kind === 'request' && outcome !== 'rejected' && same(ctx)) {
        receiptScope = ctx;
        const completedAt = now();
        publish({ retryAt: timestamp(completedAt) && timestamp(completedAt + resendCooldownMs) ? completedAt + resendCooldownMs : Number.MAX_SAFE_INTEGER });
      }
      if (!ctx.isCurrent()) {
        const currentOwner = same(ctx);
        if (currentOwner && outcome === 'accepted') receiptScope = ctx;
        if (!currentOwner) stale(ctx);
        else if (outcome !== 'rejected') publish({ status: outcome === 'accepted' ? 'refresh-required' : 'uncertain', account: null,
          acknowledged: outcome === 'accepted' ? kind : null, error: outcome === 'unknown' ? 'unknown' : null });
        else publish({ status: 'cancelled' });
        return result(outcome);
      }
      if (outcome === 'rejected') { publish({ status: 'ready', error: 'rejected' }); return result('rejected', true); }
      if (outcome === 'unknown') { publish({ status: 'uncertain', error: 'unknown' }); return result('unknown', true); }
      receiptScope = ctx;
      publish({ acknowledged: kind, status: 'loading' });
      try { await read(ctx, controller); return result('accepted', true, true); }
      catch {
        if (!same(ctx)) { stale(ctx); return result('accepted'); }
        publish({ status: 'refresh-required', error: 'read' });
        return result('accepted', ctx.isCurrent());
      }
    });
  }
  function cancel() {
    if (disposed) return;
    revision++;
    active?.controller.abort();
    accountScope = null;
    publish({ status: active?.mutation ? 'cancelling' : 'cancelled', account: null, acknowledged: null, error: null });
  }
  return {
    refresh, request: (destination: string) => mutate('request', destination), verify: (destinationId: string, proof: string) => mutate('verify', destinationId, proof), cancel,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { if (!disposed) listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { if (disposed) return; cancel(); disposed = true; snapshot = Object.freeze({ ...snapshot, status: 'disposed', busy: false }); listeners.clear(); },
  };
}
