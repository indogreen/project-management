import { base } from '$app/paths';
import { env } from '$env/dynamic/public';
import { setUpdateReady } from '$lib/stores/pwa';

// Interval polling berkala untuk mengecek pembaruan Service Worker (~60 menit)
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

let periodicUpdateTimer: ReturnType<typeof setInterval> | null = null;
let visibilityListenerRegistered = false;

/**
 * Menyiapkan pendeteksian update dan polling berkala pada ServiceWorkerRegistration aktif.
 */
function setupUpdateDetection(registration: ServiceWorkerRegistration): void {
  // 1. Deteksi jika sudah ada worker yang berstatus waiting saat halaman dibuka
  // Hanya picu updateReady jika sudah ada controller aktif (bukan instalasi awal pertama)
  if (registration.waiting && navigator.serviceWorker.controller) {
    setUpdateReady(registration);
  }

  // 2. Deteksi event updatefound untuk worker baru yang sedang diunduh/diinstal
  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      // Saat worker baru selesai terinstal dan sudah ada controller aktif sebelumnya
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        setUpdateReady(registration);
      }
    });
  });

  // 3. Panggil registration.update() saat tab kembali visible
  if (!visibilityListenerRegistered && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void registration.update().catch(() => {
          // Tangani kemungkinan offline / network timeout tanpa melempar error
        });
      }
    });
    visibilityListenerRegistered = true;
  }

  // 4. Polling registration.update() tiap ~60 menit
  if (!periodicUpdateTimer && typeof window !== 'undefined') {
    periodicUpdateTimer = setInterval(() => {
      void registration.update().catch(() => {
        // Tangani kemungkinan offline / network timeout tanpa melempar error
      });
    }, UPDATE_CHECK_INTERVAL_MS);
  }
}

/**
 * Menghapus seluruh registrasi Service Worker aktif dan membersihkan seluruh
 * cache storage yang berawalan 'indogreen-'.
 *
 * Berfungsi sebagai:
 * 1. Pencegah konflik saat berpindah dari mode BUILD ke mode DEV pada origin yang sama.
 * 2. Kill-switch runtime jika PUBLIC_PWA_ENABLED di-set ke 'false'.
 */
export async function unregisterAndClean(): Promise<void> {
  if (periodicUpdateTimer) {
    clearInterval(periodicUpdateTimer);
    periodicUpdateTimer = null;
  }

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
    const registration = await navigator.serviceWorker.register(swUrl, {
      type: 'classic'
    });
    setupUpdateDetection(registration);
  } catch (error) {
    console.error('[PWA] Registrasi Service Worker gagal:', error);
  }
}
