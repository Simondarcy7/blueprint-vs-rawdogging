import type { AsyncStringStorage } from './ports';

/** One instance per namespace. Requires atomic manifest writes and globally unique generation IDs. */
export function createChunkedStorage({ storage, prefix, chunkBytes, maxChunks, createGenerationId, onCleanupFailure = () => undefined }: {
  storage: AsyncStringStorage; prefix: string; chunkBytes: number; maxChunks: number; createGenerationId(): string;
  onCleanupFailure?: () => void;
}): AsyncStringStorage {
  if (!/^[a-zA-Z0-9_-]+$/.test(prefix) || !Number.isInteger(chunkBytes) || chunkBytes < 4 || !Number.isInteger(maxChunks) || maxChunks < 1 || maxChunks > 1000) throw new Error('Invalid chunk storage configuration');
  type Manifest = { version: 1; generation: string; count: number };
  const encoder = new TextEncoder();
  const manifestKey = (key: string) => `${prefix}:manifest:${encodeURIComponent(key)}`;
  const partKey = (key: string, manifest: Manifest, index: number) => `${prefix}:chunk:${encodeURIComponent(key)}:${manifest.generation}:${index}`;
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(operation: () => Promise<T>): Promise<T> { const next = queue.then(operation); queue = next.catch(() => undefined); return next; }
  async function readManifest(key: string): Promise<Manifest | null> {
    const raw = await storage.getItem(manifestKey(key));
    if (raw === null) return null;
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || typeof value.generation !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(value.generation) || !Number.isInteger(value.count) || value.count < 1 || value.count > maxChunks) throw new Error('Invalid storage manifest');
    return value;
  }
  async function removeParts(key: string, manifest: Manifest) {
    for (let index = 0; index < manifest.count; index++) await storage.removeItem(partKey(key, manifest, index));
  }
  function reportCleanup() { try { onCleanupFailure(); } catch { /* Do not mask committed writes. */ } }
  return {
    getItem: key => serial(async () => {
      const manifest = await readManifest(key);
      if (!manifest) return null;
      const parts: string[] = [];
      for (let index = 0; index < manifest.count; index++) {
        const part = await storage.getItem(partKey(key, manifest, index));
        if (part === null) throw new Error('Stored data is incomplete');
        if (encoder.encode(part).byteLength > chunkBytes) throw new Error('Stored chunk exceeds limit');
        parts.push(part);
      }
      return parts.join('');
    }),
    setItem: (key, value) => serial(async () => {
      const previous = await readManifest(key);
      const generation = createGenerationId();
      if (!/^[A-Za-z0-9_-]{8,80}$/.test(generation) || generation === previous?.generation) throw new Error('A unique generation ID is required');
      const parts = ['']; let size = 0;
      for (const symbol of value) {
        const bytes = encoder.encode(symbol).byteLength;
        if (size + bytes > chunkBytes) { parts.push(''); size = 0; }
        if (parts.length > maxChunks) throw new Error('Value exceeds storage limit');
        parts[parts.length - 1] += symbol; size += bytes;
      }
      const manifest: Manifest = { version: 1, generation, count: parts.length };
      try {
        for (let index = 0; index < parts.length; index++) await storage.setItem(partKey(key, manifest, index), parts[index]);
        await storage.setItem(manifestKey(key), JSON.stringify(manifest));
      } catch (error) {
        try { await removeParts(key, manifest); } catch { reportCleanup(); }
        throw error;
      }
      if (previous) try { await removeParts(key, previous); } catch { reportCleanup(); }
    }),
    removeItem: key => serial(async () => {
      const manifest = await readManifest(key);
      // Keep the manifest until deletion finishes so an interrupted removal can be retried.
      if (manifest) await removeParts(key, manifest);
      await storage.removeItem(manifestKey(key));
    }),
  };
}
