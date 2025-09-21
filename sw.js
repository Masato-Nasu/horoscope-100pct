/* 100% 星占い — Service Worker
   使い方: ルートに sw.js を置き、index.html 側は ./sw.js?v=20 のようにクエリでバージョン付与
*/
const CACHE_VERSION = 'v23';                  // ← index.html の ?v=20 と合わせると分かりやすい
const CACHE_NAME = `horoscope-cache-${CACHE_VERSION}`;

// 同一オリジンのみ事前キャッシュ（CDNはランタイムで取得：CORS/opaque絡みを避けるため）
const CORE_ASSETS = [
  './',                 // index.html
  './index.html',       // 明示
  './manifest.json?v=4',
  './icon-192.png',
];

// インストール：コアをプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    // すぐ有効化
    await self.skipWaiting();
  })());
});

// 有効化：古いキャッシュを掃除
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// フェッチ戦略
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // POST などはスルー
  if (req.method !== 'GET') return;

  // ナビゲーション（HTML）：キャッシュ優先→失敗したらネット→最後にオフライン簡易ページ
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('./');
      try {
        const fresh = await fetch(req);
        // 成功したら新鮮版をキャッシュ差し替え
        cache.put('./', fresh.clone());
        return fresh;
      } catch (_) {
        if (cached) return cached;
        // 簡易オフライン応答
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

  // 同一オリジンの静的ファイル：Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = (async () => {
        try {
          const res = await fetch(req);
          // 成功した GET はキャッシュを最新化
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        } catch (_) {
          // ネット失敗時はキャッシュにフォールバック
          return cached || Promise.reject(_);
        }
      })();
      // まずキャッシュ（あれば即時表示）、裏で更新
      return cached || fetchPromise;
    })());
    return;
  }

  // サードパーティ（CDN 等）：ネット優先、失敗時のみキャッシュにフォールバック
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const res = await fetch(req);
      // 200系レスポンスは（opaque含め）一応キャッシュしておく
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


