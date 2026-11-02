<script lang="ts">
  import { browser } from '$app/environment';
  import { pwaStore, triggerInstallPrompt } from '$lib/stores/pwa';
  import { isStandalone, isIOSSafari } from '$lib/utils/pwa-platform';
  import Modal from '$lib/components/Modal.svelte';
  import { showSuccess, showInfo } from '$lib/utils/toast';

  const INSTALL_ICON = 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4';

  type Props = {
    variant?: 'menu' | 'card' | 'button';
    onclick?: () => void;
  };

  let { variant = 'button', onclick: onCustomClick }: Props = $props();

  let showIosModal = $state(false);
  let showFallbackModal = $state(false);

  let isCurrentStandalone = $derived(browser ? isStandalone() || $pwaStore.isInstalled : false);

  let isIOS = $derived(browser ? isIOSSafari() : false);

  async function handleInstall(): Promise<void> {
    onCustomClick?.();

    if (!browser) return;

    if (isCurrentStandalone) {
      showInfo('Aplikasi sudah terpasang di perangkat Anda.');
      return;
    }

    // Kasus 1: Android & Chromium (desktop / mobile) yang memiliki event prompt
    if ($pwaStore.deferredPrompt) {
      const outcome = await triggerInstallPrompt();
      if (outcome === 'accepted') {
        showSuccess('Aplikasi berhasil dipasang!');
      }
      return;
    }

    // Kasus 2: Safari di iOS (butuh petunjuk manual Add to Home Screen)
    if (isIOS) {
      showIosModal = true;
      return;
    }

    // Kasus 3: Browser lain yang belum memicu beforeinstallprompt
    showFallbackModal = true;
  }
</script>

{#if variant === 'menu'}
  {#if !isCurrentStandalone}
    <button
      type="button"
      class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
      onclick={handleInstall}
    >
      <svg
        class="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={INSTALL_ICON} />
      </svg>
      <span>Pasang Aplikasi</span>
    </button>
    <div class="h-px bg-border"></div>
  {/if}
{:else if variant === 'card'}
  <div
    class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h2 class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          <svg
            class="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={INSTALL_ICON}
            />
          </svg>
          Aplikasi Web (PWA)
        </h2>
        <p class="max-w-xl text-sm text-gray-600 dark:text-gray-300">
          Pasang Indogreen Project Management di layar utama perangkat Anda untuk akses cepat,
          performa optimal, dan tampilan mandiri tanpa bilah browser.
        </p>
      </div>

      <div class="shrink-0">
        {#if isCurrentStandalone}
          <div
            class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
          >
            <svg
              class="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Aplikasi Terpasang
          </div>
        {:else}
          <button
            type="button"
            onclick={handleInstall}
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d={INSTALL_ICON} />
            </svg>
            Pasang Aplikasi
          </button>
        {/if}
      </div>
    </div>
  </div>
{:else if !isCurrentStandalone}
  <button
    type="button"
    onclick={handleInstall}
    class="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
  >
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d={INSTALL_ICON} />
    </svg>
    Pasang Aplikasi
  </button>
{/if}

<!-- Dialog Panduan Instalasi iOS Safari -->
<Modal bind:show={showIosModal} title="Pasang di Layar Utama (iOS Safari)">
  <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
    <p>
      Ikuti langkah berikut untuk memasang Indogreen Project Management di iPhone atau iPad Anda:
    </p>

    <ol class="space-y-3 pl-1">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
        >
          1
        </span>
        <div class="leading-relaxed">
          Tekan tombol <strong class="text-foreground">Bagikan</strong> (ikon kotak berpanah ke atas
          <svg
            class="inline-block h-4 w-4 align-text-bottom"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            /></svg
          >) di bilah menu Safari.
        </div>
      </li>

      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
        >
          2
        </span>
        <div class="leading-relaxed">
          Gulir ke bawah pada menu opsi, lalu pilih <strong class="text-foreground"
            >Tambah ke Layar Utama</strong
          >
          (<em>Add to Home Screen</em>).
        </div>
      </li>

      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
        >
          3
        </span>
        <div class="leading-relaxed">
          Tekan tombol <strong class="text-foreground">Tambah</strong> di pojok kanan atas layar.
        </div>
      </li>
    </ol>

    <div
      class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <strong>Catatan untuk iOS:</strong> Setelah aplikasi berhasil dipasang dan dibuka dari Layar Utama,
      Anda perlu melakukan login satu kali lagi karena sistem iOS menjalankan aplikasi dalam wadah penyimpanan
      mandiri.
    </div>

    <div class="mt-4 flex justify-end">
      <button
        type="button"
        onclick={() => (showIosModal = false)}
        class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
      >
        Mengerti
      </button>
    </div>
  </div>
</Modal>

<!-- Dialog Panduan Browser Standar Lainnya -->
<Modal bind:show={showFallbackModal} title="Petunjuk Pemasangan Aplikasi">
  <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
    <p>
      Browser Anda belum mendukung pemasangan otomatis dengan satu klik, atau aplikasi sudah berada
      dalam status siap dipasang melalui menu browser.
    </p>

    <div class="rounded-lg bg-muted p-3 text-xs leading-relaxed">
      <p class="font-semibold text-foreground">Cara memasang secara manual:</p>
      <ul class="mt-2 list-disc space-y-1 pl-4">
        <li>
          <strong>Google Chrome / Microsoft Edge:</strong> Klik ikon install (<svg
            class="inline-block h-3.5 w-3.5 align-text-bottom"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={INSTALL_ICON}
            /></svg
          >) di sisi kanan kolom alamat URL (address bar), atau buka menu titik tiga &gt;
          <em>Pasang Indogreen</em>.
        </li>
        <li>
          <strong>Browser Mobile (Android):</strong> Buka menu peramban (titik tiga) &gt; pilih
          <em>Tambahkan ke Layar Utama</em>
          atau <em>Instal Aplikasi</em>.
        </li>
      </ul>
    </div>

    <div class="mt-4 flex justify-end">
      <button
        type="button"
        onclick={() => (showFallbackModal = false)}
        class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
      >
        Tutup
      </button>
    </div>
  </div>
</Modal>
