/** Local release/development flags. Never use client flags as an authorization boundary. */
export function createFeatureStore<T extends Record<string, boolean>>(defaults: T, storage: { read(): Promise<string | null>; write(raw: string): Promise<void> }) {
  if (!Object.values(defaults).every(value => typeof value === 'boolean')) throw new Error('Flags must be boolean');
  const baseline = Object.freeze({ ...defaults });
  let snapshot: Readonly<{ flags: Readonly<T>; ready: boolean }> = Object.freeze({ flags: baseline as Readonly<T>, ready: false });
  const listeners = new Set<() => void>();
  let queue: Promise<unknown> = Promise.resolve();
  function serial<R>(operation: () => Promise<R>): Promise<R> { const result = queue.then(operation); queue = result.catch(() => undefined); return result; }
  function parse(raw: string | null): T {
    if (raw === null) return { ...baseline } as T;
    const overrides: unknown = JSON.parse(raw);
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Invalid feature overrides');
    for (const [key, value] of Object.entries(overrides)) {
      if (!Object.hasOwn(baseline, key) || typeof value !== 'boolean') throw new Error('Unknown flag or invalid override');
    }
    return { ...baseline, ...overrides } as T;
  }
  function publish(flags: T) {
    snapshot = Object.freeze({ flags: Object.freeze(flags), ready: true });
    for (const listener of listeners) try { listener(); } catch { /* A consumer cannot invalidate a durable save. */ }
    return snapshot;
  }
  const initial = snapshot;
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load: () => serial(async () => publish(parse(await storage.read()))),
    set: (key: keyof T & string, enabled: boolean) => serial(async () => {
      if (!snapshot.ready) throw new Error('Load flags before editing');
      if (!Object.hasOwn(baseline, key) || typeof enabled !== 'boolean') throw new Error('Invalid feature flag');
      const next = { ...snapshot.flags, [key]: enabled } as T;
      await storage.write(JSON.stringify(next));
      return publish(next);
    }),
    reset: () => serial(async () => { await storage.write(JSON.stringify(baseline)); return publish({ ...baseline } as T); }),
  };
}
