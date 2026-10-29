import { createSerialTaskQueue, withDeadline } from '../../lib/asyncWork.ts';

export type OutboxItem<T> = { id: string; payload: T };
export type FlushResult = { sent: number; state: 'empty' | 'pending' | 'stopped'; reason?: 'storage' | 'delivery' };
export type OutboxOptions<T> = {
  /** Reads must settle; writes must report commit-aware outcomes. No unsafe timeout-and-resume. */
  storage: { read(): Promise<string | null>; write(raw: string): Promise<void> };
  /** Validate and reconstruct domain payloads; no casts of untrusted stored JSON. */
  parsePayload(input: unknown): T;
  /** Globally unique operation identity; retained for all retries. */
  createId(): string;
  /** Resolve only on durable acceptance. The receiver must deduplicate by id. */
  send(item: OutboxItem<T>, signal: AbortSignal): Promise<void>;
  /** Host ownership fence, also enforced inside the storage adapter at commit. */
  assertOwner?(): void;
  limit?: number;
  maxBytes?: number;
  deliveryTimeoutMs?: number;
};

/** One owning instance per storage scope. No background polling, network or SDK initialization. */
export function createDurableOutbox<T>(options: OutboxOptions<T>) {
  const { storage, parsePayload, createId, send, assertOwner = () => {} } = options;
  const limit = options.limit ?? 100;
  const maxBytes = options.maxBytes ?? 262_144;
  const timeout = options.deliveryTimeoutMs ?? 15_000;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10_000) throw new Error('Invalid outbox limit');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 16_777_216) throw new Error('Invalid outbox byte limit');
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2_147_483_647) throw new Error('Invalid delivery deadline');
  const serial = createSerialTaskQueue();
  let disposed = false;
  let flushing: Promise<FlushResult> | undefined;
  const active = () => { if (disposed) throw new Error('Outbox is disposed'); assertOwner(); };
  const validId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);
  function bounded(raw: string) {
    if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new Error('Outbox byte limit exceeded');
    return raw;
  }
  function decode(raw: string | null): OutboxItem<T>[] {
    if (raw === null) return [];
    const value: unknown = JSON.parse(bounded(raw));
    if (!value || typeof value !== 'object') throw new Error('Invalid outbox');
    const envelope = value as Record<string, unknown>;
    if (envelope.version !== 1 || !Array.isArray(envelope.items) || envelope.items.length > limit) throw new Error('Unsupported outbox state');
    const ids = new Set<string>();
    return envelope.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new Error('Invalid outbox item');
      const row = item as Record<string, unknown>;
      if (!validId(row.id) || ids.has(row.id)) throw new Error('Invalid or duplicate operation identity');
      ids.add(row.id);
      return { id: row.id, payload: parsePayload(row.payload) };
    });
  }
  async function read() {
    active();
    const raw = await storage.read();
    active();
    return decode(raw);
  }
  async function write(items: OutboxItem<T>[]) {
    const raw = bounded(JSON.stringify({ version: 1, items }));
    // Validate the serialized representation too (undefined, NaN, custom JSON conversion).
    decode(raw);
    active();
    await storage.write(raw);
  }
  async function drain(): Promise<FlushResult> {
    let sent = 0;
    // A finite batch prevents producers from keeping one flush alive indefinitely.
    for (let index = 0; index < limit; index++) {
      if (disposed) return { sent, state: 'stopped' };
      let item: OutboxItem<T> | undefined;
      try { item = await serial.run(async () => (await read())[0]); }
      catch { return { sent, state: disposed ? 'stopped' : 'pending', reason: 'storage' }; }
      if (!item) return { sent, state: 'empty' };
      try {
        active();
        // Give the transport a defensive snapshot: mutation must not change the receipt ID.
        const delivery = decode(JSON.stringify({ version: 1, items: [item] }))[0];
        await withDeadline(signal => { active(); return send(delivery, signal); }, timeout);
      } catch { return { sent, state: disposed ? 'stopped' : 'pending', reason: 'delivery' }; }
      if (disposed) return { sent, state: 'stopped' };
      try {
        await serial.run(async () => {
          const latest = await read();
          // An external writer is a violated host contract; never delete an unrelated item.
          if (latest[0]?.id !== item.id) throw new Error('Outbox ownership changed');
          await write(latest.slice(1));
        });
      } catch { return { sent, state: disposed ? 'stopped' : 'pending', reason: 'storage' }; }
      sent++;
    }
    try { return { sent, state: (await serial.run(read)).length ? 'pending' : 'empty' }; }
    catch { return { sent, state: disposed ? 'stopped' : 'pending', reason: 'storage' }; }
  }
  return {
    enqueue(input: unknown): Promise<string> {
      // Snapshot immediately so caller mutations cannot change a queued submission.
      let payload: T;
      try { active(); payload = parsePayload(JSON.parse(bounded(JSON.stringify(parsePayload(input))))); }
      catch (error) { return Promise.reject(error); }
      return serial.run(async () => {
        const items = await read();
        if (items.length >= limit) throw new Error('Outbox is full; retry delivery before adding more');
        const id = createId();
        if (!validId(id) || items.some(item => item.id === id)) throw new Error('Invalid or duplicate operation identity');
        await write([...items, { id, payload }]);
        return id;
      });
    },
    list: () => serial.run(read),
    flush(): Promise<FlushResult> {
      flushing ??= drain().finally(() => { flushing = undefined; });
      return flushing;
    },
    /** Stops future handoffs/acks. Cannot cancel a storage write or request already handed off. */
    dispose() { disposed = true; },
  };
}
