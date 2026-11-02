import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Service Worker and Web Manifest must never be cached by intermediaries or browser HTTP cache
  const pathname = event.url.pathname;
  if (
    pathname === '/service-worker.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json'
  ) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
};

