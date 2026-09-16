import type { AsyncStringStorage } from './ports';

/** Prevents a secure-store value surviving reinstall from being treated as the current session. */
export function createInstallBoundStorage({ installationKey, createInstallationId, installationStore, secureStore }: {
  installationKey: string; createInstallationId(): string; installationStore: AsyncStringStorage; secureStore: AsyncStringStorage;
}): AsyncStringStorage {
  if (!installationKey) throw new Error('Installation key is required');
  const validId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{16,160}$/.test(value);
  let pendingId: Promise<string> | undefined;
  function installationId() {
    return pendingId ??= (async () => {
      const previous = await installationStore.getItem(installationKey);
      if (validId(previous)) return previous;
      if (previous !== null) throw new Error('Installation identity is corrupt');
      const id = createInstallationId();
      if (!validId(id)) throw new Error('Invalid installation identity');
      await installationStore.setItem(installationKey, id);
      return id;
    })().catch(error => { pendingId = undefined; throw error; });
  }
  return {
    async getItem(key) {
      const id = await installationId();
      const raw = await secureStore.getItem(key);
      if (raw === null) return null;
      const value = JSON.parse(raw);
      if (!value || value.version !== 1 || !validId(value.installationId) || typeof value.value !== 'string') throw new Error('Invalid secure storage envelope');
      // Do not silently delete data. Explicit account/device cleanup owns removal.
      return value.installationId === id ? value.value : null;
    },
    async setItem(key, value) {
      await secureStore.setItem(key, JSON.stringify({ version: 1, installationId: await installationId(), value }));
    },
    removeItem: key => secureStore.removeItem(key),
  };
}
