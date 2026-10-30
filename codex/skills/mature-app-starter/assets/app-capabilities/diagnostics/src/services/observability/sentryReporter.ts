import { sanitizeDiagnostic, sanitizeEvent, type EventPolicy } from './safeTelemetry.ts';
import { settleWithin, validateTimeout } from './settleWithin.ts';

export type SafeCrashEvent = {
  event_id?: string;
  level: 'error';
  environment: string;
  release: string;
  exception: { values: { type: string; value: string; stacktrace: {
    frames: { filename: string; lineno?: number }[];
  } }[] };
  extra: Record<string, string | number | boolean>;
};
export type SentryBridgeOptions = {
  enabled: true;
  defaultIntegrations: false;
  autoInitializeNativeSdk: false;
  sendDefaultPii: false;
  attachScreenshot: false;
  attachViewHierarchy: false;
  enableLogs: false;
  enableAutoSessionTracking: false;
  tracesSampleRate: 0;
  replaysSessionSampleRate: 0;
  replaysOnErrorSampleRate: 0;
  beforeBreadcrumb: () => null;
  beforeSend: (event: unknown) => SafeCrashEvent | null;
};
/** Bind to a dedicated app-owned Sentry client; do not share a mutable global client across apps. */
export type SentryBridge = {
  initialize(options: SentryBridgeOptions): Promise<void>;
  captureEvent(event: SafeCrashEvent): Promise<void>;
};

const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};

/** Explicit reporting only. Native auto-crash setup and source-map upload remain host integration. */
export function createSentryReporter(options: {
  load: () => Promise<SentryBridge>;
  allowedFiles: readonly string[];
  contextPolicy: Readonly<Record<string, readonly (string | number | boolean)[]>>;
  environment: string;
  release: string;
  timeoutMs?: number;
}) {
  const timeoutMs = options.timeoutMs ?? 15_000;
  validateTimeout(timeoutMs);
  const allowedFiles = [...options.allowedFiles];
  const policy: EventPolicy = { diagnostic: Object.fromEntries(
    Object.entries(options.contextPolicy).map(([key, values]) => [key, [...values]]),
  ) };
  const environment = options.environment;
  const release = options.release;
  const factory = options.load;
  let enabled = false;
  let disposed = false;
  let generation = 0;
  let quarantined = false;
  let loading: Promise<SentryBridge | null> | undefined;

  function sanitize(input: unknown, context: unknown): SafeCrashEvent {
    const source = object(input);
    const values = object(source.exception).values;
    const first = Array.isArray(values) ? object(values[0]) : {};
    const vendorFrames = object(first.stacktrace).frames;
    const frames = Array.isArray(vendorFrames) ? vendorFrames.slice(0, 30).map(frame => {
      const f = object(frame);
      return { file: f.filename, line: f.lineno };
    }) : source.frames;
    const safe = sanitizeDiagnostic({ type: first.type ?? source.type ?? source.name, frames }, allowedFiles);
    return {
      ...(typeof source.event_id === 'string' && /^[a-f0-9]{32}$/i.test(source.event_id)
        ? { event_id: source.event_id } : {}),
      level: 'error', environment, release,
      exception: { values: [{ type: safe.type, value: 'Exception details omitted.', stacktrace: {
        frames: safe.frames.map(frame => ({ filename: frame.file, ...(frame.line ? { lineno: frame.line } : {}) })),
      } }] },
      extra: { ...sanitizeEvent('diagnostic', context, policy)?.properties },
    };
  }
  function beforeSend(input: unknown) {
    if (!enabled || disposed || quarantined) return null;
    try { return sanitize(input, object(input).extra); } catch { return null; }
  }
  async function load() {
    if (quarantined || disposed || !enabled) return null;
    loading ??= (async () => {
      const loaded = await settleWithin(Promise.resolve().then(factory), timeoutMs);
      if (loaded.state !== 'fulfilled') { quarantined = true; return null; }
      if (!enabled || disposed) return null;
      const client = loaded.value;
      const initialized = await settleWithin(Promise.resolve().then(() => client.initialize({
        enabled: true, defaultIntegrations: false, autoInitializeNativeSdk: false,
        sendDefaultPii: false, attachScreenshot: false, attachViewHierarchy: false,
        enableLogs: false, enableAutoSessionTracking: false, tracesSampleRate: 0,
        replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0,
        beforeBreadcrumb: () => null, beforeSend,
      })), timeoutMs);
      if (initialized.state !== 'fulfilled') { quarantined = true; return null; }
      return client;
    })();
    const client = await loading;
    if (!client && !quarantined) loading = undefined;
    return client;
  }
  return {
    /** Reporting policy is independent of analytics consent. No provider is initialized here. */
    setEnabled(value: boolean) { enabled = value && !disposed; ++generation; },
    reset() { enabled = false; ++generation; },
    dispose() { disposed = true; enabled = false; ++generation; },
    async capture(input: unknown, context: unknown = {}): Promise<boolean> {
      if (!enabled || disposed || quarantined) return false;
      const ticket = generation;
      try {
        const event = sanitize(input, context);
        const client = await load();
        if (!client || !enabled || disposed || ticket !== generation) return false;
        const result = await settleWithin(Promise.resolve().then(() => {
          if (!enabled || disposed || ticket !== generation) throw new Error('Stale diagnostic');
          return client.captureEvent(event);
        }), timeoutMs);
        if (result.state === 'timed-out') quarantined = true;
        return result.state === 'fulfilled';
      } catch { return false; }
    },
  };
}
