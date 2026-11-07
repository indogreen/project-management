import { writable } from 'svelte/store';

export type User = {
  id?: number;
  name: string;
  username?: string;
  email: string;
};

export const currentUser = writable<User | null>(null);

// helper opsional biar rapih dipakai di mana-mana
export const setUser = (u: User | null) => currentUser.set(u);
export const patchUser = (partial: Partial<User>) =>
  currentUser.update((u) => (u ? { ...u, ...partial } : u));

/** Hapus data user dari store & localStorage (dipanggil saat refresh token gagal) */
export const clearUser = () => {
  currentUser.set(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
  }
};
