import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const host = JSON.parse(await readFile('vercel.json', 'utf8'));
const csp = host.headers[0].headers.find(
  (header) => header.key === 'Content-Security-Policy',
).value;
const root = path.resolve('dist');
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};
createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    const url = new URL(request.url, 'http://localhost');
    const decoded = decodeURIComponent(url.pathname);
    const candidate = path.resolve(root, `.${decoded}`);
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403);
      response.end();
      return;
    }
    let file;
    for (const name of [candidate, `${candidate}.html`, path.join(candidate, 'index.html')]) {
      try {
        if ((await stat(name)).isFile()) {
          file = name;
          break;
        }
      } catch {}
    }
    const missing = !file;
    file ??= path.join(root, '+not-found.html');
    response.writeHead(missing ? 404 : 200, {
      'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Export preview: http://127.0.0.1:${port}`));
