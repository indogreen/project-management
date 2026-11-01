import { describe, expect, it, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { pwaStore, setUpdateReady, dismissUpdate } from './pwa';

describe('PWA Store (pwa.ts)', () => {
  beforeEach(() => {
    pwaStore.set({
      updateReady: false,
      registration: undefined
    });
  });

  it('memiliki nilai awal updateReady = false dan registration undefined', () => {
    const state = get(pwaStore);
    expect(state.updateReady).toBe(false);
    expect(state.registration).toBeUndefined();
  });

  it('mengubah updateReady menjadi true saat setUpdateReady dipanggil', () => {
    const mockRegistration = {} as ServiceWorkerRegistration;
    setUpdateReady(mockRegistration);

    const state = get(pwaStore);
    expect(state.updateReady).toBe(true);
    expect(state.registration).toBe(mockRegistration);
  });

  it('mempertahankan registration lama jika setUpdateReady dipanggil tanpa argumen', () => {
    const mockRegistration = {} as ServiceWorkerRegistration;
    setUpdateReady(mockRegistration);
    setUpdateReady();

    const state = get(pwaStore);
    expect(state.updateReady).toBe(true);
    expect(state.registration).toBe(mockRegistration);
  });

  it('mengubah updateReady menjadi false saat dismissUpdate dipanggil', () => {
    setUpdateReady();
    expect(get(pwaStore).updateReady).toBe(true);

    dismissUpdate();
    expect(get(pwaStore).updateReady).toBe(false);
  });
});

