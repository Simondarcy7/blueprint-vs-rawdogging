import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Unknown OS state is treated as reduced motion; late reads cannot override newer events. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      changed = true;
      if (active) setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active && !changed) setReduced(value);
    }).catch(() => undefined);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}
