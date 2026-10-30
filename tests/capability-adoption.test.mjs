import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, mkdir, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { test } from 'node:test';

const repo = fileURLToPath(new URL('../', import.meta.url));
const run = (args, cwd = repo) => spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
test('new packs install into a generated app without replacing its baseline and typecheck in place', async t => {
  const parent = await mkdtemp(join(tmpdir(), 'blueprint-adoption-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const app = join(parent, 'reading-journal');
  const creation = run(['scripts/create-app.mjs', '--target', app, '--name', 'reading-journal', '--agent', 'codex', '--skip-install']);
  assert.equal(creation.status, 0, creation.stderr);
  const original = await readFile(join(app, 'src/lib/asyncWork.ts'), 'utf8');
  const brand = await readFile(join(app, 'brand.json'), 'utf8');
  const script = '.agents/skills/mature-app-starter/scripts/scaffold-baseline.mjs';
  const args = [script, '--root', '.', '--with', 'updates,diagnostics,outbox,drafts,import-review,interactions,engagement,account-recovery,notification-preferences,undo', '--only-packs'];
  const preview = run([...args, '--dry-run'], app); assert.equal(preview.status, 0, preview.stderr);
  assert.ok(!(await readdir(join(app, 'src/services'))).includes('outbox'));
  const installed = run(args, app); assert.equal(installed.status, 0, installed.stderr);
  assert.equal(await readFile(join(app, 'src/lib/asyncWork.ts'), 'utf8'), original);
  assert.equal(await readFile(join(app, 'brand.json'), 'utf8'), brand);
  const types = run([join(repo, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--allowImportingTsExtensions', '--lib', 'ES2023,DOM',
    'src/services/updates/launchUpdate.ts', 'src/services/updates/expoAdapter.ts',
    'src/services/outbox/durableOutbox.ts', 'src/services/analytics/analyticsClient.ts',
    'src/services/observability/sentryReporter.ts', 'src/services/drafts/draftController.ts',
    'src/services/import-review/importReview.ts', 'src/services/interactions/overlayFocus.ts',
    'src/services/engagement/promptPolicy.ts',
    ...(await readdir(join(app, 'src/services/account-recovery'))).filter(name => name.endsWith('.ts')).map(name => `src/services/account-recovery/${name}`),
    ...(await readdir(join(app, 'src/services/notification-preferences'))).filter(name => name.endsWith('.ts')).map(name => `src/services/notification-preferences/${name}`),
    ...(await readdir(join(app, 'src/services/undo'))).filter(name => name.endsWith('.ts')).map(name => `src/services/undo/${name}`)], app);
  assert.equal(types.status, 0, types.stdout + types.stderr);
  const second = run(args, app); assert.notEqual(second.status, 0); assert.match(second.stderr, /Existing file preserved/);
});

test('pack-only mode rejects absent baseline dependencies and missing pack selection before writes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-missing-baseline-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const script = 'codex/skills/mature-app-starter/scripts/scaffold-baseline.mjs';
  for (const args of [['--only-packs'], ...['outbox', 'updates', 'drafts', 'import-review', 'account-recovery', 'notification-preferences'].map(pack => ['--with', pack, '--only-packs'])]) {
    const result = run([script, '--root', root, ...args]); assert.notEqual(result.status, 0);
    assert.deepEqual(await readdir(root), []);
  }
});

test('product workflow reference typechecks and emits runnable browser modules from the capability source', () => {
  const result = run(['scripts/serve-product-workflows.mjs', '--check']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('interrupting the npm example removes its temporary build and releases its server', { skip: process.platform === 'win32', timeout: 20_000 }, async t => {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn('npm', ['run', 'example:ux', '--', '--port', String(port)], {
    cwd: repo, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const closed = once(child, 'close');
  let temporary;
  t.after(async () => {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already stopped. */ }
    if (temporary) await rm(temporary, { recursive: true, force: true });
  });
  const transcript = await new Promise((resolve, reject) => {
    let output = '';
    child.once('error', reject);
    child.once('exit', () => reject(new Error(`Example exited before readiness: ${output}`)));
    const collect = chunk => {
      output += chunk.toString();
      if (output.includes('Ctrl+C stops')) resolve(output);
    };
    child.stdout.on('data', collect); child.stderr.on('data', collect);
  });
  temporary = transcript.match(/Temporary build: (.+)/)?.[1];
  assert.ok(temporary?.startsWith(join(tmpdir(), 'blueprint-workflows-')), transcript);
  assert.ok((await readdir(temporary)).includes('web'));
  // Match Ctrl+C to the npm process group, including npm's signal forwarding.
  process.kill(-child.pid, 'SIGINT');
  await closed;
  await assert.rejects(readdir(temporary), { code: 'ENOENT' });
  const reused = createServer(); reused.listen(port, '127.0.0.1');
  await once(reused, 'listening'); await new Promise(resolve => reused.close(resolve));
});

test('pack-only mode rejects a symlinked shared helper without copying files', async t => {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-helper-link-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/lib'), { recursive: true });
  await writeFile(join(root, 'helper.ts'), 'export const marker = true;');
  await symlink(join(root, 'helper.ts'), join(root, 'src/lib/asyncWork.ts'));
  const result = run(['codex/skills/mature-app-starter/scripts/scaffold-baseline.mjs', '--root', root, '--with', 'outbox', '--only-packs']);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /no symlinks/);
  assert.deepEqual(await readdir(join(root, 'src')), ['lib']);
});
