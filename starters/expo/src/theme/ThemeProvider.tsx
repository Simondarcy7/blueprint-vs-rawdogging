import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { useSystemAppearance } from '@/services/appearance/useSystemAppearance';
import { storage } from '@/services/storage';
import { report } from '@/services/diagnostics';
import { palettes, parseAppearance, type AppearancePreference, type Colors } from './tokens';

interface Theme {
  colors: Colors;
  dark: boolean;
  preference: AppearancePreference;
  ready: boolean;
  pending: boolean;
  error: string | undefined;
  setPreference: (value: AppearancePreference) => Promise<void>;
}
const ThemeContext = createContext<Theme | null>(null);
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useSystemAppearance();
  const [preference, updatePreference] = useState<AppearancePreference>('system');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    storage
      .getItem('shell.appearance.v1')
      .then((value) => {
        if (active) updatePreference(parseAppearance(value));
      })
      .catch(() => {
        report({ operation: 'appearance', code: 'unavailable' });
        if (active)
          setError('Your appearance preference could not be loaded. You can choose it again.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  async function setPreference(value: AppearancePreference) {
    if (!ready || pending) return;
    setPending(true);
    setError(undefined);
    try {
      await storage.setItem('shell.appearance.v1', value);
      updatePreference(value);
    } catch {
      setError('Your appearance preference could not be saved. Please try again.');
      report({ operation: 'appearance', code: 'failed' });
    } finally {
      setPending(false);
    }
  }
  const dark = ready && (preference === 'dark' || (preference === 'system' && system === 'dark'));
  const palette = dark ? palettes.dark : palettes.light;
  useEffect(() => {
    if (Platform.OS === 'web' && ready)
      for (const [key, value] of Object.entries(palette))
        document.documentElement.style.setProperty(`--${key}`, value);
  }, [palette, ready]);
  const colors =
    Platform.OS === 'web'
      ? (Object.fromEntries(Object.keys(palette).map((key) => [key, `var(--${key})`])) as Colors)
      : palette;
  return (
    <ThemeContext value={{ colors, dark, preference, ready, pending, error, setPreference }}>
      {children}
    </ThemeContext>
  );
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider is missing.');
  return value;
}
