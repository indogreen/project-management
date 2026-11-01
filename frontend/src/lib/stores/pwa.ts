import { get, writable } from 'svelte/store';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PwaState {
  updateReady: boolean;
  registration?: ServiceWorkerRegistration;
  deferredPrompt?: BeforeInstallPromptEvent | null;
  canInstall: boolean;
  isInstalled: boolean;
}

/**
 * Writable store untuk status Progressive Web App (PWA).
 * Menyimpan status updateReady, referensi ServiceWorkerRegistration aktif,
 * event deferredPrompt instalasi, dan status pemasangan aplikasi.
 */
export const pwaStore = writable<PwaState>({
  updateReady: false,
  registration: undefined,
  deferredPrompt: null,
  canInstall: false,
  isInstalled: false
});

/**
 * Menandai bahwa pembaruan versi baru Service Worker telah siap dipasang.
 */
export function setUpdateReady(registration?: ServiceWorkerRegistration): void {
  pwaStore.update((state) => ({
    ...state,
    updateReady: true,
    registration: registration ?? state.registration
  }));
}

/**
 * Mereset status pembaruan atau menutup prompt sementara.
 */
export function dismissUpdate(): void {
  pwaStore.update((state) => ({
    ...state,
    updateReady: false
  }));
}

/**
 * Menyimpan event `beforeinstallprompt` untuk dipicu saat user menekan tombol install.
 */
export function setDeferredPrompt(event: BeforeInstallPromptEvent | null): void {
  pwaStore.update((state) => ({
    ...state,
    deferredPrompt: event,
    canInstall: event !== null,
    isInstalled: event ? false : state.isInstalled
  }));
}

/**
 * Menandai bahwa aplikasi telah sukses terpasang (via `appinstalled` atau prompt).
 */
export function setAppInstalled(): void {
  pwaStore.update((state) => ({
    ...state,
    deferredPrompt: null,
    canInstall: false,
    isInstalled: true
  }));
}

/**
 * Memicu dialog install native browser dari event yang disimpan.
 * Mengembalikan 'accepted', 'dismissed', atau 'unsupported'.
 */
export async function triggerInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  const currentState = get(pwaStore);
  const promptEvent = currentState.deferredPrompt;

  if (!promptEvent) {
    return 'unsupported';
  }

  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === 'accepted') {
      setAppInstalled();
    } else {
      // User membatalkan install prompt
      setDeferredPrompt(null);
    }

    return choice.outcome;
  } catch (error) {
    console.error('[PWA] Gagal menjalankan install prompt:', error);
    return 'unsupported';
  }
}
