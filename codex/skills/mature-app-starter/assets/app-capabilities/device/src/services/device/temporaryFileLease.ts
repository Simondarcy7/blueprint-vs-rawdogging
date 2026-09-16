/** Adopt only app-owned temporary resources. The adapter enforces allowed directories/object URLs. */
export function createTemporaryFileLease(deleteFile: (uri: string) => void | Promise<void>) {
  let current: string | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  function serial(operation: () => Promise<void>) {
    const result = queue.then(operation); queue = result.catch(() => undefined); return result;
  }
  return {
    current: () => current,
    adopt: (uri: string) => serial(async () => {
      if (!uri) throw new Error('A temporary resource URI is required');
      if (current && current !== uri) await deleteFile(current);
      current = uri;
    }),
    release: () => serial(async () => {
      if (current === null) return;
      await deleteFile(current);
      current = null;
    }),
  };
}
