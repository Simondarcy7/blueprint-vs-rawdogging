import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../codex/skills/mature-app-starter/scripts/create-feature.mjs', import.meta.url));
const run = (root, ...args) => spawnSync(process.execPath, [script, '--root', root, ...args], { encoding: 'utf8' });

async function project(t) {
  const root = await mkdtemp(join(tmpdir(), 'feature-scaffold-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('creates both supported layouts with a matching public type export', async (t) => {
  const root = await project(t);
  for (const layout of ['features', 'modules']) {
    const result = run(root, '--name', 'saved-items', '--layout', layout);
    assert.equal(result.status, 0, result.stderr);
    const dir = join(root, 'src', layout, 'saved-items');
    assert.deepEqual((await readdir(dir)).sort(), ['README.md', 'index.ts', 'types.ts']);
    assert.match(await readFile(join(dir, 'index.ts'), 'utf8'), /export type \{ SavedItemsState \} from '\.\/types'/);
    assert.match(await readFile(join(dir, 'types.ts'), 'utf8'), /export type SavedItemsState/);
  }
});

test('refuses an existing feature and preserves user files', async (t) => {
  const root = await project(t);
  assert.equal(run(root, '--name', 'editor').status, 0);
  const file = join(root, 'src', 'features', 'editor', 'types.ts');
  await writeFile(file, 'user-owned content');
  assert.notEqual(run(root, '--name', 'editor').status, 0);
  assert.equal(await readFile(file, 'utf8'), 'user-owned content');
});

test('rejects traversal, invalid layout and malformed arguments before writing', async (t) => {
  const root = await project(t);
  for (const args of [[], ['--name', '../escape'], ['--name', 'Bad Name'], ['--name', 'ok', '--layout', '../out'], ['--name', 'ok', '--unknown', 'value'], ['--name']]) {
    assert.notEqual(run(root, ...args).status, 0);
    assert.deepEqual(await readdir(root), []);
  }
});

test('refuses a symlinked source directory without writing outside the project', async (t) => {
  const root = await project(t);
  const outside = await project(t);
  await symlink(outside, join(root, 'src'), 'dir');
  assert.notEqual(run(root, '--name', 'editor').status, 0);
  assert.deepEqual(await readdir(outside), []);
});

test('rejects a missing project root', async (t) => {
  const root = await project(t);
  assert.notEqual(run(join(root, 'missing'), '--name', 'editor').status, 0);
  assert.deepEqual(await readdir(root), []);
});
