import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, Tabs, router, usePathname } from 'expo-router';
import { AppShell, ProductText } from '@/foundation/blueprint-shell/components/product-ui';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationTheme,
} from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import { brand, navigation } from '@/config/app';
import { useTheme } from '@/theme/ThemeProvider';
export function RootNavigation() {
  const { colors, dark } = useTheme();
  return (
    <NavigationTheme
      value={{
        ...(dark ? DarkTheme : DefaultTheme),
        colors: {
          ...(dark ? DarkTheme : DefaultTheme).colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
      }}
    >
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
          contentStyle: { backgroundColor: colors.background },
          animation: 'none',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="note/new" options={{ title: 'New note' }} />
        <Stack.Screen name="note/index" options={{ title: 'Your note' }} />
        <Stack.Screen name="support" options={{ title: 'Information' }} />
      </Stack>
    </NavigationTheme>
  );
}
export function TabNavigation() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const activeKey =
    pathname === '/settings' ? 'settings' : pathname === '/notes' ? 'notes' : 'home';
  const destinations = { home: '/', notes: '/notes', settings: '/settings' } as const;
  return (
    <AppShell
      activeKey={activeKey}
      insets={insets}
      header={
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <ProductText variant="heading">{brand.name}</ProductText>
        </View>
      }
      navigation={[
        {
          key: 'home',
          label: navigation.home,
          icon: <Feather accessible={false} name="home" color={colors.accent} size={22} />,
        },
        {
          key: 'notes',
          label: navigation.notes,
          icon: <Feather accessible={false} name="file-text" color={colors.accent} size={22} />,
        },
        {
          key: 'settings',
          label: navigation.settings,
          icon: <Feather accessible={false} name="sliders" color={colors.accent} size={22} />,
        },
      ]}
      onNavigate={(key) => {
        if (key === 'home' || key === 'notes' || key === 'settings')
          router.navigate(destinations[key]);
      }}
    >
      <Tabs tabBar={() => null} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: navigation.home }} />
        <Tabs.Screen name="notes" options={{ title: navigation.notes }} />
        <Tabs.Screen name="settings" options={{ title: navigation.settings }} />
      </Tabs>
    </AppShell>
  );
}
