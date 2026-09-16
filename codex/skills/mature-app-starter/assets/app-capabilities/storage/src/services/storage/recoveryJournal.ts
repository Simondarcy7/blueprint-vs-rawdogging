import type { AsyncStringStorage } from './ports';

/** Bounded local history. Use the same scope/protection/deletion policy as the primary data. */
export function createRecoveryJournal<T>({ storage, key, limit, encode, decode }: {
  storage: AsyncStringStorage; key: string; limit: number; encode(value: T): string; decode(raw: string): T;
}) {
  if (!key || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid recovery journal configuration');
  let queue: Promise<unknown> = Promise.resolve();
  function serial<R>(operation: () => Promise<R>): Promise<R> {
    const result = queue.then(operation); queue = result.catch(() => undefined); return result;
  }
  async function read(): Promise<string[]> {
    const raw = await storage.getItem(key);
    if (raw === null) return [];
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length > 100 || !entries.every(entry => typeof entry === 'string')) throw new Error('Recovery journal is corrupt');
    return entries;
  }
  return {
    archive: (value: T) => serial(async () => {
      const payload = encode(value);
      decode(payload);
      const entries = await read();
      if (entries[0] === payload) return;
      await storage.setItem(key, JSON.stringify([payload, ...entries].slice(0, limit)));
    }),
    latest: () => serial(async () => {
      for (const entry of await read()) {
        try { return decode(entry); } catch { /* Try the next older validated snapshot. */ }
      }
      return null;
    }),
    clear: () => serial(() => storage.removeItem(key)),
  };
}
