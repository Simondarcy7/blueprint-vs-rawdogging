import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import type { ErrorBoundaryProps } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { brand } from '@/config/app';
import { fontSources } from '@/config/fonts';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { NotesProvider } from '@/modules/notes';
import { RootNavigation } from '@/modules/navigation';
import { report } from '@/services/diagnostics';
void SplashScreen.preventAutoHideAsync().catch(() => undefined);
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const [retryFailed, setRetryFailed] = useState(false);
  async function attemptRetry() {
    setRetryFailed(false);
    try {
      await retry();
    } catch {
      setRetryFailed(true);
      report({ operation: 'startup', code: 'failed' });
    }
  }
  useEffect(() => {
    report({ operation: 'render', code: 'failed' });
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 32,
        gap: 24,
        backgroundColor: brand.light.background,
      }}
    >
      <Text accessibilityRole="header" style={{ fontSize: 28, color: brand.light.text }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 16, color: brand.light.text }}>
        The app couldn’t open this screen. Try again, or close and reopen the app.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void attemptRetry();
        }}
        style={{ padding: 20, backgroundColor: brand.light.accent, borderRadius: 16 }}
      >
        <Text style={{ color: brand.light.onAccent }}>Try again</Text>
      </Pressable>
      {retryFailed ? (
        <Text accessibilityLiveRegion="polite" style={{ color: brand.light.text }}>
          Retry didn’t work. Please close and reopen the app.
        </Text>
      ) : null}
    </View>
  );
}
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);
  useEffect(() => {
    if (fontError) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);
  if (fontError) throw fontError;
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ReadyNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ReadyNavigation() {
  const { ready } = useTheme();
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  return (
    <NotesProvider>
      <RootNavigation />
    </NotesProvider>
  );
}
