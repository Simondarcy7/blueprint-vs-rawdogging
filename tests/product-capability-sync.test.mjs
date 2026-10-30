import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import ts from 'typescript';
import { manifestName, productPacks, syncProductCapabilities } from '../scripts/sync-product-capabilities.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const assets = 'codex/skills/mature-app-starter/assets';
const sourceFile = `${assets}/app-capabilities/engagement/src/services/engagement/promptPolicy.ts`;
const consumerFile = 'services/engagement/promptPolicy.ts';
async function setup(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'product-capability-sync-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceRoot = join(root, 'canonical');
  await mkdir(join(sourceRoot, assets, 'app-baseline/src/lib'), { recursive: true });
  await cp(join(repo, assets, 'app-baseline/src/lib/asyncWork.ts'), join(sourceRoot, assets, 'app-baseline/src/lib/asyncWork.ts'));
  for (const pack of productPacks) await cp(join(repo, assets, 'app-capabilities', pack), join(sourceRoot, assets, 'app-capabilities', pack), { recursive: true });
  const target = join(root, 'consumer/src/foundation/blueprint');
  const run = (mode, destination = target) => syncProductCapabilities({ sourceRoot, target: destination, mode });
  return { root, sourceRoot, target, run };
}

test('dry-run is inert, first write records canonical hashes, and check verifies a standalone installed layout', async t => {
  const s = await setup(t);
  assert.equal((await s.run('dry-run')).status, 'planned');
  await assert.rejects(readFile(join(s.target, manifestName)), { code: 'ENOENT' });
  const first = await s.run('write'); assert.equal(first.status, 'written'); assert.equal(first.created.length, 5);
  const manifest = JSON.parse(await readFile(join(s.target, manifestName), 'utf8'));
  assert.deepEqual(manifest.packs, productPacks); assert.equal(manifest.source.kind, 'working-tree');
  assert.equal(manifest.source.gitRevision, null); assert.match(manifest.source.contentDigest, /^[a-f0-9]{64}$/);
  assert.equal(manifest.files[consumerFile].source, sourceFile);
  assert.deepEqual(await readFile(join(s.target, consumerFile)), await readFile(join(s.sourceRoot, sourceFile)));
  assert.equal((await s.run('check')).status, 'up-to-date'); assert.equal((await s.run('write')).status, 'up-to-date');
  const program = ts.createProgram(Object.keys(manifest.files).map(path => join(s.target, path)), {
    noEmit: true, strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true, types: [],
  });
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')), []);
  assert.ok(!(await readdir(s.target)).some(name => name.endsWith('.lock') || name.endsWith('.blueprint-tmp')));
});

test('one canonical source change is detected and adopted identically by two independent consumers', async t => {
  const s = await setup(t); const second = join(s.root, 'other-product/src/foundation/blueprint');
  await s.run('write'); await s.run('write', second);
  await writeFile(join(s.sourceRoot, sourceFile), (await readFile(join(s.sourceRoot, sourceFile), 'utf8')) + '\nexport const sharedFixRevision = 2;\n');
  for (const target of [s.target, second]) {
    await assert.rejects(s.run('check', target), /Capability drift/);
    const before = await readFile(join(target, consumerFile), 'utf8');
    assert.deepEqual((await s.run('dry-run', target)).updated, [consumerFile]);
    assert.equal(await readFile(join(target, consumerFile), 'utf8'), before);
    assert.deepEqual((await s.run('write', target)).updated, [consumerFile]);
    assert.equal((await import(pathToFileURL(join(target, consumerFile)))).sharedFixRevision, 2);
    assert.equal((await s.run('check', target)).status, 'up-to-date');
  }
  assert.deepEqual(await readFile(join(s.target, manifestName)), await readFile(join(second, manifestName)));
});

test('unknown files are never adopted or overwritten, even when their bytes match canonical source', async t => {
  const s = await setup(t);
  await mkdir(join(s.target, 'services/engagement'), { recursive: true });
  const content = await readFile(join(s.sourceRoot, sourceFile)); await writeFile(join(s.target, consumerFile), content);
  for (const mode of ['write', 'dry-run', 'check']) await assert.rejects(s.run(mode), /Unknown existing file preserved/);
  assert.deepEqual(await readFile(join(s.target, consumerFile)), content);
  await assert.rejects(readFile(join(s.target, 'lib/asyncWork.ts')), { code: 'ENOENT' });
});

test('all changes preflight before writes; local edits prevent even unrelated canonical updates', async t => {
  const s = await setup(t); await s.run('write');
  const helper = await readFile(join(s.target, 'lib/asyncWork.ts'), 'utf8');
  await writeFile(join(s.sourceRoot, assets, 'app-baseline/src/lib/asyncWork.ts'), helper + '\n// reviewed shared improvement\n');
  await writeFile(join(s.target, consumerFile), 'export const localCustomization = true;\n');
  const manifest = await readFile(join(s.target, manifestName));
  for (const mode of ['write', 'dry-run', 'check']) await assert.rejects(s.run(mode), /Locally modified capability preserved/);
  assert.equal(await readFile(join(s.target, 'lib/asyncWork.ts'), 'utf8'), helper);
  assert.deepEqual(await readFile(join(s.target, manifestName)), manifest);
});

