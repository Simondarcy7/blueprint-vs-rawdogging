export type DeviceResult<T = undefined> =
  | { status: 'ready'; value: T }
  | { status: 'cancelled' | 'denied' | 'unavailable' | 'failed' };
export type PickedFile = { uri: string; name: string; mimeType?: string; size?: number };
export type DeviceAdapters = {
  copyText?: (text: string) => Promise<void>;
  /** Resolution means the share surface opened/returned, not that a recipient received anything. */
  share?: (input: { title: string; text?: string; url?: string }) => Promise<'opened' | 'cancelled'>;
  pickFile?: () => Promise<DeviceResult<PickedFile>>;
  confirm?: (input: { title: string; message: string; confirmLabel: string; destructive: boolean }) => Promise<boolean>;
};
export function createDeviceActions(adapters: DeviceAdapters) {
  return {
    async copyText(text: string): Promise<DeviceResult> {
      if (!adapters.copyText) return { status: 'unavailable' };
      try { await adapters.copyText(text); return { status: 'ready', value: undefined }; } catch { return { status: 'failed' }; }
    },
    async share(input: { title: string; text?: string; url?: string }): Promise<DeviceResult<'opened'>> {
      if (!adapters.share) return { status: 'unavailable' };
      try {
        if (input.url && !['https:', 'http:'].includes(new URL(input.url).protocol)) return { status: 'failed' };
        const result = await adapters.share(input);
        return result === 'cancelled' ? { status: 'cancelled' } : { status: 'ready', value: 'opened' };
      } catch { return { status: 'failed' }; }
    },
    async pickFile(): Promise<DeviceResult<PickedFile>> {
      if (!adapters.pickFile) return { status: 'unavailable' };
      try { return await adapters.pickFile(); } catch { return { status: 'failed' }; }
    },
    async confirm(input: { title: string; message: string; confirmLabel: string; destructive: boolean }): Promise<DeviceResult<boolean>> {
      if (!adapters.confirm) return { status: 'unavailable' };
      try { return { status: 'ready', value: await adapters.confirm(input) }; } catch { return { status: 'failed' }; }
    },
  };
}
