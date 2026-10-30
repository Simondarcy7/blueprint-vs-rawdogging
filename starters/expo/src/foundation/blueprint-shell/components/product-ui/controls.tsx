import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { ProductText, useProductUITheme } from "./theme";

export type ActionButtonProps = {
  label: string;
  onPress(): void | Promise<unknown>;
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  errorMessage?: string;
  testID?: string;
};
/** Lock before invoking the host so rapid presses cannot dispatch the same operation twice. */
export function ActionButton({
  label,
  onPress,
  tone = "primary",
  disabled = false,
  busy = false,
  accessibilityLabel,
  accessibilityHint,
  errorMessage = "Could not complete this action. Please try again.",
  testID,
}: ActionButtonProps) {
  const theme = useProductUITheme();
  const lock = useRef(false);
  const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const blocked = disabled || busy || pending;
  const color =
    tone === "primary"
      ? theme.colors.onAccent
      : tone === "danger"
        ? theme.colors.danger
        : theme.colors.accent;
  async function press() {
    if (lock.current || blocked) return;
    lock.current = true;
    setPending(true);
    setFailed(false);
    try {
      await onPress();
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      lock.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <View style={{ gap: 6, minWidth: 0 }}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: blocked, busy: busy || pending }}
        aria-disabled={blocked}
        aria-busy={busy || pending}
        disabled={blocked}
        onPress={press}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => ({
          minHeight: 48,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: theme.radius,
          borderWidth: 2,
          borderColor: focused
            ? theme.colors.focus
            : tone === "primary"
              ? theme.colors.accent
              : theme.colors.border,
          backgroundColor:
            tone === "primary" ? theme.colors.accent : theme.colors.surface,
          opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        })}
      >
        {(busy || pending) && (
          <ActivityIndicator
            color={color}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
          />
        )}
        <ProductText style={{ color, fontWeight: "600", textAlign: "center" }}>
          {label}
        </ProductText>
      </Pressable>
      {failed && (
        <ProductText accessibilityRole="alert" tone="danger" variant="caption">
          {errorMessage}
        </ProductText>
      )}
    </View>
  );
}

export type FormFieldProps = TextInputProps & {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
};
export const FormField = forwardRef<ComponentRef<typeof TextInput>, FormFieldProps>(
  function FormField(
    { label, helper, error, required, style, onFocus, onBlur, ...props },
    ref,
  ) {
    const theme = useProductUITheme();
    const id = useId();
    const [focused, setFocused] = useState(false);
    const message = error || helper;
    return (
      <View style={{ gap: 6, minWidth: 0 }}>
        <ProductText style={{ fontWeight: "600" }}>
          {label}
          {required ? " *" : ""}
        </ProductText>
        <TextInput
          {...props}
          ref={ref}
          allowFontScaling
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={
            [
              props.accessibilityHint,
              required ? "Required" : undefined,
              message,
            ]
              .filter(Boolean)
              .join(". ") || undefined
          }
          accessibilityState={{
            ...props.accessibilityState,
            disabled: props.editable === false,
          }}
          aria-disabled={props.editable === false}
          aria-describedby={message ? `${id}-message` : undefined}
          aria-invalid={Boolean(error)}
          aria-required={required}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={
            props.placeholderTextColor ?? theme.colors.muted
          }
          style={[
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
              fontFamily: theme.fontFamily,
              borderColor: error
                ? theme.colors.danger
                : focused
                  ? theme.colors.focus
                  : theme.colors.border,
              borderWidth: 2,
              borderRadius: theme.radius,
              minHeight: props.multiline ? 112 : 48,
              padding: 12,
              fontSize: 16,
              textAlignVertical: props.multiline ? "top" : "center",
              opacity: props.editable === false ? 0.6 : 1,
            },
            style,
          ]}
        />
        {message && (
          <ProductText
            nativeID={`${id}-message`}
            variant="caption"
            tone={error ? "danger" : "muted"}
            accessibilityLiveRegion={error ? "polite" : "none"}
          >
            {message}
          </ProductText>
        )}
      </View>
    );
  },
);

export function SearchField({
  value,
  onChangeText,
  clearLabel = "Clear search",
  ...props
}: Omit<FormFieldProps, "value" | "onChangeText"> & {
  value: string;
  onChangeText(value: string): void;
  clearLabel?: string;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <View style={{ gap: 8 }}>
      <FormField
        {...props}
        ref={input}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={props.autoCapitalize ?? "none"}
        autoCorrect={props.autoCorrect ?? false}
        returnKeyType={props.returnKeyType ?? "search"}
      />
      {value.length > 0 && (
        <ActionButton
          label={clearLabel}
          tone="secondary"
          disabled={props.editable === false}
          onPress={() => {
            onChangeText("");
            input.current?.focus();
          }}
        />
      )}
    </View>
  );
}

