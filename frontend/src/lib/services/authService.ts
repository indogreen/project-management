import axiosClient from '$lib/axiosClient';
import type { AuthFeatures } from '$lib/types/auth';

export type { AuthFeatures };

export type User = {
  id: number;
  name: string;
  email: string;
};

export type AuthUser = User & {
  roles: string[];
  permissions: string[];
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

/** Fetches public auth features/config (e.g. registration enabled status). */
export async function getAuthFeatures(): Promise<AuthFeatures> {
  const response = await axiosClient.get<AuthFeatures>('/auth/features');
  return response.data;
}

/** Sends user credentials to the JWT login endpoint. */
export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const response = await axiosClient.post<AuthTokenResponse>('/auth/login', { email, password });
  return response.data;
}

/** Registers a new user account. */
export async function register(payload: RegisterPayload): Promise<void> {
  await axiosClient.post('/auth/register', payload);
}

/** Invalidates the current JWT token on the backend. */
export async function logout(): Promise<void> {
  await axiosClient.post('/auth/logout');
}

/** Fetches the authenticated user with roles and permissions. */
export async function getMe(): Promise<AuthUser> {
  const response = await axiosClient.get<AuthUser>('/auth/me');
  return response.data;
}

/** Refreshes the current JWT token through the backend refresh endpoint. */
export async function refreshToken(): Promise<AuthTokenResponse> {
  const response = await axiosClient.post<AuthTokenResponse>('/auth/refresh');
  return response.data;
}
