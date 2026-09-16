import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Preferences } from './preferences';
import type { BaselinePalette } from '../../theme/baseline';
import type { NotificationState } from '../notifications';

/** Controlled screen: the host hydrates preferences and applies confirmed changes app-wide. */
export function SettingsScreen({ preferences, palette, onChange, notifications, onNotificationsChange, links, version }: {
  preferences: Preferences;
  palette: BaselinePalette;
  onChange(patch: Partial<Omit<Preferences, 'version'>>): Promise<void>;
  notifications?: NotificationState;
  onNotificationsChange?: (enabled: boolean) => Promise<void>;
  links: readonly { label: string; open(): void | Promise<void> }[];
  version: string;
}) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const disabled = pending || notifications?.status === 'pending';
  async function act(operation: () => void | Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError(false);
    try { await operation(); } catch { setError(true); }
    finally { lock.current = false; setPending(false); }
  }
  function choice(label: string, selected: boolean, operation: () => Promise<void>) {
    return <Pressable key={label} accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => act(operation)}
      style={{ padding: 12, minHeight: 48, borderWidth: 1, borderColor: palette.border, borderRadius: 8 }}>
      <Text style={{ color: palette.text }}>{selected ? '● ' : '○ '}{label}</Text>
    </Pressable>;
  }
  return <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={{ padding: 24, gap: 16 }}>
    <Text accessibilityRole="header" style={{ fontSize: 28, color: palette.text }}>Settings</Text>
    <Text accessibilityRole="header" style={{ fontSize: 20, color: palette.text }}>Appearance</Text>
    <View accessibilityLabel="Appearance" style={{ gap: 8 }}>
      {(['system', 'light', 'dark'] as const).map(mode => choice(mode[0].toUpperCase() + mode.slice(1), preferences.appearance === mode, () => onChange({ appearance: mode })))}
    </View>
    <Text accessibilityRole="header" style={{ fontSize: 20, color: palette.text }}>Motion</Text>
    <View accessibilityLabel="Motion" style={{ gap: 8 }}>
      {choice('Follow device', preferences.motion === 'system', () => onChange({ motion: 'system' }))}
      {choice('Reduce motion', preferences.motion === 'reduced', () => onChange({ motion: 'reduced' }))}
    </View>
    {notifications && <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontSize: 20, color: palette.text }}>Notifications</Text>
      <Text style={{ color: palette.muted }}>{notifications.permission === 'granted'
        ? (notifications.enabled ? 'Notifications are enabled.' : 'Notifications are off.')
        : notifications.permission === 'denied' ? 'Permission is blocked. Review your device or browser settings.'
          : notifications.permission === 'undetermined' ? 'Enable notifications to choose whether to grant permission.'
            : 'Notifications are unavailable on this device or have not been configured.'}</Text>
      {onNotificationsChange && (notifications.enabled || ['granted', 'undetermined'].includes(notifications.permission)) &&
        <Pressable accessibilityRole="switch" accessibilityLabel="Notifications"
          accessibilityState={{ checked: notifications.enabled, disabled }} disabled={disabled}
          onPress={() => act(() => onNotificationsChange(!notifications.enabled))}
          style={{ minHeight: 48, padding: 12, borderWidth: 1, borderColor: palette.border }}>
          <Text style={{ color: palette.accent }}>{notifications.enabled ? 'Turn off' : 'Enable notifications'}</Text>
        </Pressable>}
      {notifications.status === 'error' && <Text accessibilityRole="alert" style={{ color: palette.text }}>Notification settings could not be updated. Check the current status and try again.</Text>}
    </View>}
    {pending && <Text accessibilityLiveRegion="polite" style={{ color: palette.muted }}>Please wait…</Text>}
    {error && <Text accessibilityRole="alert" style={{ color: palette.text }}>The action could not be completed. Please try again.</Text>}
    <Text accessibilityRole="header" style={{ fontSize: 20, color: palette.text }}>About and support</Text>
    {links.map(link => <Pressable key={link.label} accessibilityRole="link" disabled={disabled}
      accessibilityState={{ disabled }} onPress={() => act(link.open)} style={{ minHeight: 48, paddingVertical: 12 }}>
      <Text style={{ color: palette.accent }}>{link.label}</Text>
    </Pressable>)}
    <Text style={{ color: palette.muted }}>Version {version}</Text>
  </ScrollView>;
}
