import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const assetRoot = 'codex/skills/mature-app-starter/assets';
export const productPacks = Object.freeze(['drafts', 'import-review', 'interactions', 'engagement']);
export const appShellPacks = Object.freeze(['product-ui', 'product-workflows', 'account-recovery', 'notification-preferences', 'undo']);
export const manifestName = '.blueprint-product-capabilities.json';
const hash = value => createHash('sha256').update(value).digest('hex');
const safePath = value => typeof value === 'string' && !isAbsolute(value) && !value.includes('\\')
  && value.split('/').every(part => part && part !== '.' && part !== '..');
async function info(path) { try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
async function noSymlinks(path) {
  const absolute = resolve(path);
  let cursor = parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const stat = await info(cursor);
    if (stat?.isSymbolicLink()) throw new Error(`Symlink path refused: ${cursor}`);
    if (cursor !== absolute && stat && !stat.isDirectory()) throw new Error(`Not a directory: ${cursor}`);
  }
}
const digest = files => hash(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))));

async function canonicalFiles(sourceRoot, packs) {
  const files = new Map();
  async function add(source, destination) {
    await noSymlinks(source);
    const stat = await info(source);
    if (!stat?.isFile()) throw new Error(`Missing regular source file: ${source}`);
    if (files.has(destination)) throw new Error(`Duplicate source destination: ${destination}`);
    const bytes = await readFile(source);
    files.set(destination, { bytes, source: relative(sourceRoot, source).split(sep).join('/'), sha256: hash(bytes) });
  }
  async function walk(directory, prefix = '') {
    await noSymlinks(directory);
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      const destination = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Source symlink refused: ${path}`);
      if (entry.isDirectory()) await walk(path, `${destination}/`);
      else if (entry.isFile()) await add(path, destination);
      else throw new Error(`Unsupported source entry: ${path}`);
    }
  }
  await add(join(sourceRoot, assetRoot, 'app-baseline/src/lib/asyncWork.ts'), 'lib/asyncWork.ts');
  for (const pack of packs) await walk(join(sourceRoot, assetRoot, 'app-capabilities', pack, 'src'));
  return files;
}

function readManifest(raw, packs) {
  const manifest = JSON.parse(raw);
  if (!manifest || manifest.version !== 1 || !manifest.source || !manifest.files
    || Array.isArray(manifest.files) || typeof manifest.files !== 'object'
    || JSON.stringify(manifest.packs) !== JSON.stringify(packs)) throw new Error('Unsupported capability manifest');
  for (const [path, entry] of Object.entries(manifest.files)) {
    if (!safePath(path) || !/^(lib|services|components|modules)\//.test(path) || !entry || typeof entry !== 'object'
      || !safePath(entry.source) || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Invalid capability manifest file');
  }
  if (digest(manifest.files) !== manifest.source.contentDigest) throw new Error('Capability manifest digest mismatch');
  return manifest;
}

/** Vendored, byte-identical source. This is not a merge tool or runtime dependency resolver. */
export async function syncProductCapabilities({ target, mode, sourceRoot = repositoryRoot, bundle = 'product' }) {
  if (!['product', 'app-shell'].includes(bundle)) throw new Error('Unknown capability bundle');
  const packs = bundle === 'app-shell' ? appShellPacks : productPacks;
  const selectedManifestName = bundle === 'app-shell' ? '.blueprint-app-shell.json' : manifestName;
  if (!target || !['check', 'dry-run', 'write'].includes(mode)) throw new Error('A target and explicit mode are required');
  target = resolve(target); sourceRoot = resolve(sourceRoot);
  await noSymlinks(target);
  const targetInfo = await info(target);
  if (targetInfo && !targetInfo.isDirectory()) throw new Error('Capability target must be a directory');
  const sources = await canonicalFiles(sourceRoot, packs);
  const currentFiles = Object.fromEntries([...sources].map(([path, { source, sha256 }]) => [path, { source, sha256 }]));
  const contentDigest = digest(currentFiles);
  const manifestPath = join(target, selectedManifestName);
  await noSymlinks(manifestPath);
  const manifestInfo = await info(manifestPath);
  if (manifestInfo && !manifestInfo.isFile()) throw new Error('Capability manifest must be a regular file');
  const previousRaw = manifestInfo ? await readFile(manifestPath, 'utf8') : null;
  const previous = previousRaw === null ? null : readManifest(previousRaw, packs);
  for (const path of Object.keys(previous?.files ?? {})) {
    if (!sources.has(path)) throw new Error(`Canonical file removed; review the consumer manually: ${path}`);
  }
  const created = []; const updated = []; const expected = new Map();
  // Preflight the whole batch: no changed source is installed before every consumer file is safe.
  for (const [path, source] of sources) {
    const destination = join(target, path);
    await noSymlinks(destination);
    const stat = await info(destination);
    const tracked = previous?.files[path];
    if (stat && !stat.isFile()) throw new Error(`Non-file destination refused: ${path}`);
    if (tracked) {
      if (!stat) throw new Error(`Locally deleted capability preserved: ${path}`);
      const actual = hash(await readFile(destination));
      if (actual !== tracked.sha256) throw new Error(`Locally modified capability preserved: ${path}`);
      expected.set(path, actual);
      if (actual !== source.sha256) updated.push(path);
    } else {
      if (stat) throw new Error(`Unknown existing file preserved: ${path}`);
      expected.set(path, null); created.push(path);
    }
  }
  const changed = !previous || created.length > 0 || updated.length > 0 || previous.source.contentDigest !== contentDigest;
  if (mode === 'check' && changed) throw new Error(`Capability drift: ${created.length} new, ${updated.length} updated; run --dry-run to review`);
  if (mode !== 'write' || !changed) return { status: changed ? 'planned' : 'up-to-date', created, updated, contentDigest };

  let gitRevision = null;
  try { gitRevision = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* Source hashes still identify a copied fixture/archive. */ }
  const manifest = { version: 1, packs,
    source: { repository: 'https://github.com/Simondarcy7/blueprint-vs-rawdogging', kind: 'working-tree', gitRevision, contentDigest },
    files: currentFiles };
  await mkdir(target, { recursive: true });
  await noSymlinks(target);
  const lock = join(target, '.blueprint-product-capabilities.lock');
  await writeFile(lock, 'Capability sync in progress. Remove only after confirming no sync is running.\n', { flag: 'wx' });
  async function replace(path, bytes, expectedHash) {
    await noSymlinks(path);
    const exists = await info(path);
    if (expectedHash === null) {
      if (exists) throw new Error(`Concurrent destination appeared: ${path}`);
      await mkdir(dirname(path), { recursive: true });
      await noSymlinks(path);
      await writeFile(path, bytes, { flag: 'wx' });
      return;
    }
    if (!exists?.isFile() || hash(await readFile(path)) !== expectedHash) throw new Error(`Concurrent modification preserved: ${path}`);
    const temporary = join(dirname(path), `.${randomUUID()}.blueprint-tmp`);
    try {
      await writeFile(temporary, bytes, { flag: 'wx' });
      await noSymlinks(path);
      if (hash(await readFile(path)) !== expectedHash) throw new Error(`Concurrent modification preserved: ${path}`);
      await rename(temporary, path);
    } finally { await rm(temporary, { force: true }); }
  }
  try {
    // Another sync may have completed between preflight and lock acquisition.
    const latestManifest = await info(manifestPath);
    if ((latestManifest ? await readFile(manifestPath, 'utf8') : null) !== previousRaw)
      throw new Error('Capability manifest changed after preflight; retry');
    for (const path of [...created, ...updated]) await replace(join(target, path), sources.get(path).bytes, expected.get(path));
    await replace(manifestPath, JSON.stringify(manifest, null, 2) + '\n', previousRaw === null ? null : hash(previousRaw));
  } finally { await rm(lock, { force: true }); }
  return { status: 'written', created, updated, contentDigest };
}

async function main(args) {
  let target; let mode; let bundle;
  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    if (argument === '--target' && !target && args[i + 1] && !args[i + 1].startsWith('--')) target = args[++i];
    else if (argument === '--bundle' && !bundle && args[i + 1] && !args[i + 1].startsWith('--')) bundle = args[++i];
    else if (['--check', '--dry-run', '--write'].includes(argument) && !mode) mode = argument.slice(2);
    else throw new Error('Usage: sync-product-capabilities.mjs --target PATH [--bundle product|app-shell] --dry-run|--write|--check');
  }
  const result = await syncProductCapabilities({ target, mode, bundle });
  console.log(`${result.status}: ${result.created.length} new, ${result.updated.length} updated capability files`);
  for (const path of [...result.created, ...result.updated]) console.log(`  ${path}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
