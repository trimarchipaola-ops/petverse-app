// Service worker: l'app resta utilizzabile anche offline.
// Strategia "prima la rete": quando c'è connessione si vedono sempre i file aggiornati,
// senza connessione si usa la copia salvata. Le chiamate a Supabase non passano dalla cache.
const CACHE = 'petverse-v3';
const FILES = [
  './',
  './index.html',
  './app.js',
  './config.js',
  './manifest.webmanifest',
  './asset/cane_felice.webp',
  './asset/gatto_felice.webp',
  './asset/cane_volo.webp',
  './asset/coniglio_felice.webp',
  './asset/criceto_felice.webp',
  './asset/uccellino_felice.webp',
  './asset/geco_felice.webp',
  './asset/pianeta_crocchetta.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
