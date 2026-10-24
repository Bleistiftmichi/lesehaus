import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';

export const PIN = '1234';
export const words = JSON.parse(readFileSync(new URL('../content/words.json', import.meta.url))).woerter;
export const stories = [1, 2, 3, 4, 5, 6].flatMap((n) => JSON.parse(readFileSync(new URL(`../content/stories/stufe-${n}.json`, import.meta.url))).geschichten);
export const shot = (page, name) => page.waitForTimeout(350).then(() => page.screenshot({ path: `tests/screenshots/${name}.png`, animations: 'disabled' }));

/** Sprachausgabe stummschalten und sofort „fertig“ melden; Teilen-Menü abschalten. */
export async function quiet(page) {
  await page.addInitScript(() => {
    if (window.speechSynthesis) {
      const proto = Object.getPrototypeOf(window.speechSynthesis);
      proto.speak = function (u) { setTimeout(() => u.onend && u.onend(), 5); };
      proto.cancel = function () {};
    }
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  });
}

export async function tapPin(page, pin = PIN) {
  for (const d of pin) await page.locator('.keypad button', { hasText: new RegExp(`^${d}$`) }).click();
}

export async function onboard(page, name = 'Testkind') {
  await page.goto('/');
  await page.getByRole('button', { name: /Los geht/ }).click();
  await tapPin(page);
  await tapPin(page);
  await page.getByLabel('Name des Kindes').fill(name);
  await page.getByRole('button', { name: 'Pferd' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.tile.silben')).toBeVisible();
}

export async function openParents(page) {
  await page.getByRole('button', { name: 'Elternbereich' }).click();
  await tapPin(page);
  const q = await page.locator('.sheet p', { hasText: '×' }).textContent();
  const [a, b] = q.match(/\d+/g).map(Number);
  for (const d of String(a * b)) await page.locator('.keypad button', { hasText: new RegExp(`^${d}$`) }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByText('Elternbereich', { exact: true })).toBeVisible();
}
