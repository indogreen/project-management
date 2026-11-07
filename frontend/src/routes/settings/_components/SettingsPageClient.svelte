<script lang="ts">
  import { onMount } from 'svelte';
  import {
    fetchRoleConfig,
    fetchRoleUsers,
    updatePassword,
    updateProfile,
    updateRole,
    type ActionConfig,
    type ModuleConfig,
    type RoleForm,
    type RoleUser
  } from '$lib/services/settingsService';
  import { userRoles } from '$lib/stores/permissions';
  import { currentUser, patchUser } from '$lib/stores/user';
  import { extractApiErrors } from '$lib/utils/errors';
  import { showError, showSuccess } from '$lib/utils/toast';
  import ProfileSettingsTab from './ProfileSettingsTab.svelte';
  import RoleSettingsTab from './RoleSettingsTab.svelte';
  import SecuritySettingsTab from './SecuritySettingsTab.svelte';
  import SettingsTabs, { type SettingsTab } from './SettingsTabs.svelte';
  import { buildPermissionsPayload, cloneModules, createEmptyModules } from './settings-role';

  // ---------------------------
  // Global UI
  // ---------------------------
  let disabled = $state(false);
  let activeTab = $state<SettingsTab>('profile');
  let pageLoading = $state(true);
  let errorMsg = $state('');

  // ---------------------------
  // Profile
  // ---------------------------
  let profile = $state({ name: '', username: '', email: '' });
  let initialProfile = $state({ name: '', username: '', email: '' });
  let profileInitialized = $state(false);

  // Sinkronisasi Profile dari Store secara Reaktif
  $effect(() => {
    if ($currentUser && !profileInitialized) {
      profile.name = $currentUser.name;
      profile.username = $currentUser.username ?? '';
      profile.email = $currentUser.email;
      initialProfile = { ...profile };
      profileInitialized = true;
    }
  });

  let savingProfile = $state(false);

  let profileDirty = $derived(JSON.stringify(profile) !== JSON.stringify(initialProfile));

  async function submitProfile() {
    if (!profileDirty || savingProfile) return;
    savingProfile = true;
    errorMsg = '';
    try {
      const data = await updateProfile({ name: profile.name, username: profile.username });
      profile.name = data.name ?? profile.name;
      profile.username = data.username ?? profile.username;
      initialProfile = { ...profile };
      patchUser({ name: profile.name, username: profile.username });
      showSuccess('Profil berhasil diperbarui');
    } catch (err) {
      showError(extractApiErrors(err));
    } finally {
      savingProfile = false;
    }
  }

  function resetProfileToInitial() {
    profile = { ...initialProfile };
  }

  // ---------------------------
  // Keamanan / Password
  // ---------------------------
  let pw = $state({ current: '', next: '', confirm: '' });
  let showPw = $state({ current: false, next: false, confirm: false });
  let savingPw = $state(false);

  let pwRules = $derived({
    len8: pw.next.length >= 8,
    hasLower: /[a-z]/.test(pw.next),
    hasUpper: /[A-Z]/.test(pw.next),
    notSameAsOld: pw.next !== '' && pw.current !== '' && pw.next !== pw.current,
    confirmMatch: pw.next !== '' && pw.next === pw.confirm
  });
  let canUpdatePw = $derived(
    pwRules.len8 &&
      pwRules.hasLower &&
      pwRules.hasUpper &&
      pwRules.notSameAsOld &&
      pwRules.confirmMatch &&
      !savingPw
  );

  async function handleChangePassword() {
    if (!canUpdatePw) return;
    savingPw = true;
    try {
      await updatePassword(pw);
      showSuccess('Password berhasil diperbarui');
      pw = { current: '', next: '', confirm: '' };
    } catch (err) {
      showError(extractApiErrors(err));
    } finally {
      savingPw = false;
    }
  }

  // ---------------------------
  // Role (DINAMIS DARI BACKEND)
  // ---------------------------
  // Variable state untuk menyimpan config
  let moduleList = $state<ModuleConfig[]>([]);
  let actionList = $state<ActionConfig[]>([]);
  let roleList = $state<{ key: string; label: string }[]>([]);

  // State untuk expand/collapse modul di UI
  let expandedModules = $state<Record<string, boolean>>({});
  let users = $state<RoleUser[]>([]);

  // Sinkronisasi Roles dari Store secara Reaktif
  let myRoles = $derived($userRoles);
  let currentIsOnlyAdmin = $derived(myRoles.includes('admin') && !myRoles.includes('super_admin'));
  let canManageRoles = $derived(myRoles.includes('admin') || myRoles.includes('super_admin'));
  let selectedUserIsSuperAdmin = $state(false);

  let selectedUserId = $state('');

  // Inisialisasi awal kosong, akan di-rebuild saat data config masuk
  let role = $state<RoleForm>({
    userId: '',
    selectedRole: 'user',
    modules: {}
  });
  let initialRole = $state<RoleForm>({
    userId: '',
    selectedRole: 'user',
    modules: {}
  });
  let savingRole = $state(false);

  let roleDirty = $derived(JSON.stringify(role) !== JSON.stringify(initialRole));

  // Helper membuat object kosong berdasarkan moduleList & actionList yang sudah ditarik
  function applyUserRole(user: RoleUser | null) {
    // Pastikan config sudah ada sebelum apply role
    if (moduleList.length === 0) return;

    if (!user) {
      selectedUserId = '';
      selectedUserIsSuperAdmin = false;
      const empty = createEmptyModules(moduleList, actionList);
      role = { userId: '', selectedRole: 'user', modules: empty };
      initialRole = { userId: '', selectedRole: 'user', modules: cloneModules(empty) };
      return;
    }

    const perms = (user.permissions ?? []) as string[];
    const modules = createEmptyModules(moduleList, actionList);

    // Map permissions string ("project-view") ke struktur object
    for (const m of moduleList) {
      const actions = m.actions ?? actionList;
      for (const a of actions) {
        const permName = `${m.key}-${a.key}`;
        if (modules[m.key]) {
          modules[m.key][a.key] = perms.includes(permName);
        }
      }
    }

    selectedUserId = String(user.id);
    role = {
      userId: selectedUserId,
      selectedRole: user.roles && user.roles.length > 0 ? user.roles[0] : 'user',
      modules
    };

    selectedUserIsSuperAdmin = user.roles?.includes('super_admin') ?? false;

    initialRole = {
      userId: role.userId,
      selectedRole: role.selectedRole,
      modules: cloneModules(role.modules)
    };
  }

  function toggleModuleAll(moduleKey: string, checked: boolean) {
    // Copy module state
    const updatedModule = { ...role.modules[moduleKey] };

    // Set semua action menjadi checked/unchecked
    const modConfig = moduleList.find((m) => m.key === moduleKey);
    const actions = modConfig?.actions ?? actionList;

    for (const a of actions) {
      updatedModule[a.key] = checked;
    }

    role = {
      ...role,
      modules: {
        ...role.modules,
        [moduleKey]: updatedModule
      }
    };
  }

  function handleToggleAction(moduleKey: string, actionKey: string, checked: boolean) {
    const updatedModule = {
      ...role.modules[moduleKey],
      [actionKey]: checked
    };
    role = {
      ...role,
      modules: {
        ...role.modules,
        [moduleKey]: updatedModule
      }
    };
  }

  async function submitRole() {
    if (!roleDirty || savingRole) return;
    if (!role.userId) {
      showError('Silakan pilih user terlebih dahulu.');
      return;
    }

    savingRole = true;
    try {
      await updateRole({
        user_id: Number(role.userId),
        permissions: buildPermissionsPayload(role, moduleList, actionList),
        role: role.selectedRole
      });
      initialRole = {
        userId: role.userId,
        selectedRole: role.selectedRole,
        modules: cloneModules(role.modules)
      };
      showSuccess('Role & akses berhasil diperbarui');
    } catch (err) {
      showError(extractApiErrors(err));
    } finally {
      savingRole = false;
    }
  }

  function resetRoleToInitial() {
    role = {
      userId: initialRole.userId,
      selectedRole: initialRole.selectedRole,
      modules: cloneModules(initialRole.modules)
    };
    selectedUserId = role.userId;
  }

  function handleProfileSubmit(event: SubmitEvent) {
    event.preventDefault();
    void submitProfile();
  }

  function handleRoleSubmit(event: SubmitEvent) {
    event.preventDefault();
    void submitRole();
  }

  $effect(() => {
    if (!canManageRoles && activeTab === 'role') {
      activeTab = 'profile';
    }
  });

  // ---------------------------
  // Bootstrap
  // ---------------------------
  onMount(async () => {
    pageLoading = true;
    errorMsg = '';
    try {
      // Data profile dan password tetap di-bootstrap di sini
    } catch (err) {
      console.error(err);
      errorMsg = extractApiErrors(err);
      showError(errorMsg);
    } finally {
      pageLoading = false;
    }
  });

  // Fetch Config & Users secara reaktif jika canManageRoles menjadi true
  let usersLoaded = $state(false);
  let configLoaded = $state(false);
  $effect(() => {
    if (!canManageRoles || pageLoading) return;

    void (async () => {
      // 1. Fetch Config Jika Belum
      if (!configLoaded) {
        try {
          const config = await fetchRoleConfig();
          roleList = config.roles;
          moduleList = config.modules;
          actionList = config.actions;
          moduleList.forEach((m) => (expandedModules[m.key] = true));
          configLoaded = true;
        } catch (e) {
          console.error('Gagal memuat config role:', e);
        }
      }

      // 2. Fetch Users Jika Belum (Hanya setelah config ready)
      if (configLoaded && !usersLoaded) {
        try {
          users = await fetchRoleUsers();
          if (users.length > 0) applyUserRole(users[0]);
          usersLoaded = true;
        } catch (e) {
          console.error('Gagal memuat daftar user:', e);
        }
      }
    })();
  });
