const CACHE_NAME = 'horoscope-v6-20260807b';

const urlsToCache = [
  '/horoscope-100pct/',
  '/horoscope-100pct/index.html',
  '/horoscope-100pct/manifest.json',
  '/horoscope-100pct/splash.css',
  '/horoscope-100pct/splash.js',
  '/horoscope-100pct/icon-192.png',
  '/horoscope-100pct/icon-512.png',
  '/horoscope-100pct/v6-core.js',
  '/horoscope-100pct/v6-guide.js',
  '/horoscope-100pct/v6-app.js',
  'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => cacheName === CACHE_NAME ? null : caches.delete(cacheName))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
