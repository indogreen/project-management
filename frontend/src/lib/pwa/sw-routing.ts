/**
 * Modul Klasifikasi Routing Service Worker (Fungsi Murni)
 *
 * Mengklasifikasikan incoming request menjadi 4 kategori:
 * - 'bypass': Diteruskan langsung ke jaringan tanpa intersep/caching SW.
 * - 'navigation': Request navigasi dokumen HTML utama (network-only dengan offline fallback).
 * - 'immutable-asset': Aset hasil build Vite beralamat /_app/immutable/ dengan hash unik.
 * - 'static-asset': Aset statis terverifikasi (offline.html, manifest, icons).
 */

export type RequestClassification = 'bypass' | 'navigation' | 'immutable-asset' | 'static-asset';

export interface ClassifyRequestInput {
  url: string | URL;
  method: string;
  mode?: string;
  destination?: string;
  origin: string;
  headers?: Headers | Record<string, string | null | undefined> | Map<string, string> | null;
}

const STATIC_EXACT_PATHS = ['/offline.html', '/manifest.webmanifest', '/manifest.json'];

function getHeaderValue(
  headers:
    | Headers
    | Record<string, string | null | undefined>
    | Map<string, string>
    | null
    | undefined,
  name: string
): string | null {
  if (!headers) return null;

  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name);
  }

  if (typeof (headers as Map<string, string>).get === 'function') {
    const lowerName = name.toLowerCase();
    for (const [key, value] of (headers as Map<string, string>).entries()) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    return null;
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName && typeof value === 'string') {
      return value;
    }
  }

  return null;
}

/**
 * Menentukan klasifikasi perlakuan Service Worker terhadap suatu HTTP request.
 * Fungsi ini murni (pure function), tanpa dependensi runtime `self` atau browser environment.
 */
export function classifyRequest(input: ClassifyRequestInput): RequestClassification {
  const { url, method, mode, origin, headers } = input;

  // 1. Method bukan GET => WAJIB bypass
  if (method.toUpperCase() !== 'GET') {
    return 'bypass';
  }

  // Parse URL secara aman
  let parsedUrl: URL;
  try {
    parsedUrl = typeof url === 'string' ? new URL(url, origin) : url;
  } catch {
    return 'bypass';
  }

  // 2. Origin berbeda dari origin Service Worker (lintas origin) => WAJIB bypass
  if (parsedUrl.origin !== origin) {
    return 'bypass';
  }

  const pathname = parsedUrl.pathname;

  // 3. Path diawali /api (termasuk /api/proxy/...) atau /storage => WAJIB bypass
  if (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/storage' ||
    pathname.startsWith('/storage/')
  ) {
    return 'bypass';
  }

  // 4. Path berakhiran /__data.json (data load SSR dinamis per user) => WAJIB bypass
  if (pathname.endsWith('/__data.json')) {
    return 'bypass';
  }

  // 5. Header x-sveltekit-action ada (form actions), atau Accept meminta application/json => WAJIB bypass
  const actionHeader = getHeaderValue(headers, 'x-sveltekit-action');
  if (actionHeader !== null && actionHeader !== undefined) {
    return 'bypass';
  }

  const acceptHeader = getHeaderValue(headers, 'accept');
  if (acceptHeader && acceptHeader.toLowerCase().includes('application/json')) {
    return 'bypass';
  }

  // 6. Header Authorization ada (authenticated calls) => WAJIB bypass
  const authHeader = getHeaderValue(headers, 'authorization');
  if (authHeader !== null && authHeader !== undefined) {
    return 'bypass';
  }

  // ─────────────────────────────────────────────────────────────
  // Evaluasi klasifikasi setelah lolos seluruh gerbang bypass di atas
  // ─────────────────────────────────────────────────────────────

  // 7. Request navigasi halaman HTML
  if (mode === 'navigate') {
    return 'navigation';
  }

  // 8. Immutable build assets (/_app/immutable/...)
  if (pathname.startsWith('/_app/immutable/')) {
    return 'immutable-asset';
  }

  // 9. Static assets (offline page, web manifest, icons)
  if (STATIC_EXACT_PATHS.includes(pathname) || pathname.startsWith('/icons/')) {
    return 'static-asset';
  }

  // 10. Default fallback untuk resource lainnya (mis. robots.txt)
  return 'bypass';
}
