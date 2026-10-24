// Stufenlogik und Belohnungen (Sterne, Abzeichen).

import { state, settings, MAX_LEVEL, EXERCISES, today } from './store.js';
import { badgeList } from './content.js';

const WINDOW = 10;
const UP = 0.85;
const DOWN = 0.6;

export const level = (ex) => state.progress.levels[ex].stufe;

/** Eine Antwort ins Protokoll schreiben. ok: true/false, null = nicht gewertet. */
export function record(ex, id, ok, wordId = null) {
  const p = state.progress;
  p.log.push({ t: Date.now(), ex, id, ok });
  if (wordId && ok !== null) {
    const s = p.wordStats[wordId] || (p.wordStats[wordId] = { seen: 0, wrong: 0 });
    s.seen++;
    if (!ok) s.wrong++;
  }
  if (ex === 'blitz' && ok !== null) adaptBlitz(ok);
}

/**
 * Nach einer Runde: über die letzten 10 gewerteten Aufgaben (seit dem letzten Stufenwechsel)
 * ≥ 85 % → eine Stufe hoch, < 60 % → eine Stufe runter. Gibt 'hoch' | 'runter' | null zurück.
 */
export function evaluateLevel(ex) {
  const L = state.progress.levels[ex];
  if (L.fixiert) return null;
  const recent = state.progress.log.filter((e) => e.ex === ex && e.ok !== null && e.t > L.since).slice(-WINDOW);
  if (recent.length < WINDOW) return null;
  const rate = recent.filter((e) => e.ok).length / recent.length;
  if (rate >= UP && L.stufe < MAX_LEVEL) { L.stufe++; L.since = Date.now(); onLevelChange(ex); return 'hoch'; }
  if (rate < DOWN && L.stufe > 1) { L.stufe--; L.since = Date.now(); onLevelChange(ex); return 'runter'; }
  return null;
}

function onLevelChange(ex) {
  // Neue Stufe beim Blitzlesen: wieder mit der großzügigen Startzeit beginnen.
  if (ex === 'blitz') state.progress.blitzMs = settings().blitzStartMs;
}

/** Blitzlese-Zeit: wird kürzer, wenn die letzten 5 Antworten (fast) alle stimmen. */
function adaptBlitz(ok) {
  const s = settings();
  if (!s.blitzAuto) { state.progress.blitzMs = s.blitzStartMs; return; }
  const last = state.progress.log.filter((e) => e.ex === 'blitz' && e.ok !== null).slice(-5);
  let ms = state.progress.blitzMs || s.blitzStartMs;
  if (ok && last.length === 5 && last.filter((e) => e.ok).length >= 4) ms -= 75;
  if (!ok) ms += 100;
  state.progress.blitzMs = Math.max(s.blitzMinMs, Math.min(s.blitzStartMs, ms));
}

export function starsFor(correct, total) {
  if (!total) return 1;
  const r = correct / total;
  return r >= 0.85 ? 3 : r >= 0.6 ? 2 : 1;   // fürs Mitmachen gibt es immer mindestens einen Stern
}

export function addStars(n) {
  state.progress.stars += n;
  state.progress.counters.sterneGesamt = (state.progress.counters.sterneGesamt || 0) + n;
}

// ---------- Abzeichen ----------

function streakDays() {
  const days = state.progress.days;
  let n = 0;
  const d = new Date();
  while (days[today(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

const CHECKS = {
  'erste-runde': (p) => p.counters.runden >= 1,
  'erste-geschichte': (p) => p.counters.geschichten >= 1,
  'geschichten-10': (p) => p.counters.geschichten >= 10,
  'geschichten-30': (p) => p.counters.geschichten >= 30,
  'silben-50': (p) => p.counters.silben >= 50,
  'silben-200': (p) => p.counters.silben >= 200,
  'blitz-50': (p) => p.counters.blitz >= 50,
  'blitz-200': (p) => p.counters.blitz >= 200,
  'alles-richtig': (p) => p.counters.perfekt >= 1,
  'perfekt-10': (p) => p.counters.perfekt >= 10,
  'alle-uebungen': (p) => EXERCISES.every((ex) => p.log.some((e) => e.ex === ex)),
  'stufe-2': (p) => EXERCISES.some((ex) => p.levels[ex].stufe >= 2),
  'stufe-3': (p) => EXERCISES.some((ex) => p.levels[ex].stufe >= 3),
  'stufe-5': (p) => EXERCISES.some((ex) => p.levels[ex].stufe >= 5),
  'stufe-6': (p) => EXERCISES.some((ex) => p.levels[ex].stufe >= 6),
  'tage-5': (p) => Object.values(p.days).filter((s) => s > 0).length >= 5,
  'tage-20': (p) => Object.values(p.days).filter((s) => s > 0).length >= 20,
  'serie-3': () => streakDays() >= 3,
  'serie-7': () => streakDays() >= 7,
  'sterne-50': (p) => (p.counters.sterneGesamt || 0) >= 50,
  'sterne-200': (p) => (p.counters.sterneGesamt || 0) >= 200,
};

/** Prüft alle Abzeichen und gibt die neu verdienten zurück. */
export function checkBadges() {
  const p = state.progress;
  const fresh = [];
  for (const b of badgeList()) {
    if (p.badges[b.id]) continue;
    if (CHECKS[b.id]?.(p)) { p.badges[b.id] = Date.now(); fresh.push(b); }
  }
  return fresh;
}

/** Wörter, die oft falsch waren (für den Elternbereich und zum gezielten Üben). */
export function hardWords(progress = state.progress, n = 15) {
  return Object.entries(progress.wordStats)
    .filter(([, s]) => s.wrong > 0)
    .map(([id, s]) => ({ id, ...s, rate: s.wrong / s.seen }))
    .sort((a, b) => b.wrong - a.wrong || b.rate - a.rate)
    .slice(0, n);
}

/**
 * Wörter für eine Runde wählen: schwierige Wörter kommen öfter dran,
 * kürzlich gesehene seltener.
 */
export function chooseItems(pool, n, ex) {
  const p = state.progress;
  const recent = new Set(p.log.filter((e) => e.ex === ex).slice(-40).map((e) => e.id));
  const weighted = pool.map((w) => {
    const s = p.wordStats[w.id];
    let weight = 1;
    if (s?.wrong) weight += Math.min(3, s.wrong / Math.max(1, s.seen) * 4);
    if (recent.has(w.id)) weight *= 0.25;
    if (!s) weight += 0.5;
    return { w, key: Math.random() ** (1 / weight) };
  });
  return weighted.sort((a, b) => b.key - a.key).slice(0, n).map((x) => x.w);
}
