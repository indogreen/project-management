import { describe, expect, it, vi } from 'vitest';
import axiosClient from '$lib/axiosClient';
import { forgotPassword, getAuthFeatures, login, resetPassword } from './authService';

vi.mock('$lib/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('authService', () => {
  it('getAuthFeatures calls /auth/features and returns feature flags', async () => {
    const mockData = { registration_enabled: false, allowed_domain: 'indogreen.id' };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockData });

    const result = await getAuthFeatures();
    expect(axiosClient.get).toHaveBeenCalledWith('/auth/features');
    expect(result).toEqual(mockData);
  });

  it('login sends login identifier and password', async () => {
    const mockResponse = { access_token: 'mock-jwt-token', token_type: 'bearer', expires_in: 3600 };
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await login('admin_user', 'Secret123!');
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
      login: 'admin_user',
      email: 'admin_user',
      password: 'Secret123!'
    });
    expect(result).toEqual(mockResponse);
  });

  it('forgotPassword calls /auth/forgot-password with email', async () => {
    const mockResponse = { message: 'Kode verifikasi terkirim' };
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await forgotPassword('user@indogreen.id');
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'user@indogreen.id'
    });
    expect(result).toEqual(mockResponse);
  });

  it('resetPassword calls /auth/reset-password with payload', async () => {
    const mockPayload = {
      email: 'user@indogreen.id',
      token: '123456',
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    };
    const mockResponse = { message: 'Password berhasil direset' };
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await resetPassword(mockPayload);
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/reset-password', mockPayload);
    expect(result).toEqual(mockResponse);
  });
});
