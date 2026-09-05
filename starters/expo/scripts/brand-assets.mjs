import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
const brand = JSON.parse(await readFile(new URL('../brand.json', import.meta.url)));
for (const value of [brand.light.accent, brand.light.background])
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error('Asset colors must be six-digit hex.');
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="224" fill="${brand.light.accent}"/><path d="M288 320h192v192H288zM544 320h192v192H544zM288 576h192v128H288zM544 576h192v128H544z" fill="${brand.light.background}"/></svg>`;
await mkdir(new URL('../assets/', import.meta.url), { recursive: true });
const check = process.argv.includes('--check');
for (const [name, size] of [
  ['icon.png', 1024],
  ['adaptive-icon.png', 1024],
  ['splash.png', 256],
  ['favicon.png', 64],
]) {
  const output = await sharp(Buffer.from(mark)).resize(size, size).png().toBuffer();
  const target = new URL(`../assets/${name}`, import.meta.url);
  if (check) {
    if (!output.equals(await readFile(target)))
      throw new Error(`${name} is stale; run npm run assets.`);
  } else await writeFile(target, output);
}
console.log(check ? 'Brand assets are current.' : 'Generated brand assets.');
