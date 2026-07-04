var CACHE_NAME = 'sirius-fx-v1';
var urlsToCache = [
  '/',
  '/index.html',
  '/ai-hub.html',
  '/alerts.html',
  '/ai-analyzer.html',
  '/admin.html',
  '/signals.html',
  '/css/main.css',
  '/js/config.js',
  '/js/icon.js',
  '/js/i18n.js',
  '/js/trading-tools.js',
  '/js/ai-tools.js',
  '/js/behavioral-flags.js',
  '/js/risk-planner.js',
  '/js/market-chat.js',
  '/js/chart.js',
  '/js/news.js',
  '/js/effects.js',
  '/js/market-dashboard.js',
  '/js/trading-sessions.js',
  '/assets/logo_new_png.png',
  '/assets/logo.svg',
  '/assets/og-image.jpg',
  '/assets/icons/sprite.svg',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) return response;
      return fetch(event.request).then(function(networkResponse) {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') return networkResponse;
        var responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          if (event.request.url.indexOf('chrome-extension') === -1) {
            cache.put(event.request, responseToCache);
          }
        });
        return networkResponse;
      }).catch(function() {
        if (event.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
