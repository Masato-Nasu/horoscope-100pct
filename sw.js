/* sw.js v32 — 2025-09-21 23:14:47 */
const CACHE_VERSION = 'v32';
const APP_CACHE = 'horoscope-app-' + CACHE_VERSION;

const APP_SHELL = [
  '/horoscope-100pct/',
  '/horoscope-100pct/index.html?v=build-202509212314',
  '/horoscope-100pct/manifest.json?v=10',
  '/horoscope-100pct/icon-192.png',
  '/horoscope-100pct/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== APP_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first for HTML; cache-first for others.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  // Ignore cross-origin
  if (url.origin !== location.origin) return;

  const isHTML = req.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(APP_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(APP_CACHE);
        const cached = await cache.match(req) || await cache.match('/horoscope-100pct/');
        return cached || new Response('Offline', {status: 503});
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(APP_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
