// ----- horoscope SW v30 : 強制リフレッシュ & 全キャッシュ削除 -----

const CACHE_VERSION = 'v30';
const CACHE_NAME = `horoscope-cache-${CACHE_VERSION}`;

// GitHub Pages のプロジェクトルート
const ROOT = '/horoscope-100pct/';

// コアファイル（最低限オフラインで必要なもの）
const CORE_ASSETS = [
  `${ROOT}`,
  `${ROOT}index.html`,
  `${ROOT}manifest.json?v=9`,
  `${ROOT}icon-192.png`,
  `${ROOT}icon-512.png`,
];

// ----- install -----
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE_ASSETS); } catch (_) {}
    await self.skipWaiting();
  })());
});

// ----- activate -----
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // 古いキャッシュを全部削除
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// ----- fetch -----
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // ページ遷移（HTML）はネット優先
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        cache.put(`${ROOT}`, fresh.clone()).catch(() => {});
        cache.put(`${ROOT}index.html`, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const fallback =
          (await cache.match(`${ROOT}`)) ||
          (await cache.match(`${ROOT}index.html`));
        return fallback || new Response('<h1>オフライン</h1>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // 同一オリジンの静的ファイルはキャッシュ優先
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      try {
        const res = await fetch(req);
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  // 外部リソース（CDN等）はネット優先
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const res = await fetch(req);
      if (res && (res.status === 200 || res.type === 'opaque')) {
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      const cached = await cache.match(req);
      if (cached) return cached;
      throw new Error('network error');
    }
  })());
});
