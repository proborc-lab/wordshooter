/* Wordshooter — service worker: installeerbaar + offline.
 *
 * Stale-while-revalidate: geef direct uit de cache terug en ververs op de
 * achtergrond. Een nieuwe deploy is daardoor na één herlaadbeurt binnen —
 * geen versie-bump nodig. De pagina zelf halen we network-first op.
 *
 * Alle paden relatief: het spel woont in een submap (/wordshooter/) en hoort
 * niet te weten in welke. Een leidende "/" zou vanaf de web-root zoeken.
 *
 * De JS-modules en woordenlijst-CSV's worden vanzelf gecached zodra ze de
 * eerste keer (online) geladen worden; daarna speelt het spel ook offline.
 */
const CACHE = 'wordshooter-v1';
const SHELL = [
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './css/style.css',
  './js/main.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // niets van buiten cachen

  if (req.mode === 'navigate') {
    // Pagina: network-first, val terug op de cache als er geen internet is.
    e.respondWith(
      fetch(req)
        .then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // De rest: stale-while-revalidate.
  e.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
