import { describe, expect, it, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  pwaStore,
  setUpdateReady,
  dismissUpdate,
  setDeferredPrompt,
  setAppInstalled,
  triggerInstallPrompt,
  type BeforeInstallPromptEvent
} from './pwa';

describe('PWA Store (pwa.ts)', () => {
  beforeEach(() => {
    pwaStore.set({
      updateReady: false,
      registration: undefined,
      deferredPrompt: null,
      canInstall: false,
      isInstalled: false
    });
  });

  it('memiliki nilai awal updateReady = false dan registration undefined', () => {
    const state = get(pwaStore);
    expect(state.updateReady).toBe(false);
    expect(state.registration).toBeUndefined();
    expect(state.deferredPrompt).toBeNull();
    expect(state.canInstall).toBe(false);
    expect(state.isInstalled).toBe(false);
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

  it('mengatur deferredPrompt dan canInstall melalui setDeferredPrompt', () => {
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
    } as unknown as BeforeInstallPromptEvent;

    setDeferredPrompt(mockPromptEvent);

    const state = get(pwaStore);
    expect(state.deferredPrompt).toBe(mockPromptEvent);
    expect(state.canInstall).toBe(true);
    expect(state.isInstalled).toBe(false);
  });

  it('mengatur status saat aplikasi terpasang melalui setAppInstalled', () => {
    setAppInstalled();

    const state = get(pwaStore);
    expect(state.deferredPrompt).toBeNull();
    expect(state.canInstall).toBe(false);
    expect(state.isInstalled).toBe(true);
  });

  it('mengembalikan unsupported pada triggerInstallPrompt jika deferredPrompt tidak ada', async () => {
    const result = await triggerInstallPrompt();
    expect(result).toBe('unsupported');
  });

  it('mengeksekusi prompt dan menandai terpasang jika user memilih accepted', async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
    } as unknown as BeforeInstallPromptEvent;

    setDeferredPrompt(mockPromptEvent);
    const result = await triggerInstallPrompt();

    expect(result).toBe('accepted');
    expect(promptMock).toHaveBeenCalled();
    const state = get(pwaStore);
    expect(state.isInstalled).toBe(true);
    expect(state.canInstall).toBe(false);
  });

  it('menghapus deferredPrompt jika user memilih dismissed pada prompt', async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' })
    } as unknown as BeforeInstallPromptEvent;

    setDeferredPrompt(mockPromptEvent);
    const result = await triggerInstallPrompt();

    expect(result).toBe('dismissed');
    expect(promptMock).toHaveBeenCalled();
    const state = get(pwaStore);
    expect(state.deferredPrompt).toBeNull();
    expect(state.canInstall).toBe(false);
  });
});
