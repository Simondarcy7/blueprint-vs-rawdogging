import { View } from 'react-native';
import { useTransientNotice } from '../../hooks/useTransientNotice';
import { AppButton, AppText, Surface } from './primitives';

export function TransientNotice({ id, message, dismiss }: { id: string; message: string; dismiss(): void }) {
  const interaction = useTransientNotice({ id, message, dismiss });
  return <View {...interaction}><Surface>
    <AppText accessibilityLiveRegion="polite">{message}</AppText>
    <AppButton label="Dismiss notice" onPress={dismiss} />
  </Surface></View>;
}
