import { createSerialTaskQueue } from '../../lib/asyncWork.ts';

export type DraftStatus = 'unloaded' | 'loading' | 'ready' | 'blocked' | 'disposed';
export type DraftError = 'read' | 'corrupt' | 'conflict' | 'save' | 'clear' | 'ownership' | null;
export type DraftSnapshot<T> = Readonly<{
  value: T; revision: number; saved: boolean; dirty: boolean;
  status: DraftStatus; busy: boolean; recovery: T | null; error: DraftError;
}>;
export type DraftOptions<T extends object> = {
  owner: string;
  draftId: string;
  initial: T;
  /** Validate and reconstruct a JSON-compatible object. No unvalidated casts. */
  parse(input: unknown): T;
  /** One instance owns this scope. Adapters must bound reads and report actual commit outcomes. */
  storage: { read(): Promise<string | null>; write(raw: string): Promise<void>; remove(): Promise<void> };
  /** Check a live owner/lease; adapters must enforce it again at the actual write/delete commit. */
  assertOwner?: () => void;
  /** Saved-record version for conflict detection. Defaults to the serialized initial value. */
  baselineRevision?: string;
  maxBytes?: number;
};

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value === 'string' || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))) return value;
  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if ((!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) || seen.has(value))
      throw new Error('Draft codec must return plain JSON data');
    if (Object.getOwnPropertySymbols(value).length) throw new Error('Draft codec must return plain JSON data');
    const fields = Object.getOwnPropertyDescriptors(value);
    for (const [key, field] of Object.entries(fields)) {
      if (Array.isArray(value) && key === 'length') continue;
      if (!Object.hasOwn(field, 'value') || !field.enumerable)
        throw new Error('Draft codec must return plain JSON data without accessors');
    }
    seen.add(value);
    try {
      if (Array.isArray(value)) {
        if (Object.keys(value).length !== value.length) throw new Error('Draft codec must return plain JSON arrays');
        return Object.freeze(Array.from({ length: value.length }, (_, index) => {
          if (!Object.hasOwn(fields, index)) throw new Error('Draft codec must return dense JSON arrays');
          return freeze(fields[index].value, seen);
        })) as T;
      }
      return Object.freeze(Object.fromEntries(Object.entries(fields).map(([key, field]) =>
        [key, freeze(field.value, seen)]))) as T;
    } finally { seen.delete(value); }
  } else throw new Error('Draft codec must return plain JSON data');
}

