import type { PropsWithChildren } from 'react';
import { ProductUIProvider } from '@/foundation/blueprint-shell/components/product-ui';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';

/** Brand and OS preferences remain application-owned. */
export function ProductTheme({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <ProductUIProvider
      theme={{
        colors: {
          background: colors.background,
          surface: colors.surface,
          text: colors.text,
          muted: colors.muted,
          border: colors.border,
          accent: colors.accent,
          onAccent: colors.onAccent,
          danger: colors.danger,
          focus: colors.accent,
        },
        fontFamily: tokens.fonts.body,
        headingFontFamily: tokens.fonts.heading,
      }}
    >
      {children}
    </ProductUIProvider>
  );
}
