// Silben darstellen (Farben und/oder Bögen) und Trennvorschläge für den Elternbereich.
// Die App rät die Trennung NICHT selbst: Angezeigt wird immer die gespeicherte Trennung.

import { h } from './ui.js';
import { settings } from './store.js';

/** Ist die Silbenhilfe auf dieser Stufe an? `toggle` = Kind hat sie per Knopf umgeschaltet. */
export function helpOn(stufe, toggle = null) {
  const mode = settings().silbenhilfe;
  if (mode === 'immer') return true;
  if (mode === 'nie') return false;
  if (stufe <= 3) return true;           // Stufe 1–3: immer an
  if (stufe >= 6) return false;          // Stufe 6: aus
  return toggle ?? stufe === 4;          // Stufe 4–5: wählbar, Start: 4 an, 5 aus
}

/** Darf das Kind die Silbenhilfe auf dieser Stufe selbst umschalten? */
export const helpToggleable = (stufe) => settings().silbenhilfe === 'auto' && (stufe === 4 || stufe === 5);

/** CSS-Klassen für einen Container, je nach Stil im Elternbereich. */
export function helpClasses(on) {
  if (!on) return '';
  const stil = settings().silbenStil;
  return [stil !== 'boegen' && 'syl-color', stil !== 'farbe' && 'syl-bows'].filter(Boolean).join(' ');
}

/** Ein Wort aus Silben: <span.word><span.syl.s0>Ba</span><span.syl.s1>na</span>…</span> */
export function wordEl(silben, { onSyllable } = {}) {
  const w = h('span', { class: 'word' });
  silben.forEach((s, i) => {
    const syl = h('span', { class: `syl s${i % 2}` }, s);
    if (onSyllable) syl.addEventListener('click', (e) => { e.stopPropagation(); onSyllable(i, syl); });
    w.append(syl);
  });
  return w;
}

// ---------- Trennvorschlag (nur als Vorbelegung im Elternbereich) ----------

const VOWELS = 'aeiouäöüyAEIOUÄÖÜY';
const DIPH = ['aa', 'ee', 'oo', 'ie', 'ei', 'ai', 'au', 'eu', 'äu', 'ey', 'ay'];
const UNITS = ['sch', 'ch', 'ck', 'ph', 'th', 'qu'];

/**
 * Einfacher Vorschlag nach Grundregeln: ein Konsonant zwischen Vokalen geht zur nächsten
 * Silbe, bei mehreren nur der letzte; ch/sch/ck/ph/qu bleiben zusammen.
 * Zusammengesetzte Wörter erkennt das nicht – deshalb ist es nur ein Vorschlag.
 */
export function suggestSyllables(word) {
  const w = word.trim();
  if (!w) return '';
  const lower = w.toLowerCase();
  // Buchstabengruppen bilden
  const groups = [];
  let i = 0;
  while (i < w.length) {
    const unit = UNITS.find((u) => lower.startsWith(u, i));
    const d = DIPH.find((x) => lower.startsWith(x, i));
    const len = unit ? unit.length : d ? 2 : 1;
    const text = w.slice(i, i + len);
    groups.push({ text, vowel: !unit && VOWELS.includes(w[i]) });
    i += len;
  }
  const vIdx = groups.map((g, k) => (g.vowel ? k : -1)).filter((k) => k >= 0);
  if (vIdx.length < 2) return w;
  const cuts = [];
  for (let k = 0; k < vIdx.length - 1; k++) {
    const a = vIdx[k], b = vIdx[k + 1];
    const cons = b - a - 1;
    if (cons <= 1) cuts.push(a + 1);       // Ho-se, Ba-na-ne, auch Vokal-Vokal: Fe-ri-en
    else cuts.push(b - 1);                 // Kat-ze, Fens-ter, Zu-cker (ck ist eine Gruppe)
  }
  let out = '';
  groups.forEach((g, k) => { if (cuts.includes(k)) out += '-'; out += g.text; });
  return out;
}

/** Vorschlag für einen ganzen Text: jedes Wort bekommt Silbenstriche „|“. */
export function suggestMarkedText(text) {
  return String(text).replace(/[\p{L}]+/gu, (word) => suggestSyllables(word).replace(/-/g, '|'));
}
