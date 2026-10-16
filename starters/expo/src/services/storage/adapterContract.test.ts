import { expect, it } from 'vitest';
import { verifyStorageAdapter } from './adapterContract';
it('checks ordinary string persistence across independently created adapters', async () => {
  const data = new Map<string, string>();
  await verifyStorageAdapter(
    () => ({
      getItem: async (key) => data.get(key) ?? null,
      setItem: async (key, value) => {
        data.set(key, value);
      },
      removeItem: async (key) => {
        data.delete(key);
      },
    }),
    'test-only',
  );
  expect(data.size).toBe(0);
});
