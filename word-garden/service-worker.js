/* =========================================================
   service-worker.js
   Caches the app shell + word data so it works offline on
   the iPad after first load (handy in the car, no wifi etc).

   IMPORTANT when you add new letter JSON files: bump
   CACHE_VERSION so returning devices fetch the new files
   instead of serving a stale cached list.
   ========================================================= */
const CACHE_VERSION = 'word-garden-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/garden.css',
  './css/games.css',
  './js/core/storage.js',
  './js/core/speech.js',
  './js/core/progress.js',
  './js/core/wordDataLoader.js',
  './js/core/parentGate.js',
  './js/core/dailyChallenge.js',
  './js/core/router.js',
  './js/games/shared.js',
  './js/games/listenChoose.js',
  './js/games/missingLetter.js',
  './js/games/wordBuilder.js',
  './js/games/sentenceBuilder.js',
  './js/games/letterTrace.js',
  './js/games/memoryGame.js',
  './js/games/speedQuiz.js',
  './js/games/playRouter.js',
  './js/ui/onboarding.js',
  './js/ui/gardenView.js',
  './js/ui/letterPicker.js',
  './js/ui/wordDetail.js',
  './js/ui/gamesHub.js',
  './js/ui/challenge.js',
  './js/ui/parentDashboard.js',
  './js/app.js',
  './data/words/index.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Cache word-data JSON on the fly so newly-added letter
          // files get picked up without needing a full re-deploy cache bump.
          if (event.request.url.includes('/data/words/')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
