import { useSyncExternalStore } from 'react';
const query = '(prefers-color-scheme: dark)';
function subscribe(listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const snapshot = () => (window.matchMedia(query).matches ? 'dark' : 'light');
export function useSystemAppearance() {
  return useSyncExternalStore(subscribe, snapshot, () => 'light');
}
