import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Return false to let the navigator handle Back. Register only on the focused screen. */
export function useAndroidBackAction(onBack?: () => boolean) {
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android' || !onBack) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, [onBack]));
}
