<script lang="ts">
  import InstallButton from '$lib/components/pwa/InstallButton.svelte';

  /** Profile settings form with bindable local draft. */
  let {
    profile = $bindable(),
    disabled,
    pageLoading,
    saving,
    dirty,
    onReset,
    onSubmit
  }: {
    profile: { name: string; username?: string; email: string };
    disabled: boolean;
    pageLoading: boolean;
    saving: boolean;
    dirty: boolean;
    onReset: () => void;
    onSubmit: (event: SubmitEvent) => void;
  } = $props();
</script>

<div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
  <form onsubmit={onSubmit}>
    <div class="space-y-12 rounded-lg bg-white px-4 py-4 sm:px-6 lg:px-8 dark:bg-black">
      <div>
        <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-300">
          Kelola informasi data pribadi kamu.
        </p>
        <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label for="name" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
              >Name</label
            >
            <div class="mt-2">
              <input
                id="name"
                type="text"
                bind:value={profile.name}
                autocomplete="given-name"
                class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 disabled:opacity-60 sm:text-sm/6 dark:bg-neutral-900 dark:text-gray-100 dark:outline-gray-700"
                disabled={disabled || pageLoading || saving}
              />
            </div>
          </div>
          <div class="sm:col-span-4">
            <label for="username" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
              >Username</label
            >
            <div class="mt-2">
              <input
                id="username"
                type="text"
                bind:value={profile.username}
                autocomplete="username"
                placeholder="Username unik"
                class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 disabled:opacity-60 sm:text-sm/6 dark:bg-neutral-900 dark:text-gray-100 dark:outline-gray-700"
                disabled={disabled || pageLoading || saving}
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Username dapat digunakan untuk masuk ke akun Anda.
            </p>
          </div>
          <div class="sm:col-span-4">
            <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-300"
              >Email address</label
            >
            <div class="mt-2">
              <input
                id="email"
                type="email"
                bind:value={profile.email}
                autocomplete="email"
                readonly
                class="block w-full cursor-not-allowed rounded-md bg-gray-100 px-3 py-1.5 text-base text-gray-700 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 sm:text-sm/6 dark:bg-neutral-800 dark:text-gray-300 dark:outline-gray-700"
              />
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Email hanya ditampilkan dan tidak bisa diubah.
            </p>
          </div>
        </div>
        <div class="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onclick={onReset}
            class="text-sm/6 font-semibold text-gray-900 dark:text-gray-200"
            disabled={!dirty || saving}
          >
            Reset
          </button>
          <button
            type="submit"
            class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
            disabled={!dirty || saving || pageLoading}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  </form>

  <div class="mt-6">
    <InstallButton variant="card" />
  </div>
</div>
