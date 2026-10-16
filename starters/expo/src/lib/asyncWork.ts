/** A generation guard for stale reads. Capture a ticket before work, check before applying it. */
export function createGenerationGuard() {
  let generation = 0;
  return {
    invalidate: () => {
      generation++;
    },
    ticket: () => {
      const captured = generation;
      return () => captured === generation;
    },
  };
}

export function createSerialTaskQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(operation: () => T | Promise<T>): Promise<T> {
      const result = tail.then(operation);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}

/** Coalesce concurrent calls. Failed work can be retried; this is not server idempotency. */
export function singleFlight<T>(operation: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  return () =>
    (pending ??= Promise.resolve()
      .then(operation)
      .finally(() => {
        pending = undefined;
      }));
}

/** Bounds waiting and requests cancellation. Work must respect the signal before side effects. */
export async function withDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647)
    throw new Error('Invalid deadline');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Operation timed out'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
