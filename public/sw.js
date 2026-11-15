// public/sw.js
// Gram Samadhan — Offline Service Worker
// Enables rural offline browsing, fast asset retrieval, and network resilience.

const CACHE_NAME = 'gram-samadhan-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

// Install: Cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Purge old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy
//   • Static hashed assets (/assets/): Cache-first
//   • HTML navigation requests: Network-first with cache fallback
//   • API requests (functions/v1/): Network-only (no caching of sensitive grievance data)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache POST requests or external API calls
  if (event.request.method !== 'GET') return;
  if (url.pathname.includes('/functions/v1/') || url.pathname.includes('/auth/v1/')) {
    return;
  }

  // 1. Static hashed assets (Cache-first)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 2. HTML navigation requests (Network-first with index.html fallback for SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.status === 404) {
            return caches.match('/index.html').then((cached) => cached || res);
          }
          return res;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. General static requests (Stale-while-revalidate)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

