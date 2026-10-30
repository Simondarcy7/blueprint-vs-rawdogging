import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repo = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
let port = 8769;
let check = false;
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--check') check = true;
  else if (args[index] === '--port' && /^\d+$/.test(args[index + 1] ?? '')) port = Number(args[++index]);
  else throw new Error('Usage: node scripts/serve-product-workflows.mjs [--check] [--port 8769]');
}
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('Port must be 1–65535');
const temporary = await mkdtemp(join(tmpdir(), 'blueprint-workflows-'));
const source = join(temporary, 'source');
const output = join(temporary, 'web');
let server;
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  server?.close();
  server?.closeAllConnections();
  // npm may forward the same terminal signal. Finish cleanup synchronously before exit.
  try { rmSync(temporary, { recursive: true, force: true }); }
  catch (error) { console.error(`Could not remove owned build ${temporary}: ${error.message}`); process.exit(1); }
  process.exit(0);
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
try {
  await cp(join(repo, 'examples/product-workflows'), source, { recursive: true });
  const assets = join(repo, 'codex/skills/mature-app-starter/assets');
  await mkdir(join(source, 'capabilities'), { recursive: true });
  await cp(join(assets, 'app-baseline/src/lib'), join(source, 'capabilities/lib'), { recursive: true });
  for (const pack of ['drafts', 'import-review', 'interactions', 'engagement'])
    await cp(join(assets, 'app-capabilities', pack, 'src'), join(source, 'capabilities'), { recursive: true });
  const program = ts.createProgram([join(source, 'main.ts')], {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true, rewriteRelativeImportExtensions: true, noEmitOnError: true, rootDir: source, outDir: output,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: () => source, getNewLine: () => '\n',
  }));
  if (program.emit().emitSkipped) throw new Error('Example compilation failed');
  await cp(join(source, 'index.html'), join(output, 'index.html'));
  await cp(join(source, 'style.css'), join(output, 'style.css'));
  if (check) {
    console.log('Product workflow example: strict TypeScript and browser build passed.');
    await rm(temporary, { recursive: true, force: true });
  } else {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    server = createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const file = resolve(output, '.' + (pathname === '/' ? '/index.html' : pathname));
        if (!file.startsWith(output + sep) || !types[extname(file)]) { response.writeHead(404).end(); return; }
        const content = await readFile(file);
        response.writeHead(200, { 'Content-Type': types[extname(file)] + '; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(content);
      } catch { response.writeHead(404).end(); }
    });
    server.once('error', async error => { console.error(`Example server: ${error.message}. Use --port with another available port if needed.`); await rm(temporary, { recursive: true, force: true }); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Product workflow reference: http://127.0.0.1:${port}\nTemporary build: ${temporary}\nCtrl+C stops this server and removes its build.`));
  }
} catch (error) { await rm(temporary, { recursive: true, force: true }); throw error; }
