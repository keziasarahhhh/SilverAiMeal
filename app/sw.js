// Offline app shell: cache-first for same-origin files, network for CDNs.
const CACHE = 'silvermeal-v1';
const SHELL = [
  './', './index.html', './app.css', './app.js', './i18n.js', './icon.svg', './manifest.webmanifest',
  '../core/expiry.js', '../core/foods.js', '../core/planner.js', '../core/waste.js', '../core/seed.js', '../core/claude.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // network-first so updates show up, falling back to cache offline
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
