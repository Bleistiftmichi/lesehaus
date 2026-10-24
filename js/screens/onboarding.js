// Erster Start: Elma stellt sich vor, Erwachsene legen PIN und erstes Kinderprofil an.

import { h, icon } from '../ui.js';
import { elmaEl, line } from '../elma.js';
import { speak } from '../speech.js';
import { state, saveGlobal } from '../store.js';
import { pinSetup, setPin } from '../parents/pin.js';
import { profileForm, createProfileAndSelect } from './profiles.js';
import { go } from '../router.js';

export function onboardingScreen() {
  const screen = h('div', { class: 'screen narrow' });

  const step1 = () => {
    const text = line('vorstellung');
    const bubble = h('div', { class: 'bubble', style: { marginBottom: 0, flex: '0 0 auto', width: '100%' }, onclick: () => speak(text) }, h('div', { class: 'bubble-text' }, text));
    screen.replaceChildren(
      h('div', { class: 'grow center', style: { gap: '18px' } },
        elmaEl('hallo', 'big bob'),
        bubble,
        h('button', { class: 'btn big', onclick: () => { speak(text); step2(); } }, 'Los geht\'s', icon('next'))),
    );
  };

  const step2 = () => {
    const box = h('div', { class: 'parents', style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
    screen.replaceChildren(
      h('div', { class: 'scroll' },
        h('div', { class: 'parents card' },
          h('h3', {}, 'Für Erwachsene: Einrichten'),
          h('p', {}, 'Der Elternbereich (Einstellungen, Fortschritt, eigene Wörter, Sicherung) ist mit einer 4-stelligen PIN und einer kleinen Rechenaufgabe geschützt.'),
          h('p', { class: 'small muted' }, 'Alle Daten bleiben nur auf diesem Gerät. Die App sendet nichts ins Internet.')),
        box));
    pinSetup(box).then(async (pin) => {
      await setPin(pin);
      step3();
    });
  };

  const step3 = () => {
    screen.replaceChildren(h('div', { class: 'scroll' },
      h('div', { class: 'parents card' }, h('h3', {}, 'Erstes Kind anlegen'),
        h('p', { class: 'small muted' }, 'Weitere Kinder kannst du später im Elternbereich hinzufügen.')),
      profileForm({
        saveLabel: 'Fertig',
        onSave: async (data) => {
          await createProfileAndSelect(data);
          state.global.onboarded = true;
          await saveGlobal();
          go('home', { first: true });
        },
      })));
  };

  step1();
  return screen;
}
