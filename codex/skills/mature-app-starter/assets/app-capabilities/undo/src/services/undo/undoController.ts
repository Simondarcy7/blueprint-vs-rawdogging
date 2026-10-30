export type UndoKind = 'clear' | 'restore';
export type UndoResult =
  | { status: 'committed'; kind: UndoKind; count: number; current: boolean }
  | { status: 'empty' | 'retryable' | 'stale' | 'busy' | 'unknown'; current: boolean };
export type UndoSnapshot = Readonly<{
  status: 'idle' | 'ready' | 'busy' | 'uncertain' | 'disposed';
  count: number; canUndo: boolean; operation: UndoKind | null; operationId: number | null;
  error: 'storage' | 'invalid' | 'ownership' | 'unknown' | null;
}>;
export type UndoTransaction = Readonly<{
  owner: string; kind: UndoKind;
  /** Local sequence only. A remote adapter must supply its own durable idempotency identity. */
  operationId: number;
  /** Check again at the actual commit, inside the same transaction as reading/writing. */
  isCurrent(): boolean;
}>;
export type UndoOptions<T extends object> = {
  /** Include an account/lease generation; returning to the same account must not revive old work. */
  owner: string; getOwner(): string;
  /** Reconstruct validated, plain JSON data. Identity/merge callbacks must be pure. */
  parse(value: unknown): T; getId(item: T): string;
  /** Existing arrivals win by default. Override only to merge monotonic fields such as readAt. */
  merge?(current: T, removed: T): T;
  storage: {
    /**
     * Atomically read the latest collection, run update, then commit its result. May rerun update
     * on transaction conflicts. 'not-committed' guarantees no mutation; thrown errors are unknown.
     * Never implement as an unguarded async read followed by replace. Do not time out accepted writes.
     */
    transact(update: (current: readonly unknown[]) => readonly T[], context: UndoTransaction): Promise<'committed' | 'not-committed'>;
  };
  maxItems?: number; maxBytes?: number;
};

function detached<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value === 'string' || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))) return value;
  if (!value || typeof value !== 'object' || seen.has(value)) throw new Error('Expected plain JSON data');
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if ((!array && prototype !== Object.prototype && prototype !== null) || Object.getOwnPropertySymbols(value).length)
    throw new Error('Expected plain JSON data');
  const fields = Object.getOwnPropertyDescriptors(value);
  for (const [key, field] of Object.entries(fields)) {
    if (array && key === 'length') continue;
    if (!Object.hasOwn(field, 'value') || !field.enumerable) throw new Error('Accessors are not undo data');
  }
  seen.add(value);
  try {
    if (array) {
      if (Object.keys(value).length !== value.length) throw new Error('Expected dense array');
      return Object.freeze(Array.from({ length: value.length }, (_, index) => {
        if (!Object.hasOwn(fields, index)) throw new Error('Expected dense array');
        return detached(fields[index].value, seen);
      })) as T;
    }
    return Object.freeze(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, detached(field.value, seen)]))) as T;
  } finally { seen.delete(value); }
}

