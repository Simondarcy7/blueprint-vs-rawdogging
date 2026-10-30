import { withDeadline } from '../../lib/asyncWork.ts';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
// Bound type expansion for recursive JSON schemas; runtime freezing still covers every accepted node.
export type Frozen<T, Depth extends readonly unknown[] = []> = Depth['length'] extends 8 ? Readonly<T>
  : T extends object ? { readonly [K in keyof T]: Frozen<T[K], [...Depth, 0]> } : T;
export type ImportReview<T extends JsonValue, S extends JsonValue> = Readonly<{
  revision: number; value: Frozen<T>; summary: Frozen<S>;
}>;
export type ImportReviewError = 'invalid-source' | 'validation-failed' | 'commit-failed' | 'owner-changed' | 'stale-review';
export type ImportSnapshot<T extends JsonValue, S extends JsonValue> = Readonly<{
  status: 'idle' | 'validating' | 'review' | 'committing' | 'cancelling' | 'committed' | 'invalid' | 'cancelled';
  revision: number; review: ImportReview<T, S> | null; error: ImportReviewError | null;
}>;
export type StageResult<T extends JsonValue, S extends JsonValue> =
  | { status: 'review'; review: ImportReview<T, S> }
  | { status: 'invalid' | 'cancelled' | 'busy' };
export type ConfirmResult = { status: 'committed'; current: boolean }
  | { status: 'retryable' | 'stale' | 'busy' | 'cancelled' | 'invalid' };
export type ImportCommitContext = Readonly<{
  owner: string;
  reviewRevision: number;
  signal: AbortSignal;
  /** Check within the host's atomic write/transaction, not only before starting async work. */
  isCurrent: () => boolean;
}>;

/** Clone JSON data without invoking getters or silently converting unsupported values. */
function freezeJson<T extends JsonValue>(input: T, maxBytes: number): { value: Frozen<T>; canonical: string } {
  const path = new Set<object>();
  let nodes = 0;
  function visit(value: unknown, depth: number): JsonValue {
    if (++nodes > 100_000 || depth > 64) throw new Error('Import structure exceeds limits');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object' || path.has(value)) throw new Error('Expected JSON data');
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) throw new Error('Expected plain data');
    if (Object.getOwnPropertySymbols(value).length) throw new Error('Unexpected symbol data');
    path.add(value);
    try {
      const fields = Object.getOwnPropertyDescriptors(value);
      if (Object.values(fields).some(field => field.get || field.set)) throw new Error('Unexpected accessor');
      if (Array.isArray(value)) {
        if (Object.keys(value).length !== value.length) throw new Error('Unexpected array fields');
        return Object.freeze(Array.from({ length: value.length }, (_, index) => {
          if (!Object.hasOwn(fields, String(index))) throw new Error('Sparse arrays are unsupported');
          return visit(fields[index].value, depth + 1);
        })) as unknown as JsonValue;
      }
      return Object.freeze(Object.fromEntries(Object.keys(fields).sort().map(key =>
        [key, visit(fields[key].value, depth + 1)]))) as JsonValue;
    } finally { path.delete(value); }
  }
  const cloned = visit(input, 0);
  const canonical = JSON.stringify(cloned);
  if (new TextEncoder().encode(canonical).byteLength > maxBytes) throw new Error('Import exceeds size limit');
  return { value: cloned as Frozen<T>, canonical };
}

