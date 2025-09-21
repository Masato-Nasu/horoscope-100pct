// ----- horoscope SW v28 : force refresh & purge old caches -----

const CACHE_VERSION = 'v28';
const CACHE_NAME = `horoscope-cache-${CACHE_VERSION}`;

// ルートは GitHub Pages のプロジェクトパスに合わせる
const ROOT = '/horoscope-100pct/';

// 起動時に最低限使うファイル（絶対パス）
const CORE_ASSETS = [
  `${ROOT}`,
  `${ROOT}index.html`,
  `${ROOT}manifest.json?v=9`,
  `${ROOT}icon-192.png`,
  `${ROOT}icon-512.png`,
];

// ----- install: 先にコアだけ入れて、即アクティブ化 -----
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE_ASSETS); } catch (_) {}
    await self.skipWaiting();
  })());
});

// ----- activate: 既存キャッシュを**全削除**して最新に統一 -----
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // 旧キャッシュをすべて削除（名前問わず）
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// ----- fetch: ナビゲーションはネット優先。失敗時だけキャッシュ -----
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 1) ページ遷移（アプリ本体のHTML）
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        // ルートHTMLを最新に更新
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

  // 2) 同一オリジンの静的ファイル（アイコン/manifest等）
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

  // 3) 外部CDN（astronomy-engine等）はネット優先、失敗時のみキャッシュ
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
