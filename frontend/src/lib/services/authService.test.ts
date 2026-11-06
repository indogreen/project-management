import { describe, expect, it, vi } from 'vitest';
import axiosClient from '$lib/axiosClient';
import { getAuthFeatures } from './authService';

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
});
