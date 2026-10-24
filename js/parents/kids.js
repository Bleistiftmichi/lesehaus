// Elternbereich › Kinder (Profile anlegen, ändern, löschen)

import { h, overlay, confirmBox, icon } from '../ui.js';
import { state, addProfile, removeProfile, saveProfiles, selectProfile } from '../store.js';
import { avatarEl } from '../avatars.js';
import { profileForm } from '../screens/profiles.js';
import { section } from './form.js';

export function kidsTab(ctx) {
  const openForm = (p = null) => {
    const ov = overlay(h('div', { class: 'scroll' },
      h('h2', {}, p ? 'Kind bearbeiten' : 'Kind hinzufügen'),
      profileForm({
        name: p?.name || '', tier: p?.tier || 'katze',
        onSave: async (data) => {
          if (p) { Object.assign(p, data); await saveProfiles(); }
          else {
            const np = await addProfile(data);
            if (!state.profile) await selectProfile(np.id);
          }
          ov.close();
          ctx.rerender();
        },
      }),
      h('button', { class: 'btn light', style: { marginTop: '10px', width: '100%' }, onclick: () => ov.close() }, 'Abbrechen')));
  };

  if (ctx.neu) { ctx.neu = false; setTimeout(() => openForm(), 50); }

  return h('div', {},
    section('Kinder',
      state.profiles.map((p) => h('div', { class: 'list-item' },
        avatarEl(p.tier, 'sm'),
        h('div', { class: 'grow' }, h('b', {}, p.name), p.id === state.profile?.id ? h('span', { class: 'chip', style: { marginLeft: '8px' } }, 'aktiv') : null),
        h('button', { class: 'btn light round', 'aria-label': 'Bearbeiten', onclick: () => openForm(p) }, icon('edit')),
        h('button', {
          class: 'btn light round', 'aria-label': 'Löschen',
          onclick: async () => {
            if (await confirmBox(`Profil „${p.name}“ mit allem Fortschritt, allen Sternen und eigenen Inhalten dieses Kindes löschen? Das lässt sich nicht rückgängig machen (außer mit einer Sicherung).`, { yes: 'Löschen', danger: true })) {
              await removeProfile(p.id);
              ctx.rerender();
            }
          },
        }, icon('trash')))),
      h('button', { class: 'btn', style: { marginTop: '12px' }, onclick: () => openForm() }, icon('plus'), 'Kind hinzufügen'),
      h('p', { class: 'muted small' }, 'Namen werden nur auf diesem Gerät gespeichert.')),
  );
}
