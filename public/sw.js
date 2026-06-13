/*
 * BeanCircle service worker
 * ─────────────────────────
 * Responsibilities:
 *   1. Web Push delivery + notification click handling (unchanged behaviour).
 *   2. App-shell / static-asset caching for offline support & speed.
 *   3. Versioned caches with automatic cleanup of old versions.
 *   4. Controlled update flow (waits for the app to send SKIP_WAITING).
 *
 * Bump CACHE_VERSION on any change to this file or the precached assets to
 * invalidate old caches and trigger the in-app "New version available" prompt.
 */

const CACHE_VERSION = 'v1.0.0';
const PRECACHE = `bc-precache-${CACHE_VERSION}`;
const STATIC_CACHE = `bc-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `bc-images-${CACHE_VERSION}`;
const RUNTIME_CACHE = `bc-runtime-${CACHE_VERSION}`;
const CURRENT_CACHES = [PRECACHE, STATIC_CACHE, IMAGE_CACHE, RUNTIME_CACHE];

const OFFLINE_URL = '/offline.html';

// Minimal app shell needed to render the offline experience. Kept tiny and
// resilient — a single 404 must not abort the whole install.
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const IMAGE_CACHE_LIMIT = 60;
const RUNTIME_CACHE_LIMIT = 50;

/* ── Install: precache the offline shell ──────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })),
        ),
      );
      // Note: we intentionally do NOT skipWaiting() here. A new worker stays in
      // the "waiting" state so the app can show an update prompt and activate it
      // on the user's command. First installs have no controller and activate
      // immediately regardless.
    })(),
  );
});

/* ── Activate: claim clients and drop stale caches ────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('bc-') && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/* ── Update flow: app asks us to take over immediately ────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ── Caching strategies ───────────────────────────────────────────────────── */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
        if (limit) trimCache(cacheName, limit);
      }
      return response;
    })
    .catch(() => undefined);
  return cached || network || fetch(request);
}

async function networkFirstNavigation(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;
    return await fetch(event.request);
  } catch {
    const cache = await caches.open(PRECACHE);
    const offline = await cache.match(OFFLINE_URL);
    return (
      offline ||
      new Response('You are offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

/* ── Fetch routing ────────────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever touch GETs over http(s); leave everything else (POST mutations,
  // chrome-extension://, etc.) to the network untouched.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // App navigations: network-first with an offline fallback page. We never
  // cache HTML so authenticated, locale-aware pages are always fresh.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  // Cross-origin (API, map tiles, object storage) — go straight to the network.
  // Caching authenticated/opaque cross-origin responses is unsafe by default.
  if (url.origin !== self.location.origin) return;

  // Hashed, immutable build output & self-hosted fonts → cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/font/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Optimised images → stale-while-revalidate with a bounded cache.
  if (
    url.pathname.startsWith('/_next/image') ||
    /\.(?:png|jpg|jpeg|webp|avif|gif|svg)$/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, IMAGE_CACHE_LIMIT));
    return;
  }

  // Everything else same-origin (RSC payloads, public assets) → SWR.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, RUNTIME_CACHE_LIMIT));
});

/* ── Web Push (unchanged) ─────────────────────────────────────────────────── */
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_e) {
      payload = { title: 'BeanCircle', body: event.data.text() };
    }
  }

  const title = payload.title || 'BeanCircle';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag: payload.tag,
    data: { url: payload.url || '/' },
    renotify: Boolean(payload.tag),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ('focus' in client) {
          try {
            await client.navigate(url);
          } catch (_e) {
            /* navigate can reject cross-origin; fall back to focus */
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })(),
  );
});