type RadioControl = {
  focus(): void;
  click(): void;
  getAttribute(name: string): string | null;
  closest(selector: string): unknown;
};
type RadioKeyboardEvent = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  preventDefault(): void;
  currentTarget: {
    querySelectorAll(selector: string): ArrayLike<RadioControl>;
  };
  target: { closest?(selector: string): unknown };
};
export type ChoiceGroupHandle = {
  focusSelected(): void;
  focusOption(value: string): void;
};
export type ChoiceGroupProps = {
  label: string;
  options: readonly {
    value: string;
    label: string;
    accessibilityLabel?: string;
    description?: string;
    disabled?: boolean;
  }[];
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
  testID?: string;
};
export const ChoiceGroup = forwardRef<ChoiceGroupHandle, ChoiceGroupProps>(
  function ChoiceGroup(
    { label, options, value, onChange, disabled = false, testID },
    ref,
  ) {
    const theme = useProductUITheme();
    const [focused, setFocused] = useState<string | null>(null);
    const controls = useRef(new Map<string, ComponentRef<typeof View>>());
    const enabled = options.filter((option) => !option.disabled && !disabled);
    const tabValue = enabled.some((option) => option.value === value)
      ? value
      : enabled[0]?.value;
    useImperativeHandle(ref, () => ({
      focusSelected() {
        if (tabValue) controls.current.get(tabValue)?.focus();
      },
      focusOption(key) {
        if (enabled.some((option) => option.value === key))
          controls.current.get(key)?.focus();
      },
    }));
    const keyboard =
      Platform.OS === "web"
        ? {
            onKeyDown(nativeEvent: unknown) {
              // React Native versions type this prop differently; this branch only receives DOM keyboard events.
              const event = nativeEvent as RadioKeyboardEvent;
              if (
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                ![
                  " ",
                  "ArrowRight",
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowUp",
                  "Home",
                  "End",
                ].includes(event.key)
              )
                return;
              const choices = Array.from(
                event.currentTarget.querySelectorAll('[role="radio"]'),
              ).filter(
                (node) =>
                  node.closest('[role="radiogroup"]') === event.currentTarget &&
                  node.getAttribute("aria-disabled") !== "true",
              );
              const current = event.target.closest?.('[role="radio"]');
              const index = choices.indexOf(current as RadioControl);
              if (index < 0 || !choices.length) return;
              event.preventDefault();
              if (event.key === " ") {
                choices[index]?.click();
                return;
              }
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? choices.length - 1
                    : (index +
                        (event.key === "ArrowRight" || event.key === "ArrowDown"
                          ? 1
                          : -1) +
                        choices.length) %
                      choices.length;
              const control = choices[next];
              if (control) {
                control.focus();
                control.click();
              }
            },
          }
        : {};
    return (
      <View
        {...keyboard}
        testID={testID}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{ gap: 8 }}
      >
        <ProductText style={{ fontWeight: "600" }}>{label}</ProductText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {options.map((option) => {
            const blocked = disabled || Boolean(option.disabled);
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                ref={(node) => {
                  if (node) controls.current.set(option.value, node);
                  else controls.current.delete(option.value);
                }}
                accessibilityRole="radio"
                accessibilityLabel={option.accessibilityLabel ?? option.label}
                accessibilityHint={option.description}
                accessibilityState={{ checked: selected, disabled: blocked }}
                aria-checked={selected}
                aria-disabled={blocked}
                disabled={blocked}
                tabIndex={
                  Platform.OS === "web"
                    ? option.value === tabValue
                      ? 0
                      : -1
                    : undefined
                }
                onPress={() => {
                  if (!blocked) onChange(option.value);
                }}
                onFocus={() => setFocused(option.value)}
                onBlur={() => setFocused(null)}
                style={({ pressed }) => ({
                  minHeight: 48,
                  padding: 12,
                  borderWidth: 2,
                  borderRadius: theme.radius,
                  borderColor:
                    focused === option.value
                      ? theme.colors.focus
                      : selected
                        ? theme.colors.accent
                        : theme.colors.border,
                  backgroundColor: selected
                    ? theme.colors.accent
                    : theme.colors.surface,
                  opacity: blocked ? 0.55 : pressed ? 0.8 : 1,
                })}
              >
                <ProductText
                  style={{
                    color: selected ? theme.colors.onAccent : theme.colors.text,
                  }}
                >
                  {option.label}
                </ProductText>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  },
);

/** Decorative slots must not add a second interactive target inside a row/button. */
export function Decorative({ children }: { children?: ReactNode }) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
    >
      {children}
    </View>
  );
}
