<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { resetPassword } from '$lib/services/authService';
  import { theme, toggleTheme } from '$lib/stores/theme';
  import { extractApiErrors } from '$lib/utils/errors';
  import { showSuccess } from '$lib/utils/toast';
  import { getSafeInternalRedirect } from '$lib/utils/url';

  let email = $state('');
  let token = $state('');
  let password = $state('');
  let password_confirmation = $state('');
  let showPassword = $state(false);
  let showPasswordConfirmation = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);

  onMount(() => {
    const existingToken = localStorage.getItem('jwt_token');
    if (existingToken) {
      goto(getSafeInternalRedirect($page.url));
      return;
    }

    // Prefill dari URL query parameter jika user mengklik link dari email
    const queryEmail = $page.url.searchParams.get('email');
    const queryToken = $page.url.searchParams.get('token');

    if (queryEmail) email = queryEmail;
    if (queryToken) token = queryToken;
  });

  async function handleSubmit() {
    if (loading) return;
    error = null;

    if (password !== password_confirmation) {
      error = 'Konfirmasi password tidak cocok.';
      return;
    }

    if (password.length < 8) {
      error = 'Password minimal harus 8 karakter.';
      return;
    }

    loading = true;
    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation
      });

      showSuccess('Password berhasil direset! Silakan login dengan password baru Anda.');
      goto('/auth/login');
    } catch (err) {
      error = extractApiErrors(err);
      console.error('Reset password failed:', err);
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
  <title>Reset Password - Indogreen</title>
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

<div class="flex min-h-screen items-center justify-center px-6 py-12">
  <div class="w-full max-w-md">
    <div
      class="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-xl shadow-indigo-100/20 backdrop-blur
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

      <form class="space-y-4" onsubmit={handleSubmitEvent} aria-busy={loading}>
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Masukkan kode verifikasi dari email dan tentukan password baru Anda.
          </p>
        </div>

        <!-- Alamat Email -->
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
              class="peer block w-full rounded-xl border border-gray-300 bg-white px-11 py-2.5 text-gray-900 placeholder:text-gray-400
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

        <!-- Kode Verifikasi / Token -->
        <div>
          <label
            for="token"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Kode Verifikasi / Token
          </label>
          <div class="relative">
            <input
              id="token"
              type="text"
              name="token"
              placeholder="Contoh: 123456"
              bind:value={token}
              required
              class="peer block w-full rounded-xl border border-gray-300 bg-white px-11 py-2.5 font-mono text-gray-900 placeholder:font-sans placeholder:text-gray-400
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
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Password Baru -->
        <div>
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password Baru
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Minimal 8 karakter"
              bind:value={password}
              autocomplete="new-password"
              required
              class="peer block w-full rounded-xl border border-gray-300 bg-white px-11 py-2.5 text-gray-900 placeholder:text-gray-400
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
                <path
                  d="M12 15v2m-6 1h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z"
                /><path d="M8 11V7a4 4 0 118 0v4" />
              </svg>
            </div>
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {#if showPassword}
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle
                    cx="12"
                    cy="12"
                    r="3"
                  />
                </svg>
              {:else}
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M3 3l18 18" /><path d="M10.58 10.58A3 3 0 0113.41 13.4" /><path
                    d="M9.88 4.64A9.94 9.94 0 0112 4c6.5 0 10 8 10 8a17.61 17.61 0 01-4.21 5.32"
                  /><path d="M6.11 6.11A17.64 17.64 0 002 12s3.5 7 10 7a9.94 9.94 0 004.12-.83" />
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <!-- Konfirmasi Password Baru -->
        <div>
          <label
            for="password_confirmation"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Konfirmasi Password Baru
          </label>
          <div class="relative">
            <input
              id="password_confirmation"
              type={showPasswordConfirmation ? 'text' : 'password'}
              name="password_confirmation"
              placeholder="Ulangi password baru"
              bind:value={password_confirmation}
              autocomplete="new-password"
              required
              class="peer block w-full rounded-xl border border-gray-300 bg-white px-11 py-2.5 text-gray-900 placeholder:text-gray-400
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
                <path
                  d="M12 15v2m-6 1h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z"
                /><path d="M8 11V7a4 4 0 118 0v4" />
              </svg>
            </div>
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onclick={() => (showPasswordConfirmation = !showPasswordConfirmation)}
              aria-label={showPasswordConfirmation
                ? 'Sembunyikan konfirmasi password'
                : 'Tampilkan konfirmasi password'}
            >
              {#if showPasswordConfirmation}
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle
                    cx="12"
                    cy="12"
                    r="3"
                  />
                </svg>
              {:else}
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M3 3l18 18" /><path d="M10.58 10.58A3 3 0 0113.41 13.4" /><path
                    d="M9.88 4.64A9.94 9.94 0 0112 4c6.5 0 10 8 10 8a17.61 17.61 0 01-4.21 5.32"
                  /><path d="M6.11 6.11A17.64 17.64 0 002 12s3.5 7 10 7a9.94 9.94 0 004.12-.83" />
                </svg>
              {/if}
            </button>
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
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span>Menyimpan Password...</span>
          {:else}
            <span>Perbarui Password</span>
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

        <p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Kembali ke
          <a
            href="/auth/login"
            class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Halaman Login
          </a>
        </p>
      </form>
    </div>
  </div>
</div>
