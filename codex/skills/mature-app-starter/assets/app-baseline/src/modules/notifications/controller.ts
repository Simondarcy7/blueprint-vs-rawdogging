export type Permission = 'unsupported' | 'unconfigured' | 'undetermined' | 'denied' | 'granted';
export type NotificationState = Readonly<{
  permission: Permission;
  enabled: boolean;
  status: 'idle' | 'pending' | 'ready' | 'error';
}>;
export type NotificationAdapter = {
  getPermission(): Promise<Permission>;
  requestPermission(): Promise<Permission>;
  readEnabled(): Promise<boolean>;
  /** Must persist preference and reconcile registration/schedules; retry must be safe. */
  setEnabled(enabled: boolean): Promise<void>;
};

/** No OS prompt at startup. Refresh on foreground; enable only from an explicit action. */
export function createNotificationController(adapter: NotificationAdapter) {
  let state: NotificationState = { permission: 'unconfigured', enabled: false, status: 'idle' };
  let pending: Promise<NotificationState> | undefined;
  function run(action: () => Promise<void>) {
    // Duplicate taps share the current operation. The UI disables controls while pending.
    if (pending) return pending;
    state = { ...state, status: 'pending' };
    pending = Promise.resolve().then(action).then(() => {
      state = { ...state, status: 'ready' };
      return state;
    }).catch(() => {
      state = { ...state, status: 'error' };
      return state;
    }).finally(() => { pending = undefined; });
    return pending;
  }
  return {
    current: () => state,
    refresh: () => run(async () => {
      const permission = await adapter.getPermission();
      const enabled = await adapter.readEnabled();
      state = { ...state, permission, enabled };
    }),
    setEnabled: (enabled: boolean) => run(async () => {
      let permission = await adapter.getPermission();
      state = { ...state, permission };
      if (enabled && permission === 'undetermined') {
        permission = await adapter.requestPermission();
        state = { ...state, permission };
      }
      if (enabled && permission !== 'granted') return;
      await adapter.setEnabled(enabled);
      state = { ...state, enabled };
    }),
  };
}

/** Explicitly unavailable; never reports fake delivery or registration success. */
export const unavailableNotifications: NotificationAdapter = {
  getPermission: async () => 'unconfigured',
  requestPermission: async () => 'unconfigured',
  readEnabled: async () => false,
  setEnabled: async (enabled) => { if (enabled) throw new Error('Notifications are not configured'); },
};