/** Selection validates only. A reviewed revision and current owner are required for commit. */
export function createImportReview<T extends JsonValue, S extends JsonValue>(options: {
  parse: (contents: string, signal: AbortSignal) => T | Promise<T>;
  summarize: (value: Frozen<T>) => S;
  commit: (value: Frozen<T>, context: ImportCommitContext) => Promise<void>;
  getOwner: () => string;
  maxBytes?: number;
  validationTimeoutMs?: number;
}) {
  const { parse, summarize, commit, getOwner } = options;
  const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
  const timeoutMs = options.validationTimeoutMs ?? 15_000;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 100 * 1024 * 1024)
    throw new Error('Import byte limit must be 1–104857600');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000)
    throw new Error('Validation timeout must be 1–60000 ms');
  let revision = 0;
  let disposed = false;
  let request: AbortController | undefined;
  let candidate: { contents: string; owner: string; canonical: string; review: ImportReview<T, S> } | undefined;
  let activeCommit: { revision: number; promise: Promise<ConfirmResult> } | undefined;
  let handedToCommit = false;
  let snapshot: ImportSnapshot<T, S> = Object.freeze({ status: 'idle', revision: 0, review: null, error: null });
  const listeners = new Set<() => void>();
  function publish(status: ImportSnapshot<T, S>['status'], review: ImportReview<T, S> | null = null, error: ImportReviewError | null = null) {
    snapshot = Object.freeze({ status, revision, review, error });
    for (const listener of listeners) { try { listener(); } catch { /* UI observers cannot alter commit outcomes. */ } }
  }
  const sameOwner = (owner: string) => { try { return getOwner() === owner; } catch { return false; } };
  const current = (ticket: number, owner: string, controller: AbortController) =>
    !disposed && revision === ticket && !controller.signal.aborted && sameOwner(owner);
  function finishStale(ticket: number, owner: string) {
    if (!disposed && ticket === revision) {
      candidate = undefined;
      const ownerMatches = sameOwner(owner);
      publish(ownerMatches ? 'cancelled' : 'invalid', null, ownerMatches ? null : 'owner-changed');
    }
  }

  function validate(contents: string, controller: AbortController) {
    return withDeadline(timeout => new Promise<T>((resolve, reject) => {
      let settled = false;
      const finish = (action: () => void) => {
        if (settled) return;
        settled = true;
        timeout.removeEventListener('abort', abort);
        controller.signal.removeEventListener('abort', abort);
        action();
      };
      const abort = () => {
        finish(() => reject(new Error('Validation cancelled')));
        controller.abort();
      };
      timeout.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener('abort', abort, { once: true });
      if (timeout.aborted || controller.signal.aborted) { abort(); return; }
      Promise.resolve().then(() => {
        if (controller.signal.aborted) throw new Error('Validation cancelled');
        return parse(contents, controller.signal);
      }).then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
    }), timeoutMs);
  }

  async function stage(contents: string): Promise<StageResult<T, S>> {
    if (activeCommit) return { status: 'busy' };
    if (disposed) return { status: 'cancelled' };
    request?.abort();
    const ticket = ++revision;
    const controller = new AbortController();
    request = controller;
    candidate = undefined;
    let owner: string;
    try {
      owner = getOwner();
      if (typeof owner !== 'string' || !owner.length) throw new Error('Missing import owner');
    } catch { publish('invalid', null, 'owner-changed'); return { status: 'invalid' }; }
    if (typeof contents !== 'string' || new TextEncoder().encode(contents).byteLength > maxBytes) {
      publish('invalid', null, 'invalid-source'); return { status: 'invalid' };
    }
    publish('validating');
    try {
      const validated = freezeJson<T>(await validate(contents, controller), maxBytes);
      if (!current(ticket, owner, controller)) { finishStale(ticket, owner); return { status: 'cancelled' }; }
      const summary = freezeJson<S>(summarize(validated.value), maxBytes).value;
      if (!current(ticket, owner, controller)) { finishStale(ticket, owner); return { status: 'cancelled' }; }
      const review = Object.freeze({ revision: ticket, value: validated.value, summary });
      candidate = { contents, owner, canonical: validated.canonical, review };
      publish('review', review);
      if (!current(ticket, owner, controller)) { finishStale(ticket, owner); return { status: 'cancelled' }; }
      return { status: 'review', review };
    } catch {
      if (!disposed && ticket === revision) publish('invalid', null, 'validation-failed');
      return { status: disposed || ticket !== revision ? 'cancelled' : 'invalid' };
    }
  }

  function confirm(reviewRevision: number): Promise<ConfirmResult> {
    if (activeCommit) return activeCommit.revision === reviewRevision
      ? activeCommit.promise : Promise.resolve({ status: 'busy' });
    if (!candidate || candidate.review.revision !== reviewRevision || disposed) return Promise.resolve({ status: 'stale' });
    const selected = candidate;
    const ticket = revision;
    const controller = new AbortController();
    request = controller;
    handedToCommit = false;
    // Install the in-flight guard before notifying observers or starting asynchronous validation.
    const promise = Promise.resolve().then(async (): Promise<ConfirmResult> => {
      try {
        if (!current(ticket, selected.owner, controller)) {
          finishStale(ticket, selected.owner);
          return { status: disposed || ticket !== revision ? 'cancelled' : 'stale' };
        }
        publish('committing', selected.review);
        const validated = freezeJson<T>(await validate(selected.contents, controller), maxBytes);
        if (!current(ticket, selected.owner, controller)) { finishStale(ticket, selected.owner); return { status: 'cancelled' }; }
        if (validated.canonical !== selected.canonical) {
          candidate = undefined; publish('invalid', null, 'stale-review'); return { status: 'invalid' };
        }
        const context = Object.freeze({ owner: selected.owner, reviewRevision,
          signal: controller.signal, isCurrent: () => current(ticket, selected.owner, controller) });
        if (!context.isCurrent()) { finishStale(ticket, selected.owner); return { status: 'cancelled' }; }
        handedToCommit = true;
        // No timeout races a destructive commit: a lost acknowledgement is not proof of failure.
        await commit(selected.review.value, context);
        const stillCurrent = context.isCurrent();
        candidate = undefined;
        if (!disposed) publish('committed', stillCurrent ? selected.review : null);
        return { status: 'committed', current: stillCurrent };
      } catch {
        if (disposed || ticket !== revision) {
          if (!disposed) publish('cancelled');
          return { status: 'cancelled' };
        }
        if (!sameOwner(selected.owner)) {
          candidate = undefined; publish('invalid', null, 'owner-changed'); return { status: 'stale' };
        }
        // The host must reject only a definitely uncommitted operation, or support idempotent retry.
        publish('review', selected.review, handedToCommit ? 'commit-failed' : 'validation-failed');
        return { status: 'retryable' };
      }
    }).finally(() => { activeCommit = undefined; handedToCommit = false; });
    activeCommit = { revision: reviewRevision, promise };
    return promise;
  }
  function cancel() {
    ++revision;
    request?.abort();
    candidate = undefined;
    publish(handedToCommit ? 'cancelling' : 'cancelled');
  }
  return {
    stage, confirm, cancel,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { disposed = true; cancel(); listeners.clear(); },
  };
}
