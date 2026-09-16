/** In-memory cache only. Keys must include identity/configuration; clear on sign-out or replacement. */
export function createResourceCache<T>(maxEntries: number, now: () => number = Date.now) {
  if (!Number.isInteger(maxEntries) || maxEntries < 1) throw new Error('Invalid cache capacity');
  const entries = new Map<string, { value: T; expiresAt: number }>();
  return {
    get(key: string): T | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now()) { entries.delete(key); return undefined; }
      entries.delete(key); entries.set(key, entry);
      return entry.value;
    },
    set(key: string, value: T, ttlMs: number) {
      if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('Invalid cache lifetime');
      entries.delete(key); entries.set(key, { value, expiresAt: now() + ttlMs });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
    },
    delete: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
  };
}
