// Startseite eines Kindes: Elma, drei Übungen, Sterne, Abzeichen.

import { h, iconButton, starCount } from '../ui.js';
import { elmaSays, line } from '../elma.js';
import { state, settings, secondsToday, limitReached, MAX_LEVEL } from '../store.js';
import { avatarEl } from '../avatars.js';
import { go } from '../router.js';
import { parentGate } from '../parents/pin.js';
import { isUnlocked, speak } from '../speech.js';
import { play } from '../sounds.js';

const TILES = [
  { ex: 'silben', icon: '🧩', label: 'Silben', say: 'Silben und Wörter' },
  { ex: 'blitz', icon: '⚡', label: 'Blitzlesen', say: 'Blitzlesen' },
  { ex: 'texte', icon: '📖', label: 'Geschichten', say: 'Geschichten' },
];

export function homeScreen() {
  if (!state.profile) { go('profiles'); return h('div'); }
  const p = state.profile;
  const pr = state.progress;
  const blocked = limitReached();

  const top = h('div', { class: 'topbar' },
    h('button', {
      class: 'btn round light', style: { padding: 0, overflow: 'hidden' }, 'aria-label': 'Profil wechseln',
      onclick: () => go('profiles'),
    }, avatarEl(p.tier, 'sm')),
    h('span', { class: 'spacer' }),
    starCount(pr.stars),
    iconButton('lock', async () => { if (await parentGate()) go('parents'); }, { label: 'Elternbereich' }),
  );

  const greeting = blocked ? line('pause') : line('begruessung', { name: p.name });
  const elma = elmaSays(greeting, { mood: blocked ? 'denkt' : 'hallo', size: 'big', bob: true, speakNow: isUnlocked() });

  const goalMin = settings().dailyGoal;
  const minutes = Math.floor(secondsToday() / 60);
  const goal = goalMin > 0 ? h('div', { class: 'goal', 'aria-label': `Heute ${minutes} von ${goalMin} Minuten` },
    h('span', {}, '🎯'),
    h('div', { class: 'goal-bar' }, h('div', { style: { width: Math.min(100, minutes / goalMin * 100) + '%' } })),
    h('span', {}, minutes >= goalMin ? '✓' : `${minutes}/${goalMin}`)) : null;

  const tiles = h('div', { class: 'tiles' }, TILES.map((t) => {
    const stufe = pr.levels[t.ex].stufe;
    return h('button', {
      class: `tile ${t.ex}`, disabled: blocked, 'aria-label': `${t.say}, Stufe ${stufe}`,
      onclick: () => { play('klick'); speak(t.say); go(t.ex); },
    },
    h('span', { class: 'tile-icon', style: { fontSize: '52px', lineHeight: '64px', textAlign: 'center' } }, t.icon),
    h('span', { class: 'tile-label' }, t.label,
      h('span', { class: 'level', 'aria-hidden': 'true' }, Array.from({ length: MAX_LEVEL }, (_, i) => h('i', { class: i < stufe ? 'on' : '' })))));
  }));

  const small = h('div', { class: 'home-small' },
    h('button', { class: 'tile abzeichen', onclick: () => { play('klick'); go('badges'); }, 'aria-label': 'Abzeichen' },
      h('span', { class: 'tile-icon', style: { fontSize: '38px', lineHeight: '46px', textAlign: 'center' } }, '🏅'),
      h('span', { class: 'tile-label' }, Object.keys(pr.badges).length)),
    h('button', { class: 'tile welt', 'aria-label': 'Spielzimmer – kommt bald', onclick: () => elma.set(line('spielweltBald'), 'staunt') },
      h('span', { class: 'tile-icon', style: { fontSize: '38px', lineHeight: '46px', textAlign: 'center' } }, '🏠'),
      h('span', { class: 'tile-label', style: { fontSize: '.8em' } }, 'bald!')),
  );

  return h('div', { class: 'screen narrow' }, top,
    h('div', { class: 'scroll', style: { display: 'flex', flexDirection: 'column', gap: '14px' } }, elma, goal, tiles, small));
}
