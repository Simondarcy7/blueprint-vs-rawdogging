import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repo = fileURLToPath(new URL('../', import.meta.url));
const script = join(repo, 'templates/scripts/verify-blueprint.mjs');
const run = (root) => spawnSync(process.execPath, [script, root], { encoding: 'utf8' });
async function temp(t) {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function put(root, path, content) {
  const file = join(root, path);
  await mkdir(join(file, '..'), { recursive: true });
  await writeFile(file, content);
}
async function fixture(root) {
  await put(root, 'package.json', JSON.stringify({
    main: 'expo-router/entry', dependencies: { expo: '*', 'expo-router': '*', react: '*', 'react-native': '*' }, devDependencies: { typescript: '*' },
  }));
  for (const file of ['BLUEPRINT.md', 'docs/project-index.md', 'docs/app-quality-contract.md', 'tsconfig.json', 'src/app/_layout.tsx', 'src/app/(tabs)/index.tsx', 'src/modules/home/index.ts']) {
    await put(root, file, file.endsWith('.json') ? '{}' : '// structural fixture only\n');
  }
}

test('structural fixture passes, but this does not imply a runnable app', async (t) => {
  const root = await temp(t); await fixture(root);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Manual architecture, behavior and quality checks still required/);
});

test('empty and missing foundations fail rather than claiming setup is complete', async (t) => {
  const root = await temp(t);
  assert.notEqual(run(root).status, 0);
  await fixture(root);
  await rm(join(root, 'src/app/(tabs)/index.tsx'));
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ordinary route/);
});

test('rejects competing roots, missing public APIs and tests in the route tree', async (t) => {
  const root = await temp(t); await fixture(root);
  await mkdir(join(root, 'src/features'));
  await put(root, 'src/app/home.test.tsx', '');
  await rm(join(root, 'src/modules/home/index.ts'));
  const result = run(root);
  assert.notEqual(result.status, 0);
  for (const pattern of [/src\/features/, /home.test.tsx/, /home\/index.ts/]) assert.match(result.stderr, pattern);
});

test('rejects framework substitution and incorrect entrypoints', async (t) => {
  const root = await temp(t); await fixture(root);
  await put(root, 'package.json', JSON.stringify({ main: 'index.js', dependencies: { vite: '*' } }));
  const result = run(root);
  assert.notEqual(result.status, 0);
  for (const pattern of [/Missing runtime dependency: expo/, /Missing TypeScript/, /main must be/, /Alternative app framework/]) assert.match(result.stderr, pattern);
});

for (const agent of ['codex', 'claude', 'both']) {
  for (const docs of [true, false]) {
    test(`installer ${agent}, docs=${docs}: contract, modules, no-docs, preservation and explicit force`, async (t) => {
      const root = await temp(t);
      const target = join(root, 'new-app');
      const args = [join(repo, 'install.sh'), '--target', target, '--agent', agent, ...(docs ? [] : ['--no-docs'])];
      let result = spawnSync('bash', [...args, '--dry-run'], { cwd: repo, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(await readdir(root), []);
      result = spawnSync('bash', args, { cwd: repo, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      for (const file of ['BLUEPRINT.md', 'docs/project-index.md', 'docs/app-quality-contract.md', 'scripts/verify-blueprint.mjs']) {
        assert.ok((await readFile(join(target, file), 'utf8')).length);
      }
      assert.ok(!(await readdir(join(target, 'src'))).includes('features'));
      const verifier = spawnSync(process.execPath, ['scripts/verify-blueprint.mjs'], { cwd: target, encoding: 'utf8' });
      assert.notEqual(verifier.status, 0, 'Instruction-only installation must not pass');
      for (const flavor of agent === 'both' ? ['codex', 'claude'] : [agent]) {
        const name = flavor === 'codex' ? 'AGENTS.md' : 'CLAUDE.md';
        const prefix = flavor === 'codex' ? '.agents' : '.claude';
        assert.match(await readFile(join(target, name), 'utf8'), /Read `BLUEPRINT.md` first/);
        assert.match(await readFile(join(target, 'src/modules', name), 'utf8'), /Product modules are required/);
        assert.equal(await readFile(join(target, prefix, 'skills/mature-app-starter/references/required-blueprint.md'), 'utf8'), await readFile(join(repo, 'BLUEPRINT.md'), 'utf8'));
      }
      assert.equal((await readdir(join(target, 'docs'))).includes('foundation'), docs);
      const sentinel = join(target, 'BLUEPRINT.md');
      await writeFile(sentinel, 'existing project instructions');
      spawnSync('bash', args, { cwd: repo, encoding: 'utf8' });
      assert.equal(await readFile(sentinel, 'utf8'), 'existing project instructions');
      result = spawnSync('bash', [...args, '--force'], { cwd: repo, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(await readFile(sentinel, 'utf8'), await readFile(join(repo, 'BLUEPRINT.md'), 'utf8'));
    });
  }
}
