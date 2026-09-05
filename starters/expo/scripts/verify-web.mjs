import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
const brand = JSON.parse(await readFile('brand.json', 'utf8'));
const limits = JSON.parse(await readFile('budgets.json', 'utf8'));
async function walk(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const name = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(name)));
    else result.push(name);
  }
  return result;
}
const files = await walk('dist');
const pages = files.filter((name) => name.endsWith('.html'));
if (pages.length < 6) throw new Error('Missing exported routes.');
for (const page of pages) {
  let html = await readFile(page, 'utf8');
  if (page.endsWith('_sitemap.html')) {
    html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow" /></head>');
    await writeFile(page, html);
  }
  const inline = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const match of inline) {
    if (/\bsrc=/.test(match[1]) || /application\/ld\+json/.test(match[1]) || !match[2].trim())
      continue;
    const name = createHash('sha256').update(match[2]).digest('hex').slice(0, 24) + '.js';
    await mkdir('dist/_shell', { recursive: true });
    await writeFile(`dist/_shell/${name}`, match[2]);
    html = html.replace(match[0], `<script${match[1]} src="/_shell/${name}"></script>`);
  }
  await writeFile(page, html);
  if (!/<title[\s>]/.test(html) || !html.includes('name="robots"'))
    throw new Error(`Missing metadata: ${page}`);
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  let bytes = 0;
  for (const script of new Set(scripts)) {
    if (/^https?:/.test(script)) throw new Error('Unreviewed external script.');
    bytes += gzipSync(await readFile(path.join('dist', script))).length;
  }
  if (bytes > limits.initialJavaScriptGzip)
    throw new Error(`${page}: ${bytes} gzip bytes exceeds ${limits.initialJavaScriptGzip}`);
  console.log(`${page}: ${bytes} initial JavaScript gzip bytes`);
}
for (const file of files.filter((name) => /\.(png|jpe?g|webp|avif)$/i.test(name)))
  if ((await readFile(file)).length > limits.imageBytes)
    throw new Error(`Image exceeds budget: ${file}`);
const publicOrigin =
  process.env.EXPO_PUBLIC_APP_ENV === 'production' ? process.env.EXPO_PUBLIC_SITE_URL : undefined;
const url = publicOrigin ? new URL(publicOrigin) : undefined;
if (
  url &&
  (url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash)
)
  throw new Error('Invalid public site origin.');
await writeFile(
  'dist/robots.txt',
  url
    ? `User-agent: *
Allow: /support
Disallow: /
Sitemap: ${url.origin}/sitemap.xml
`
    : 'User-agent: *\nDisallow: /\n',
);
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${url ? `<url><loc>${url.origin}/support</loc></url>` : ''}</urlset>`,
);
console.log(
  `${brand.name}: metadata and configured budgets passed. Only /support is eligible for public indexing.`,
);

const missing = await readFile('dist/+not-found.html', 'utf8');
await writeFile('dist/404.html', missing);
