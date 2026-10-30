import { createContext, useContext, type PropsWithChildren } from "react";
import { Text, type TextProps } from "react-native";

export type ProductUITheme = {
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    onAccent: string;
    danger: string;
    focus: string;
  };
  fontFamily?: string;
  headingFontFamily?: string;
  radius?: number;
  gutter?: number;
  contentMaxWidth?: number;
};
type ResolvedTheme = ProductUITheme & {
  radius: number;
  gutter: number;
  contentMaxWidth: number;
};
const ThemeContext = createContext<ResolvedTheme | null>(null);
export function ProductUIProvider({
  theme,
  children,
}: PropsWithChildren<{ theme: ProductUITheme }>) {
  const value = {
    ...theme,
    radius: theme.radius ?? 12,
    gutter: theme.gutter ?? 20,
    contentMaxWidth: theme.contentMaxWidth ?? 960,
  };
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
export function useProductUITheme() {
  const theme = useContext(ThemeContext);
  if (!theme)
    throw new Error("Product UI requires an app-owned ProductUIProvider theme");
  return theme;
}
export function ProductText({
  variant = "body",
  tone = "default",
  headingLevel,
  style,
  ...props
}: TextProps & {
  variant?: "title" | "heading" | "body" | "caption";
  tone?: "default" | "muted" | "danger" | "accent";
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  const theme = useProductUITheme();
  const sizes = {
    title: [30, 38],
    heading: [20, 28],
    body: [16, 24],
    caption: [14, 21],
  };
  return (
    <Text
      {...props}
      allowFontScaling
      accessibilityRole={headingLevel ? "header" : props.accessibilityRole}
      aria-level={headingLevel}
      style={[
        {
          color: tone === "default" ? theme.colors.text : theme.colors[tone],
          fontFamily: headingLevel
            ? (theme.headingFontFamily ?? theme.fontFamily)
            : theme.fontFamily,
          fontSize: sizes[variant][0],
          lineHeight: sizes[variant][1],
          flexShrink: 1,
          fontWeight:
            variant === "title" || variant === "heading" ? "600" : "400",
        },
        style,
      ]}
    />
  );
}
