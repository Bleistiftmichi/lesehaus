// Startpunkt der App.

import { state, load, applyLook } from './store.js';
import { loadContent } from './content.js';
import { initSpeech } from './speech.js';
import { requestPersist } from './db.js';
import { register, go } from './router.js';
import { h } from './ui.js';
import { onboardingScreen } from './screens/onboarding.js';
import { profilesScreen } from './screens/profiles.js';
import { homeScreen } from './screens/home.js';
import { resultScreen } from './screens/result.js';
import { badgesScreen } from './screens/badges.js';
import { silbenScreen } from './exercises/silben.js';
import { blitzScreen } from './exercises/blitz.js';
import { texteScreen } from './exercises/texte.js';
import { parentsScreen } from './parents/index.js';

register('onboarding', onboardingScreen);
register('profiles', profilesScreen);
register('home', homeScreen);
register('result', resultScreen);
register('badges', badgesScreen);
register('silben', silbenScreen);
register('blitz', blitzScreen);
register('texte', texteScreen);
register('parents', parentsScreen);

// Pinch-Zoom und Doppeltipp-Zoom auf iOS unterdrücken.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

async function start() {
  await load();
  await loadContent();
  initSpeech({ rate: state.global.speechRate, voiceURI: state.global.voiceURI });
  applyLook();
  requestPersist();

  if (!state.global.onboarded) return go('onboarding');
  if (state.profile && state.profiles.length === 1) return go('home');
  return go('profiles');
}

start().catch((e) => {
  console.error(e);
  document.getElementById('app').replaceChildren(h('div', { class: 'screen center' },
    h('p', {}, 'Oh! Beim Starten ist etwas schiefgegangen.'),
    h('p', { class: 'muted small' }, String(e.message || e)),
    h('button', { class: 'btn', onclick: () => location.reload() }, 'Neu laden')));
});

// ---------- Offline-Betrieb und Updates ----------

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const offer = (worker) => showUpdateBanner(worker);
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) offer(nw);
      });
    });
    // iPhone-Apps prüfen selten von selbst: beim Zurückkehren in die App nachsehen.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch((e) => console.warn('Service Worker nicht registriert', e));

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
}

function showUpdateBanner(worker) {
  if (document.querySelector('.update-banner.sw')) return;
  const banner = h('div', { class: 'update-banner sw', role: 'status' },
    h('span', {}, 'Neue Version verfügbar'),
    h('button', { class: 'btn', onclick: () => worker.postMessage('skipWaiting') }, 'Neu laden'),
  );
  document.body.append(banner);
}
