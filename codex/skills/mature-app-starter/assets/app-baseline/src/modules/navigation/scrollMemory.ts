/** Ephemeral and bounded. Include dataset/identity in keys, and clear on replace/sign-out. */
export function createScrollMemory(limit = 30) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Invalid scroll memory limit');
  const positions = new Map<string, number>();
  return {
    read: (key: string) => positions.get(key) ?? 0,
    write(key: string, offset: number) {
      if (!Number.isFinite(offset) || offset < 0) return;
      positions.delete(key); positions.set(key, offset);
      while (positions.size > limit) positions.delete(positions.keys().next().value!);
    },
    clear: () => positions.clear(),
  };
}
