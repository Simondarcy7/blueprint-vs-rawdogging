/** Replace palettes with app-owned semantic tokens; keep component behavior reusable. */
export const baselinePalettes = {
  light: { background: '#ffffff', text: '#17212b', muted: '#465565', accent: '#174ea6', border: '#748292' },
  dark: { background: '#111820', text: '#f4f7fa', muted: '#bcc7d3', accent: '#a8c7fa', border: '#8898a8' },
};
export type BaselinePalette = typeof baselinePalettes.light;
