// Profilwahl („Wer liest heute?“) und Formular für ein Kinderprofil.

import { h, speakerButton, icon } from '../ui.js';
import { state, selectProfile, addProfile } from '../store.js';
import { avatarEl, ANIMALS } from '../avatars.js';
import { go } from '../router.js';
import { speak } from '../speech.js';
import { parentGate } from '../parents/pin.js';
import { play } from '../sounds.js';

export function profilesScreen() {
  const title = 'Wer liest heute?';
  const cards = state.profiles.map((p) => h('button', {
    class: 'profile-card',
    onclick: async () => {
      play('klick');
      speak('Hallo ' + p.name + '!');
      await selectProfile(p.id);
      go('home');
    },
  }, avatarEl(p.tier), h('span', {}, p.name)));

  const add = h('button', {
    class: 'profile-card', style: { borderStyle: 'dashed', color: 'var(--ink-soft)' }, 'aria-label': 'Kind hinzufügen (Erwachsene)',
    onclick: async () => {
      if (await parentGate()) go('parents', { tab: 'kinder', neu: true });
    },
  }, h('div', { class: 'avatar', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' } }, icon('plus')), h('span', { class: 'small' }, 'Kind hinzufügen'));

  return h('div', { class: 'screen narrow' },
    h('div', { class: 'topbar' }, h('div', { class: 'title' }, title), speakerButton(title)),
    h('div', { class: 'scroll' }, h('div', { class: 'profiles' }, cards, add)),
  );
}

/** Formular: Name + Tierbild. onSave({name, tier}) */
export function profileForm({ name = '', tier = 'pferd', onSave, saveLabel = 'Speichern' }) {
  let chosen = tier;
  const input = h('input', { type: 'text', value: name, maxlength: 20, placeholder: 'Name', autocomplete: 'off', autocapitalize: 'words', 'aria-label': 'Name des Kindes' });
  const pick = h('div', { class: 'avatar-pick' });
  const renderPick = () => pick.replaceChildren(...Object.entries(ANIMALS).map(([key, a]) => h('button', {
    type: 'button', class: key === chosen ? 'sel' : '', 'aria-label': a.name,
    onclick: () => { chosen = key; renderPick(); },
  }, avatarEl(key))));
  renderPick();
  const msg = h('p', { class: 'gate-msg warn' });
  const save = h('button', {
    class: 'btn', onclick: () => {
      const n = input.value.trim();
      if (!n) { msg.textContent = 'Bitte einen Namen eingeben.'; return; }
      onSave({ name: n, tier: chosen });
    },
  }, saveLabel);
  return h('div', { class: 'parents', style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
    h('label', { class: 'field' }, 'Name des Kindes', h('span', { class: 'hint' }, 'Bleibt nur auf diesem Gerät.'), input),
    h('div', { class: 'field' }, h('b', {}, 'Tierbild'), pick),
    msg, save);
}

export async function createProfileAndSelect(data) {
  const p = await addProfile(data);
  await selectProfile(p.id);
  return p;
}
