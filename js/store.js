// Zustand der App: Einstellungen, Kinderprofile, Fortschritt, eigene Inhalte.
// Alles bleibt auf dem Gerät (siehe db.js).

import * as db from './db.js';

export const EXERCISES = ['silben', 'blitz', 'texte'];
export const EXERCISE_NAMES = { silben: 'Silben & Wörter', blitz: 'Blitzlesen', texte: 'Geschichten' };
export const MAX_LEVEL = 6;

export const DEFAULT_GLOBAL = {
  onboarded: false,
  pinHash: null,
  pinSalt: null,
  speechRate: 0.85,
  voiceURI: null,
  sounds: true,
  autoSpeak: true,        // Anweisungen automatisch vorlesen
  readQuestions: true,    // Fragen/Antworten in Geschichten per 🔊 vorlesbar
  colors: ['#1f6fd1', '#d93a3a'],
  betaSpeech: false,
};

export const DEFAULT_SETTINGS = {
  fontScale: 1,
  silbenhilfe: 'auto',    // auto | immer | nie
  silbenStil: 'farbe',    // farbe | boegen | beides
  blitzStartMs: 1500,
  blitzMinMs: 500,
  blitzAuto: true,
  dailyGoal: 10,          // Minuten, 0 = aus
  dailyLimit: 0,          // Minuten, 0 = aus
  wortquelle: 'alle',     // alle | liste:<Name>
};

export function newProgress() {
  return {
    levels: Object.fromEntries(EXERCISES.map((e) => [e, { stufe: 1, fixiert: false, since: 0 }])),
    log: [],              // { t, ex, id, ok }  (ok: true/false; null = nicht gewertet)
    wordStats: {},        // id -> { seen, wrong }
    stars: 0,
    badges: {},           // id -> Zeitstempel
    days: {},             // 'JJJJ-MM-TT' -> Sekunden
    blitzMs: DEFAULT_SETTINGS.blitzStartMs,
    storiesRead: {},      // id -> Zeitstempel
    counters: { runden: 0, perfekt: 0, silben: 0, blitz: 0, geschichten: 0 },
    world: null,          // Spielwelt (Etappe 2)
  };
}

const LOG_LIMIT = 4000;

export const state = {
  global: { ...DEFAULT_GLOBAL },
  profiles: [],
  profile: null,
  progress: null,
  custom: { woerter: [], geschichten: [] },
};

export async function load() {
  state.global = { ...DEFAULT_GLOBAL, ...((await db.get('global')) || {}) };
  state.profiles = ((await db.get('profiles')) || []).map(normalizeProfile);
  state.custom = { woerter: [], geschichten: [], ...((await db.get('custom')) || {}) };
  const lastId = await db.get('lastProfile');
  if (lastId && state.profiles.some((p) => p.id === lastId)) await selectProfile(lastId);
  applyLook();
}

function normalizeProfile(p) {
  return { ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings || {}) } };
}

function normalizeProgress(pr) {
  const base = newProgress();
  const out = { ...base, ...(pr || {}) };
  out.levels = { ...base.levels, ...(out.levels || {}) };
  out.counters = { ...base.counters, ...(out.counters || {}) };
  return out;
}

export async function selectProfile(id) {
  state.profile = state.profiles.find((p) => p.id === id) || null;
  state.progress = state.profile ? normalizeProgress(await db.get('progress:' + id)) : null;
  await db.set('lastProfile', id);
  applyLook();
}

export function settings() {
  return state.profile ? state.profile.settings : { ...DEFAULT_SETTINGS };
}

export const saveGlobal = () => db.set('global', state.global);
export const saveProfiles = () => db.set('profiles', state.profiles);
export const saveCustom = () => db.set('custom', state.custom);

export async function saveProgress(profileId = state.profile?.id, progress = state.progress) {
  if (!profileId || !progress) return;
  if (progress.log.length > LOG_LIMIT) progress.log = progress.log.slice(-LOG_LIMIT);
  await db.set('progress:' + profileId, progress);
}

export async function loadProgress(profileId) {
  if (profileId === state.profile?.id) return state.progress;
  return normalizeProgress(await db.get('progress:' + profileId));
}

export async function addProfile({ name, tier, farbe }) {
  const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const profile = normalizeProfile({ id, name: name.trim(), tier, farbe, created: Date.now() });
  state.profiles.push(profile);
  await saveProfiles();
  await db.set('progress:' + id, newProgress());
  return profile;
}

export async function removeProfile(id) {
  state.profiles = state.profiles.filter((p) => p.id !== id);
  await saveProfiles();
  await db.del('progress:' + id);
  state.custom.woerter = state.custom.woerter.filter((w) => w.profil !== id);
  state.custom.geschichten = state.custom.geschichten.filter((g) => g.profil !== id);
  await saveCustom();
  if (state.profile?.id === id) { state.profile = null; state.progress = null; await db.del('lastProfile'); }
}

/** Schriftgröße und Silbenfarben als CSS-Variablen setzen. */
export function applyLook() {
  const root = document.documentElement.style;
  root.setProperty('--font-scale', String(settings().fontScale || 1));
  root.setProperty('--syl0', state.global.colors[0]);
  root.setProperty('--syl1', state.global.colors[1]);
}

// ---------- Tageszeit ----------

export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function secondsToday() {
  return state.progress?.days[today()] || 0;
}

let lastActivity = 0;
/** Bei jeder Antwort aufrufen: zählt aktive Übungszeit (Pausen über 60 s zählen nicht). */
export function trackActivity() {
  if (!state.progress) return;
  const now = Date.now();
  const delta = lastActivity ? Math.min((now - lastActivity) / 1000, 60) : 5;
  lastActivity = now;
  const key = today();
  state.progress.days[key] = Math.round((state.progress.days[key] || 0) + delta);
}
export function resetActivityClock() { lastActivity = Date.now(); }

export function limitReached() {
  const lim = settings().dailyLimit;
  return lim > 0 && secondsToday() >= lim * 60;
}

// ---------- Backup ----------

export async function exportAll() {
  return {
    app: 'lesehaus',
    format: 1,
    exportiert: new Date().toISOString(),
    daten: await db.dump(),
  };
}

export async function importAll(obj) {
  if (!obj || obj.app !== 'lesehaus' || typeof obj.daten !== 'object') {
    throw new Error('Das ist keine Lesehaus-Sicherung.');
  }
  await db.replaceAll(obj.daten);
  state.profile = null;
  state.progress = null;
  await load();
}
