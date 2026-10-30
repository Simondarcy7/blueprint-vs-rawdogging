import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const assets = fileURLToPath(new URL('../assets/', import.meta.url));
const supported = ['storage', 'device', 'flags', 'diagnostics', 'updates', 'outbox', 'drafts', 'import-review', 'interactions', 'engagement', 'account-recovery', 'notification-preferences', 'undo'];
async function exists(path) { try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Source symlink is not allowed: ${path}`);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}
async function main(args) {
  let root; let dryRun = false; let onlyPacks = false; let packs = [];
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (seen.has(flag)) throw new Error(`Duplicate argument: ${flag}`);
    seen.add(flag);
    if (flag === '--dry-run') dryRun = true;
    else if (flag === '--only-packs') onlyPacks = true;
    else if (['--root', '--with'].includes(flag) && args[i + 1] && !args[i + 1].startsWith('--')) {
      const value = args[++i];
      if (flag === '--root') root = value; else packs = value.split(',');
    } else throw new Error(`Usage: scaffold-baseline.mjs --root EXISTING_APP [--with ${supported.join(',')}] [--only-packs] [--dry-run]`);
  }
  if (!root) throw new Error('An existing app root is required');
  if (onlyPacks && !packs.length) throw new Error('--only-packs requires --with');
  if (packs.some(pack => !supported.includes(pack)) || new Set(packs).size !== packs.length) throw new Error('Unknown or duplicate capability pack');
  root = await realpath(root);
  if (!(await lstat(root)).isDirectory()) throw new Error('App root must be a directory');
  if (onlyPacks && packs.some(pack => ['updates', 'outbox', 'drafts', 'import-review', 'account-recovery', 'notification-preferences'].includes(pack))) {
    for (const part of ['src', 'src/lib', 'src/lib/asyncWork.ts']) {
      const info = await exists(join(root, part));
      if (!info || info.isSymbolicLink() || (part.endsWith('.ts') ? !info.isFile() : !info.isDirectory())) {
        throw new Error('Selected packs require the existing baseline src/lib/asyncWork.ts (no symlinks). Integrate the baseline first.');
      }
    }
  }
  const roots = [...(onlyPacks ? [] : [join(assets, 'app-baseline')]), ...packs.map(pack => join(assets, 'app-capabilities', pack))];
  const planned = [];
  for (const sourceRoot of roots) {
    for (const source of await files(join(sourceRoot, 'src'))) planned.push({ source, dest: join(root, relative(sourceRoot, source)) });
  }
  const destinations = new Set();
  for (const { dest } of planned) {
    if (destinations.has(dest)) throw new Error(`Duplicate destination: ${dest}`);
    destinations.add(dest);
    let cursor = root;
    for (const segment of relative(root, dirname(dest)).split(/[\\/]/)) {
      cursor = join(cursor, segment);
      const info = await exists(cursor);
      if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error(`Unsafe destination directory: ${cursor}`);
    }
    if (await exists(dest)) throw new Error(`Existing file preserved; merge manually: ${dest}`);
  }
  // Preflight all collisions before any writes. Exclusive creation still protects concurrent files.
  for (const { source, dest } of planned) {
    if (!dryRun) { await mkdir(dirname(dest), { recursive: true }); await writeFile(dest, await readFile(source), { flag: 'wx' }); }
    console.log(`${dryRun ? 'Would create' : 'Created'} ${relative(root, dest)}`);
  }
  console.log(`${planned.length} source files ${dryRun ? 'planned' : 'copied'}. No dependencies, routes, providers or external services were configured.`);
  console.log('Read assets/app-baseline/README.md and assets/app-capabilities/README.md before host integration.');
}
main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
