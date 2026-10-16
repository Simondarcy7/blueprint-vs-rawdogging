import { lstat, readFile, readdir } from 'node:fs/promises';
import { resolve, join, relative, basename } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const errors = [];
async function info(path) {
  try { return await lstat(path); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
async function requireFile(path) {
  const stat = await info(join(root, path));
  if (!stat?.isFile()) errors.push(`Missing regular file: ${path}`);
}
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) errors.push(`Route tree must not contain symlinks: ${relative(root, path)}`);
    else if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

async function main() {
  let pkg = {};
  try { pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')); }
  catch { errors.push('package.json is missing or invalid JSON.'); }
  for (const dependency of ['expo', 'expo-router', 'react', 'react-native']) {
    if (!pkg.dependencies?.[dependency]) errors.push(`Missing runtime dependency: ${dependency}`);
  }
  if (!(pkg.devDependencies?.typescript || pkg.dependencies?.typescript)) errors.push('Missing TypeScript dependency.');
  if (pkg.main !== 'expo-router/entry') errors.push('package.json main must be expo-router/entry (custom entry requires an approved exception and adapted check).');
  if (pkg.dependencies?.vite || pkg.devDependencies?.vite || pkg.dependencies?.next || pkg.devDependencies?.next) {
    errors.push('Alternative app framework detected; separate or explicitly approve it.');
  }
  for (const file of ['BLUEPRINT.md', 'tsconfig.json', 'src/app/_layout.tsx', 'docs/project-index.md', 'docs/app-quality-contract.md']) await requireFile(file);
  for (const path of ['app', 'src/features', 'App.tsx', 'App.js']) {
    if (await info(join(root, path))) errors.push(`Conflicting default architecture: ${path}`);
  }
  const routes = await info(join(root, 'src/app'));
  if (routes?.isDirectory() && !routes.isSymbolicLink()) {
    const files = await walk(join(root, 'src/app'));
    for (const path of files) {
      const name = relative(join(root, 'src/app'), path).replaceAll('\\', '/');
      if (/(^|\/)(?:__tests__|components|hooks|store|helpers|services)\//.test(name)
          || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(name)
          || /\.(?:md|json)$/.test(name)) errors.push(`Non-route content in route tree: ${name}`);
    }
    if (!files.some((path) => /\.[jt]sx?$/.test(path) && !/^(?:_|\+)/.test(basename(path)) && !path.endsWith('.d.ts'))) {
      errors.push('src/app needs at least one ordinary route in addition to layouts/special files.');
    }
  } else errors.push('src/app must be a regular directory.');
  const moduleRoot = join(root, 'src/modules');
  const modules = await info(moduleRoot);
  if (modules?.isDirectory() && !modules.isSymbolicLink()) {
    let count = 0;
    for (const entry of await readdir(moduleRoot, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) errors.push(`Module must not be a symlink: ${entry.name}`);
      if (!entry.isDirectory()) continue;
      count++;
      await requireFile(`src/modules/${entry.name}/index.ts`);
    }
    if (!count) errors.push('src/modules needs at least one product module.');
  } else errors.push('src/modules must be a regular directory.');
  if (errors.length) throw new Error(errors.map((message) => `- ${message}`).join('\n'));
  console.log('Blueprint structural checks passed. Manual architecture, behavior and quality checks still required.');
}
main().catch((error) => {
  console.error(`Blueprint structural checks failed:\n${error.message}`);
  process.exitCode = 1;
});
