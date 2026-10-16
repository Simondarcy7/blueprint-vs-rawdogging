import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import { useSystemAppearance } from '@/services/appearance/useSystemAppearance';
import { storage } from '@/services/storage';
import { report } from '@/services/diagnostics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { palettes, type AppearancePreference, type Colors } from './tokens';
import {
  createPreferencesStore,
  defaultPreferences,
  reduceMotion,
  resolveAppearance,
  type Preferences,
} from './preferences';

const store = createPreferencesStore({
  read: () => storage.getItem('shell.preferences.v1'),
  write: (value) => storage.setItem('shell.preferences.v1', value),
});
interface Theme {
  colors: Colors;
  dark: boolean;
  preference: AppearancePreference;
  motion: Preferences['motion'];
  reducedMotion: boolean;
  ready: boolean;
  writable: boolean;
  pending: boolean;
  error: string | undefined;
  retryLoad: () => Promise<void>;
  setPreference: (value: AppearancePreference) => Promise<void>;
  setMotion: (value: Preferences['motion']) => Promise<void>;
}
const ThemeContext = createContext<Theme | null>(null);
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useSystemAppearance();
  const systemReduced = useReducedMotion();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [writable, setWritable] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const active = useRef(false);
  const saving = useRef(false);
  const retryLoad = useCallback(async () => {
    setWritable(false);
    setError(undefined);
    try {
      const next = await store.load();
      if (active.current) {
        setPreferences(next);
        setWritable(true);
      }
    } catch {
      report({ operation: 'appearance', code: 'unavailable' });
      if (active.current)
        setError(
          'Preferences could not be loaded. Stored data was preserved. Retry before changing settings.',
        );
    } finally {
      if (active.current) setReady(true);
    }
  }, []);
  useEffect(() => {
    active.current = true;
    void Promise.resolve().then(retryLoad);
    return () => {
      active.current = false;
    };
  }, [retryLoad]);
  async function update(patch: Partial<Omit<Preferences, 'version'>>) {
    if (!writable || saving.current) return;
    saving.current = true;
    setPending(true);
    setError(undefined);
    try {
      const next = await store.update(patch);
      if (active.current) setPreferences(next);
    } catch {
      if (active.current) setError('Your preference could not be saved. Please try again.');
      report({ operation: 'appearance', code: 'failed' });
    } finally {
      saving.current = false;
      if (active.current) setPending(false);
    }
  }
  const dark =
    ready && resolveAppearance(preferences, system === 'dark' ? 'dark' : 'light') === 'dark';
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
    <ThemeContext
      value={{
        colors,
        dark,
        preference: preferences.appearance,
        motion: preferences.motion,
        reducedMotion: reduceMotion(preferences, systemReduced),
        ready,
        writable,
        pending,
        error,
        retryLoad,
        setPreference: (value) => update({ appearance: value }),
        setMotion: (value) => update({ motion: value }),
      }}
    >
      {children}
    </ThemeContext>
  );
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider is missing.');
  return value;
}
