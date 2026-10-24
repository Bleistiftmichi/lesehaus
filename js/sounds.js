// Kleine Töne, direkt im Gerät erzeugt (keine Audiodateien).

import { state } from './store.js';

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

window.addEventListener('pointerdown', () => audio(), { once: true, capture: true });

function tone(freq, start, dur, { type = 'sine', vol = 0.18 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const SOUNDS = {
  richtig: () => { tone(660, 0, 0.18); tone(990, 0.1, 0.25); },
  nochmal: () => { tone(440, 0, 0.18, { type: 'triangle', vol: 0.12 }); tone(392, 0.14, 0.22, { type: 'triangle', vol: 0.12 }); },
  klick: () => tone(880, 0, 0.06, { type: 'triangle', vol: 0.08 }),
  klatsch: () => tone(320, 0, 0.09, { type: 'square', vol: 0.06 }),
  stern: () => { tone(784, 0, 0.15); tone(1047, 0.12, 0.15); tone(1319, 0.24, 0.3); },
  fanfare: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'triangle', vol: 0.14 })); },
};

export function play(name) {
  if (!state.global.sounds) return;
  try { SOUNDS[name]?.(); } catch { /* Ton ist nicht wichtig */ }
}
