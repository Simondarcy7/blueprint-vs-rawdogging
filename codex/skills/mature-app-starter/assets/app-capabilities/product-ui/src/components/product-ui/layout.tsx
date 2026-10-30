import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Decorative } from "./controls";
import { ProductText, useProductUITheme } from "./theme";

export type ScreenInsets = {
  top: number;
  bottom: number;
  left?: number;
  right?: number;
};
const inset = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
export type NavigationItem = {
  key: string;
  label: string;
  accessibilityLabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

/** The shell owns supplied insets once; nested screens should receive zero insets. Router stays host-owned. */
export function AppShell({
  navigation,
  activeKey,
  onNavigate,
  children,
  header,
  insets,
  navigationLabel = "Main navigation",
  skipLabel = "Skip to content",
  testID = "product-app-shell",
}: PropsWithChildren<{
  navigation: readonly NavigationItem[];
  activeKey: string;
  onNavigate(key: string): void;
  header?: ReactNode;
  insets?: ScreenInsets;
  navigationLabel?: string;
  skipLabel?: string;
  testID?: string;
}>) {
  const theme = useProductUITheme();
  const dimensions = useWindowDimensions();
  const [width, setWidth] = useState<number | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const main = useRef<ComponentRef<typeof View>>(null);
  const [skipFocused, setSkipFocused] = useState(false);
  const wide =
    (width ?? dimensions.width) >= 960 * Math.max(1, dimensions.fontScale || 1);
  const navigationProps =
    Platform.OS === "web"
      ? { role: "navigation" as const, "aria-label": navigationLabel }
      : {};
  return (
    <View
      testID={testID}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: theme.colors.background,
        paddingTop: inset(insets?.top),
        paddingBottom: inset(insets?.bottom),
        paddingLeft: inset(insets?.left),
        paddingRight: inset(insets?.right),
      }}
    >
      {Platform.OS === "web" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
          aria-controls={`${testID}-main`}
          onFocus={() => setSkipFocused(true)}
          onBlur={() => setSkipFocused(false)}
          onPress={() => main.current?.focus()}
          pointerEvents={skipFocused ? "auto" : "none"}
          style={{
            position: "absolute",
            zIndex: 10,
            top: 0,
            left: theme.gutter,
            padding: 12,
            minHeight: 48,
            opacity: skipFocused ? 1 : 0,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.focus,
            borderWidth: 2,
            borderRadius: theme.radius,
          }}
        >
          <ProductText tone="accent">{skipLabel}</ProductText>
        </Pressable>
      )}
      {header}
      <View
        style={{
          flex: 1,
          minHeight: 0,
          flexDirection: wide ? "row" : "column-reverse",
        }}
      >
        <View
          {...navigationProps}
          accessibilityLabel={navigationLabel}
          style={{
            width: wide ? 240 : undefined,
            borderRightWidth: wide ? 1 : 0,
            borderTopWidth: wide ? 0 : 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <ScrollView
            horizontal={!wide}
            keyboardShouldPersistTaps="handled"
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ padding: 8, gap: 8, flexGrow: 1 }}
          >
            {navigation.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.accessibilityLabel ?? item.label}
                accessibilityState={{
                  selected: activeKey === item.key,
                  disabled: Boolean(item.disabled),
                }}
                aria-disabled={Boolean(item.disabled)}
                {...(Platform.OS === "web"
                  ? {
                      "aria-current":
                        activeKey === item.key ? ("page" as const) : undefined,
                    }
                  : {})}
                disabled={item.disabled}
                onPress={() => {
                  if (!item.disabled && item.key !== activeKey)
                    onNavigate(item.key);
                }}
                onFocus={() => setFocused(item.key)}
                onBlur={() => setFocused(null)}
                style={({ pressed }) => ({
                  minHeight: 48,
                  minWidth: 72,
                  flexGrow: wide ? 0 : 1,
                  padding: 12,
                  borderWidth: 2,
                  borderColor:
                    focused === item.key
                      ? theme.colors.focus
                      : activeKey === item.key
                        ? theme.colors.accent
                        : "transparent",
                  borderRadius: theme.radius,
                  flexDirection: wide ? "row" : "column",
                  alignItems: "center",
                  justifyContent: wide ? "flex-start" : "center",
                  gap: 6,
                  opacity: item.disabled ? 0.55 : pressed ? 0.8 : 1,
                })}
              >
                {item.icon && <Decorative>{item.icon}</Decorative>}
                <ProductText
                  variant="caption"
                  tone={activeKey === item.key ? "accent" : "default"}
                  style={{ fontWeight: activeKey === item.key ? "600" : "400" }}
                >
                  {item.label}
                </ProductText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View
          ref={main}
          nativeID={`${testID}-main`}
          {...(Platform.OS === "web"
            ? { role: "main" as const, tabIndex: -1 as const }
            : {})}
          style={{ flex: 1, minWidth: 0, minHeight: 0 }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

export function ScreenHeader({
  title,
  description,
  eyebrow,
  action,
  backAction,
  closeAction,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  backAction?: ReactNode;
  closeAction?: ReactNode;
}) {
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const [width, setWidth] = useState<number | null>(null);
  const compact = (width ?? windowWidth) < 480 || fontScale > 1.3;
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap: 12 }}
    >
      {(backAction || closeAction) && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View>{backAction}</View>
          <View>{closeAction}</View>
        </View>
      )}
      <View
        style={{
          flexDirection: compact ? "column" : "row",
          alignItems: compact ? "stretch" : "flex-start",
          gap: 16,
        }}
      >
        <View style={{ flex: compact ? undefined : 1, minWidth: 0, gap: 6 }}>
          {eyebrow && (
            <ProductText variant="caption" tone="accent">
              {eyebrow}
            </ProductText>
          )}
          <ProductText variant="title" headingLevel={1}>
            {title}
          </ProductText>
          {description && <ProductText tone="muted">{description}</ProductText>}
        </View>
        {action && (
          <View
            style={{
              minWidth: 0,
              alignSelf: compact ? "stretch" : "flex-start",
            }}
          >
            {action}
          </View>
        )}
      </View>
    </View>
  );
}

