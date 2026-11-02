import { writable } from 'svelte/store';

/**
 * Store reaktif untuk memantau status konektivitas jaringan pengguna (online/offline).
 * Menggunakan API standar `navigator.onLine` serta event window 'online' dan 'offline'.
 */
function createConnectivityStore() {
  const initial =
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  const { subscribe, set } = writable<boolean>(initial);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => set(true));
    window.addEventListener('offline', () => set(false));
  }

  return {
    subscribe,
    /** Method pembantu untuk pengujian unit atau simulasi konektivitas */
    set
  };
}

export const isOnline = createConnectivityStore();
