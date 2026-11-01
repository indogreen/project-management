import { writable } from 'svelte/store';

export interface PwaState {
  updateReady: boolean;
  registration?: ServiceWorkerRegistration;
}

/**
 * Writable store untuk status pembaruan Progressive Web App (PWA).
 * Menyimpan status updateReady dan referensi ServiceWorkerRegistration aktif.
 */
export const pwaStore = writable<PwaState>({
  updateReady: false,
  registration: undefined
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