test('locally deleted files and upstream removals require manual review', async t => {
  const s = await setup(t); await s.run('write');
  await rm(join(s.target, consumerFile)); await assert.rejects(s.run('write'), /Locally deleted capability preserved/);
  await cp(join(s.sourceRoot, sourceFile), join(s.target, consumerFile));
  await rm(join(s.sourceRoot, sourceFile)); await assert.rejects(s.run('write'), /Canonical file removed/);
  assert.ok((await readFile(join(s.target, consumerFile))).length);
});

test('symlink target ancestors, installed files and canonical sources are rejected', async t => {
  const s = await setup(t); const outside = join(s.root, 'outside'); await mkdir(outside);
  const alias = join(s.root, 'consumer-alias'); await symlink(outside, alias);
  await assert.rejects(s.run('write', join(alias, 'blueprint')), /Symlink path refused/); assert.deepEqual(await readdir(outside), []);
  await s.run('write'); const content = await readFile(join(s.target, consumerFile));
  await writeFile(join(outside, 'file.ts'), content); await rm(join(s.target, consumerFile));
  await symlink(join(outside, 'file.ts'), join(s.target, consumerFile));
  await assert.rejects(s.run('write'), /Symlink path refused/); assert.deepEqual(await readFile(join(outside, 'file.ts')), content);
  await rm(join(s.sourceRoot, sourceFile)); await symlink(join(outside, 'file.ts'), join(s.sourceRoot, sourceFile));
  await assert.rejects(s.run('dry-run'), /Source symlink refused|Symlink path refused/);
});

test('malformed, traversal and tampered manifests fail before any writes', async t => {
  const s = await setup(t); await s.run('write'); const manifest = await readFile(join(s.target, manifestName), 'utf8');
  for (const content of ['{broken', JSON.stringify({ version: 99 }), JSON.stringify({ ...JSON.parse(manifest), files: { '../../elsewhere': { source: sourceFile, sha256: 'a'.repeat(64) } } }), manifest.replace(/"sha256": "[a-f0-9]{64}"/, '"sha256": "' + '0'.repeat(64) + '"')]) {
    await writeFile(join(s.target, manifestName), content);
    await assert.rejects(s.run('write'));
    assert.equal(await readFile(join(s.target, manifestName), 'utf8'), content);
  }
});

test('an existing sync lock blocks writes and is not removed by a competing invocation', async t => {
  const s = await setup(t); await s.run('write');
  await writeFile(join(s.sourceRoot, sourceFile), (await readFile(join(s.sourceRoot, sourceFile), 'utf8')) + '\n// update\n');
  const lock = join(s.target, '.blueprint-product-capabilities.lock'); await writeFile(lock, 'other invocation');
  const before = await readFile(join(s.target, consumerFile));
  await assert.rejects(s.run('write'), { code: 'EEXIST' });
  assert.equal(await readFile(lock, 'utf8'), 'other invocation'); assert.deepEqual(await readFile(join(s.target, consumerFile)), before);
});

test('CLI requires exactly one explicit mode and never writes on malformed arguments', async t => {
  const s = await setup(t); const script = join(repo, 'scripts/sync-product-capabilities.mjs');
  for (const args of [[], ['--target', s.target], ['--target', s.target, '--write', '--check'], ['--target', s.target, '--force'], ['--target', s.target, '--target', s.target, '--write']]) {
    const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' }); assert.notEqual(result.status, 0);
  }
  await assert.rejects(readFile(join(s.target, manifestName)), { code: 'ENOENT' });
});

test('app-shell bundle keeps a separate manifest and protects UI and workflow source from drift', async t => {
  const s = await setup(t);
  const packs = ['product-ui', 'product-workflows', 'account-recovery', 'notification-preferences', 'undo'];
  const destinations = ['components/product-ui/Screen.tsx', 'modules/product-workflows/Settings.tsx', 'services/account-recovery/accountRecovery.ts', 'services/notification-preferences/notificationPreferences.ts', 'services/undo/undoController.ts'];
  for (let i = 0; i < packs.length; i++) {
    const path = join(s.sourceRoot, assets, 'app-capabilities', packs[i], 'src', destinations[i]);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, 'export const value = 1;\n');
  }
  const run = mode => syncProductCapabilities({ sourceRoot: s.sourceRoot, target: s.target, mode, bundle: 'app-shell' });
  assert.equal((await run('dry-run')).created.length, 6);
  await run('write');
  const manifest = JSON.parse(await readFile(join(s.target, '.blueprint-app-shell.json'), 'utf8'));
  assert.deepEqual(manifest.packs, packs);
  assert.equal((await run('check')).status, 'up-to-date');
  await assert.rejects(readFile(join(s.target, manifestName)), { code: 'ENOENT' });
  await writeFile(join(s.target, destinations[0]), 'export const local = true;\n');
  await assert.rejects(run('write'), /Locally modified/);
  await assert.rejects(syncProductCapabilities({ target: s.target, mode: 'write', bundle: 'unknown' }), /Unknown capability bundle/);
});
