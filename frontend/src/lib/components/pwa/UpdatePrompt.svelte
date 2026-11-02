<script lang="ts">
  import { browser } from '$app/environment';
  import { beforeNavigate } from '$app/navigation';
  import { updated } from '$app/state';
  import { onMount } from 'svelte';
  import { confirm } from '$lib/components/common/ConfirmDialog.svelte';
  import { pwaStore, setUpdateReady } from '$lib/stores/pwa';

  let dismissed = $state(false);
  let isUpdating = $state(false);
  let refreshing = false;

  // Sinkronkan status updated dari SvelteKit ($app/state) ke PWA store
  $effect(() => {
    if (updated.current && !$pwaStore.updateReady) {
      setUpdateReady();
    }
  });

  let isVisible = $derived(browser && ($pwaStore.updateReady || updated.current) && !dismissed);

  function isModalOrDrawerOpen(): boolean {
    if (typeof document === 'undefined') return false;
    return document.body.dataset.scrollLocked === 'true';
  }

  // Intersep navigasi saat versi baru terdeteksi
  beforeNavigate(({ willUnload, to }) => {
    if (willUnload || !to) return;

    if (updated.current || $pwaStore.updateReady) {
      // JANGAN auto-reload bila modal/drawer terbuka (indikator scroll-lock)
      if (isModalOrDrawerOpen()) {
        return;
      }

      // Paksa full reload ke target URL agar chunk baru dan data SSR termuat sempurna
      location.href = to.url.href;
    }
  });

  onMount(() => {
    // Bersihkan penanda reload jika ada dari sesi sebelumnya
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('pwa_refreshing');
    }
  });

  async function applyUpdate() {
    if (!browser || refreshing) return;

    // Jika modal atau drawer sedang terbuka, minta konfirmasi agar input user tidak hilang
    if (isModalOrDrawerOpen()) {
      const confirmed = await confirm({
        title: 'Formulir Sedang Terbuka',
        text: 'Terdapat dialog atau formulir yang belum selesai. Menyegarkan halaman sekarang akan membatalkan perubahan yang belum disimpan. Tetap perbarui sekarang?',
        confirmText: 'Tetap Perbarui',
        cancelText: 'Tunda'
      });

      if (!confirmed) {
        return;
      }
    }

    isUpdating = true;
    refreshing = true;

    // Guard flag di sessionStorage untuk memastikan reload HANYA SEKALI dan tidak loop
    try {
      sessionStorage.setItem('pwa_refreshing', 'true');
    } catch {
      // Abaikan jika storage disabled
    }

    const reg = $pwaStore.registration;

    if (reg?.waiting) {
      // Tunggu controllerchange sekali saja sebelum memicu reload
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          window.location.reload();
        },
        { once: true }
      );

      reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Fallback timeout jika controllerchange tidak terpicu
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      // Fallback reload langsung jika dipicu oleh kit version poll
      window.location.reload();
    }
  }

  function dismiss() {
    dismissed = true;
  }
</script>

{#if isVisible}
  <aside
    role="alert"
    aria-live="polite"
    class="fixed right-4 bottom-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-2xl transition-all duration-300 md:w-auto"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <svg
          class="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </div>

      <div class="min-w-0 flex-1">
        <h2 class="text-sm font-semibold text-foreground">Versi baru tersedia</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Pembaruan aplikasi telah siap. Perbarui sekarang untuk mendapatkan versi terbaru.
        </p>

        <div class="mt-3 flex items-center gap-2">
          <button
            type="button"
            onclick={applyUpdate}
            disabled={isUpdating}
            class="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {#if isUpdating}
              <svg
                class="mr-1.5 h-3.5 w-3.5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Memperbarui...
            {:else}
              Perbarui sekarang
            {/if}
          </button>

          <button
            type="button"
            onclick={dismiss}
            disabled={isUpdating}
            class="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  </aside>
{/if}
