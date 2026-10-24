import { test, expect } from '@playwright/test';
import { quiet, onboard, openParents, shot, words, stories, tapPin } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await quiet(page);
  page.on('pageerror', (e) => { throw e; });
});

const lc = (s) => s.toLowerCase();

async function solveSilben(page) {
  for (let i = 0; i < 8; i++) {
    const weiter = page.getByRole('button', { name: 'Weiter' });
    const slots = page.locator('.slots');
    const clap = page.getByRole('button', { name: 'Klatschen' });
    await expect(weiter.or(slots).or(clap).first()).toBeVisible();
    if (await weiter.isVisible()) {
      await weiter.click();
    } else if (await slots.isVisible()) {
      const n = await page.locator('.slot').count();
      const tiles = await page.locator('.pool .tilebtn').allTextContents();
      const word = words.find((w) => {
        const s = w.silben.split('-');
        if (s.length !== n) return false;
        const rest = tiles.map(lc);
        return s.every((x) => { const k = rest.indexOf(lc(x)); if (k < 0) return false; rest.splice(k, 1); return true; });
      });
      if (!word) throw new Error("kein Wort für " + n + " " + JSON.stringify(tiles));
      for (const s of word.silben.split('-')) {
        await page.locator('.pool .tilebtn:not(.used)', { hasText: new RegExp(`^${s}$`, 'i') }).first().click();
      }
      await expect(page.locator('.slots.good')).toBeVisible();
    } else {
      const text = (await page.locator('.big-word').textContent()).trim();
      const w = words.find((x) => x.text === text);
      for (let k = 0; k < w.silben.split('-').length; k++) await clap.click();
      if (i === 5) await shot(page, '04-silben-klatschen');
      await page.getByRole('button', { name: 'Fertig' }).click();
    }
    if (i === 2) await shot(page, '03-silben');
    // warten, bis die nächste Aufgabe dran ist
    if (i < 7) await expect(page.locator('.progress-dots span.done')).toHaveCount(i + 1, { timeout: 10000 });
  }
}

