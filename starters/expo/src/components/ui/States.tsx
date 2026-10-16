import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
export function Notice({
  title,
  message,
  action,
  onAction,
  error = false,
}: {
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  error?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Card style={error ? { borderColor: colors.danger } : undefined}>
      <View accessibilityLiveRegion="polite">
        <Text variant="heading">{title}</Text>
        <Text muted>{message}</Text>
      </View>
      {action && onAction ? <Button label={action} onPress={onAction} variant="secondary" /> : null}
    </Card>
  );
}
export function LoadingState({ label = 'Loading your space…' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      aria-busy={true}
      style={{ gap: 16 }}
    >
      <ActivityIndicator color={colors.accent} />
      <Text muted>{label}</Text>
      {[1, 2].map((key) => (
        <View
          key={key}
          accessible={false}
          style={{ height: 88, backgroundColor: colors.tint, borderRadius: 18 }}
        />
      ))}
    </View>
  );
}