/** Recoverable local drafts, separate from saving a product record or submitting an outbox item. */
export function createDraftController<T extends object>(options: DraftOptions<T>) {
  const { owner, draftId, parse, storage, assertOwner = () => {} } = options;
  if (typeof owner !== 'string' || typeof draftId !== 'string' || !owner || !draftId
    || owner.length > 256 || draftId.length > 256) throw new Error('Invalid draft scope');
  const maxBytes = options.maxBytes ?? 262_144;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 16_777_216) throw new Error('Invalid draft byte limit');
  function bounded(raw: string) {
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > maxBytes) throw new Error('Draft byte limit exceeded');
    return raw;
  }
  function copy(input: unknown): T {
    // Clone descriptors before serialization: getters can change even on a frozen object.
    const decoded = freeze(parse(input));
    if (!decoded || typeof decoded !== 'object') throw new Error('Draft must be a JSON-compatible object');
    bounded(JSON.stringify(decoded));
    return decoded;
  }
  const initial = copy(options.initial);
  const baseline = options.baselineRevision ?? JSON.stringify(initial);
  if (typeof baseline !== 'string' || baseline.length > maxBytes) throw new Error('Invalid baseline revision');
  let value = initial;
  let revision = 0;
  let savedRevision: number | null = null;
  let dirty = false;
  let status: DraftStatus = 'unloaded';
  let error: DraftError = null;
  let recovery: T | null = null;
  let recoveryMatchesBaseline = false;
  let pending = 0;
  let generation = 0;
  let loading: Promise<boolean> | undefined;
  const serial = createSerialTaskQueue();
  const listeners = new Set<() => void>();
  let snapshot: DraftSnapshot<T>;
  function publish() {
    snapshot = Object.freeze({ value, revision, saved: status === 'ready' && savedRevision === revision,
      dirty, status, busy: pending > 0 || status === 'loading', recovery, error });
    for (const listener of listeners) { try { listener(); } catch { /* Observer failure cannot discard input. */ } }
  }
  function active() {
    if (status === 'disposed') throw new Error('Draft controller disposed');
    try { assertOwner(); }
    catch (cause) { status = 'blocked'; error = 'ownership'; publish(); throw cause; }
  }
  function nextRevision() {
    if (revision >= Number.MAX_SAFE_INTEGER) throw new Error('Draft revision exhausted');
    return revision + 1;
  }
  function failed(operation: Exclude<DraftError, null>) {
    if (status !== 'disposed' && error !== 'ownership') { error = operation; publish(); }
    return false;
  }
  function decode(raw: string) {
    const envelope: unknown = JSON.parse(bounded(raw));
    if (!envelope || typeof envelope !== 'object') throw new Error('Invalid draft');
    const record = envelope as Record<string, unknown>;
    if (record.version !== 1 || record.owner !== owner || record.draftId !== draftId
      || !Number.isSafeInteger(record.revision) || Number(record.revision) < 0
      || typeof record.baseline !== 'string') throw new Error('Unsupported draft scope or format');
    return { value: copy(record.value), matchesBaseline: record.baseline === baseline };
  }
  publish();

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    set(input: unknown) {
      active();
      const next = copy(input);
      revision = nextRevision(); value = next; dirty = true;
      if (status === 'ready' && !recovery) error = null;
      publish();
    },
    load(): Promise<boolean> {
      if (loading) return loading;
      try { active(); } catch { return Promise.resolve(false); }
      if (status === 'ready') return Promise.resolve(true);
      const ticket = generation;
      status = 'loading'; error = null; publish();
      loading = serial.run(async () => {
        let raw: string | null;
        try { active(); raw = await storage.read(); active(); }
        catch { if (status !== 'disposed') status = 'blocked'; return failed('read'); }
        if (ticket !== generation) return false;
        let stored: ReturnType<typeof decode> | null;
        try { stored = raw === null ? null : decode(raw); }
        catch { status = 'blocked'; return failed('corrupt'); }
        status = 'ready'; error = null; recovery = null;
        // A fresh read supersedes any older receipt, including after ownership recovery.
        savedRevision = null;
        if (stored) {
          if (dirty || !stored.matchesBaseline) {
            recovery = stored.value;
            recoveryMatchesBaseline = stored.matchesBaseline;
            error = 'conflict';
          } else {
            // Stored counters are metadata, not authority over this session's edit sequence.
            revision = nextRevision(); value = stored.value;
            savedRevision = revision; dirty = false;
          }
        } else dirty = dirty || JSON.stringify(value) !== JSON.stringify(initial);
        publish();
        return true;
      }).finally(() => { loading = undefined; });
      return loading;
    },
    /** Explicit choice after load found stored work alongside local edits or a changed baseline. */
    recover() {
      active();
      if (status !== 'ready' || !recovery) return;
      revision = nextRevision();
      value = recovery;
      savedRevision = recoveryMatchesBaseline ? revision : null;
      dirty = !recoveryMatchesBaseline;
      recovery = null; error = null; publish();
    },
    /** Explicitly choose current input; stored recovery remains intact until save/clear succeeds. */
    keepCurrent() {
      active();
      if (status !== 'ready' || !recovery) return;
      recovery = null; savedRevision = null; dirty = true; error = null; publish();
    },
    save(): Promise<boolean> {
      try { active(); } catch { return Promise.resolve(false); }
      if (status !== 'ready' || recovery) return Promise.resolve(false);
      const ticket = generation;
      const savingRevision = revision;
      let raw: string;
      try { raw = bounded(JSON.stringify({ version: 1, owner, draftId, baseline, revision: savingRevision, value })); decode(raw); }
      catch { return Promise.resolve(failed('save')); }
      pending++; publish();
      return serial.run(async () => {
        try {
          active(); if (ticket !== generation) return false;
          await storage.write(raw);
          active(); if (ticket !== generation) return false;
          savedRevision = savingRevision; dirty = revision !== savingRevision; error = null;
          return !dirty;
        } catch { return failed('save'); }
        finally { pending--; publish(); }
      });
    },
    /** Explicit discard. A failed removal retains input; newer edits survive a pending clear. */
    clear(): Promise<boolean> {
      try { active(); } catch { return Promise.resolve(false); }
      const ticket = ++generation;
      const clearingRevision = revision;
      pending++; publish();
      return serial.run(async () => {
        try {
          active(); if (ticket !== generation) return false;
          await storage.remove();
          active(); if (ticket !== generation) return false;
          savedRevision = null; recovery = null; status = 'ready'; error = null;
          if (revision === clearingRevision) {
            revision = nextRevision(); value = initial; dirty = false;
            generation++; // Invalidate a save captured before this reset, while clear was pending.
          } else dirty = true;
          return true;
        } catch {
          if (status === 'loading' || status === 'unloaded') status = 'blocked';
          return failed('clear');
        }
        finally { pending--; publish(); }
      });
    },
    /** Preserve storage, fence pending results. The adapter owns cancellation/commit guarantees. */
    dispose() { generation++; status = 'disposed'; publish(); listeners.clear(); },
  };
}
