import { useId } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import { Text } from './Text';
export function Field({
  label,
  error,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const id = useId();
  const { colors } = useTheme();
  const web =
    Platform.OS === 'web'
      ? { 'aria-describedby': error || hint ? `${id}-help` : undefined, 'aria-invalid': !!error }
      : {};
  return (
    <View style={{ gap: 8 }}>
      <Text nativeID={`${id}-label`} style={{ fontWeight: '600' }}>
        {label}
      </Text>
      <TextInput
        {...props}
        {...web}
        accessibilityLabel={label}
        accessibilityHint={error || hint}
        placeholderTextColor={colors.muted}
        style={[
          {
            minHeight: 52,
            padding: 16,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.controlBorder,
            borderRadius: tokens.radius.sm,
            color: colors.text,
            backgroundColor: colors.surface,
            fontSize: 16,
            fontFamily: tokens.fonts.body,
            textAlignVertical: props.multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {error || hint ? (
        <Text
          nativeID={`${id}-help`}
          variant="small"
          muted={!error}
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={error ? { color: colors.danger } : undefined}
        >
          {error || hint}
        </Text>
      ) : null}
    </View>
  );
}
