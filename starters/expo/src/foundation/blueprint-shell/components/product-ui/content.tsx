import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { ActionButton } from "./controls";
import { ProductText, useProductUITheme } from "./theme";

function DelayedPlaceholder({
  children,
  delay,
}: PropsWithChildren<{ delay: number }>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <View
      testID="product-loading-placeholder"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      {...(Platform.OS === "web" ? { inert: true } : {})}
      pointerEvents="none"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {children}
    </View>
  );
}

export type AsyncContentProps = PropsWithChildren<{
  status: "loading" | "ready" | "empty" | "error";
  hasContent?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void | Promise<unknown>;
  retryLabel?: string;
  loadingLabel?: string;
  skeleton?: ReactNode;
  revealDelayMs?: number;
  emptyAction?: ReactNode;
}>;
/** Refresh and failed refresh keep useful content mounted. Only first load uses a decorative placeholder. */
export function AsyncContent({
  status,
  hasContent = false,
  children,
  errorMessage = "Could not load this content.",
  emptyTitle = "Nothing here yet",
  emptyMessage,
  onRetry,
  retryLabel = "Try again",
  loadingLabel = "Loading…",
  skeleton,
  revealDelayMs = 120,
  emptyAction,
}: AsyncContentProps) {
  const theme = useProductUITheme();
  const keepContent = hasContent || status === "ready";
  return (
    <View style={{ gap: 16 }}>
      <View
        key="notice"
        accessibilityLiveRegion={status === "ready" ? "none" : "polite"}
      >
        {status === "loading" && (
          <View
            accessibilityState={{ busy: true }}
            aria-busy
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <ActivityIndicator
              color={theme.colors.accent}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              aria-hidden
            />
            <ProductText tone="muted">{loadingLabel}</ProductText>
          </View>
        )}
        {status === "error" && (
          <View style={{ gap: 12 }}>
            <ProductText accessibilityRole="alert" tone="danger">
              {errorMessage}
            </ProductText>
            {onRetry && (
              <ActionButton
                label={retryLabel}
                tone="secondary"
                onPress={onRetry}
              />
            )}
          </View>
        )}
        {status === "empty" && !keepContent && (
          <View style={{ gap: 8 }}>
            <ProductText variant="heading" headingLevel={2}>
              {emptyTitle}
            </ProductText>
            {emptyMessage && (
              <ProductText tone="muted">{emptyMessage}</ProductText>
            )}
            {emptyAction}
          </View>
        )}
      </View>
      <View key="content">
        {keepContent ? (
          children
        ) : status === "loading" ? (
          <DelayedPlaceholder delay={revealDelayMs}>
            {skeleton ?? (
              <View
                style={{
                  minHeight: 100,
                  borderRadius: theme.radius,
                  backgroundColor: theme.colors.border,
                }}
              />
            )}
          </DelayedPlaceholder>
        ) : null}
      </View>
    </View>
  );
}

type RetryableProps<P extends object> = {
  load: () => Promise<{ default: ComponentType<P> }>;
  contentProps: P;
  loading?: ReactNode;
  errorMessage?: string;
  retryLabel?: string;
  resetKey?: string | number;
  onRetry?: () => void;
};
/** Retry creates a fresh lazy payload; a late completion from an older attempt cannot replace it. */
export class RetryableContent<P extends object> extends Component<
  RetryableProps<P>
> {
  state = { failed: false, attempt: 0, Content: lazy(this.props.load) };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous: RetryableProps<P>) {
    if (previous.resetKey !== this.props.resetKey) this.retry();
  }
  retry = () => {
    try {
      this.props.onRetry?.();
    } catch {
      /* Observer failure must not prevent recovery. */
    }
    this.setState(({ attempt }: typeof this.state) => ({
      failed: false,
      attempt: attempt + 1,
      Content: lazy(this.props.load),
    }));
  };
  render() {
    if (this.state.failed)
      return (
        <AsyncContent
          status="error"
          errorMessage={this.props.errorMessage}
          retryLabel={this.props.retryLabel}
          onRetry={this.retry}
        />
      );
    const Content = this.state.Content;
    return (
      <Suspense
        key={this.state.attempt}
        fallback={this.props.loading ?? <AsyncContent status="loading" />}
      >
        <Content {...this.props.contentProps} />
      </Suspense>
    );
  }
}
