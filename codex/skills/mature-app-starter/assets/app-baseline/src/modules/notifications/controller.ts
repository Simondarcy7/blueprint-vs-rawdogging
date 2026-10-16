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
  let latest: { key: string; promise: Promise<NotificationState> } | undefined;
  let tail: Promise<unknown> = Promise.resolve();
  function run(key: string, action: () => Promise<void>) {
    if (latest?.key === key) return latest.promise;
    state = { ...state, status: 'pending' };
    const operation = tail.then(action).then(() => {
      state = { ...state, status: latest?.promise === operation ? 'ready' : 'pending' };
      return state;
    }).catch(() => {
      state = { ...state, status: latest?.promise === operation ? 'error' : 'pending' };
      return state;
    }).finally(() => { if (latest?.promise === operation) latest = undefined; });
    latest = { key, promise: operation };
    tail = operation;
    return operation;
  }
  return {
    current: () => state,
    refresh: () => run('refresh', async () => {
      const permission = await adapter.getPermission();
      const enabled = await adapter.readEnabled();
      state = { ...state, permission, enabled };
    }),
    setEnabled: (enabled: boolean) => run(String(enabled), async () => {
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
