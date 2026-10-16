import { Text as NativeText, type TextProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
export function Text({
  variant = 'body',
  muted = false,
  style,
  ...props
}: TextProps & { variant?: 'title' | 'heading' | 'body' | 'small'; muted?: boolean }) {
  const { colors } = useTheme();
  const size = tokens.type[variant];
  return (
    <NativeText
      {...props}
      style={[
        {
          color: muted ? colors.muted : colors.text,
          fontFamily:
            variant === 'title' || variant === 'heading' ? tokens.fonts.heading : tokens.fonts.body,
          fontSize: size,
          lineHeight: size * 1.45,
          fontWeight: variant === 'title' || variant === 'heading' ? '600' : '400',
          flexShrink: 1,
        },
        style,
      ]}
    />
  );
}
