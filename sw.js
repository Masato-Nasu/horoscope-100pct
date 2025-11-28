// Simple cache-first service worker for horoscope-100pct
const CACHE_NAME = 'horoscope-v2025-astronomy-v14';

const URLS_TO_CACHE = [
  '/horoscope-100pct/',
  '/horoscope-100pct/index.html',
  '/horoscope-100pct/manifest.json',
  '/horoscope-100pct/icon-192.png',
  '/horoscope-100pct/icon-512.png',
  'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.0/astronomy.browser.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
