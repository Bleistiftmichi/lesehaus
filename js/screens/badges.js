// Abzeichen-Regal.

import { h, iconButton, speakerButton } from '../ui.js';
import { state } from '../store.js';
import { badgeList } from '../content.js';
import { go } from '../router.js';
import { speak } from '../speech.js';

export function badgesScreen() {
  const got = state.progress.badges;
  const list = badgeList();
  const n = list.filter((b) => got[b.id]).length;
  const title = 'Deine Abzeichen';
  return h('div', { class: 'screen narrow' },
    h('div', { class: 'topbar' },
      iconButton('home', () => go('home'), { label: 'Zur Startseite' }),
      h('div', { class: 'title' }, `${title} (${n}/${list.length})`),
      speakerButton(`Du hast ${n} von ${list.length} Abzeichen.`)),
    h('div', { class: 'scroll' }, h('div', { class: 'badges' }, list.map((b) => h('button', {
      class: 'badge' + (got[b.id] ? '' : ' locked'),
      onclick: () => speak(got[b.id] ? `${b.titel}. ${b.text}` : `Noch nicht geschafft: ${b.text}`),
    }, h('span', { class: 'badge-icon' }, b.icon), h('span', {}, b.titel))))));
}
