const CACHE_NAME = 'horoscope-v7-daily4';

const urlsToCache = [
  '/horoscope-100pct/',
  '/horoscope-100pct/index.html',
  '/horoscope-100pct/manifest.json',
  '/horoscope-100pct/splash.css',
  '/horoscope-100pct/splash.js',
  '/horoscope-100pct/icon-192.png',
  '/horoscope-100pct/icon-512.png',
  '/horoscope-100pct/v6-core.js',
  '/horoscope-100pct/reading.js',
  '/horoscope-100pct/daily.js?v=startup4',
  'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache.map(url => new Request(url, {cache: "reload"})))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => cacheName.startsWith('horoscope-v') && cacheName !== CACHE_NAME ? caches.delete(cacheName) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, {cache: 'reload'}).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/horoscope-100pct/index.html') || Response.error();
    }));
    return;
  }
  event.respondWith(caches.open(CACHE_NAME).then(async cache =>
    await cache.match(event.request) || fetch(event.request)
  ));
});
