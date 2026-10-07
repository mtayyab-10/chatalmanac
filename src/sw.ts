/**
 * src/sw.ts — Service Worker for Chatalmanac
 *
 * Strategy: cache-first for static assets, network-only for nothing
 * (the site makes no network requests after initial load).
 *
 * This service worker:
 * - Caches all static assets on install
 * - Serves from cache on every request (offline-capable)
 * - Never sends any data to a network — there is no network request to make
 * - Updates silently when a new version is deployed
 *
 * Privacy note: a service worker intercepts ALL requests from the page.
 * This one only handles its own cached assets. It never forwards or logs
 * any data from the user's file analysis.
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'chatalmanac-v1';

// Assets to pre-cache on install. Vite's build manifest would normally
// populate this list — for now we cache the app shell.
const PRECACHE_URLS: string[] = [
  '/',
  '/index.html',
];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Pre-cache the app shell
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch {
        // If pre-caching fails (e.g. offline during SW registration), continue
      }
      // Activate immediately rather than waiting for old tabs to close
      return self.skipWaiting();
    }),
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      // Delete caches from old versions
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key)),
      );
      // Take control of all open clients immediately
      return self.clients.claim();
    }),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests.
  // This implicitly blocks any external requests the page might attempt.
  if (url.origin !== self.location.origin) {
    // External request — do NOT fetch it.
    // Return a 403 to make the failure explicit rather than a network error.
    event.respondWith(
      Promise.resolve(
        new Response('Blocked by service worker: external requests are disabled.', {
          status: 403,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );
    return;
  }

  // Network-first strategy for navigation requests (ensures new deployments update smoothly)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const indexCached = await caches.match('/index.html');
          if (indexCached) return indexCached;
          return new Response('Offline — the app shell was not cached yet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }),
    );
    return;
  }

  // Cache-first strategy for same-origin static assets
  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache the response
      try {
        const response = await fetch(event.request);
        if (response.ok && event.request.method === 'GET') {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return new Response('Offline resource unavailable.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }),
  );
});
