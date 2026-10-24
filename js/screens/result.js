// Ergebnis nach einer Übung: Sterne, Lob, neue Abzeichen, Stufenwechsel.

import { h, icon, starsRow } from '../ui.js';
import { elmaEl, line } from '../elma.js';
import { go } from '../router.js';
import { play } from '../sounds.js';
import { speak, isUnlocked } from '../speech.js';

export function resultScreen({ ex, stars, correct, total, levelChange, stufe, badges = [], goalReached }) {
  const parts = [line('runde' + stars)];
  if (levelChange === 'hoch') parts.push(line('stufeHoch', { stufe }));
  if (levelChange === 'runter') parts.push(line('stufeRunter', { stufe }));
  if (goalReached) parts.push(line('tagesziel'));
  if (badges.length) parts.push(line('abzeichen') + ' ' + badges.map((b) => b.titel.replace(/!$/, '')).join(', ') + '!');
  const text = parts.join(' ');

  setTimeout(() => play(stars === 3 || levelChange === 'hoch' ? 'fanfare' : 'stern'), 300);
  if (isUnlocked()) setTimeout(() => speak(text), 900);

  return h('div', { class: 'screen narrow' },
    h('div', { class: 'scroll center', style: { gap: '18px', justifyContent: 'flex-start', paddingTop: '10px' } },
      starsRow(stars),
      total ? h('div', { class: 'muted', 'aria-label': `${correct} von ${total} richtig` }, `${correct} / ${total} ✓`) : null,
      elmaEl(stars >= 2 || levelChange === 'hoch' ? 'freut' : 'ermutigt', 'big'),
      h('div', { class: 'bubble no-tail', onclick: () => speak(text) }, h('div', { class: 'bubble-text' }, text)),
      badges.map((b) => h('div', { class: 'badge-new', onclick: () => speak(b.titel + '. ' + b.text) },
        h('span', { class: 'badge-icon' }, b.icon), h('span', {}, b.titel))),
    ),
    h('div', { class: 'row', style: { justifyContent: 'center' } },
      h('button', { class: 'btn big light', 'aria-label': 'Startseite', onclick: () => go('home') }, icon('home')),
      h('button', { class: 'btn big', 'aria-label': 'Nochmal', onclick: () => go(ex) }, icon('again'))),
  );
}
