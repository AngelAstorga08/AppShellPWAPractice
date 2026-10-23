const cacheName = 'products-v5';
const staticAssets = [
    './index.html',
    './app.js',
    './app.css',
    './manifest.webmanifest'
];

self.addEventListener('install', e => {
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        await cache.addAll(staticAssets);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', e => {
    e.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names.filter(name => name !== cacheName).map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;
    e.respondWith(cacheFirst(req));
});

async function cacheFirst(req){
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try{
        const fresh = await fetch(req);
        if (fresh.ok) await cache.put(req, fresh.clone());
        return fresh;
    }
    catch(e){
        if (req.mode === 'navigate') {
            return await cache.match('./index.html') || Response.error();
        }
        return Response.error();
    }
}
