// Service Worker: speichert alle Dateien der App auf dem Gerät, damit sie offline läuft.
//
// WICHTIG bei Änderungen:
// 1. VERSION erhöhen (auch in js/version.js) – sonst bekommt das iPhone das Update nicht.
// 2. Neue Dateien unten in ASSETS eintragen (`npm run check` prüft das).

const VERSION = '1.0.0';
const CACHE = 'lesehaus-' + VERSION;

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/main.js',
  'js/version.js',
  'js/db.js',
  'js/store.js',
  'js/content.js',
  'js/router.js',
  'js/speech.js',
  'js/sounds.js',
  'js/ui.js',
  'js/elma.js',
  'js/avatars.js',
  'js/syll.js',
  'js/levels.js',
  'js/screens/onboarding.js',
  'js/screens/profiles.js',
  'js/screens/home.js',
  'js/screens/result.js',
  'js/screens/badges.js',
  'js/exercises/runner.js',
  'js/exercises/silben.js',
  'js/exercises/blitz.js',
  'js/exercises/texte.js',
  'js/parents/index.js',
  'js/parents/pin.js',
  'js/parents/form.js',
  'js/parents/progress.js',
  'js/parents/settings.js',
  'js/parents/kids.js',
  'js/parents/own-content.js',
  'js/parents/backup.js',
  'content/words.json',
  'content/blitz-saetze.json',
  'content/badges.json',
  'content/elma-saetze.json',
  'content/stories/stufe-1.json',
  'content/stories/stufe-2.json',
  'content/stories/stufe-3.json',
  'content/stories/stufe-4.json',
  'content/stories/stufe-5.json',
  'content/stories/stufe-6.json',
  'assets/fonts/Andika-Regular.ttf',
  'assets/fonts/Andika-Bold.ttf',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' umgeht den HTTP-Cache, damit wirklich die neue Version geladen wird.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('lesehaus-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Die App fragt per Knopf „Neu laden“ nach dem Update.
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Erst im Cache nachsehen, sonst aus dem Netz holen (und für später merken).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (e) {
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
