import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyStorageAdapter } from '../codex/skills/mature-app-starter/assets/app-capabilities/storage/src/services/storage/adapterContract.ts';

function fixture() {
  const data = new Map();
  return { data, create: () => ({ getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); }, removeItem: async key => { data.delete(key); } }) };
}
test('adapter contract verifies reopen/isolation and cleans only its disposable keys', async () => {
  const storage = fixture();
  storage.data.set('personal', 'keep');
  await verifyStorageAdapter(storage.create, 'disposable');
  assert.deepEqual([...storage.data], [['personal', 'keep']]);
});
test('adapter contract refuses existing keys and detects broken instance persistence', async () => {
  const storage = fixture();
  storage.data.set('occupied:primary', 'keep');
  await assert.rejects(verifyStorageAdapter(storage.create, 'occupied'), /already exist/);
  assert.equal(storage.data.get('occupied:primary'), 'keep');
  await assert.rejects(verifyStorageAdapter(() => fixture().create(), 'fresh'), /contract failed/);
  await assert.rejects(verifyStorageAdapter(storage.create, ''), /namespace/);
});
