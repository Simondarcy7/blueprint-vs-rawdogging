/** Bound optional SDK work without pretending that a timed-out SDK request was cancelled. */
export type Settled<T> = { state: 'fulfilled'; value: T } | { state: 'rejected' | 'timed-out' };

export function validateTimeout(timeoutMs: number) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000)
    throw new Error('Optional transport timeout must be 1–60000 ms');
}

export async function settleWithin<T>(operation: Promise<T>, timeoutMs: number): Promise<Settled<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation.then<Settled<T>, Settled<T>>(
        value => ({ state: 'fulfilled', value }),
        () => ({ state: 'rejected' }),
      ),
      new Promise<Settled<T>>(resolve => {
        timer = setTimeout(() => resolve({ state: 'timed-out' }), timeoutMs);
      }),
    ]);
  } finally { clearTimeout(timer); }
}
