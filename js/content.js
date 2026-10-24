// Lädt die mitgelieferten Inhalte (Ordner content/) und mischt die eigenen Inhalte
// aus dem Elternbereich dazu.

import { state } from './store.js';

const data = { woerter: [], saetze: [], geschichten: [], badges: [], elma: {} };

async function json(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Konnte ' + path + ' nicht laden');
  return res.json();
}

export async function loadContent() {
  const [w, s, b, e, ...stories] = await Promise.all([
    json('content/words.json'),
    json('content/blitz-saetze.json'),
    json('content/badges.json'),
    json('content/elma-saetze.json'),
    ...[1, 2, 3, 4, 5, 6].map((n) => json(`content/stories/stufe-${n}.json`)),
  ]);
  data.woerter = w.woerter.map(normalizeWord);
  data.saetze = s.saetze;
  data.badges = b.abzeichen;
  data.elma = e;
  data.geschichten = stories.flatMap((f) => f.geschichten.map((g) => ({ ...g, stufe: f.stufe })));
}

export function normalizeWord(w) {
  return { ...w, silbenListe: String(w.silben).split('-').filter(Boolean) };
}

export const elmaTexts = () => data.elma;
export const badgeList = () => data.badges;

/** Eigene Inhalte, die für das aktuelle Profil gelten (für alle oder genau dieses Kind). */
function forProfile(list) {
  const pid = state.profile?.id;
  return list.filter((x) => !x.profil || x.profil === pid);
}

export function customWords() {
  const pool = data.woerter;
  return forProfile(state.custom.woerter).map((w) => {
    const n = normalizeWord({ ...w, custom: true });
    if (!n.ablenker || n.ablenker.filter(Boolean).length < 3) n.ablenker = autoDistractors(n.text, pool);
    return n;
  });
}

export function allWords() {
  return [...data.woerter, ...customWords()];
}

/** Namen der eigenen Wortlisten (z. B. „Lernwörter Schule“). */
export function customLists() {
  return [...new Set(forProfile(state.custom.woerter).map((w) => w.liste).filter(Boolean))];
}

/**
 * Wörter für eine Übung auf einer Stufe. Ist im Elternbereich eine eigene Liste
 * gewählt, kommen nur deren Wörter (egal welche Stufe).
 */
export function wordsFor(stufe, quelle = 'alle') {
  if (quelle.startsWith('liste:')) {
    const name = quelle.slice(6);
    const list = customWords().filter((w) => w.liste === name);
    if (list.length >= 4) return list;
  }
  const all = allWords();
  let pool = all.filter((w) => w.stufe === stufe);
  // Zu wenige Wörter auf der Stufe? Nachbarstufen dazunehmen.
  for (let d = 1; pool.length < 12 && d < 6; d++) {
    pool = pool.concat(all.filter((w) => w.stufe === stufe - d || w.stufe === stufe + d));
  }
  return pool;
}

export function phrasesFor(stufe) {
  let pool = data.saetze.filter((s) => s.stufe === stufe);
  if (pool.length < 5) pool = data.saetze.filter((s) => Math.abs(s.stufe - stufe) <= 1);
  return pool;
}

export function storiesFor(stufe) {
  const own = forProfile(state.custom.geschichten).map((g) => ({ ...g, custom: true }));
  const all = [...data.geschichten, ...own];
  const exact = all.filter((g) => g.stufe === stufe);
  return exact.length ? exact : all.filter((g) => Math.abs(g.stufe - stufe) <= 1);
}

export function findWord(id) {
  return allWords().find((w) => w.id === id);
}

// ---------- Text mit Silbenstrichen ----------

/** "Lu|po ist ein Po|ny." → Absätze → Wörter mit Silben. */
export function parseMarkedText(text) {
  return String(text).split(/\n\s*\n/).map((para) => para.split(/\s+/).filter(Boolean).map((token) => {
    const m = token.match(/^([^\p{L}\p{N}|]*)(.*?)([^\p{L}\p{N}|]*)$/u);
    const core = m ? m[2] : token;
    return {
      pre: m ? m[1] : '',
      post: m ? m[3] : '',
      silben: core.split('|').filter((s) => s !== ''),
      plain: token.replace(/\|/g, ''),
    };
  }));
}

export const stripMarks = (t) => String(t).replace(/\|/g, '');

// ---------- Ablenker für eigene Wörter ----------

export function editDistance(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

const SWAPS = [['b', 'd'], ['d', 'b'], ['m', 'n'], ['n', 'm'], ['ei', 'ie'], ['ie', 'ei'], ['p', 'b'], ['t', 'd'], ['u', 'n'], ['a', 'o'], ['o', 'a'], ['e', 'a'], ['i', 'e'], ['h', 'k'], ['r', 'l'], ['l', 'r']];

/** Drei ähnliche Wörter: zuerst echte Wörter aus der Sammlung, sonst kleine Buchstabentausche. */
export function autoDistractors(text, pool = data.woerter) {
  const out = new Set();
  const cand = pool
    .filter((w) => w.text !== text && Math.abs(w.text.length - text.length) <= 1)
    .map((w) => [w.text, editDistance(w.text, text)])
    .filter(([, d]) => d <= 2)
    .sort((a, b) => a[1] - b[1]);
  for (const [t] of cand) { if (out.size < 3) out.add(t); }
  const lower = text.toLowerCase();
  for (const [from, to] of SWAPS) {
    if (out.size >= 3) break;
    const i = lower.indexOf(from, 1);
    if (i > 0) {
      let v = text.slice(0, i) + to + text.slice(i + from.length);
      if (v !== text) out.add(v);
    }
  }
  while (out.size < 3) out.add(text.slice(0, -1) + ['e', 'n', 's'][out.size]);
  return [...out].slice(0, 3);
}