test('Einrichten, alle drei Übungen, Sterne und Speichern', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Los geht/ })).toBeVisible();
  await shot(page, '01-willkommen');
  await page.getByRole('button', { name: /Los geht/ }).click();
  await tapPin(page); await tapPin(page);
  await page.getByLabel('Name des Kindes').fill('Testkind');
  await page.getByRole('button', { name: 'Pferd' }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.tile.silben')).toBeVisible();
  await shot(page, '02-startseite');

  // Silben
  await page.locator('.tile.silben').click();
  await solveSilben(page);
  await expect(page.locator('.stars')).toBeVisible();
  await expect(page.getByText('6 / 6 ✓')).toBeVisible();
  await shot(page, '05-ergebnis');
  await page.getByRole('button', { name: 'Startseite' }).click();
  await expect(page.locator('.star-count')).toContainText('3');

  // Blitzlesen
  await page.locator('.tile.blitz').click();
  for (let i = 0; i < 8; i++) {
    const handle = await page.waitForFunction(() => {
      const b = document.querySelector('.flash-box');
      const t = b?.textContent.trim();
      return b && t && !b.querySelector('.dot') && !b.querySelector('.mask') ? t : null;
    }, null, { timeout: 15000 });
    const shown = await handle.jsonValue();
    if (i === 0) await shot(page, '06-blitz-wort');
    await expect(page.locator('.option').first()).toBeVisible({ timeout: 10000 });
    if (i === 0) await shot(page, '07-blitz-auswahl');
    await page.locator('.option', { hasText: new RegExp(`^${shown}$`) }).click();
    if (i < 7) await expect(page.locator('.progress-dots span.done')).toHaveCount(i + 1, { timeout: 10000 });
  }
  await expect(page.getByText('8 / 8 ✓')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Startseite' }).click();

  // Geschichten
  await page.locator('.tile.texte').click();
  await expect(page.locator('.reading')).toBeVisible();
  await shot(page, '08-geschichte');
  const title = (await page.locator('.story-title').first().textContent()).trim();
  const story = stories.find((g) => g.titel.replace(/\|/g, '') === title);
  await page.getByRole('button', { name: 'Fertig gelesen' }).click();
  for (const [i, f] of story.fragen.entries()) {
    await expect(page.locator('.question .text')).toHaveText(f.frage);
    if (i === 0) await shot(page, '09-frage');
    await page.locator('.option', { hasText: f.antworten[f.richtig] }).first().click();
    if (i < 2) await expect(page.locator('.progress-dots span.done')).toHaveCount(i + 2, { timeout: 10000 });
  }
  await expect(page.getByText('3 / 3 ✓')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Startseite' }).click();
  await expect(page.locator('.star-count')).toContainText('9');

  // Nach dem Neuladen ist alles noch da
  await page.reload();
  await expect(page.locator('.star-count')).toContainText('9');
  await page.getByRole('button', { name: 'Abzeichen' }).click();
  await expect(page.locator('.badge:not(.locked)')).toHaveCount(4); // Los geht's, Entdeckerin, Erste Geschichte, Volltreffer
  await shot(page, '10-abzeichen');
});

test('Elternbereich: Einstellungen, eigene Wörter, Sicherung', async ({ page }) => {
  await onboard(page);
  await openParents(page);
  await shot(page, '11-eltern-fortschritt');

  await page.getByRole('tab', { name: 'Einstellungen' }).click();
  await shot(page, '12-eltern-einstellungen');

  // Lernwörter als Liste anlegen
  await page.getByRole('tab', { name: 'Eigene Inhalte' }).click();
  await page.getByRole('button', { name: /Mehrere Wörter/ }).click();
  await page.locator('textarea').fill('Fahrrad\nSchule\nFreundin\nGarten');
  await page.getByRole('button', { name: /Silben vorschlagen/ }).click();
  const inputs = page.locator('.sheet .list-item input');
  await expect(inputs).toHaveCount(4);
  expect(await inputs.nth(0).inputValue()).toBe('Fahr-rad');
  expect(await inputs.nth(2).inputValue()).toBe('Freun-din');
  await shot(page, '13-eltern-lernwoerter');
  await page.getByRole('button', { name: 'Alle speichern' }).click();
  await expect(page.getByText('Lernwörter Schule (4)')).toBeVisible();

  // Liste fürs Üben auswählen
  await page.getByRole('tab', { name: 'Einstellungen' }).click();
  await page.locator('label.field', { hasText: 'Wörter für Silben' }).locator('select').selectOption('liste:Lernwörter Schule');

  // Sicherung exportieren
  await page.getByRole('tab', { name: 'Sicherung' }).click();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /Sicherung exportieren/ }).click();
  const file = await (await dl).path();
  await shot(page, '14-eltern-sicherung');

  // Elternbereich verlassen: Silben-Übung nutzt jetzt nur die Lernwörter
  await page.getByRole('button', { name: 'Elternbereich verlassen' }).click();
  await page.locator('.tile.silben').click();
  await page.getByRole('button', { name: 'Weiter' }).waitFor();
  const w = (await page.locator('.big-word').textContent()).trim();
  expect(['Fahrrad', 'Schule', 'Freundin', 'Garten']).toContain(w);
  await page.getByRole('button', { name: 'Übung beenden' }).click();

  // Alles löschen (neues, leeres Gerät simulieren) und Sicherung einspielen
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('lesehaus'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Los geht/ })).toBeVisible();
  // Neu einrichten, dann im Elternbereich die Sicherung laden
  await onboard(page, 'Anderes');
  await openParents(page);
  await page.getByRole('tab', { name: 'Sicherung' }).click();
  await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('button', { name: 'Wiederherstellen' }).click();
  await expect(page.getByText('Sicherung wiederhergestellt ✓')).toBeVisible();
  await page.getByRole('tab', { name: 'Kinder' }).click();
  await expect(page.locator('.list-item', { hasText: 'Testkind' })).toBeVisible();
  await expect(page.locator('.list-item', { hasText: 'Anderes' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Eigene Inhalte' }).click();
  await expect(page.getByText('Lernwörter Schule (4)')).toBeVisible();
});

test('Querformat und iPad', async ({ page }) => {
  await onboard(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await shot(page, '15-quer-startseite');
  await page.locator('.tile.texte').click();
  await expect(page.locator('.reading')).toBeVisible();
  await shot(page, '16-quer-geschichte');
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.getByRole('button', { name: 'Übung beenden' }).click();
  await shot(page, '17-ipad-startseite');
});
