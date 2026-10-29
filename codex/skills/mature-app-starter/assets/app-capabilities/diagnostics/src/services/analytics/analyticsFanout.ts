import type { SafeEvent } from '../observability/safeTelemetry.ts';
import { settleWithin, validateTimeout } from '../observability/settleWithin.ts';

/** Factories must create disabled clients with automatic collection/replay turned off. */
export type AnalyticsTransport = {
  setEnabled(enabled: boolean): Promise<void>;
  capture(event: SafeEvent): Promise<void>;
  reset(): Promise<void>;
};
export type AnalyticsFactory = () => Promise<AnalyticsTransport>;

/** A failed provider does not prevent delivery to the others. No event buffering or retries. */
export function createAnalyticsFanout(factories: readonly AnalyticsFactory[], timeoutMs = 15_000) {
  validateTimeout(timeoutMs);
  const slots = factories.map(factory => {
    let client: AnalyticsTransport | undefined;
    let loading: Promise<AnalyticsTransport | undefined> | undefined;
    let quarantined = false;
    const disable = (transport: AnalyticsTransport) => {
      void Promise.resolve().then(() => transport.setEnabled(false)).catch(() => {});
    };
    async function load() {
      if (quarantined) return undefined;
      loading ??= (async () => {
        const pending = Promise.resolve().then(factory);
        const result = await settleWithin(pending, timeoutMs);
        if (result.state !== 'fulfilled') {
          quarantined = true;
          // A late factory result is never admitted. Best-effort cleanup only.
          void pending.then(disable).catch(() => {});
          return undefined;
        }
        client = result.value;
        return client;
      })();
      return loading;
    }
    async function call(operation: (transport: AnalyticsTransport) => Promise<void>, critical = false) {
      if (!client || quarantined) return false;
      const current = client;
      const pending = Promise.resolve().then(() => operation(current));
      const result = await settleWithin(pending, timeoutMs);
      if (result.state === 'timed-out' || (critical && result.state === 'rejected')) {
        quarantined = true;
        disable(current);
        // A stale enabling operation must be followed by another disable when it eventually settles.
        void pending.then(() => disable(current), () => disable(current));
      }
      return result.state === 'fulfilled';
    }
    return {
      async setEnabled(value: boolean, stillAllowed: () => boolean) {
        if (value && !stillAllowed()) return;
        if (value) await load();
        if (value && !stillAllowed()) return;
        await call(transport => transport.setEnabled(value), true);
      },
      async capture(event: SafeEvent, stillAllowed: () => boolean) {
        if (!stillAllowed()) return false;
        return call(async transport => {
          if (!stillAllowed()) throw new Error('Stale analytics operation');
          await transport.capture({ name: event.name, properties: { ...event.properties } });
        });
      },
      async reset() { await call(transport => transport.reset(), true); },
    };
  });
  return {
    async setEnabled(value: boolean, stillAllowed: () => boolean) {
      await Promise.all(slots.map(slot => slot.setEnabled(value, stillAllowed)));
    },
    async capture(event: SafeEvent, stillAllowed: () => boolean) {
      return (await Promise.all(slots.map(slot => slot.capture(event, stillAllowed)))).some(Boolean);
    },
    async reset() { await Promise.all(slots.map(slot => slot.reset())); },
  };
}
