// Prüft die Inhalte im Ordner content/ – nach eigenen Änderungen laufen lassen: `npm run check`
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const load = async (p) => JSON.parse(await readFile(join(root, 'content', p), 'utf8'));
const errors = [];
const err = (m) => errors.push(m);

const { woerter } = await load('words.json');
const ids = new Set();
const perLevel = {};
for (const w of woerter) {
  if (ids.has(w.id)) err(`Wort-id doppelt: ${w.id}`);
  ids.add(w.id);
  if (w.silben.replace(/-/g, '') !== w.text) err(`Silben passen nicht: ${w.text} / ${w.silben}`);
  if (!(w.stufe >= 1 && w.stufe <= 6)) err(`Stufe falsch: ${w.text}`);
  if (!Array.isArray(w.ablenker) || w.ablenker.length !== 3 || w.ablenker.includes(w.text)) err(`Ablenker falsch: ${w.text}`);
  perLevel[w.stufe] = (perLevel[w.stufe] || 0) + 1;
}

const { saetze } = await load('blitz-saetze.json');
for (const s of saetze) if (s.ablenker?.length !== 3 || s.ablenker.includes(s.text)) err(`Satz-Ablenker falsch: ${s.text}`);

let stories = 0;
const storyIds = new Set();
for (let n = 1; n <= 6; n++) {
  const f = await load(`stories/stufe-${n}.json`);
  if (f.stufe !== n) err(`stufe-${n}.json: stufe ist ${f.stufe}`);
  for (const g of f.geschichten) {
    stories++;
    if (storyIds.has(g.id)) err(`Geschichten-id doppelt: ${g.id}`);
    storyIds.add(g.id);
    if (!g.titel || !g.text) err(`${g.id}: Titel oder Text fehlt`);
    if (!g.fragen?.length) err(`${g.id}: keine Fragen`);
    for (const q of g.fragen || []) {
      if (!(q.richtig >= 0 && q.richtig < q.antworten.length)) err(`${g.id}: richtig-Index falsch bei „${q.frage}“`);
      if ([q.frage, ...q.antworten].some((t) => t.includes('|'))) err(`${g.id}: | in Frage/Antwort`);
    }
  }
}

const badges = (await load('badges.json')).abzeichen;
await load('elma-saetze.json');

console.log(`Wörter: ${woerter.length} ${JSON.stringify(perLevel)} · Blitz-Sätze: ${saetze.length} · Geschichten: ${stories} · Abzeichen: ${badges.length}`);
if (errors.length) { errors.forEach((e) => console.error('✗', e)); process.exit(1); }
console.log('Inhalte ok');