</script>

<svelte:head>
  <title>Settings - Indogreen</title>
</svelte:head>

<div class="max-w-1xl">
  {#if pageLoading}
    <div class="mb-4 text-sm text-gray-900 dark:text-white">Memuat data…</div>
  {/if}
  {#if errorMsg}
    <div
      class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
    >
      {errorMsg}
    </div>
  {/if}

  <SettingsTabs bind:activeTab showRoleTab={canManageRoles} />

  {#if activeTab === 'profile'}
    <ProfileSettingsTab
      bind:profile
      {disabled}
      {pageLoading}
      saving={savingProfile}
      dirty={profileDirty}
      onReset={resetProfileToInitial}
      onSubmit={handleProfileSubmit}
    />
  {/if}

  {#if activeTab === 'keamanan'}
    <SecuritySettingsTab
      bind:password={pw}
      bind:visibility={showPw}
      rules={pwRules}
      saving={savingPw}
      canUpdate={canUpdatePw}
      onUpdate={() => void handleChangePassword()}
    />
  {/if}

  {#if activeTab === 'role' && canManageRoles}
    <RoleSettingsTab
      {myRoles}
      {users}
      bind:selectedUserId
      bind:role
      {roleList}
      {moduleList}
      {actionList}
      bind:expandedModules
      {pageLoading}
      saving={savingRole}
      dirty={roleDirty}
      {currentIsOnlyAdmin}
      {selectedUserIsSuperAdmin}
      onSelectUser={applyUserRole}
      onToggleModule={toggleModuleAll}
      onToggleAction={handleToggleAction}
      onReset={resetRoleToInitial}
      onSubmit={handleRoleSubmit}
    />
  {/if}
</div>