/** One-level, session-only undo: merge into current data instead of replacing it with a stale snapshot. */
export function createUndoController<T extends object>(options: UndoOptions<T>) {
  const { owner, getOwner, parse, getId, storage, merge = (current: T) => current } = options;
  const maxItems = options.maxItems ?? 1_000;
  const maxBytes = options.maxBytes ?? 262_144;
  if (typeof owner !== 'string' || !owner || owner.length > 256) throw new Error('Invalid undo owner');
  if (!Number.isSafeInteger(maxItems) || maxItems < 1 || maxItems > 100_000
    || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 16_777_216) throw new Error('Invalid undo limits');
  let removed: readonly T[] | null = null;
  let generation = 0;
  let nextId = 0;
  let disposed = false;
  let pending: Promise<UndoResult> | null = null;
  let operation: UndoKind | null = null;
  let operationId: number | null = null;
  let error: UndoSnapshot['error'] = null;
  let uncertain: { kind: UndoKind; candidate: readonly T[] | null } | null = null;
  let snapshot: UndoSnapshot;
  const listeners = new Set<() => void>();
  function current(ticket = generation) {
    try { return !disposed && ticket === generation && getOwner() === owner; } catch { return false; }
  }
  function publish() {
    const status = disposed ? 'disposed' : pending ? 'busy' : uncertain ? 'uncertain' : removed?.length ? 'ready' : 'idle';
    snapshot = Object.freeze({ status, count: removed?.length ?? 0, canUndo: status === 'ready', operation, operationId, error });
    for (const listener of listeners) { try { listener(); } catch { /* Observers cannot change a commit result. */ } }
  }
  function checkOwner() {
    if (current()) return true;
    generation++; removed = null; uncertain = null; error = 'ownership'; publish();
    return false;
  }
  function copy(value: unknown): T {
    const parsed = detached(parse(value));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected an undo item object');
    return parsed;
  }
  function identity(value: T) {
    const id = getId(value);
    if (typeof id !== 'string' || !id || id.length > 512) throw new Error('Invalid undo item identity');
    return id;
  }
  function collection(input: readonly unknown[]) {
    if (!Array.isArray(input) || input.length > maxItems || Object.keys(input).length !== input.length) throw new Error('Invalid undo collection');
    for (let index = 0; index < input.length; index++) {
      const field = Object.getOwnPropertyDescriptor(input, index);
      if (!field || !Object.hasOwn(field, 'value')) throw new Error('Expected dense data array');
    }
    const items = input.map(copy);
    if (new Set(items.map(identity)).size !== items.length) throw new Error('Duplicate undo identity');
    if (new TextEncoder().encode(JSON.stringify(items)).byteLength > maxBytes) throw new Error('Undo data exceeds byte limit');
    return Object.freeze(items);
  }
  function accept(kind: UndoKind, candidate: readonly T[]) {
    if (kind === 'restore') removed = null;
    else if (candidate.length) removed = candidate; // Repeated clear of an empty collection keeps useful recovery.
    error = null;
  }
  function run(kind: UndoKind): Promise<UndoResult> {
    if (!checkOwner()) return Promise.resolve({ status: 'stale', current: false });
    if (pending) return operation === kind ? pending : Promise.resolve({ status: 'busy', current: true });
    if (uncertain) return Promise.resolve({ status: 'unknown', current: true });
    if (kind === 'restore' && !removed?.length) return Promise.resolve({ status: 'empty', current: true });
    const ticket = generation;
    const recovery = removed;
    operation = kind; operationId = ++nextId; error = null;
    const id = operationId;
    pending = Promise.resolve().then(async (): Promise<UndoResult> => {
      let open = true;
      let candidate: readonly T[] | null = null;
      let invalid = false;
      const context: UndoTransaction = Object.freeze({ owner, kind, operationId: id, isCurrent: () => open && current(ticket) });
      if (!context.isCurrent()) { if (!current()) checkOwner(); return { status: 'stale', current: false }; }
      let result: 'committed' | 'not-committed' | 'unknown';
      try {
        result = await storage.transact(input => {
          if (!context.isCurrent()) throw new Error('Undo owner or session changed');
          try {
            const latest = collection(input);
            if (kind === 'clear') { candidate = latest; return Object.freeze([]); }
            const prior = new Map(recovery!.map(item => [identity(item), item]));
            const merged = latest.map(item => {
              const id = identity(item); const previous = prior.get(id); prior.delete(id);
              const next = previous ? copy(merge(item, previous)) : item;
              if (identity(next) !== id) throw new Error('Undo merge changed item identity');
              return next;
            });
            const output = collection([...merged, ...prior.values()]);
            candidate = recovery;
            return output;
          } catch (cause) { invalid = true; throw cause; }
        }, context);
      } catch { result = 'unknown'; }
      finally { open = false; }
      const active = current(ticket);
      // The transaction callback may run asynchronously; TS cannot narrow its captured assignment.
      const captured = candidate as readonly T[] | null;
      if (result === 'committed' && captured) {
        if (active) accept(kind, captured);
        else if (!current()) checkOwner();
        return { status: 'committed', kind, count: captured.length, current: active };
      }
      if (!active) { if (!current()) checkOwner(); return { status: result === 'not-committed' ? 'stale' : 'unknown', current: false }; }
      if (result === 'not-committed') { error = invalid ? 'invalid' : 'storage'; return { status: 'retryable', current: true }; }
      uncertain = { kind, candidate }; error = 'unknown';
      return { status: 'unknown', current: true };
    }).finally(() => {
      pending = null;
      if (!uncertain) { operation = null; operationId = null; }
      publish();
    });
    publish();
    return pending;
  }
  publish();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    clear: () => run('clear'),
    restore: () => run('restore'),
    /** Call only after the adapter proves the uncertain transaction's outcome. Never guess. */
    resolveUnknown(committed: boolean) {
      if (typeof committed !== 'boolean' || !checkOwner() || pending || !uncertain || (committed && !uncertain.candidate)) return false;
      if (committed) accept(uncertain.kind, uncertain.candidate!);
      else error = 'storage';
      uncertain = null; operation = null; operationId = null; publish();
      return true;
    },
    /** Forget the offer, for example after local-data deletion. Does not roll back accepted storage work. */
    discard() { generation++; removed = null; uncertain = null; error = null; if (!pending) { operation = null; operationId = null; } publish(); },
    dispose() { disposed = true; generation++; removed = null; uncertain = null; publish(); listeners.clear(); },
  };
}
