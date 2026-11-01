/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { version } from '$service-worker';
import {
  classifyRequest,
  pruneCache,
  MAX_IMMUTABLE_ASSETS,
  MAX_STATIC_ASSETS
} from './lib/pwa/sw-routing';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_STATIC = `indogreen-static-${version}`;
const CACHE_ASSETS = `indogreen-assets-${version}`;

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon-180.png'
];

sw.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE_ASSETS)));
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      for (const key of keys) {
        if (key.startsWith('indogreen-') && key !== CACHE_STATIC && key !== CACHE_ASSETS) {
          await caches.delete(key);
        }
      }
    })
  );
});

sw.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void sw.skipWaiting();
  }
});

sw.addEventListener('fetch', (event) => {
  const classification = classifyRequest({
    url: event.request.url,
    method: event.request.method,
    mode: event.request.mode,
    destination: event.request.destination,
    origin: sw.location.origin,
    headers: event.request.headers
  });

  if (classification === 'bypass') {
    return;
  }

  if (classification === 'navigation') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) {
          return offlinePage;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  if (classification === 'immutable-asset') {
    event.respondWith(
      caches.open(CACHE_ASSETS).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(event.request);
        // Simpan hanya respons status 200 bertipe basic (bukan opaque, bukan error, tanpa set-cookie)
        if (
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          !networkResponse.headers.has('set-cookie')
        ) {
          await cache.put(event.request, networkResponse.clone());
          event.waitUntil(pruneCache(cache, MAX_IMMUTABLE_ASSETS));
        }
        return networkResponse;
      })
    );
    return;
  }

  if (classification === 'static-asset') {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        const fetchPromise = fetch(event.request)
          .then(async (networkResponse) => {
            if (
              networkResponse.status === 200 &&
              networkResponse.type === 'basic' &&
              !networkResponse.headers.has('set-cookie')
            ) {
              await cache.put(event.request, networkResponse.clone());
              await pruneCache(cache, MAX_STATIC_ASSETS);
            }
            return networkResponse;
          })
          .catch(() => null);

        // Stale-While-Revalidate: sajikan cache segera jika ada, lalu revalidasi di background
        if (cachedResponse) {
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }

        const networkResponse = await fetchPromise;
        if (networkResponse) {
          return networkResponse;
        }

        return new Response('Asset not available offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }
});
