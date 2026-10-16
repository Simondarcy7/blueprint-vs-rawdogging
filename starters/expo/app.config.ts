import type { ExpoConfig } from 'expo/config';
import brand from './brand.json';

const projectId = process.env.EAS_PROJECT_ID;
if (
  projectId &&
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)
) {
  throw new Error('EAS_PROJECT_ID must be a project UUID.');
}
const config: ExpoConfig = {
  name: brand.name,
  slug: brand.slug,
  scheme: brand.scheme,
  version: '1.0.0',
  owner: process.env.EXPO_OWNER || undefined,
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  ios: { supportsTablet: true, bundleIdentifier: brand.bundleIdentifier },
  android: {
    package: brand.bundleIdentifier,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: brand.light.accent,
    },
  },
  web: { bundler: 'metro', output: 'static', favicon: './assets/favicon.png' },
  plugins: [
    'expo-status-bar',
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: brand.light.background,
        image: './assets/splash.png',
        imageWidth: 160,
        dark: { backgroundColor: brand.dark.background },
      },
    ],
  ],
  experiments: { typedRoutes: true },
  runtimeVersion: { policy: 'fingerprint' },
  updates: projectId
    ? {
        url: `https://u.expo.dev/${projectId}`,
        checkAutomatically: 'ON_LOAD',
        fallbackToCacheTimeout: 0,
      }
    : { enabled: false },
  extra: projectId ? { eas: { projectId } } : {},
};
export default config;
