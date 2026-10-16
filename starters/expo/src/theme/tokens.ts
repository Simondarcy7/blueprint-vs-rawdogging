import { brand } from '@/config/app';
import { fontFamilies } from '@/config/fonts';
export const palettes = { light: brand.light, dark: brand.dark };
export type Colors = typeof brand.light;
export const tokens = {
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 10, md: 18, lg: 28, pill: 999 },
  width: { content: 960 },
  type: { title: 36, heading: 24, body: 16, small: 14 },
  fonts: fontFamilies,
};
export type AppearancePreference = 'system' | 'light' | 'dark';
export function parseAppearance(value: string | null): AppearancePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
