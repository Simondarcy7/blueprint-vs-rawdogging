import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const repo = fileURLToPath(new URL('../', import.meta.url));
const script = join(repo, 'scripts/create-app.mjs');
const run = args => spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf8' });
for (const agent of ['codex', 'claude', 'both']) test(`creates a self-contained ${agent} app without copying local build output`, async t => {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-create-test-')); t.after(() => rm(root, { recursive: true, force: true })); const target = join(root, 'new-app');
  const result = run(['--target', target, '--name', 'new-app', '--agent', agent, '--skip-install']); assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(await readFile(join(target, 'brand.json'))).name, 'New App');
  const pkg = JSON.parse(await readFile(join(target, 'package.json'))); assert.equal(pkg.name, 'new-app'); assert.equal(pkg.main, 'expo-router/entry');
  const lock = JSON.parse(await readFile(join(target, 'package-lock.json'))); assert.equal(lock.packages[''].name, 'new-app');
  const entries = await readdir(target); for (const excluded of ['node_modules', 'dist', 'dist-native', '.expo', '.env']) assert.ok(!entries.includes(excluded));
  assert.ok(entries.includes('blueprint-version.json')); assert.ok(entries.includes('.github'));
  const verify = spawnSync(process.execPath, ['scripts/verify-blueprint.mjs'], { cwd: target, encoding: 'utf8' }); assert.equal(verify.status, 0, verify.stdout + verify.stderr);
});
test('rejects existing destinations and invalid names without modifying existing work', async t => {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-create-existing-')); t.after(() => rm(root, { recursive: true, force: true })); await writeFile(join(root, 'keep.txt'), 'user work');
  assert.notEqual(run(['--target', root, '--name', 'valid', '--skip-install']).status, 0); assert.equal(await readFile(join(root, 'keep.txt'), 'utf8'), 'user work');
  assert.notEqual(run(['--target', join(root, 'bad'), '--name', '../bad', '--skip-install']).status, 0); assert.deepEqual(await readdir(root), ['keep.txt']);
});
