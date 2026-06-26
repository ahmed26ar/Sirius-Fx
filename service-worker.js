const CACHE = 'sirius-fx-v1';
const STATIC = [
  '/',
  '/index.html',
  '/ai-hub.html',
  '/ai-analyzer.html',
  '/alerts.html',
  '/signals.html',
  '/admin.html',
  '/css/main.css',
  '/js/config.js',
  '/js/i18n.js',
  '/js/theme.js',
  '/js/app.js',
  '/js/chart.js',
  '/js/ticker.js',
  '/js/news.js',
  '/js/trading-tools.js',
  '/js/ai-tools.js',
  '/js/market-chat.js',
  '/assets/logo_new_png.png',
  '/assets/icon-sirius.svg',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls — network first
  if (url.hostname.includes('firebaseio') || url.hostname.includes('workers.dev') || url.hostname.includes('googleapis')) {
    return e.respondWith(networkFirst(e.request));
  }

  // External resources — stale-while-revalidate
  if (url.hostname !== self.location.hostname) {
    return e.respondWith(staleWhileRevalidate(e.request));
  }

  // Static assets — cache first
  e.respondWith(cacheFirst(e.request));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  return networkAndCache(req);
}

async function networkFirst(req) {
  try {
    return await networkAndCache(req);
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchP = networkAndCache(req).catch(() => {});
  return cached || fetchP;
}

async function networkAndCache(req) {
  const res = await fetch(req);
  if (res.ok) {
    const clone = res.clone();
    caches.open(CACHE).then(c => c.put(req, clone));
  }
  return res;
}
