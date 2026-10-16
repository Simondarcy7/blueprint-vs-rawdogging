import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { Text } from './Text';
export function Button({
  label,
  variant = 'primary',
  busy = false,
  disabled,
  ...props
}: Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  busy?: boolean;
}) {
  const { colors } = useTheme();
  const foreground =
    variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      {...props}
      accessibilityRole={props.accessibilityRole ?? 'button'}
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ ...props.accessibilityState, disabled: !!disabled || busy, busy }}
      aria-checked={props.accessibilityState?.checked}
      aria-selected={props.accessibilityState?.selected}
      aria-busy={busy}
      aria-disabled={!!disabled || busy}
      disabled={disabled || busy}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: tokens.space.lg,
        paddingVertical: 12,
        borderRadius: tokens.radius.pill,
        backgroundColor:
          variant === 'primary'
            ? colors.accent
            : variant === 'danger'
              ? colors.dangerSurface
              : colors.surface,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: colors.controlBorder,
        opacity: disabled || busy ? 0.6 : pressed ? 0.8 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {busy ? <ActivityIndicator color={foreground} /> : null}
        <Text style={{ color: foreground, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
      </View>
    </Pressable>
  );
}
