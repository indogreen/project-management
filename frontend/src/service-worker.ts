/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { version } from '$service-worker';
import { classifyRequest } from './lib/pwa/sw-routing';

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

  if (classification === 'bypass' || classification === 'immutable-asset') {
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

  if (classification === 'static-asset') {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_STATIC);
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }
});
