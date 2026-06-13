const CACHE_NAME = 'garden-match-v32';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './landing-overrides.css',
  './game.js',
  './manifest.webmanifest',
  './icon.svg',
  './hero-flower.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './privacy.html',
  './terms.html',
  './credits.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
