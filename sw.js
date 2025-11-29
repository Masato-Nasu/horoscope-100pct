// Cache Name: バージョンを変えると更新されます
const CACHE_NAME = 'horoscope-100pct-2-v2025-astronomy-2';

// キャッシュするファイル一覧
const urlsToCache = [
  '/horoscope-100pct-2/',
  '/horoscope-100pct-2/index.html',
  '/horoscope-100pct-2/manifest.json',
  '/horoscope-100pct-2/splash.css',
  '/horoscope-100pct-2/splash.js',
  '/horoscope-100pct-2/icon-192.png',
  '/horoscope-100pct-2/icon-512.png',
  // ★重要: 天文計算ライブラリもキャッシュする（オフライン対応用）
  'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークに取りに行く
        return fetch(event.request);
      })
  );
});

// 古いキャッシュを削除する処理
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});