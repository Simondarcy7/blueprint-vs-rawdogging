import { expect, it } from 'vitest';
import brand from '../../brand.json';
function luminance(hex: string) {
  if (!/^#[a-f0-9]{6}$/i.test(hex)) throw new Error('Theme colors must be six-digit hex values.');
  const values = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722;
}
function contrast(first: string, second: string) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
for (const [name, palette] of Object.entries({ light: brand.light, dark: brand.dark })) {
  it(`${name} text, focus and field boundaries meet baseline contrast`, () => {
    for (const value of Object.values(palette)) luminance(value);
    for (const background of [palette.background, palette.surface, palette.tint])
      for (const text of [palette.text, palette.muted])
        expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.onAccent, palette.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.danger, palette.dangerSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.focus, palette.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(palette.controlBorder, palette.surface)).toBeGreaterThanOrEqual(3);
  });
}
