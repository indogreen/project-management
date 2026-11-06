<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { forgotPassword } from '$lib/services/authService';
  import { theme, toggleTheme } from '$lib/stores/theme';
  import { extractApiErrors } from '$lib/utils/errors';
  import { getSafeInternalRedirect } from '$lib/utils/url';

  let email = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  onMount(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      goto(getSafeInternalRedirect($page.url));
    }
  });

  async function handleSubmit() {
    if (loading) return;
    error = null;
    loading = true;
    try {
      const res = await forgotPassword(email);
      successMessage =
        res.message ||
        'Jika email Anda terdaftar, instruksi dan kode verifikasi reset password telah dikirim ke email Anda.';
    } catch (err) {
      error = extractApiErrors(err);
      console.error('Forgot password failed:', err);
    } finally {
      loading = false;
    }
  }

  function handleSubmitEvent(event: SubmitEvent) {
    event.preventDefault();
    void handleSubmit();
  }
</script>

<svelte:head>
  <title>Lupa Password - Indogreen</title>
</svelte:head>

<!-- Background -->
<div
  class="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-cyan-50
            dark:from-neutral-900 dark:via-neutral-950 dark:to-black"
></div>
<div class="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl">
  <div
    class="relative left-1/2 aspect-[1155/678] w-[36rem] -translate-x-1/2
              bg-gradient-to-tr from-indigo-300 to-cyan-300 opacity-30
              dark:from-indigo-700/40 dark:to-cyan-700/40"
  ></div>
</div>

<div class="flex min-h-screen items-center justify-center px-6">
  <div class="w-full max-w-md">
    <div
      class="mt-8 rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-xl shadow-indigo-100/20 backdrop-blur
                dark:border-gray-700 dark:bg-neutral-900/80 dark:shadow-black/20"
    >
      <!-- Toggle Tema -->
      <div class="mb-3 flex justify-center">
        <button
          aria-label="Toggle dark mode"
          class="rounded-full p-2 text-gray-600 hover:bg-gray-100
                 dark:text-gray-300 dark:hover:bg-neutral-800"
          onclick={toggleTheme}
          title={$theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {#if $theme === 'dark'}
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12.79A9 9 0 1111.21 3c-.09.88.27 1.75.92 2.4a5 5 0 006.47 6.47c.65.65 1.52 1.01 2.4.92z"
              />
            </svg>
          {:else}
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v2m4.95 2.05-1.41 1.41M21 12h-2m-4 6l1.41 1.41M12 19v2M6.46 17.95l1.41-1.41M5 12H3m3.05-4.95L7.46 8.46M12 8a4 4 0 100 8 4 4 0 000-8z"
              />
            </svg>
          {/if}
        </button>
      </div>

      {#if successMessage}
        <!-- Tampilan Saat Email Berhasil Dikirim -->
        <div class="space-y-5 text-center">
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          >
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div>
            <h2 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Periksa Kotak Masuk Email
            </h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {successMessage}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Periksa juga folder Spam jika tidak menemukan email dalam beberapa menit.
            </p>
          </div>

          <div class="space-y-3 pt-2">
            <a
              href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:bg-indigo-500 dark:shadow-indigo-900/30"
            >
              <span>Masukkan Kode Verifikasi</span>
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>

            <button
              type="button"
              onclick={() => {
                successMessage = null;
              }}
              class="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
            >
              Kirim Ulang ke Email Lain
            </button>
          </div>

          <p class="pt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Ingat password Anda?
            <a
              href="/auth/login"
              class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Masuk disini
            </a>
          </p>
        </div>
      {:else}
        <!-- Form Permintaan Lupa Password -->
        <form class="space-y-5" onsubmit={handleSubmitEvent} aria-busy={loading}>
          <div class="text-center">
            <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Lupa Password
            </h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Masukkan alamat email akun Anda untuk menerima kode verifikasi dan instruksi reset password.
            </p>
          </div>

          <!-- Email Input -->
          <div>
            <label
              for="email"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Alamat Email
            </label>
            <div class="relative">
              <input
                id="email"
                type="email"
                name="email"
                placeholder="nama@indogreen.id"
                bind:value={email}
                autocomplete="email"
                required
                class="peer block w-full rounded-xl border border-gray-300 bg-white px-11 py-3 text-gray-900 placeholder:text-gray-400
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-70
                       dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder-gray-400"
                disabled={loading}
              />
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0z" /><path
                    d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364 6.364l-1.414-1.414M6.05 6.05 4.636 4.636"
                  />
                </svg>
              </div>
            </div>
          </div>

          {#if error}
            <div
              class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700
                        dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
            >
              {error}
            </div>
          {/if}

          <button
            type="submit"
            class="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70
                   dark:shadow-indigo-900/30"
            disabled={loading}
            aria-disabled={loading}
          >
            {#if loading}
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              <span>Mengirim Kode...</span>
            {:else}
              <span>Kirim Kode Verifikasi</span>
              <svg
                class="h-4 w-4 opacity-90 transition group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            {/if}
          </button>

          <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Kembali ke
            <a
              href="/auth/login"
              class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Halaman Login
            </a>
          </p>
        </form>
      {/if}
    </div>
  </div>
</div>
