// Kleine Formular-Bausteine für den Elternbereich.

import { h } from '../ui.js';

export function field(label, control, hint = '') {
  return h('label', { class: 'field' }, label, hint ? h('span', { class: 'hint' }, hint) : null, control);
}

export function toggle(label, checked, onchange, hint = '') {
  const input = h('input', { type: 'checkbox', checked, onchange: (e) => onchange(e.target.checked) });
  return h('div', {}, h('label', { class: 'switch' }, h('span', {}, label), input), hint ? h('div', { class: 'hint muted small' }, hint) : null);
}

export function select(options, value, onchange) {
  return h('select', { onchange: (e) => onchange(e.target.value) },
    options.map(([v, t]) => h('option', { value: v, selected: String(v) === String(value) }, t)));
}

export function range({ min, max, step, value, format = (v) => v, onchange }) {
  const out = h('output', {}, format(value));
  const input = h('input', {
    type: 'range', min, max, step, value,
    oninput: (e) => { out.textContent = format(Number(e.target.value)); },
    onchange: (e) => onchange(Number(e.target.value)),
  });
  return h('div', { class: 'row' }, h('div', { class: 'grow' }, input), out);
}

export function stepper({ min, max, value, onchange }) {
  let v = value;
  const out = h('output', {}, v);
  const set = (n) => { v = Math.max(min, Math.min(max, n)); out.textContent = v; onchange(v); };
  return h('div', { class: 'stepper' },
    h('button', { class: 'btn light round', type: 'button', 'aria-label': 'weniger', onclick: () => set(v - 1) }, '−'),
    out,
    h('button', { class: 'btn light round', type: 'button', 'aria-label': 'mehr', onclick: () => set(v + 1) }, '+'));
}

export const section = (title, ...children) => h('section', {}, h('h3', {}, title), ...children);
