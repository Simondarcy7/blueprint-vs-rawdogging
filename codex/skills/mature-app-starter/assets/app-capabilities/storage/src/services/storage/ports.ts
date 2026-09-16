/** The adapter must make each individual setItem atomic; multi-key writes are not implied. */
export type AsyncStringStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
export function scopedStorage(storage: AsyncStringStorage, namespace: string): AsyncStringStorage {
  if (!namespace) throw new Error('A storage namespace is required');
  const keyFor = (key: string) => `${encodeURIComponent(namespace)}:${encodeURIComponent(key)}`;
  return {
    getItem: key => storage.getItem(keyFor(key)),
    setItem: (key, value) => storage.setItem(keyFor(key), value),
    removeItem: key => storage.removeItem(keyFor(key)),
  };
}

/** This isolates application operations, not hostile access to the device. */
export function createOwnerScope(initialOwner: string | null = null) {
  let owner = initialOwner;
  let generation = 0;
  return {
    change(next: string | null) { if (owner !== next) { owner = next; generation++; } },
    capture() {
      const capturedOwner = owner;
      const capturedGeneration = generation;
      return { owner: capturedOwner, isCurrent: () => capturedOwner === owner && capturedGeneration === generation };
    },
  };
}
