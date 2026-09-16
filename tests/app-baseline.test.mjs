import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createPreferencesStore, defaultPreferences, parsePreferences, resolveAppearance, reduceMotion } from '../codex/skills/mature-app-starter/assets/app-baseline/src/modules/settings/preferences.ts';
import { createNotificationController, unavailableNotifications } from '../codex/skills/mature-app-starter/assets/app-baseline/src/modules/notifications/controller.ts';
import { pageMetadata, sitemapUrls } from '../codex/skills/mature-app-starter/assets/app-baseline/src/services/seo/routePolicy.ts';

function storage(initial = null) {
  let raw = initial;
  return { read: async () => raw, write: async value => { raw = value; }, raw: () => raw };
}

test('preferences persist explicit appearance and respect OS reduced motion', async () => {
  const adapter = storage();
  const store = createPreferencesStore(adapter);
  await store.load();
  await store.update({ appearance: 'dark' });
  const nextLaunch = createPreferencesStore(adapter);
  const value = await nextLaunch.load();
  assert.equal(resolveAppearance(value, 'light'), 'dark');
  assert.equal(resolveAppearance(defaultPreferences, 'dark'), 'dark');
  assert.equal(reduceMotion(value, true), true);
  assert.equal(reduceMotion({ ...value, motion: 'reduced' }, false), true);
});

test('overlapping preference updates are serialized and preserve both changes', async () => {
  const adapter = storage();
  const store = createPreferencesStore(adapter);
  await store.load();
  await Promise.all([store.update({ appearance: 'dark' }), store.update({ motion: 'reduced' })]);
  assert.deepEqual(JSON.parse(adapter.raw()), { version: 1, appearance: 'dark', motion: 'reduced' });
});

test('failed writes leave confirmed settings intact and a later retry succeeds', async () => {
  const adapter = storage();
  let fail = true;
  const store = createPreferencesStore({ ...adapter, write: async value => {
    if (fail) throw new Error('Storage unavailable');
    await adapter.write(value);
  } });
  await store.load();
  await assert.rejects(store.update({ appearance: 'dark' }));
  assert.equal(store.current().appearance, 'system');
  assert.equal(adapter.raw(), null);
  fail = false;
  await store.update({ appearance: 'dark' });
  assert.equal(store.current().appearance, 'dark');
});

test('corrupt and future-version settings are preserved; edits cannot overwrite failed hydration', async () => {
  for (const raw of ['broken', '{"version":2}', '{"version":1,"appearance":["system"],"motion":"system"}']) {
    const adapter = storage(raw);
    const store = createPreferencesStore(adapter);
    await assert.rejects(store.load());
    await assert.rejects(store.update({ appearance: 'light' }));
    assert.equal(adapter.raw(), raw);
  }
  assert.throws(() => parsePreferences('{"version":1,"appearance":"unknown","motion":"system"}'));
});

function notifications(permission = 'undetermined') {
  let enabled = false;
  const calls = { prompts: 0, writes: 0 };
  return { calls,
    getPermission: async () => permission,
    requestPermission: async () => { calls.prompts++; permission = 'granted'; return permission; },
    readEnabled: async () => enabled,
    setEnabled: async next => { calls.writes++; enabled = next; },
    revoke: () => { permission = 'denied'; },
  };
}

test('refresh never prompts, duplicate enable actions share one operation, revocation is visible', async () => {
  const adapter = notifications();
  const controller = createNotificationController(adapter);
  await controller.refresh();
  assert.equal(adapter.calls.prompts, 0);
  const first = controller.setEnabled(true);
  assert.equal(controller.current().status, 'pending');
  const second = controller.setEnabled(true);
  assert.equal(first, second);
  assert.equal((await first).enabled, true);
  assert.deepEqual(adapter.calls, { prompts: 1, writes: 1 });
  adapter.revoke();
  const revoked = await controller.refresh();
  assert.equal(revoked.permission, 'denied');
  await controller.setEnabled(false);
  assert.equal(controller.current().enabled, false);
});

test('denied and unavailable notifications do not claim enablement', async () => {
  for (const adapter of [notifications('denied'), unavailableNotifications]) {
    const controller = createNotificationController(adapter);
    const value = await controller.setEnabled(true);
    assert.equal(value.enabled, false);
    assert.notEqual(value.permission, 'granted');
  }
});

test('notification adapter failures become actionable state, and retry recovers', async () => {
  const adapter = notifications('granted');
  let fail = true;
  const controller = createNotificationController({ ...adapter, setEnabled: async next => {
    if (fail) throw new Error('Delivery registration unavailable');
    await adapter.setEnabled(next);
  } });
  assert.equal((await controller.setEnabled(true)).status, 'error');
  assert.equal(controller.current().enabled, false);
  fail = false;
  assert.equal((await controller.setEnabled(true)).enabled, true);
});

const policy = { productionOrigin: 'https://example.com', environment: 'production', pages: [
  { path: '/', title: 'Example', description: 'A useful app' },
  { path: '/help', title: 'Help', description: 'Get help' },
] };
test('SEO uses an explicit public allowlist and excludes preview environments', () => {
  assert.deepEqual(sitemapUrls(policy), ['https://example.com/', 'https://example.com/help']);
  assert.equal(pageMetadata(policy, '/help').canonical, 'https://example.com/help');
  assert.deepEqual(pageMetadata(policy, '/account'), { robots: 'noindex, nofollow' });
  for (const environment of ['preview', 'development']) {
    assert.deepEqual(sitemapUrls({ ...policy, environment }), []);
    assert.deepEqual(pageMetadata({ ...policy, environment }, '/'), { robots: 'noindex, nofollow' });
  }
});
test('SEO rejects token-bearing or ambiguous paths and invalid origins', () => {
  for (const path of ['/auth?token=secret', '//outside.example', '/../private', '/a%2fb', '/a#token', '/a\\b']) {
    assert.throws(() => sitemapUrls({ ...policy, pages: [{ ...policy.pages[0], path }] }));
  }
  for (const productionOrigin of ['http://example.com', 'https://user:secret@example.com', 'https://example.com/subpath']) {
    assert.throws(() => sitemapUrls({ ...policy, productionOrigin }));
  }
});

test('public baseline references remain in sync with installed skill copies', async () => {
  for (const name of ['generic-app-baseline', 'quality-foundation']) {
    assert.equal(await readFile(new URL(`../docs/${name}.md`, import.meta.url), 'utf8'),
      await readFile(new URL(`../codex/skills/mature-app-starter/references/${name}.md`, import.meta.url), 'utf8'));
  }
  assert.equal(await readFile(new URL('../BLUEPRINT.md', import.meta.url), 'utf8'),
    await readFile(new URL('../codex/skills/mature-app-starter/references/required-blueprint.md', import.meta.url), 'utf8'));
});
