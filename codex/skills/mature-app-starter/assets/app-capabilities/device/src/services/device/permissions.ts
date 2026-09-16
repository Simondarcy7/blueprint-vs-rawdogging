export type DevicePermission = 'unsupported' | 'unconfigured' | 'undetermined' | 'denied' | 'granted';
export type PermissionAdapter = { read(): Promise<DevicePermission>; request(): Promise<DevicePermission> };

/** Explicit user-action entrypoint. Reading capability at startup must use adapter.read instead. */
export async function requestCapability(adapter: PermissionAdapter): Promise<DevicePermission | 'failed'> {
  try {
    const current = await adapter.read();
    return current === 'undetermined' ? await adapter.request() : current;
  } catch { return 'failed'; }
}

/** An enhancement failure must not prevent the primary action. No unsupported-device guess. */
export async function optionalHaptic(enabled: boolean, perform?: () => Promise<void>): Promise<boolean> {
  if (!enabled || !perform) return false;
  try { await perform(); return true; } catch { return false; }
}
