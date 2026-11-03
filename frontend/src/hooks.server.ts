import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy (CSP) baseline
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' https: http: ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // HSTS (HTTP Strict Transport Security) when served over HTTPS
  const isHttps =
    event.url.protocol === 'https:' ||
    event.request?.headers?.get('x-forwarded-proto') === 'https';
  if (isHttps) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

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
