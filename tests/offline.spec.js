import { test, expect } from '@playwright/test';
import { quiet, onboard } from './helpers.js';

test('läuft offline (Service Worker)', async ({ page, context }) => {
  await quiet(page);
  await onboard(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.tile.silben')).toBeVisible();
  // Geschichten (JSON-Inhalte) kommen auch offline
  await page.locator('.tile.texte').click();
  await expect(page.locator('.reading')).toBeVisible();
  // Kein einziger Netzwerkzugriff nach außen
  const external = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) external.push(r.url()); });
  await page.reload();
  await expect(page.locator('.tile.silben')).toBeVisible();
  expect(external).toEqual([]);
});
