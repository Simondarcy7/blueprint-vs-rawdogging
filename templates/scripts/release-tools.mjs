/** Validate before any provider upload/build/publish call. Local checks do not prove membership. */
export function assertReleaseTarget(actual, expected) {
  for (const field of ['project', 'environment', 'platform', 'artifact']) {
    if (typeof expected[field] !== 'string' || !expected[field] || actual[field] !== expected[field]) throw new Error(`Release target mismatch: ${field}`);
  }
  return Object.freeze({ ...expected });
}

/** Monitoring only. Cancellation stops waiting; it does not cancel a remote build. */
export async function waitForRelease({ readStatus, timeoutMs, intervalMs = 5000, now = Date.now, sleep, signal }) {
  if (![timeoutMs, intervalMs].every(value => Number.isFinite(value) && value > 0 && value <= 2_147_483_647) || intervalMs > 60_000) throw new Error('Invalid monitoring interval');
  const deadline = now() + timeoutMs;
  const controller = new AbortController();
  const cancelled = new Error('Release monitoring cancelled; remote job state is unknown');
  const timedOut = new Error('Release monitoring timed out; completion is unverified');
  let rejectStop;
  const stopped = new Promise((_, reject) => { rejectStop = reject; });
  const stop = error => { rejectStop(error); controller.abort(); };
  const abort = () => stop(cancelled);
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => stop(timedOut), timeoutMs);
  function delay(ms) {
    if (sleep) return sleep(ms, controller.signal);
    return new Promise(resolve => {
      const finish = () => { clearTimeout(waitTimer); controller.signal.removeEventListener('abort', finish); resolve(); };
      const waitTimer = setTimeout(finish, ms);
      controller.signal.addEventListener('abort', finish, { once: true });
      if (controller.signal.aborted) finish();
    });
  }
  async function monitor() {
    while (now() < deadline) {
      if (controller.signal.aborted) throw cancelled;
      const status = await readStatus(controller.signal);
      if (controller.signal.aborted) throw cancelled;
      if (now() >= deadline) throw timedOut;
      if (status.state === 'succeeded') {
        if (typeof status.id !== 'string' || !status.id || typeof status.artifactUrl !== 'string' || !status.artifactUrl) throw new Error('Successful job is missing artifact evidence');
        return status;
      }
      if (['failed', 'cancelled'].includes(status.state)) throw new Error(`Remote release ${status.state}`);
      if (!['queued', 'running'].includes(status.state)) throw new Error('Unknown remote job state');
      await delay(Math.min(intervalMs, Math.max(0, deadline - now())));
    }
    throw timedOut;
  }
  try {
    if (signal?.aborted) abort();
    return await Promise.race([stopped, monitor()]);
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', abort); controller.abort();
  }
}
