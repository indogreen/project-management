<script module lang="ts">
  import { browser } from '$app/environment';
  import Swal from 'sweetalert2';
  import { lockBodyScroll } from '$lib/utils/scroll-lock';

  export type ConfirmOptions = {
    title?: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
  };

  function isDarkMode(): boolean {
    return browser && document.documentElement.classList.contains('dark');
  }

  /** Shows a SweetAlert confirmation dialog and returns true when confirmed. */
  export async function confirm(options: ConfirmOptions = {}): Promise<boolean> {
    if (!browser) {
      return false;
    }

    const darkMode = isDarkMode();
    lockBodyScroll(true);
    try {
      const result = await Swal.fire({
        title: options.title ?? 'Apakah Anda yakin?',
        text: options.text ?? 'Tindakan ini tidak dapat dibatalkan.',
        icon: options.isDangerous ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: options.confirmText ?? 'Ya',
        cancelButtonText: options.cancelText ?? 'Batal',
        confirmButtonColor: options.isDangerous ? '#dc2626' : '#4f46e5',
        cancelButtonColor: darkMode ? '#404040' : '#6b7280',
        background: darkMode ? '#171717' : '#ffffff',
        color: darkMode ? '#f5f5f5' : '#111827',
        reverseButtons: true
      });

      return result.isConfirmed;
    } finally {
      lockBodyScroll(false);
    }
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Optional wrapper props; the exported `confirm` function is the primary API.
   */
  let { children }: { children?: Snippet } = $props();
</script>

{#if children}
  {@render children()}
{/if}
