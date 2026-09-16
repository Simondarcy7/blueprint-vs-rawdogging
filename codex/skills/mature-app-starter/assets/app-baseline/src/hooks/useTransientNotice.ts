import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

/** For redundant acknowledgements only. Important failures belong in persistent UI. */
export function useTransientNotice({ id, message, dismiss, durationMs = 5000, paused = false }: {
  id: string; message: string; dismiss(): void; durationMs?: number; paused?: boolean;
}) {
  const callback = useRef(dismiss);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { callback.current = dismiss; }, [dismiss]);
  useEffect(() => {
    if (!paused && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [id, message, paused]);
  useEffect(() => {
    if (paused || focused || hovered || !Number.isFinite(durationMs) || durationMs <= 0) return;
    let active = true;
    let changed = false;
    let readerEnabled = true;
    let foreground = AppState.currentState === 'active' || Platform.OS === 'web';
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule(value: boolean) {
      readerEnabled = value;
      clearTimeout(timer);
      // Screen-reader users dismiss explicitly. If the query fails, leave it visible.
      if (active && foreground && !readerEnabled) timer = setTimeout(() => callback.current(), durationMs);
    }
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', value => { changed = true; schedule(value); });
    void AccessibilityInfo.isScreenReaderEnabled().then(value => { if (!changed) schedule(value); }).catch(() => undefined);
    const app = AppState.addEventListener('change', state => { foreground = state === 'active'; schedule(readerEnabled); });
    return () => { active = false; clearTimeout(timer); reader.remove(); app.remove(); };
  }, [id, paused, focused, hovered, durationMs]);
  return { onFocus: () => setFocused(true), onBlur: () => setFocused(false), onPointerEnter: () => setHovered(true), onPointerLeave: () => setHovered(false) };
}
