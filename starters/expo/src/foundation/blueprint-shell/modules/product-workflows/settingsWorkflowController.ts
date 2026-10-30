import { withDeadline } from "../../lib/asyncWork.ts";

export type SettingsValues = Readonly<Record<string, string>>;
export type SettingsField = Readonly<{
  id: string;
  label: string;
  description?: string;
  options: readonly Readonly<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>[];
}>;
export type SettingsContext = Readonly<{
  signal: AbortSignal;
  isCurrent(): boolean;
}>;
export type SettingsAdapter = Readonly<{
  /** Ordered authoritative read, including any previously handed-off write. */
  read(context: SettingsContext): Promise<SettingsValues>;
  /** Atomically save the reviewed values. Check ownership before dispatch; an abort is not rollback. */
  save(
    values: SettingsValues,
    context: SettingsContext,
  ): Promise<"saved" | "not-saved" | "unknown">;
}>;
export type SettingsSnapshot = Readonly<{
  status:
    | "idle"
    | "loading"
    | "ready"
    | "saving"
    | "uncertain"
    | "error"
    | "disposed";
  committed: SettingsValues | null;
  draft: SettingsValues | null;
  dirty: boolean;
  error: "read" | "save" | "unknown" | null;
  saved: boolean;
}>;

/** A small discrete-settings workflow. The host owns persistence, scope and conflict policy. */
export function createSettingsWorkflow({
  fields,
  adapter,
  readTimeoutMs = 15_000,
}: {
  fields: readonly SettingsField[];
  adapter: SettingsAdapter;
  readTimeoutMs?: number;
}) {
  if (
    !Number.isInteger(readTimeoutMs) ||
    readTimeoutMs < 1 ||
    readTimeoutMs > 60_000
  )
    throw new Error("Invalid read deadline");
  const allowed = new Map(
    fields.map((field) => [
      field.id,
      new Map(
        field.options.map((option) => [option.value, option.disabled !== true]),
      ),
    ]),
  );
  if (
    !fields.length ||
    allowed.size !== fields.length ||
    fields.some(
      (field) =>
        !field.id ||
        !field.options.length ||
        allowed.get(field.id)?.size !== field.options.length,
    )
  )
    throw new Error("Invalid settings fields");
  const ids = [...allowed.keys()];
  let disposed = false;
  let active: AbortController | null = null;
  let snapshot: SettingsSnapshot = Object.freeze({
    status: "idle",
    committed: null,
    draft: null,
    dirty: false,
    error: null,
    saved: false,
  });
  const listeners = new Set<() => void>();
  const same = (a: SettingsValues | null, b: SettingsValues | null) =>
    a !== null && b !== null && ids.every((id) => a[id] === b[id]);
  function parse(value: SettingsValues): SettingsValues {
    if (
      !value ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
      Object.keys(value).length !== ids.length ||
      Object.values(Object.getOwnPropertyDescriptors(value)).some(
        (field) => !Object.hasOwn(field, "value"),
      )
    )
      throw new Error("Invalid settings");
    const result: Record<string, string> = Object.create(null);
    for (const [id, options] of allowed) {
      if (
        !Object.hasOwn(value, id) ||
        typeof value[id] !== "string" ||
        !options.has(value[id])
      )
        throw new Error("Invalid setting option");
      result[id] = value[id];
    }
    return Object.freeze(result);
  }
  function publish(patch: Partial<SettingsSnapshot>) {
    if (disposed) return;
    snapshot = Object.freeze({ ...snapshot, ...patch });
    for (const listener of listeners) {
      try {
        listener();
      } catch {
        /* Observers cannot change storage outcomes. */
      }
    }
  }
  function start() {
    if (disposed || active) return null;
    const controller = new AbortController();
    active = controller;
    const context: SettingsContext = Object.freeze({
      signal: controller.signal,
      isCurrent: () =>
        !disposed && active === controller && !controller.signal.aborted,
    });
    return { controller, context };
  }
  async function reload() {
    const operation = start();
    if (!operation) return false;
    const { controller, context } = operation;
    const retainedDraft = snapshot.dirty ? snapshot.draft : null;
    publish({ status: "loading", error: null, saved: false });
    try {
      const value = await withDeadline(async (signal) => {
        const abort = () => controller.abort();
        signal.addEventListener("abort", abort, { once: true });
        try {
          if (!context.isCurrent()) throw new Error("Stale settings read");
          return await adapter.read(context);
        } finally {
          signal.removeEventListener("abort", abort);
        }
      }, readTimeoutMs);
      if (!context.isCurrent()) return false;
      const committed = parse(value);
      const draft = retainedDraft ?? committed;
      publish({
        status: "ready",
        committed,
        draft,
        dirty: !same(draft, committed),
        saved: false,
      });
      return true;
    } catch {
      if (!disposed && active === controller)
        publish({ status: "error", error: "read", saved: false });
      return false;
    } finally {
      if (active === controller) active = null;
    }
  }
  function edit(id: string, value: string) {
    if (
      disposed ||
      active ||
      snapshot.status !== "ready" ||
      !snapshot.draft ||
      allowed.get(id)?.get(value) !== true
    )
      return false;
    const draft = parse({ ...snapshot.draft, [id]: value });
    publish({
      draft,
      dirty: !same(draft, snapshot.committed),
      error: null,
      saved: false,
    });
    return true;
  }
  async function save() {
    if (snapshot.status !== "ready" || !snapshot.draft || !snapshot.dirty)
      return false;
    const operation = start();
    if (!operation) return false;
    const { controller, context } = operation;
    const draft = snapshot.draft;
    publish({ status: "saving", error: null, saved: false });
    try {
      // Publish can synchronously unmount the host; guard before handing off a write.
      if (!context.isCurrent()) return false;
      const outcome = await adapter.save(draft, context);
      if (!context.isCurrent()) return false;
      if (outcome === "saved") {
        publish({
          status: "ready",
          committed: draft,
          dirty: false,
          saved: true,
        });
        return true;
      }
      if (outcome === "not-saved") {
        publish({ status: "ready", error: "save" });
        return false;
      }
      publish({ status: "uncertain", error: "unknown" });
      return false;
    } catch {
      if (context.isCurrent())
        publish({ status: "uncertain", error: "unknown" });
      return false;
    } finally {
      if (active === controller) active = null;
    }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reload,
    edit,
    save,
    cancel() {
      active?.abort();
      active = null;
      publish({
        status: "idle",
        committed: null,
        draft: null,
        dirty: false,
        error: null,
        saved: false,
      });
    },
    reset() {
      if (disposed || active || snapshot.status !== "ready") return false;
      publish({
        draft: snapshot.committed,
        dirty: false,
        error: null,
        saved: false,
      });
      return true;
    },
    dispose() {
      if (disposed) return;
      active?.abort();
      disposed = true;
      listeners.clear();
      snapshot = Object.freeze({
        status: "disposed",
        committed: null,
        draft: null,
        dirty: false,
        error: null,
        saved: false,
      });
    },
  };
}
