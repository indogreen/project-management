<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getAuthFeatures, register } from '$lib/services/authService';
  import { theme, toggleTheme } from '$lib/stores/theme';
  import { extractApiErrors } from '$lib/utils/errors';
  import { showError, showSuccess } from '$lib/utils/toast';
  import { getSafeInternalRedirect } from '$lib/utils/url';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let password_confirmation = $state('');
  let showPassword = $state(false);
  let showPassword2 = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let registrationEnabled = $state(true);

  // ⬇️ Jika sudah login atau registrasi nonaktif, jangan boleh buka register
  onMount(async () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      goto(getSafeInternalRedirect($page.url));
      return;
    }

    try {
      const features = await getAuthFeatures();
      if (!features.registration_enabled) {
        registrationEnabled = false;
        showError('Pendaftaran akun publik saat ini dinonaktifkan.');
        goto('/auth/login');
      }
    } catch (err) {
      console.warn('Gagal memverifikasi status registrasi:', err);
    }
  });

  async function handleSubmit() {
    if (loading) return;
    if (!registrationEnabled) {
      error = 'Pendaftaran akun publik saat ini dinonaktifkan.';
      return;
    }
    error = null;
    if (password !== password_confirmation) {
      error = 'Konfirmasi password tidak cocok.';
      return;
    }
    loading = true;
    try {
      await register({
        name,
        email,
        password,
        password_confirmation
      });
      showSuccess('Registrasi berhasil! Silakan login.');

      const nextParam =
        $page.url.searchParams.get('next') || $page.url.searchParams.get('redirect');
      const safeNext = nextParam ? getSafeInternalRedirect(nextParam, '') : '';
      goto(`/auth/login${safeNext ? `?redirect=${encodeURIComponent(safeNext)}` : ''}`);
    } catch (err) {
      error = extractApiErrors(err);
      console.error('Registration failed:', err);
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
  <title>Register - Indogreen</title>
</svelte:head>

<!-- Background dengan varian dark -->
<div
  class="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-50 via-white to-indigo-50
            dark:from-neutral-900 dark:via-neutral-950 dark:to-black"
></div>
<div class="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl">
  <div
    class="relative left-1/3 aspect-[1155/678] w-[36rem] -translate-x-1/3
              bg-gradient-to-tr from-cyan-300 to-indigo-300 opacity-30
              dark:from-cyan-700/40 dark:to-indigo-700/40"
  ></div>
</div>

<div class="flex min-h-screen items-center justify-center px-6 py-12">
  <div class="w-full max-w-md">
    <div
      class="mt-8 rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-xl shadow-cyan-100/30 backdrop-blur
                dark:border-gray-700 dark:bg-neutral-900/80 dark:shadow-black/20"
    >
      <!-- Toggle Tema di atas judul -->
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

      {#if !registrationEnabled}
        <div
          class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          role="alert"
        >
          Pendaftaran akun baru saat ini dinonaktifkan. Mengalihkan ke halaman login...
        </div>
      {/if}

      <form class="space-y-5" onsubmit={handleSubmitEvent} aria-busy={loading}>
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Register</h2>
        </div>

        <!-- Nama -->
        <div>
          <label for="name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Nama Lengkap</label
          >
          <div class="relative">
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Nama Lengkap"
              bind:value={name}
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
                <path d="M12 14c3.866 0 7 1.79 7 4v2H5v-2c0-2.21 3.134-4 7-4z" /><circle
                  cx="12"
                  cy="7"
                  r="4"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Email</label
          >
          <div class="relative">
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Alamat Email"
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
                <path d="M4 6l8 5 8-5" /><path d="M4 6v12h16V6" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Password -->
        <div>
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label
          >
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Minimal 8 karakter"
              bind:value={password}
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
                <path
                  d="M12 15v2m-6 1h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z"
                /><path d="M8 11V7a4 4 0 118 0v4" />
              </svg>
            </div>
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:text-gray-200"
              onclick={() => (showPassword = !showPassword)}
              disabled={loading}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
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

        <!-- Konfirmasi Password -->
        <div>
          <label
            for="password_confirmation"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Konfirmasi Password</label
          >
          <div class="relative">
            <input
              id="password_confirmation"
              type={showPassword2 ? 'text' : 'password'}
              name="password_confirmation"
              placeholder="Ulangi password"
              bind:value={password_confirmation}
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
                <path
                  d="M12 15v2m-6 1h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z"
                /><path d="M8 11V7a4 4 0 118 0v4" />
              </svg>
            </div>
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:text-gray-200"
              onclick={() => (showPassword2 = !showPassword2)}
              disabled={loading}
              aria-label={showPassword2 ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'}
              title={showPassword2 ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'}
            >
              {#if showPassword2}
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
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-line text-red-700
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
            <span>Mendaftar...</span>
          {:else}
            <span>Daftar</span>
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
      </form>

      <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
        Sudah punya akun?
        <a
          href="/auth/login"
          class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >Login disini</a
        >
      </p>
    </div>
  </div>
</div>
