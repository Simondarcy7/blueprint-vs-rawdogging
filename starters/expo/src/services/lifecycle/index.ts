import { useEffect } from 'react';
import { AppState } from 'react-native';
export function useForeground(onForeground: () => void) {
  useEffect(() => {
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && previous !== 'active') onForeground();
      previous = next;
    });
    return () => subscription.remove();
  }, [onForeground]);
}
