<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount, type Snippet } from 'svelte';
  import { confirm } from '$lib/components/common/ConfirmDialog.svelte';
  import MobileSidebar from '$lib/components/layout/MobileSidebar.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import TopNav from '$lib/components/layout/TopNav.svelte';
  import { getPageTitle } from '$lib/components/layout/nav';
  import { getMe, logout as authLogout } from '$lib/services/authService';
  import { setPermissions, setRoles } from '$lib/stores/permissions';
  import { theme } from '$lib/stores/theme';
  import { currentUser, setUser } from '$lib/stores/user';
  import { showError, showSuccess } from '$lib/utils/toast';

  let { children }: { children: Snippet } = $props();

  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);

  onMount(() => {
    const unsubscribe = theme.subscribe((currentTheme) => {
      if (typeof document === 'undefined') return;
      const themeColor = currentTheme === 'dark' ? '#000000' : '#ffffff';
      const metaTags = document.querySelectorAll('meta[name="theme-color"]');
      if (metaTags.length > 0) {
        metaTags.forEach((el) => el.setAttribute('content', themeColor));
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute('content', themeColor);
        document.head.appendChild(meta);
      }
    });
    return unsubscribe;
  });

  let isAuthRoute = $derived(page.url.pathname.startsWith('/auth'));
  let pageTitle = $derived(getPageTitle(page.url.pathname));
  let shellOffset = $derived(sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64');

  async function logout() {
    const confirmed = await confirm({
      title: 'Apakah Anda yakin ingin logout?',
      text: 'Sesi login Anda akan diakhiri.',
      confirmText: 'Logout'
    });

    if (!confirmed) return;

    try {
      await authLogout();
      localStorage.removeItem('jwt_token');
      setUser(null);
      setRoles([]);
      setPermissions([]);
      showSuccess('Logout berhasil!');
      goto('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('jwt_token');
      setUser(null);
      setRoles([]);
      setPermissions([]);
      showError('Logout gagal, namun Anda telah keluar dari sesi.');
      goto('/auth/login');
    }
  }

  async function loadUserData() {
    if (!browser) return;
    if (isAuthRoute || !localStorage.getItem('jwt_token')) return;
    if ($currentUser) return;

    try {
      const data = await getMe();
      setUser({
        id: data.id,
        name: data.name,
        email: data.email
      });
      setRoles(data.roles ?? []);
      setPermissions(data.permissions ?? []);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  }

  $effect(() => {
    if (browser && !isAuthRoute && page.url.pathname) {
      void loadUserData();
    }
  });
</script>

{#if isAuthRoute}
  {@render children()}
{:else}
  <div class="min-h-svh bg-background font-sans text-foreground">
    <Sidebar
      bind:collapsed={sidebarCollapsed}
      toggleCollapsed={() => (sidebarCollapsed = !sidebarCollapsed)}
      {logout}
    />

    <div
      class={`flex min-h-svh min-w-0 flex-col transition-[padding] duration-200 ease-linear ${shellOffset}`}
    >
      <MobileSidebar bind:open={sidebarOpen} close={() => (sidebarOpen = false)} {logout} />

      <TopNav toggleMobileSidebar={() => (sidebarOpen = true)}>
        {#snippet topnavTitle()}
          <!-- <p class="truncate text-xs font-medium text-muted-foreground">Project Management</p> -->
          <h1
            class="truncate text-xl leading-7 font-semibold tracking-normal text-foreground md:text-2xl"
          >
            {pageTitle}
          </h1>
        {/snippet}
      </TopNav>

      <main
        class="min-w-0 flex-1 bg-background px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-6 md:py-6"
      >
        <div class="mx-auto flex w-full min-w-0 flex-col">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
{/if}
