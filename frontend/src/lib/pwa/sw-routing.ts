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

export const MAX_IMMUTABLE_ASSETS = 150;
export const MAX_STATIC_ASSETS = 50;

export const STATIC_EXACT_PATHS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/indogreen.png',
  '/favicon.png',
  '/favicon.ico'
];

/**
 * Interface minimal untuk objek Cache yang mendukung operasi pemangkasan (keys & delete).
 * Kompatibel langsung dengan browser standard `Cache`.
 */
export interface CachePrunable {
  keys(): Promise<readonly (Request | string)[]>;
  delete(request: Request | string): Promise<boolean>;
}

/**
 * Menghitung daftar key yang berlebih dan harus dipangkas agar jumlah entri dalam cache <= maxItems.
 * Mengikuti prinsip FIFO (First-In, First-Out): entri tertua (posisi awal array) yang dipangkas lebih dahulu.
 * Fungsi ini murni (pure function) tanpa efek samping I/O.
 *
 * @param keys Daftar request/key saat ini dalam cache (urutan insertion)
 * @param maxItems Batas maksimum jumlah entri yang diperbolehkan
 * @returns Array key tertua yang perlu dihapus
 */
export function getExcessKeys<T>(keys: readonly T[], maxItems: number): T[] {
  if (maxItems <= 0) {
    return [...keys];
  }
  if (keys.length <= maxItems) {
    return [];
  }
  const excessCount = keys.length - maxItems;
  return keys.slice(0, excessCount);
}

/**
 * Memangkas entri tertua dalam cache hingga jumlah entri <= maxItems.
 * Menghindari penumpukan memori/storage browser secara terukur.
 *
 * @param cache Objek Cache atau cache-like yang mengimplementasikan keys() dan delete()
 * @param maxItems Batas maksimum entri yang dipertahankan
 * @returns Jumlah item yang berhasil dihapus
 */
export async function pruneCache(cache: CachePrunable, maxItems: number): Promise<number> {
  if (maxItems < 0) {
    return 0;
  }

  try {
    const keys = await cache.keys();
    const toDelete = getExcessKeys(keys, maxItems);
    let deletedCount = 0;

    for (const key of toDelete) {
      try {
        const ok = await cache.delete(key);
        if (ok) {
          deletedCount++;
        }
      } catch {
        // Abaikan kegagalan pada individu key agar pemangkasan item lain tetap berlanjut
      }
    }

    return deletedCount;
  } catch {
    return 0;
  }
}

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
