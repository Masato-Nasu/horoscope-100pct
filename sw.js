/* sw.js v41 */
const CACHE_VERSION='v41';
const APP_CACHE='horoscope-'+CACHE_VERSION;
const ASSETS=['./','./index.html?v=41','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(APP_CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys(); await Promise.all(ks.filter(k=>k!==APP_CACHE).map(k=>caches.delete(k))); await self.clients.claim();})());});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
