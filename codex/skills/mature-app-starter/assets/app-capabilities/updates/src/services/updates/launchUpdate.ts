import { withDeadline } from '../../lib/asyncWork.ts';

export type UpdateAdapter = {
  enabled: boolean;
  check(signal: AbortSignal): Promise<{ isAvailable: boolean }>;
  download(signal: AbortSignal): Promise<{ isNew: boolean }>;
  reload(): Promise<void>;
};
export type LaunchUpdateState = 'waiting' | 'ready' | 'reloading';
export type LaunchUpdateOptions = {
  adapter: UpdateAdapter;
  isActive: () => boolean;
  now?: () => number;
  windowMs?: number;
  checkTimeoutMs?: number;
  downloadTimeoutMs?: number;
};

function duration(value: number, allowZero = false) {
  if (!Number.isFinite(value) || value < (allowZero ? 0 : 1) || value > 2_147_483_647)
    throw new Error('Invalid update duration');
  return value;
}

/** Create once at application startup, outside components; remounts share this instance. */
export function createLaunchUpdateController({
  adapter, isActive, now = Date.now, windowMs = 6000,
  checkTimeoutMs = 15000, downloadTimeoutMs = 60000,
}: LaunchUpdateOptions) {
  duration(windowMs, true); duration(checkTimeoutMs); duration(downloadTimeoutMs);
  const startedAt = now();
  if (!Number.isFinite(startedAt)) throw new Error('Invalid update clock');
  const deadline = startedAt + windowMs;
  let windowClosed = !adapter.enabled || windowMs === 0;
  let state: LaunchUpdateState = windowClosed ? 'ready' : 'waiting';
  let work: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancellation = new AbortController();
  const listeners = new Set<() => void>();

  function publish(next: LaunchUpdateState) {
    if (state === next) return;
    state = next;
    for (const listener of listeners) {
      try { listener(); } catch { /* A UI observer cannot break launch recovery. */ }
    }
  }
  function open() {
    windowClosed = true;
    clearTimeout(timer);
    // A reload already accepted by the platform cannot be cancelled. Keep its gate visible.
    if (state !== 'reloading') publish('ready');
  }
  function canApply() {
    const time = now();
    return !windowClosed && !cancellation.signal.aborted && Number.isFinite(time)
      && time >= startedAt && time < deadline && isActive();
  }
  async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
    return withDeadline(deadlineSignal => new Promise<T>((resolve, reject) => {
      const signal = new AbortController();
      let done = false;
      const finish = (settle: () => void) => {
        if (done) return;
        done = true;
        cancellation.signal.removeEventListener('abort', abort);
        deadlineSignal.removeEventListener('abort', abort);
        settle();
      };
      const abort = () => {
        signal.abort();
        finish(() => reject(new Error('Update work cancelled')));
      };
      cancellation.signal.addEventListener('abort', abort, { once: true });
      deadlineSignal.addEventListener('abort', abort, { once: true });
      if (cancellation.signal.aborted || deadlineSignal.aborted) { abort(); return; }
      Promise.resolve().then(() => {
        if (signal.signal.aborted) throw new Error('Update work cancelled');
        return operation(signal.signal);
      }).then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
    }), timeoutMs);
  }
  async function run() {
    try {
      if (!adapter.enabled || cancellation.signal.aborted || windowClosed) return;
      const update = await bounded(signal => adapter.check(signal), checkTimeoutMs);
      if (!update.isAvailable || cancellation.signal.aborted) return;
      // After the startup window, finishing a download is useful for the next launch.
      const downloaded = await bounded(signal => adapter.download(signal), downloadTimeoutMs);
      if (!downloaded.isNew || !canApply()) return;
      clearTimeout(timer);
      publish('reloading');
      try {
        // Observers may synchronously cancel, expose content or change foreground state.
        if (!canApply()) { publish('ready'); return; }
        await adapter.reload();
      }
      catch { publish('ready'); }
    } catch {
      // Offline, unavailable SDKs and failed checks/downloads never fail app startup.
    } finally { open(); }
  }

  return {
    getSnapshot: (): LaunchUpdateState => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    /** This promise tracks network work, not UI readiness. Render from getSnapshot/subscribe. */
    start(): Promise<void> {
      if (work) return work;
      const remaining = deadline - now();
      if (!Number.isFinite(remaining) || remaining <= 0 || remaining > windowMs) open();
      if (!windowClosed) timer = setTimeout(open, remaining);
      work = run();
      return work;
    },
    /** Latches shut permanently when the host exposes interactive content early. */
    markInteractive: open,
    /** Session-level cancellation, not a component unmount callback. */
    cancel() { cancellation.abort(); open(); },
    dispose() { cancellation.abort(); open(); listeners.clear(); },
  };
}
