import type { DeviceAdapters } from './actions';

/** Call from a user gesture. Browser capabilities are checked at use time, never at module load. */
export function browserDeviceAdapters(): DeviceAdapters {
  if (typeof navigator === 'undefined') return {};
  return {
    copyText: navigator.clipboard ? text => navigator.clipboard.writeText(text) : undefined,
    share: typeof navigator.share === 'function' ? async input => {
      try { await navigator.share(input); return 'opened'; }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return 'cancelled'; throw error; }
    } : undefined,
    confirm: typeof globalThis.confirm === 'function' ? async input => globalThis.confirm(`${input.title}\n\n${input.message}`) : undefined,
  };
}
