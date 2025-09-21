const CACHE_NAME = "hoshi-cache-v3";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

// インストール時にキャッシュ
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// リクエストをキャッシュから返す（なければネットワーク）
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


