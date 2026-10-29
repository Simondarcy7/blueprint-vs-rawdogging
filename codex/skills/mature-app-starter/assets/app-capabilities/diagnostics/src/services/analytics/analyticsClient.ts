import { sanitizeEvent, type EventPolicy } from '../observability/safeTelemetry.ts';
import { createAnalyticsFanout, type AnalyticsFactory } from './analyticsFanout.ts';

/** One instance per product/session owner. Consent storage and route classification stay app-owned. */
export function createAnalyticsClient(options: {
  policy: EventPolicy;
  environment: string;
  development?: boolean;
  providers: readonly AnalyticsFactory[];
  timeoutMs?: number;
}) {
  const allowedEnvironment = options.environment === 'production' && options.development !== true;
  const policy: EventPolicy = Object.fromEntries(Object.entries(options.policy).map(([event, fields]) =>
    [event, Object.fromEntries(Object.entries(fields).map(([key, values]) => [key, [...values]]))]));
  const transports = createAnalyticsFanout(options.providers, options.timeoutMs);
  let enabled = false;
  let generation = 0;
  let disposed = false;
  let transition: Promise<void> = Promise.resolve();

  function setEnabled(value: boolean) {
    enabled = value && allowedEnvironment && !disposed;
    const next = enabled;
    const ticket = ++generation;
    // Revoke immediately, serialize SDK transitions, and recheck after lazy initialization.
    transition = transition.then(async () => {
      if (next && ticket !== generation) return;
      await transports.setEnabled(next, () => enabled && ticket === generation);
    }).catch(() => {});
    return transition;
  }
  function reset() {
    enabled = false;
    ++generation;
    transition = transition.then(async () => {
      await transports.setEnabled(false, () => false);
      await transports.reset();
    }).catch(() => {});
    return transition;
  }
  return {
    /** Call only after privacy/consent hydration; absent consent remains disabled. */
    setEnabled,
    /** Invalidates waiting captures immediately. Re-enable only for the next resolved identity. */
    reset,
    dispose() { disposed = true; return reset(); },
    async capture(name: string, input: unknown = {}): Promise<boolean> {
      if (!enabled || disposed) return false;
      const ticket = generation;
      try {
        // Snapshot the permitted values now; later caller mutations cannot change the event.
        const event = sanitizeEvent(name, input, policy);
        if (!event) return false;
        await transition;
        const current = () => enabled && !disposed && ticket === generation;
        if (!current()) return false;
        return await transports.capture(event, current);
      } catch { return false; }
    },
  };
}
