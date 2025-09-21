// ----- horoscope SW v31 : キャッシュ刷新 & 通常インストール対応 -----
const CACHE_VERSION = 'v31';
const CACHE_NAME = `horoscope-cache-${CACHE_VERSION}`;
const ROOT = '/horoscope-100pct/';

const CORE_ASSETS = [
  `${ROOT}`,
  `${ROOT}index.html`,
  `${ROOT}manifest.json?v=9`,
  `${ROOT}icon-192.png`,
  `${ROOT}icon-512.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE_ASSETS); } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // 古いキャッシュを全削除（GitHub Pagesの更新反映を確実に）
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // HTMLナビゲーションはネット優先（失敗時はキャッシュfallback）
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

  // 同一オリジンの静的ファイルはキャッシュ優先・バックグラウンド更新
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

  // 外部リソース（CDN等）はネット優先（キャッシュは保険）
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
