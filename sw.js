/* 100% 星占い — Service Worker */
const CACHE_VERSION = 'v26';                 // index.html の ?v= と合わせる
const CACHE_NAME = `horoscope-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json?v=8',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('./');
      try {
        const fresh = await fetch(req);
        cache.put('./', fresh.clone());
        return fresh;
      } catch (_) {
        if (cached) return cached;
        return new Response(
          `<!doctype html><meta charset="utf-8"><title>オフライン</title>
           <body style="font-family:system-ui;padding:16px">
             <h1>オフラインです</h1>
             <p>ネットワークに接続してもう一度お試しください。</p>
           </body>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = (async () => {
        try {
          const res = await fetch(req);
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        } catch (_) {
          return cached || Promise.reject(_);
        }
      })();
      return cached || fetchPromise;
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const res = await fetch(req);
      if (res && (res.status === 200 || res.type === 'opaque')) {
        cache.put(req, res.clone());
      }
      return res;
    } catch (_) {
      const cached = await cache.match(req);
      if (cached) return cached;
      throw _;
    }
  })());
});


