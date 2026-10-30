import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import ts from 'typescript';
import { verifyArchitecture } from '../templates/scripts/verify-architecture.mjs';
import { verifyAccessibility } from '../templates/scripts/verify-accessibility.mjs';
import { verifyPerformance } from '../templates/scripts/verify-performance.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const scaffold = join(repo, 'codex/skills/mature-app-starter/scripts/scaffold-baseline.mjs');
const run = (root, ...args) => spawnSync(process.execPath, [scaffold, '--root', root, ...args], { encoding: 'utf8' });
async function temp(t) { const root = await mkdtemp(join(tmpdir(), 'portable-tools-')); t.after(() => rm(root, { recursive: true, force: true })); return root; }
async function put(root, path, value) { const file = join(root, path); await mkdir(join(file, '..'), { recursive: true }); await writeFile(file, value); }
async function fixture(root) {
  await put(root, 'tsconfig.json', JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['src/*'] }, moduleResolution: 'bundler', module: 'esnext', jsx: 'react-jsx' } }));
  await put(root, 'src/modules/home/index.ts', 'export { value } from "./private";');
  await put(root, 'src/modules/home/private.ts', 'export const value = 1;');
  await put(root, 'src/app/index.tsx', 'export { value as default } from "@/modules/home";');
}

test('scaffold dry run is inert; selected packs copy without dependencies or routes', async t => {
  const root = await temp(t);
  const args = ['--with', 'storage,device,flags,diagnostics,updates,outbox,drafts,import-review,interactions,engagement,account-recovery,notification-preferences,undo,product-ui,product-workflows'];
  assert.equal(run(root, ...args, '--dry-run').status, 0); assert.deepEqual(await readdir(root), []);
  const result = run(root, ...args); assert.equal(result.status, 0, result.stderr);
  for (const path of ['src/services/storage/backup.ts', 'src/services/device/actions.ts', 'src/services/features/featureStore.ts', 'src/services/observability/safeTelemetry.ts', 'src/components/ui/primitives.tsx', 'src/modules/settings/index.ts']) assert.ok((await readFile(join(root, path), 'utf8')).length);
  assert.deepEqual(await readdir(root), ['src']);
  assert.ok(!(await readdir(join(root, 'src'))).includes('app'));
});
test('scaffold preflights every collision before copying anything', async t => {
  const root = await temp(t); const sentinel = 'src/services/seo/routePolicy.ts'; await put(root, sentinel, 'user work');
  const result = run(root); assert.notEqual(result.status, 0); assert.match(result.stderr, /Existing file preserved/);
  assert.deepEqual(await readdir(join(root, 'src')), ['services']); assert.equal(await readFile(join(root, sentinel), 'utf8'), 'user work');
});
test('scaffold rejects unknown packs, traversal, duplicate options and symlink directories', async t => {
  const root = await temp(t); const outside = await temp(t);
  for (const args of [['--with', '../outside'], ['--with', 'storage,storage'], ['--root', root], ['--unknown']]) assert.notEqual(run(root, ...args).status, 0);
  assert.deepEqual(await readdir(root), []); await symlink(outside, join(root, 'src'));
  assert.notEqual(run(root).status, 0); assert.deepEqual(await readdir(outside), []);
});
test('architecture resolves aliases and relative paths and catches private imports and env access', async t => {
  const root = await temp(t); await fixture(root); assert.deepEqual(await verifyArchitecture(root, ts), []);
  await put(root, 'src/services/invalid.ts', 'import { value } from "../modules/home/private"; export const secret = process["env"]["KEY"];');
  await put(root, 'src/config/invalid.ts', 'export { value } from "@/modules/home";');
  await put(root, 'src/app/invalid.tsx', 'export default function Screen() { return null; }');
  const issues = (await verifyArchitecture(root, ts)).join('\n');
  for (const pattern of [/public index/, /Environment access/, /Foundation\/config/, /Route implementation/]) assert.match(issues, pattern);
});
test('architecture ignores comment text, allows the Expo compiler constant and examines re-exports', async t => {
  const root = await temp(t); await fixture(root);
  await put(root, 'src/services/ok.ts', '// process.env.SECRET\nexport const server = process.env.EXPO_SERVER;');
  assert.deepEqual(await verifyArchitecture(root, ts), []);
  await put(root, 'src/services/bad.ts', 'export { value } from "@/modules/home/private";');
  assert.match((await verifyArchitecture(root, ts)).join('\n'), /public index/);
});
test('accessibility guard checks actual JSX and does not claim render coverage', async t => {
  const root = await temp(t);
  await put(root, 'src/Controls.tsx', 'const x = <View><Pressable /><TextInput /><Image /><Text allowFontScaling={false}>Text</Text></View>;');
  const issues = await verifyAccessibility(root, ts); assert.equal(issues.length, 5);
  await put(root, 'src/Controls.tsx', 'const x = <View><Pressable accessibilityRole="button" /><TextInput accessibilityLabel="Name" /><Image accessible={false} /></View>;');
  assert.deepEqual(await verifyAccessibility(root, ts), []);
});
test('performance checks reject missing output, unset budgets and oversized assets', async t => {
  const root = await temp(t); const limits = { totalJavaScriptGzipBytes: 10000, totalFontBytes: 100, maxImageBytes: 100 };
  assert.ok((await verifyPerformance(root, limits)).issues.length);
  await assert.rejects(verifyPerformance(root, { ...limits, maxImageBytes: null }));
  await put(root, 'index.html', '<html></html>'); await put(root, 'app.js', 'console.log("hello")');
  assert.deepEqual((await verifyPerformance(root, limits)).issues, []);
  await put(root, 'hero.png', 'x'.repeat(101)); await put(root, 'font.woff2', 'x'.repeat(101));
  const result = await verifyPerformance(root, limits); assert.equal(result.issues.length, 2);
});
test('all scaffolded modules satisfy the architecture and static accessibility recipes', async t => {
  const root = await temp(t); await fixture(root);
  const result = run(root, '--with', 'storage,device,flags,diagnostics,updates,outbox,drafts,import-review,interactions,engagement,account-recovery,notification-preferences,undo,product-ui,product-workflows'); assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await verifyArchitecture(root, ts), []);
  assert.deepEqual(await verifyAccessibility(root, ts), []);
});
