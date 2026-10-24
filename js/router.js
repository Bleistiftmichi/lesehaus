// Wechselt zwischen den Bildschirmen. Jeder Bildschirm ist eine Funktion,
// die ein Element zurückgibt.

import { stop } from './speech.js';
import { closeAllOverlays } from './ui.js';

const screens = {};
let currentName = null;

export function register(name, fn) { screens[name] = fn; }

export async function go(name, params = {}) {
  stop();
  closeAllOverlays();
  const app = document.getElementById('app');
  currentName = name;
  const el = await screens[name](params);
  if (currentName !== name) return;   // inzwischen woanders hin gewechselt
  el.dataset.screen = name;
  app.replaceChildren(el);
}

export const current = () => currentName;
