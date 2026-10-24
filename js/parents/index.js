// Elternbereich: Rahmen mit Reitern und Auswahl des Kindes.

import { h, iconButton } from '../ui.js';
import { state, applyLook } from '../store.js';
import { go } from '../router.js';
import { progressTab } from './progress.js';
import { settingsTab } from './settings.js';
import { kidsTab } from './kids.js';
import { contentTab } from './own-content.js';
import { backupTab, infoTab } from './backup.js';

const TABS = [
  ['fortschritt', 'Fortschritt', progressTab],
  ['einstellungen', 'Einstellungen', settingsTab],
  ['kinder', 'Kinder', kidsTab],
  ['inhalte', 'Eigene Inhalte', contentTab],
  ['sicherung', 'Sicherung', backupTab],
  ['info', 'Info', infoTab],
];

export function parentsScreen({ tab = 'fortschritt', neu = false } = {}) {
  let current = tab;
  let profileId = state.profile?.id || state.profiles[0]?.id || null;

  const tabsEl = h('div', { class: 'tabs', role: 'tablist' });
  const body = h('div', { class: 'scroll' });
  const kidSel = h('div');

  const ctx = {
    get profile() { return state.profiles.find((p) => p.id === profileId) || null; },
    rerender: () => render(),
    neu,
  };

  const renderKidSel = () => {
    const needsKid = ['fortschritt', 'einstellungen'].includes(current) && state.profiles.length > 1;
    kidSel.replaceChildren(needsKid ? h('label', { class: 'field', style: { margin: '0 0 8px' } }, 'Kind',
      h('select', { onchange: (e) => { profileId = e.target.value; render(); } },
        state.profiles.map((p) => h('option', { value: p.id, selected: p.id === profileId }, p.name)))) : '');
  };

  const render = async () => {
    if (!state.profiles.some((p) => p.id === profileId)) profileId = state.profiles[0]?.id || null;
    tabsEl.replaceChildren(...TABS.map(([key, label]) => h('button', {
      role: 'tab', class: key === current ? 'sel' : '', 'aria-selected': key === current,
      onclick: () => { current = key; ctx.neu = false; render(); },
    }, label)));
    renderKidSel();
    const fn = TABS.find(([k]) => k === current)[2];
    const top = body.scrollTop;
    body.replaceChildren(await fn(ctx));
    body.scrollTop = top;
  };

  const leave = () => {
    applyLook();
    if (!state.profiles.length) return go('onboarding');
    if (!state.profile) return go('profiles');
    go('home');
  };

  render();
  return h('div', { class: 'screen parents narrow' },
    h('div', { class: 'topbar' },
      iconButton('back', leave, { label: 'Elternbereich verlassen' }),
      h('div', { class: 'title' }, 'Elternbereich')),
    tabsEl, kidSel, body);
}
