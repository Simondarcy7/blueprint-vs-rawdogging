import { test, expect } from '@playwright/test';
import brand from '../brand.json';
import AxeBuilder from '@axe-core/playwright';
test('create, persist, search, edit and delete a note', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Capture a thought' }).click();
  await page.getByRole('button', { name: 'Save note', exact: true }).click(); await expect(page.getByText('Give your note a title.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('A useful idea'); await page.getByRole('textbox', { name: 'Note', exact: true }).fill('Remember this tomorrow.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click(); await expect(page.getByRole('link', { name: 'Open note: A useful idea' })).toBeVisible();
  await page.reload(); await page.getByRole('textbox', { name: 'Search notes' }).fill('missing'); await expect(page.getByText('No matching notes')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click(); await page.getByRole('link', { name: 'Open note: A useful idea' }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Changed idea'); await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByRole('link', { name: 'Open note: Changed idea' }).click(); await page.getByRole('button', { name: 'Delete note', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently' }).click(); await expect(page.getByRole('main').getByText('A fresh page')).toBeVisible(); await page.reload(); await expect(page.getByRole('main').getByText('A fresh page')).toBeVisible();
});
test('unsaved navigation requires a decision and Escape restores focus', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Capture a thought' }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Unsaved'); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('Discard changes?', { exact: true })).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Unsaved');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await page.getByRole('button', { name: 'Discard changes', exact: true }).click(); await expect(page.getByRole('button', { name: 'Capture a thought' })).toBeVisible();
});
test('appearance persists and explicit choice wins over system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' }); await page.goto('/settings');
  await page.getByRole('radio', { name: 'Dark', exact: true }).click(); await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('shell.preferences.v1') ?? '{}').appearance)).toBe('dark');
  await page.reload(); await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await page.emulateMedia({ colorScheme: 'light' }); await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'System', exact: true }).click(); await page.emulateMedia({ colorScheme: 'dark' }); await expect(page.getByRole('radio', { name: 'System', exact: true })).toBeChecked(); await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background').trim())).toBe(brand.dark.background); await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', brand.dark.background);
});
test('corrupt storage is preserved and public help remains available', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('shell.notes.v1', '{broken')); await page.goto('/notes');
  await expect(page.getByText('Your notes couldn’t be loaded')).toBeVisible(); await page.getByRole('button', { name: 'Retry loading' }).click();
  expect(await page.evaluate(() => localStorage.getItem('shell.notes.v1'))).toBe('{broken');
  await page.goto('/support'); await expect(page.getByText('About your space')).toBeVisible();
});
test('save failure keeps the draft and does not claim success', async ({ page }) => {
  await page.addInitScript(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'shell.notes.v1') throw new DOMException('Quota', 'QuotaExceededError'); return original.call(this, key, value); }; });
  await page.goto('/note/new'); await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Keep me'); await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.getByText('Your note could not be saved.', { exact: false })).toBeVisible(); await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Keep me');
});
test('accessible pages, no horizontal overflow and real 404', async ({ page }) => {
  for (const route of ['/', '/notes', '/settings', '/note/new', '/support']) {
    await page.goto(route); await expect(page.getByRole('main')).toBeVisible(); await page.getByRole('main').getByRole('heading').first().waitFor();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  const response = await page.goto('/does-not-exist'); expect(response?.status()).toBe(404); await expect(page.getByText('Page not found', { exact: true })).toBeVisible();
});

test('keyboard appearance selection and loaded-page offline saving', async ({ page, context }) => {
  await page.goto('/settings'); const system = page.getByRole('radio', { name: 'System', exact: true }); await system.focus(); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('radio', { name: 'Light', exact: true })).toBeChecked();
  await page.goto('/note/new'); await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Offline idea'); await context.setOffline(true); await page.getByRole('button', { name: 'Save note', exact: true }).click(); await expect(page.getByRole('link', { name: 'Open note: Offline idea' })).toBeVisible();
});

test('navigation labels fit inside their controls at narrow widths', async ({ page }) => {
  await page.goto('/');
  const navigationActions = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button');
  await expect(navigationActions).toHaveCount(3);
  expect(await navigationActions.evaluateAll(tabs => tabs.every(tab => [...tab.querySelectorAll('*')].filter(element => element.children.length === 0 && element.textContent?.trim() && !element.closest('[aria-hidden="true"]')).every(label => label.getBoundingClientRect().bottom <= tab.getBoundingClientRect().bottom + 1)))).toBe(true);
});

test('motion preference persists, and corrupt preferences remain intact until a successful retry', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Reduce motion', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Reduce motion', exact: true })).toBeChecked();
  await page.evaluate(() => localStorage.setItem('shell.preferences.v1', '{broken'));
  await page.reload();
  await expect(page.getByText('Stored data was preserved.', { exact: false })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('shell.preferences.v1'))).toBe('{broken');
  await page.getByRole('button', { name: 'Retry loading preferences' }).click();
  expect(await page.evaluate(() => localStorage.getItem('shell.preferences.v1'))).toBe('{broken');
  await page.evaluate(() => localStorage.setItem('shell.preferences.v1', JSON.stringify({ version: 1, appearance: 'system', motion: 'system' })));
  await page.getByRole('button', { name: 'Retry loading preferences' }).click();
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeEnabled();
});
