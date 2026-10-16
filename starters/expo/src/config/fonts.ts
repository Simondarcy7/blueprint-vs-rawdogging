import type { FontSource } from 'expo-font';
// Bundle licensed fonts in assets/fonts; register them here and set family names below.
// Example: { 'Brand-Regular': require('../../assets/fonts/Brand-Regular.ttf') }
export const fontSources: Record<string, FontSource> = {};
export const fontFamilies: { body: string | undefined; heading: string | undefined } = {
  body: undefined,
  heading: undefined, // Platform system fonts: no network request.
};
