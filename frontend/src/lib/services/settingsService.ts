import axiosClient from '$lib/axiosClient';

export type ProfileForm = {
  name: string;
  username?: string;
  email: string;
};

export type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

export type ActionConfig = {
  key: string;
  label: string;
};

export type ModuleConfig = {
  key: string;
  label: string;
  actions?: ActionConfig[];
};

export type RoleOption = {
  key: string;
  label: string;
};

export type RoleUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export type ModulesState = Record<string, Record<string, boolean>>;

export type RoleForm = {
  userId: string;
  selectedRole: string;
  modules: ModulesState;
};

export type RoleConfig = {
  roles: RoleOption[];
  modules: ModuleConfig[];
  actions: ActionConfig[];
};

type RoleUsersResponse = {
  data?: RoleUser[];
};

type ProfileResponse = {
  name?: string;
  username?: string;
  email?: string;
};

/** Updates the authenticated user's profile. */
export async function updateProfile(
  data: string | { name: string; username?: string }
): Promise<ProfileResponse> {
  const payload = typeof data === 'string' ? { name: data } : data;
  const response = await axiosClient.put<ProfileResponse>('/auth/profile', payload);
  return response.data;
}

/** Updates the authenticated user's password. */
export async function updatePassword(form: PasswordForm): Promise<void> {
  await axiosClient.put('/auth/password', {
    current_password: form.current,
    password: form.next,
    password_confirmation: form.confirm
  });
}

/** Fetches dynamic role module/action configuration. */
export async function fetchRoleConfig(): Promise<RoleConfig> {
  const response = await axiosClient.get<Partial<RoleConfig>>('/auth/role/config');

  return {
    roles: response.data.roles ?? [],
    modules: response.data.modules ?? [],
    actions: response.data.actions ?? []
  };
}

/** Fetches users that can be managed from settings role tab. */
export async function fetchRoleUsers(): Promise<RoleUser[]> {
  const response = await axiosClient.get<RoleUsersResponse>('/auth/role/users');
  return response.data.data ?? [];
}

/** Updates a user's role and permissions. */
export async function updateRole(payload: {
  user_id: number;
  role: string;
  permissions: Record<string, boolean>;
}): Promise<void> {
  await axiosClient.put('/auth/role', payload);
}
