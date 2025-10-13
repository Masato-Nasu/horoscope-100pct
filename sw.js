/* sw.js v50 */
const CACHE_VERSION='v50';const APP_CACHE='horoscope-'+CACHE_VERSION;
const ASSETS=['./','index.html?v=50','manifest.json','icon-192.png','icon-512.png','splash.css','splash.js','favicon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(APP_CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==APP_CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});