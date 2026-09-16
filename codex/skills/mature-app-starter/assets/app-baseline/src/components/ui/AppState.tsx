import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { BaselinePalette } from '../../theme/baseline';

/** Initial loading, empty, unavailable and recovery surfaces share the same geometry. */
export function AppState({ title, message, loading = false, action, palette }: {
  title: string; message: string; loading?: boolean; palette: BaselinePalette;
  action?: { label: string; run(): void | Promise<void> };
}) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function run() {
    if (!action || lock.current) return;
    lock.current = true;
    setPending(true);
    setFailed(false);
    try { await action.run(); } catch { setFailed(true); }
    finally { lock.current = false; setPending(false); }
  }
  return <View style={{ padding: 24, gap: 12, backgroundColor: palette.background }} accessibilityState={{ busy: loading || pending }}>
    <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 22 }}>{title}</Text>
    <Text accessibilityLiveRegion="polite" style={{ color: palette.muted }}>{message}</Text>
    {loading && <ActivityIndicator accessibilityLabel="Loading" color={palette.accent} />}
    {failed && <Text accessibilityRole="alert" style={{ color: palette.text }}>That did not work. Please try again.</Text>}
    {action && <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending || loading }} disabled={pending || loading} onPress={run}
      style={{ minHeight: 48, padding: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 8 }}>
      <Text style={{ color: palette.accent }}>{pending ? 'Please wait…' : action.label}</Text>
    </Pressable>}
  </View>;
}
