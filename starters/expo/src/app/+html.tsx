import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import brand from '../../brand.json';
const css = (palette: typeof brand.light) =>
  Object.entries(palette)
    .map(([key, value]) => `--${key}:${value}`)
    .join(';');
// Runs before the body paints; only the preference key is read, with a safe fallback.
const appearanceScript = `(function(){try{var p=localStorage.getItem('shell.appearance.v1');var dark=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);var c=dark?${JSON.stringify(brand.dark)}:${JSON.stringify(brand.light)};Object.keys(c).forEach(function(k){document.documentElement.style.setProperty('--'+k,c[k])})}catch(e){}})();`;
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        <style>{`:root{${css(brand.light)}}@media(prefers-color-scheme:dark){:root{${css(brand.dark)}}}:focus-visible{outline:3px solid var(--focus)!important;outline-offset:3px}body{margin:0;background:var(--background)}input,textarea{font:inherit}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`}</style>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
