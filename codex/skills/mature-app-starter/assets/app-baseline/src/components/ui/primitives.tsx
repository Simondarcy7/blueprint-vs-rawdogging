import { createContext, useContext, useId, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, type TextInputProps, type TextProps } from 'react-native';
import { baselinePalettes, type BaselinePalette } from '../../theme/baseline';

const PaletteContext = createContext<BaselinePalette>(baselinePalettes.light);
export const PaletteProvider = PaletteContext.Provider;
export const usePalette = () => useContext(PaletteContext);

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: 'title' | 'heading' | 'body' | 'helper'; 'aria-level'?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const palette = usePalette();
  return <Text {...props} aria-level={props['aria-level'] ?? (props.accessibilityRole === 'header' ? (variant === 'title' ? 1 : 2) : undefined)} style={[{ color: variant === 'helper' ? palette.muted : palette.text, fontSize: { title: 28, heading: 21, body: 16, helper: 14 }[variant], lineHeight: { title: 36, heading: 29, body: 24, helper: 21 }[variant] }, style]} />;
}

/** Errors remain visible; duplicate actions are blocked synchronously, before re-render. */
export function AppButton({ label, onPress, disabled = false, busy = false, selected, errorMessage = 'The action could not be completed. Please try again.' }: {
  label: string; onPress(): void | Promise<void>; disabled?: boolean; busy?: boolean; selected?: boolean; errorMessage?: string;
}) {
  const palette = usePalette();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const blocked = disabled || busy || pending;
  async function press() {
    if (lock.current || blocked) return;
    lock.current = true; setPending(true); setFailed(false);
    try { await onPress(); } catch { setFailed(true); }
    finally { lock.current = false; setPending(false); }
  }
  return <View style={{ gap: 6 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: blocked, busy: busy || pending, selected }} aria-pressed={selected}
      disabled={blocked} onPress={press} style={({ pressed }) => ({ minHeight: 48, padding: 12, borderRadius: 8, borderWidth: selected ? 2 : 1, borderColor: palette.accent, opacity: disabled ? 0.55 : pressed ? 0.75 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 })}>
      {(busy || pending) && <ActivityIndicator color={palette.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
      <Text style={{ color: palette.accent, fontSize: 16, flexShrink: 1 }}>{label}</Text>
    </Pressable>
    {failed && <AppText accessibilityRole="alert">{errorMessage}</AppText>}
  </View>;
}

export function AppTextField({ label, helper, error, style, ...props }: TextInputProps & { label: string; helper?: string; error?: string; 'aria-describedby'?: string }) {
  const palette = usePalette();
  const id = useId();
  const message = error || helper;
  return <View style={{ gap: 6 }}>
    <AppText>{label}</AppText>
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} accessibilityHint={[props.accessibilityHint, message].filter(Boolean).join('. ') || undefined}
      aria-describedby={message ? `${id}-message` : props['aria-describedby']} aria-invalid={Boolean(error)}
      placeholderTextColor={palette.muted} style={[{ color: palette.text, backgroundColor: palette.background, borderColor: palette.border, borderWidth: error ? 2 : 1, borderRadius: 8, minHeight: 48, padding: 12, fontSize: 16 }, style]} />
    {message && <AppText nativeID={`${id}-message`} accessibilityLiveRegion={error ? 'polite' : 'none'} variant="helper">{message}</AppText>}
  </View>;
}

export function Surface({ children }: PropsWithChildren) {
  const palette = usePalette();
  return <View style={{ borderColor: palette.border, borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 }}>{children}</View>;
}

/** The host supplies safe-area insets once; avoid applying navigator insets twice. */
export function Screen({ children, title, insets = { top: 0, bottom: 0 }, footer }: PropsWithChildren<{
  title: string; insets?: { top: number; bottom: number }; footer?: ReactNode;
}>) {
  const palette = usePalette();
  return <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: Math.max(0, insets.top), paddingBottom: Math.max(0, insets.bottom) }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, width: '100%', maxWidth: 900, alignSelf: 'center' }}>
      <AppText variant="title" accessibilityRole="header" aria-level={1}>{title}</AppText>
      {children}
    </ScrollView>
    {footer && <View style={{ padding: 16 }}>{footer}</View>}
  </View>;
}

export function SelectionGroup({ label, value, options, onSelect, disabled }: {
  label: string; value: string; options: readonly { value: string; label: string }[]; onSelect(value: string): void | Promise<void>; disabled?: boolean;
}) {
  return <View accessibilityLabel={label} style={{ gap: 8 }}>
    <AppText variant="heading" accessibilityRole="header">{label}</AppText>
    {options.map(option => <AppButton key={option.value} label={option.label} selected={option.value === value} disabled={disabled} onPress={() => onSelect(option.value)} />)}
  </View>;
}
