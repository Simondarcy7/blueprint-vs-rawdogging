import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { Stack, Tabs } from 'expo-router';
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
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      screenOptions={{
        headerTitle: brand.name,
        headerTitleAlign: 'left',
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: Math.max(72, 72 * fontScale) + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(8, insets.bottom),
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 12 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: navigation.home,
          tabBarIcon: ({ color, size }) => (
            <Feather aria-hidden={true} name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: navigation.notes,
          tabBarIcon: ({ color, size }) => (
            <Feather aria-hidden={true} name="file-text" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: navigation.settings,
          tabBarIcon: ({ color, size }) => (
            <Feather aria-hidden={true} name="sliders" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
