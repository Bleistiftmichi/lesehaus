// Kleine Bausteine für die Oberfläche: Elemente bauen, Symbole, Overlays.

import { speak } from './speech.js';
import { play } from './sounds.js';

/** h('div', { class: 'x', onclick: fn }, kind1, kind2 …) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function svg(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

const S = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICONS = {
  speaker: S('<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  stop: S('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  home: S('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  back: S('<path d="M15 5 8 12l7 7"/>'),
  close: S('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: S('<path d="M4.5 12.5l5 5L19.5 7"/>'),
  next: S('<path d="M9 5l7 7-7 7"/>'),
  again: S('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/>'),
  eye: S('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  book: S('<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>'),
  lock: S('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  trash: S('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
  edit: S('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  play: S('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
  share: S('<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v8h14v-8"/>'),
  people: S('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 1.7 5.5 5"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#ffc93c" stroke="#e0a100" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  starEmpty: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#efe6d4" stroke="#dacfb8" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  clap: '👏',
};

export const icon = (name) => svg(ICONS[name]);

/** Rundes Knopf-Symbol. */
export function iconButton(name, onclick, { label = '', cls = 'light' } = {}) {
  return h('button', { class: `btn round ${cls}`, 'aria-label': label, title: label, onclick }, icon(name));
}

/** 🔊-Knopf, der einen Text vorliest. text darf eine Funktion sein. */
export function speakerButton(text, { cls = 'light', label = 'Vorlesen' } = {}) {
  return iconButton('speaker', (e) => {
    e.stopPropagation();
    play('klick');
    speak(typeof text === 'function' ? text() : text);
  }, { label, cls });
}

export function starsRow(n, max = 3) {
  const row = h('div', { class: 'stars', 'aria-label': `${n} von ${max} Sternen` });
  for (let i = 0; i < max; i++) row.append(svg(i < n ? ICONS.star : ICONS.starEmpty));
  return row;
}

export function starCount(n) {
  return h('div', { class: 'star-count', 'aria-label': `${n} Sterne` }, svg(ICONS.star), String(n));
}

// ---------- Overlays ----------

export function overlay(content, { full = false, onClose } = {}) {
  const root = document.getElementById('overlay-root');
  const sheet = h('div', { class: 'sheet' + (full ? ' full' : '') }, content);
  const wrap = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' }, sheet);
  root.append(wrap);
  const close = () => { wrap.remove(); onClose?.(); };
  return { el: wrap, sheet, close };
}

export function closeAllOverlays() {
  document.getElementById('overlay-root').replaceChildren();
}

/** Ja/Nein-Frage für Erwachsene. */
export function confirmBox(text, { yes = 'Ja', no = 'Abbrechen', danger = false } = {}) {
  return new Promise((resolve) => {
    let ov;
    const done = (v) => { ov.close(); resolve(v); };
    ov = overlay(h('div', { class: 'parents' },
      h('p', {}, text),
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        h('button', { class: 'btn light', onclick: () => done(false) }, no),
        h('button', { class: 'btn' + (danger ? ' danger' : ''), onclick: () => done(true) }, yes)),
    ));
  });
}

export function toast(text, ms = 2600) {
  const t = h('div', { class: 'update-banner', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
