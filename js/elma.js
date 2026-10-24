// Elma – der kleine mintgrüne Drache. Eigene Figur, als SVG gezeichnet.
// Stimmungen: hallo, freut, ermutigt, staunt, denkt

import { h, svg, pickOne } from './ui.js';
import { speak } from './speech.js';
import { state } from './store.js';
import { elmaTexts } from './content.js';

const C = {
  body: '#5fd4b8',
  line: '#239a82',
  belly: '#eafbf5',
  snout: '#8fe3cf',
  wing: '#b5f0e2',
  horn: '#ffe1a1',
  hornLine: '#e0b45c',
  cheek: '#ff9fae',
  eye: '#2d3047',
};

function eyes(mood) {
  if (mood === 'freut') {
    return `<path d="M70 76 q10 -12 20 0" stroke="${C.eye}" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M110 76 q10 -12 20 0" stroke="${C.eye}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  const r = mood === 'staunt' ? 13 : 11;
  const lid = mood === 'denkt' ? `<path d="M68 66 h24 M108 66 h24" stroke="${C.body}" stroke-width="9"/>` : '';
  return `<circle cx="80" cy="74" r="${r}" fill="${C.eye}"/><circle cx="120" cy="74" r="${r}" fill="${C.eye}"/>
          <circle cx="84" cy="69" r="4.5" fill="#fff"/><circle cx="124" cy="69" r="4.5" fill="#fff"/>
          <circle cx="77" cy="79" r="2" fill="#fff" opacity=".8"/><circle cx="117" cy="79" r="2" fill="#fff" opacity=".8"/>${lid}`;
}

function mouth(mood) {
  switch (mood) {
    case 'freut': return `<path d="M86 103 q14 16 28 0 z" fill="#d6455d" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/><path d="M93 108 q7 5 14 0" fill="#ff8fa3"/>`;
    case 'staunt': return `<ellipse cx="100" cy="106" rx="6" ry="8" fill="#d6455d" stroke="${C.line}" stroke-width="3"/>`;
    case 'denkt': return `<path d="M90 105 q10 3 20 -2" stroke="${C.line}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M88 102 q12 11 24 0" stroke="${C.line}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
}

function arms(mood) {
  const arm = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="17" transform="rotate(${rot} ${x} ${y})" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>`;
  switch (mood) {
    case 'freut': return arm(52, 112, 40) + arm(148, 112, -40);         // beide Arme hoch
    case 'hallo': return arm(60, 140, 15) + arm(150, 108, -35);         // winkt
    case 'ermutigt': return arm(60, 140, 15) + arm(146, 120, -60) + `<circle cx="158" cy="104" r="8" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>`;
    case 'denkt': return arm(60, 140, 15) + arm(126, 116, -150);
    default: return arm(60, 140, 15) + arm(140, 140, -15);
  }
}

function sparkles(mood) {
  if (mood !== 'staunt' && mood !== 'freut') return '';
  const s = (x, y, k) => `<path d="M${x} ${y - 8 * k} L${x + 2.5 * k} ${y - 2.5 * k} L${x + 8 * k} ${y} L${x + 2.5 * k} ${y + 2.5 * k} L${x} ${y + 8 * k} L${x - 2.5 * k} ${y + 2.5 * k} L${x - 8 * k} ${y} L${x - 2.5 * k} ${y - 2.5 * k} Z" fill="#ffc93c"/>`;
  return s(30, 40, 1) + s(172, 30, 0.8) + s(178, 70, 0.6);
}

export function elmaMarkup(mood = 'hallo') {
  return `<svg class="elma-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elma, der kleine Drache">
  <!-- Schwanz -->
  <path d="M138 168 C168 172 186 154 182 126 C178 142 164 152 142 150 Z" fill="${C.body}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M180 128 l10 -14 l-1 18 z" fill="${C.horn}" stroke="${C.hornLine}" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Flügel -->
  <path d="M62 112 C34 84 14 98 16 122 C28 114 36 120 44 130 C50 122 56 120 62 126 Z" fill="${C.wing}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M138 112 C166 84 186 98 184 122 C172 114 164 120 156 130 C150 122 144 120 138 126 Z" fill="${C.wing}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
  <!-- Körper -->
  <ellipse cx="100" cy="146" rx="46" ry="42" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>
  <ellipse cx="100" cy="153" rx="29" ry="30" fill="${C.belly}"/>
  <path d="M80 142 q20 6 40 0 M78 156 q22 6 44 0 M82 170 q18 5 36 0" stroke="#bfeee0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Füße -->
  <ellipse cx="78" cy="186" rx="16" ry="9" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>
  <ellipse cx="122" cy="186" rx="16" ry="9" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>
  ${arms(mood)}
  <!-- Hörner und Zacken -->
  <path d="M66 46 C56 26 62 14 70 12 C70 26 78 36 84 42 Z" fill="${C.horn}" stroke="${C.hornLine}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M134 46 C144 26 138 14 130 12 C130 26 122 36 116 42 Z" fill="${C.horn}" stroke="${C.hornLine}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M88 38 L94 22 L100 36 L106 20 L112 38 Z" fill="#ffb3c1" stroke="#e5869a" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Kopf -->
  <ellipse cx="100" cy="80" rx="52" ry="44" fill="${C.body}" stroke="${C.line}" stroke-width="3"/>
  <ellipse cx="100" cy="100" rx="28" ry="18" fill="${C.snout}"/>
  <ellipse cx="91" cy="94" rx="3" ry="2.2" fill="${C.line}"/><ellipse cx="109" cy="94" rx="3" ry="2.2" fill="${C.line}"/>
  <ellipse cx="62" cy="96" rx="9" ry="6" fill="${C.cheek}" opacity=".65"/>
  <ellipse cx="138" cy="96" rx="9" ry="6" fill="${C.cheek}" opacity=".65"/>
  ${eyes(mood)}
  ${mouth(mood)}
  ${sparkles(mood)}
</svg>`;
}

export function elmaEl(mood = 'hallo', size = '') {
  const wrap = h('div', { class: `elma ${size}` });
  wrap.append(svg(elmaMarkup(mood)));
  return wrap;
}

/** Elma mit Sprechblase. Liest den Text vor, wenn autoSpeak an ist. */
export function elmaSays(text, { mood = 'hallo', size = 'small', speakNow = true, bob = false } = {}) {
  const fig = elmaEl(mood, size + (bob ? ' bob' : ''));
  const txt = h('div', { class: 'bubble-text' }, text);
  const bubble = h('div', { class: 'bubble', onclick: () => speak(txt.textContent) }, txt);
  const row = h('div', { class: 'elma-row' }, fig, bubble);
  row.set = (newText, newMood) => {
    txt.textContent = newText;
    if (newMood) fig.replaceChildren(svg(elmaMarkup(newMood)));
    if (state.global.autoSpeak) speak(newText);
  };
  if (speakNow && state.global.autoSpeak) speak(text);
  return row;
}

/** Zufälliger Satz aus content/elma-saetze.json; {name} wird ersetzt. */
export function line(kind, vars = {}) {
  const list = elmaTexts()[kind];
  const t = Array.isArray(list) && list.length ? pickOne(list) : '';
  return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
