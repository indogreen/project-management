import { base } from '$app/paths';
import { env } from '$env/dynamic/public';

/**
 * Menghapus seluruh registrasi Service Worker aktif dan membersihkan seluruh
 * cache storage yang berawalan 'indogreen-'.
 *
 * Berfungsi sebagai:
 * 1. Pencegah konflik saat berpindah dari mode BUILD ke mode DEV pada origin yang sama.
 * 2. Kill-switch runtime jika PUBLIC_PWA_ENABLED di-set ke 'false'.
 */
export async function unregisterAndClean(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }

    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.startsWith('indogreen-')) {
          await caches.delete(key);
        }
      }
    }
  } catch (error) {
    console.error('[PWA] Gagal unregister dan membersihkan cache:', error);
  }
}

/**
 * Mendaftarkan Service Worker aplikasi di mode produksi.
 *
 * Hanya berjalan jika:
 * - Browser mendukung Service Worker ('serviceWorker' in navigator)
 * - Aplikasi berada dalam mode produksi (import.meta.env.PROD === true)
 * - Environment variable PUBLIC_PWA_ENABLED tidak bernilai 'false'
 *
 * Jika kondisi tidak terpenuhi, secara otomatis memanggil unregisterAndClean().
 */
export async function registerServiceWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Jika berada di mode dev ATAU PUBLIC_PWA_ENABLED === 'false', bersihkan SW lama
  if (!import.meta.env.PROD || env.PUBLIC_PWA_ENABLED === 'false') {
    await unregisterAndClean();
    return;
  }

  try {
    const swUrl = `${base}/service-worker.js`;
    await navigator.serviceWorker.register(swUrl, {
      type: 'classic'
    });
  } catch (error) {
    console.error('[PWA] Registrasi Service Worker gagal:', error);
  }
}

