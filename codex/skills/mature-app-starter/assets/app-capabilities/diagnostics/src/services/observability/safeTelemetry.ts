type Scalar = string | number | boolean;
export type EventPolicy = Readonly<Record<string, Readonly<Record<string, readonly Scalar[]>>>>;
export type SafeEvent = { name: string; properties: Record<string, Scalar> };

/** Construct a new payload; never spread vendor events, URLs, user objects or exception text. */
export function sanitizeEvent(name: string, input: unknown, policy: EventPolicy): SafeEvent | null {
  if (!Object.hasOwn(policy, name)) return null;
  const properties: Record<string, Scalar> = Object.create(null);
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    for (const [key, values] of Object.entries(policy[name])) {
      if (Object.hasOwn(input, key)) {
        const value = (input as Record<string, unknown>)[key];
        if (values.includes(value as Scalar)) properties[key] = value as Scalar;
      }
    }
  }
  return { name, properties };
}

/** Disabled until policy/consent hydration. Adapter must disable vendor auto-capture and identity. */
export function createTelemetry(policy: EventPolicy, send: (event: SafeEvent) => Promise<void>) {
  let enabled = false;
  let generation = 0;
  return {
    setEnabled(value: boolean) { enabled = value; generation++; },
    async capture(name: string, input: unknown): Promise<boolean> {
      if (!enabled) return false;
      const ticket = generation;
      try {
        const event = sanitizeEvent(name, input, policy);
        if (!event || !enabled || ticket !== generation) return false;
        await send(event);
        return true;
      } catch { return false; }
    },
  };
}

export function sanitizeDiagnostic(input: unknown, allowedFiles: readonly string[]) {
  const event = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const types = ['Error', 'TypeError', 'RangeError', 'SyntaxError', 'AbortError'];
  const frames = Array.isArray(event.frames) ? event.frames.slice(0, 30).flatMap(frame => {
    if (!frame || typeof frame !== 'object' || typeof frame.file !== 'string' || !allowedFiles.includes(frame.file)) return [];
    return [{ file: frame.file, ...(Number.isSafeInteger(frame.line) && frame.line > 0 && frame.line < 1_000_000 ? { line: frame.line as number } : {}) }];
  }) : [];
  return { type: typeof event.type === 'string' && types.includes(event.type) ? event.type : 'Error', frames };
}
