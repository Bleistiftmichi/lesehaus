// Vorlesen mit der Sprachausgabe des Geräts (Web Speech API, ohne Internet).
// iOS: Sprache darf erst nach einer Berührung starten – unlock() hängt sich an die erste.

let voices = [];
let voice = null;
let preferredURI = null;
let rate = 0.85;
let current = null;      // aktuelle Äußerung (Referenz halten, sonst bricht Safari ab)
let runId = 0;
let unlocked = false;

export const supported = () => 'speechSynthesis' in window;

const GOOD_NAMES = /anna|helena|petra|marlene|vicki|yannick|markus|katja|conrad|amala|seraphina/i;
const QUALITY = /premium|enhanced|erweitert|natural|neural|siri/i;

function score(v) {
  let s = 0;
  if (/^de[-_]DE/i.test(v.lang)) s += 3;
  else if (/^de/i.test(v.lang)) s += 1;
  if (QUALITY.test(v.name)) s += 5;
  if (GOOD_NAMES.test(v.name)) s += 2;
  if (v.localService) s += 1;
  if (/eloquence|grandma|grandpa|rocko|shelley|flo|reed|sandy|eddy/i.test(v.name)) s -= 4; // Spaßstimmen
  return s;
}

function pick() {
  const de = voices.filter((v) => /^de/i.test(v.lang));
  voice = de.find((v) => v.voiceURI === preferredURI) || de.sort((a, b) => score(b) - score(a))[0] || null;
}

function loadVoices() {
  voices = speechSynthesis.getVoices();
  pick();
}

export function initSpeech({ rate: r, voiceURI } = {}) {
  if (!supported()) return;
  if (r) rate = r;
  preferredURI = voiceURI || null;
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  };
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });
}

export function germanVoices() {
  return voices.filter((v) => /^de/i.test(v.lang)).sort((a, b) => score(b) - score(a));
}
export const currentVoice = () => voice;
export function setRate(r) { rate = r; }
export function setVoice(uri) { preferredURI = uri; pick(); }
export const isUnlocked = () => unlocked;

export function stop() {
  runId++;
  if (supported()) speechSynthesis.cancel();
  current = null;
}

function utter(text, { onBoundary } = {}) {
  return new Promise((resolve) => {
    if (!supported() || !text.trim()) { resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.05;
    let done = false;
    const finish = () => { if (!done) { done = true; clearTimeout(guard); resolve(); } };
    // Sicherheitsnetz, falls Safari kein end-Ereignis schickt.
    const guard = setTimeout(finish, 1500 + text.length * 140 / rate);
    u.onend = finish;
    u.onerror = finish;
    if (onBoundary) u.onboundary = (e) => { if (e.name === undefined || e.name === 'word') onBoundary(e.charIndex); };
    current = u;
    speechSynthesis.speak(u);
  });
}

/** Einen Text vorlesen. Bricht vorheriges Vorlesen ab. */
export async function speak(text, opts = {}) {
  stop();
  const id = runId;
  await new Promise((r) => setTimeout(r, 30)); // iOS braucht nach cancel() einen Moment
  if (id !== runId) return;
  await utter(String(text), opts);
}

/**
 * Mehrere Sätze nacheinander vorlesen (für Geschichten).
 * onSentence(i) markiert den Satz; onWord(i, charIndex) das Wort, wenn das Gerät
 * Wortgrenzen meldet (nicht alle Stimmen tun das zuverlässig).
 */
export async function speakSentences(sentences, { onSentence, onWord, onEnd } = {}) {
  stop();
  const id = runId;
  await new Promise((r) => setTimeout(r, 30));
  for (let i = 0; i < sentences.length; i++) {
    if (id !== runId) return;
    onSentence?.(i);
    await utter(sentences[i], { onBoundary: onWord ? (c) => id === runId && onWord(i, c) : null });
  }
  if (id === runId) onEnd?.();
}

/** Silben einzeln mit kleiner Pause sprechen. */
export async function speakSyllables(silben, onEach) {
  stop();
  const id = runId;
  await new Promise((r) => setTimeout(r, 30));
  for (let i = 0; i < silben.length; i++) {
    if (id !== runId) return;
    onEach?.(i);
    await utter(silben[i].toLowerCase());
    await new Promise((r) => setTimeout(r, 180));
  }
  onEach?.(-1);
}
