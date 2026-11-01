<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/stores/user';
  import { userPermissions } from '$lib/stores/permissions';
  import SidebarLink from './SidebarLink.svelte';
  import { getVisibleNavGroups } from './nav';
  import InstallButton from '$lib/components/pwa/InstallButton.svelte';

  const SETTINGS_ICON =
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z';
  const LOGOUT_ICON =
    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1';

  type Props = {
    collapsed?: boolean;
    mobile?: boolean;
    close?: () => void;
    logout?: () => void;
    toggleCollapsed?: () => void;
  };

  const noop = () => {};

  let {
    collapsed = false,
    mobile = false,
    close = noop,
    logout: onLogout = noop,
    toggleCollapsed: onToggleCollapsed = noop
  }: Props = $props();

  let accountMenuOpen = $state(false);
  let accountMenuRoot: HTMLDivElement | undefined;

  let compact = $derived(collapsed && !mobile);
  let visibleGroups = $derived(getVisibleNavGroups($userPermissions ?? []));
  let displayName = $derived($currentUser?.name || 'Pengguna');
  let displayEmail = $derived($currentUser?.email || 'Belum ada email');
  let initials = $derived(
    displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
      displayEmail[0]?.toUpperCase() ||
      'U'
  );

  onMount(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        accountMenuOpen &&
        accountMenuRoot &&
        event.target instanceof Node &&
        !accountMenuRoot.contains(event.target)
      ) {
        accountMenuOpen = false;
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  });

  function closeIfMobile() {
    if (mobile) close();
  }

  function toggleCollapsed() {
    if (mobile) {
      close();
      return;
    }

    onToggleCollapsed();
  }

  function openSettings() {
    accountMenuOpen = false;
    closeIfMobile();
    goto('/settings');
  }

  function logout() {
    accountMenuOpen = false;
    closeIfMobile();
    onLogout();
  }
</script>

<div class="flex h-full min-h-0 flex-col bg-card text-card-foreground">
  <div class="flex min-h-[64px] items-center gap-3 border-b border-border px-3">
    {#if !compact}
      <a
        href="/dashboard"
        class="flex min-w-0 flex-1 items-center gap-3 rounded-[10px] px-2 py-2 transition-colors"
        aria-label="Buka dashboard"
        onclick={closeIfMobile}
      >
        <img
          src="/indogreen.png"
          alt="Indogreen"
          class="h-8 w-8 shrink-0 rounded-[8px] object-contain"
        />
        <div class="min-w-0">
          <p class="truncate text-sm leading-5 font-semibold text-foreground">Indogreen</p>
          <p class="truncate text-xs leading-4 text-muted-foreground">Project Management</p>
        </div>
      </a>
    {/if}

    <button
      type="button"
      class={`grid h-9 shrink-0 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${compact ? 'w-full' : 'w-9'}`}
      aria-label={mobile ? 'Tutup menu' : collapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
      title={mobile ? 'Tutup menu' : collapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
      onclick={toggleCollapsed}
    >
      {#if mobile}
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      {:else}
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v18" />
        </svg>
      {/if}
    </button>
  </div>

  <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu utama">
    {#each visibleGroups as group (group.label)}
      <div class="mb-5 last:mb-0">
        {#if !compact}
          <p
            class="mb-2 px-3 text-[11px] leading-4 font-semibold tracking-normal text-muted-foreground uppercase"
          >
            {group.label}
          </p>
        {:else}
          <div class="mx-auto mb-2 h-px w-8 bg-border"></div>
        {/if}

        <div class="space-y-1">
          {#each group.items as item (item.href)}
            <SidebarLink
              href={item.href}
              icon={item.icon}
              label={item.label}
              routePrefix={item.routePrefix ?? ''}
              {collapsed}
              onclick={closeIfMobile}
            >
              {item.label}
            </SidebarLink>
          {/each}
        </div>
      </div>
    {/each}
  </nav>

  <div class="border-t border-border p-2">
    <div class="relative" bind:this={accountMenuRoot}>
      {#if accountMenuOpen}
        <div
          class={`absolute bottom-full z-40 mb-2 overflow-hidden rounded-[10px] border border-border bg-popover text-popover-foreground shadow-xl ${compact ? 'left-0 w-64' : 'inset-x-0'}`}
        >
          <div class="px-4 py-3">
            <p class="truncate text-xs font-semibold tracking-normal text-foreground">
              {displayName}
            </p>
            <p class="mt-1 truncate text-xs text-muted-foreground">{displayEmail}</p>
          </div>
          <div class="h-px bg-border"></div>
          <InstallButton
            variant="menu"
            onclick={() => {
              accountMenuOpen = false;
              closeIfMobile();
            }}
          />
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
            onclick={openSettings}
          >
            <svg
              class="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={SETTINGS_ICON}
              />
            </svg>
            <span>Pengaturan</span>
          </button>
          <div class="h-px bg-border"></div>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            onclick={logout}
          >
            <svg
              class="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={LOGOUT_ICON}
              />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      {/if}

      <button
        type="button"
        class={`flex min-h-11 w-full items-center rounded-lg bg-card text-left transition-colors hover:bg-muted ${compact ? 'justify-center px-2' : 'gap-3 px-3'}`}
        aria-expanded={accountMenuOpen}
        aria-haspopup="menu"
        aria-label="Menu akun"
        title={compact ? displayName : undefined}
        onclick={() => (accountMenuOpen = !accountMenuOpen)}
      >
        <div
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          aria-hidden="true"
        >
          {initials}
        </div>

        {#if !compact}
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-foreground">{displayName}</p>
          </div>
          <svg
            class="h-4 w-4 shrink-0 text-muted-foreground transition-transform"
            class:rotate-180={accountMenuOpen}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>
