export type Preferences = Readonly<{
  version: 1;
  appearance: 'system' | 'light' | 'dark';
  motion: 'system' | 'reduced';
}>;
export type PreferenceStorage = {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
};
export const defaultPreferences: Preferences = Object.freeze({ version: 1, appearance: 'system', motion: 'system' });

export function parsePreferences(raw: string | null): Preferences {
  if (raw === null) return defaultPreferences;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1
    || !('appearance' in value) || (typeof value.appearance !== 'string' || !['system', 'light', 'dark'].includes(value.appearance))
    || !('motion' in value) || (typeof value.motion !== 'string' || !['system', 'reduced'].includes(value.motion))) {
    throw new Error('Unsupported preferences');
  }
  return { version: 1, appearance: value.appearance as Preferences['appearance'], motion: value.motion as Preferences['motion'] };
}

/** Inject an app-owned native/web adapter. Failed reads never overwrite stored data. */
export function createPreferencesStore(storage: PreferenceStorage) {
  let value = defaultPreferences;
  let loaded = false;
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  }
  return {
    current: () => value,
    load: () => serial(async () => {
      const next = parsePreferences(await storage.read());
      value = next;
      loaded = true;
      return value;
    }),
    update: (patch: Partial<Omit<Preferences, 'version'>>) => serial(async () => {
      if (!loaded) throw new Error('Load preferences before saving');
      const next = parsePreferences(JSON.stringify({ ...value, ...patch, version: 1 }));
      await storage.write(JSON.stringify(next));
      value = next;
      return value;
    }),
  };
}

export function resolveAppearance(preferences: Preferences, system: 'light' | 'dark' | null) {
  return preferences.appearance === 'system' ? system ?? 'light' : preferences.appearance;
}
export function reduceMotion(preferences: Preferences, systemReduced: boolean) {
  return preferences.motion === 'reduced' || systemReduced;
}