export type ScreenScaffoldProps = PropsWithChildren<{
  header?: ReactNode;
  footer?: ReactNode;
  stickyHeader?: ReactNode;
  insets?: ScreenInsets;
  bottomInsetHandledByHost?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** iOS defaults on; Android normally uses its host window's resize policy. Web uses the browser. */
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  scrollResetKey?: string | number;
  testID?: string;
}>;
/** One scroll owner with an in-flow sticky rail; the footer is a sibling, never an overlay on the last field. */
export function ScreenScaffold({
  children,
  header,
  footer,
  stickyHeader,
  insets,
  bottomInsetHandledByHost = false,
  scroll = true,
  contentStyle,
  keyboardAvoiding = Platform.OS === "ios",
  keyboardVerticalOffset = 0,
  scrollResetKey,
  testID = "product-screen",
}: ScreenScaffoldProps) {
  const theme = useProductUITheme();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const focusedInput = useRef<ReturnType<
    typeof TextInput.State.currentlyFocusedInput
  > | null>(null);
  const frame = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const [railHeight, setRailHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const previousReset = useRef(scrollResetKey);
  useEffect(() => {
    if (
      previousReset.current !== scrollResetKey &&
      scrollResetKey !== undefined
    )
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    previousReset.current = scrollResetKey;
  }, [scrollResetKey]);
  const revealInput = useCallback(() => {
    if (Platform.OS === "web" || !scroll) return;
    const input = focusedInput.current;
    if (!input || input !== TextInput.State.currentlyFocusedInput()) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (input !== TextInput.State.currentlyFocusedInput()) return;
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        input,
        railHeight + theme.gutter,
        true,
      );
    });
  }, [railHeight, scroll, theme.gutter]);
  useEffect(() => {
    if (Platform.OS === "web" || !scroll) return;
    const listener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      revealInput,
    );
    return () => {
      listener.remove();
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [revealInput, scroll]);
  const widthStyle: ViewStyle = {
    width: "100%",
    maxWidth: theme.contentMaxWidth,
    alignSelf: "center",
  };
  const bottom = bottomInsetHandledByHost ? 0 : inset(insets?.bottom);
  const contents = [
    <View
      key="header"
      style={[
        widthStyle,
        {
          paddingHorizontal: theme.gutter,
          paddingTop: header ? theme.gutter : 0,
          paddingBottom: header ? 16 : 0,
        },
      ]}
    >
      {header}
    </View>,
    <View
      key="rail"
      testID={`${testID}-rail`}
      onLayout={(event) => setRailHeight(event.nativeEvent.layout.height)}
      style={[
        widthStyle,
        {
          paddingHorizontal: stickyHeader ? theme.gutter : 0,
          paddingVertical: stickyHeader ? 4 : 0,
          backgroundColor: theme.colors.background,
          borderBottomWidth: stickyHeader ? 1 : 0,
          borderColor: theme.colors.border,
          zIndex: stickyHeader ? 1 : 0,
        },
      ]}
    >
      {stickyHeader}
    </View>,
    <View
      key="content"
      testID={`${testID}-content`}
      style={[
        widthStyle,
        {
          padding: theme.gutter,
          gap: 20,
          flex: scroll ? undefined : 1,
          paddingBottom: theme.gutter + (footer ? 0 : bottom),
          minHeight:
            stickyHeader && scroll
              ? Math.max(0, viewportHeight - railHeight)
              : 0,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>,
  ];
  return (
    <View
      testID={testID}
      style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: theme.colors.background,
        paddingTop: inset(insets?.top),
        paddingLeft: inset(insets?.left),
        paddingRight: inset(insets?.right),
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        enabled={Platform.OS !== "web" && keyboardAvoiding}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : Platform.OS === "android"
              ? "height"
              : undefined
        }
        keyboardVerticalOffset={inset(keyboardVerticalOffset)}
      >
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={
              Platform.OS === "web"
                ? ({ scrollPaddingTop: railHeight + theme.gutter } as ViewStyle)
                : undefined
            }
            contentContainerStyle={{ flexGrow: 1 }}
            stickyHeaderIndices={stickyHeader ? [1] : []}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "web" ? "none" : "on-drag"}
            automaticallyAdjustKeyboardInsets={false}
            onLayout={(event) =>
              setViewportHeight(event.nativeEvent.layout.height)
            }
            onFocus={(event) => {
              if (Platform.OS === "web") return;
              const input = TextInput.State.currentlyFocusedInput();
              if (input === event.target) {
                focusedInput.current = input;
                revealInput();
              }
            }}
            onBlur={(event) => {
              if (focusedInput.current === event.target)
                focusedInput.current = null;
            }}
          >
            {contents}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, minHeight: 0 }}>{contents}</View>
        )}
        {footer && (
          <View
            testID={`${testID}-footer`}
            style={{
              paddingBottom: theme.gutter + bottom,
              paddingTop: 12,
              paddingHorizontal: theme.gutter,
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View style={[widthStyle, { gap: 8 }]}>{footer}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

/** Measure usable width, scale the threshold with text, and preserve both panes' identity through resizing. */
export function AdaptiveColumns({
  primary,
  secondary,
  minColumnWidth = 320,
  gap = 24,
  testID = "product-columns",
}: {
  primary: ReactNode;
  secondary: (expanded: boolean) => ReactNode;
  minColumnWidth?: number;
  gap?: number;
  testID?: string;
}) {
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const expanded =
    width >= 2 * minColumnWidth * Math.max(1, fontScale || 1) + gap;
  return (
    <View
      testID={testID}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: expanded ? "row" : "column",
        gap,
        alignItems: expanded ? "flex-start" : "stretch",
      }}
    >
      <View style={{ minWidth: 0, flex: expanded ? 1 : undefined, gap: 16 }}>
        {primary}
      </View>
      <View style={{ minWidth: 0, flex: expanded ? 1 : undefined, gap: 16 }}>
        {secondary(expanded)}
      </View>
    </View>
  );
}
