import { useId, useState, type PropsWithChildren, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import { Decorative } from "./controls";
import { ProductText, useProductUITheme } from "./theme";

/** Collapsed controls unmount immediately; no hidden keyboard or screen-reader targets linger. */
export function SettingsSection({
  title,
  description,
  children,
  visible = true,
  expanded = true,
  onToggle,
  testID,
}: PropsWithChildren<{
  title: string;
  description?: string;
  visible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  testID?: string;
}>) {
  const theme = useProductUITheme();
  const id = useId();
  const [focused, setFocused] = useState(false);
  if (!visible) return null;
  const heading = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <ProductText variant="heading" headingLevel={2}>
          {title}
        </ProductText>
        {description && (
          <ProductText variant="caption" tone="muted">
            {description}
          </ProductText>
        )}
      </View>
      {onToggle && (
        <Decorative>
          <ProductText tone="muted">{expanded ? "−" : "+"}</ProductText>
        </Decorative>
      )}
    </View>
  );
  return (
    <View
      testID={testID}
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius,
        overflow: "hidden",
      }}
    >
      {onToggle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityHint={description}
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          aria-controls={expanded ? id : undefined}
          onPress={onToggle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={({ pressed }) => ({
            minHeight: 56,
            padding: 16,
            borderWidth: 2,
            borderColor: focused ? theme.colors.focus : "transparent",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {heading}
        </Pressable>
      ) : (
        <View style={{ padding: 16 }}>{heading}</View>
      )}
      {expanded && (
        <View nativeID={id} style={{ padding: 16, paddingTop: 0, gap: 16 }}>
          {children}
        </View>
      )}
    </View>
  );
}

export function SettingsRow({
  title,
  description,
  value,
  leading,
  onPress,
  disabled = false,
  busy = false,
  expanded,
  testID,
}: {
  title: string;
  description?: string;
  value?: string;
  leading?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
  expanded?: boolean;
  testID?: string;
}) {
  const theme = useProductUITheme();
  const { fontScale } = useWindowDimensions();
  const [focused, setFocused] = useState(false);
  const blocked = disabled || busy;
  const content = (
    <>
      <Decorative>{leading}</Decorative>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <ProductText style={{ fontWeight: "600" }}>{title}</ProductText>
        {description && (
          <ProductText variant="caption" tone="muted">
            {description}
          </ProductText>
        )}
        {value && (
          <ProductText variant="caption" tone="accent">
            {value}
          </ProductText>
        )}
      </View>
      <Decorative>
        {busy ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : onPress ? (
          <ProductText tone="muted">
            {expanded === undefined ? "›" : expanded ? "−" : "+"}
          </ProductText>
        ) : null}
      </Decorative>
    </>
  );
  const style = {
    minHeight: 60,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: fontScale > 1.3 ? ("column" as const) : ("row" as const),
    alignItems: fontScale > 1.3 ? ("stretch" as const) : ("center" as const),
  };
  if (!onPress)
    return (
      <View testID={testID} style={style}>
        {content}
      </View>
    );
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, value, description]
        .filter(Boolean)
        .join(". ")}
      accessibilityState={{ disabled: blocked, busy, expanded }}
      aria-disabled={blocked}
      aria-busy={busy}
      aria-expanded={expanded}
      disabled={blocked}
      onPress={() => {
        if (!blocked) onPress();
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        style,
        {
          borderWidth: focused ? 2 : 0,
          borderBottomWidth: 1,
          borderColor: focused ? theme.colors.focus : theme.colors.border,
          opacity: blocked ? 0.55 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}
