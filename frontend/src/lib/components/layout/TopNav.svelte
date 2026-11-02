<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getDetailParentHref } from '$lib/components/layout/nav';
  import { theme, toggleTheme } from '$lib/stores/theme';
  import { isStandalone } from '$lib/utils/pwa-platform';

  type Props = {
    toggleMobileSidebar?: () => void;
    topnavTitle?: Snippet;
  };

  const noop = () => {};

  let { toggleMobileSidebar = noop, topnavTitle }: Props = $props();

  let standalone = $state(false);

  onMount(() => {
    standalone = isStandalone();
  });

  let parentHref = $derived(getDetailParentHref(page.url.pathname));

  function handleBack() {
    if (browser && window.history.length > 1) {
      window.history.back();
    } else if (parentHref) {
      void goto(parentHref);
    }
  }
</script>

<header
  class="sticky top-0 z-20 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 backdrop-blur-md md:px-6"
>
  <div class="flex min-w-0 items-center gap-3">
    <button
      type="button"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      aria-label="Buka menu"
      onclick={toggleMobileSidebar}
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v18" />
      </svg>
    </button>

    {#if standalone && parentHref}
      <button
        type="button"
        class="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Kembali"
        title="Kembali ke halaman sebelumnya"
        onclick={handleBack}
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>
    {/if}

    <div class="min-w-0">
      {@render topnavTitle?.()}
    </div>
  </div>

  <div class="flex items-center gap-2">
    <button
      type="button"
      aria-label={$theme === 'dark' ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
      title={$theme === 'dark' ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
      class="grid h-10 w-10 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onclick={toggleTheme}
    >
      {#if $theme === 'dark'}
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v2m4.95 2.05-1.41 1.41M21 12h-2m-4 6l1.41 1.41M12 19v2M6.46 17.95l1.41-1.41M5 12H3m3.05-4.95L7.46 8.46M12 8a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
      {:else}
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12.79A9 9 0 1111.21 3c-.09.88.27 1.75.92 2.4a5 5 0 006.47 6.47c.65.65 1.52 1.01 2.4.92z"
          />
        </svg>
      {/if}
    </button>
  </div>
</header>
