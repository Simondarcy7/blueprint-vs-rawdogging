export type AtomicStringStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export async function verifyStorageAdapter(
  createAdapter: () => AtomicStringStorage,
  disposableNamespace: string,
) {
  if (!disposableNamespace.trim()) throw new Error('A disposable namespace is required');
  const primary = `${disposableNamespace}:primary`;
  const other = `${disposableNamespace}:other`;
  const first = createAdapter();
  if ((await first.getItem(primary)) !== null || (await first.getItem(other)) !== null)
    throw new Error('Contract keys already exist; choose a new disposable namespace');
  const expect = (actual: unknown, expected: unknown) => {
    if (actual !== expected) throw new Error('Storage adapter contract failed');
  };
  try {
    const value = 'A note 🌱\n第二行';
    await first.setItem(primary, value);
    const reopened = createAdapter();
    expect(await reopened.getItem(primary), value);
    await reopened.setItem(other, 'separate');
    await reopened.setItem(primary, '');
    expect(await first.getItem(primary), '');
    expect(await first.getItem(other), 'separate');
    await first.removeItem(primary);
    expect(await reopened.getItem(primary), null);
    expect(await reopened.getItem(other), 'separate');
  } finally {
    await Promise.all([first.removeItem(primary), first.removeItem(other)]);
  }
}
