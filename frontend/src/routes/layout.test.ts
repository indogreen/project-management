import { describe, expect, it, beforeEach, vi } from 'vitest';
import { load } from './+layout';

interface RedirectError {
  status: number;
  location: string;
}

function isRedirectError(err: unknown): err is RedirectError {
  return typeof err === 'object' && err !== null && 'status' in err && 'location' in err;
}

function createLoadEvent(url: string): Parameters<typeof load>[0] {
  return {
    url: new URL(url)
  } as unknown as Parameters<typeof load>[0];
}

describe('+layout.ts load', () => {
  beforeEach(() => {
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        for (const k of Object.keys(storage)) {
          delete storage[k];
        }
      })
    });
  });

  it('allows auth routes without token', async () => {
    const result = await load(createLoadEvent('http://localhost:5173/auth/login'));
    expect(result).toEqual({});
  });

  it('allows authenticated users on protected routes', async () => {
    localStorage.setItem('jwt_token', 'valid-token');
    const result = await load(createLoadEvent('http://localhost:5173/dashboard'));
    expect(result).toEqual({});
  });

  it('redirects unauthenticated user visiting root "/" to "/auth/login" without redirect param', async () => {
    try {
      await load(createLoadEvent('http://localhost:5173/'));
      expect.unreachable('Should have thrown redirect');
    } catch (err: unknown) {
      if (!isRedirectError(err)) throw err;
      expect(err.status).toBe(307);
      expect(err.location).toBe('/auth/login');
    }
  });

  it('redirects unauthenticated user visiting "/dashboard" to "/auth/login?redirect=%2Fdashboard"', async () => {
    try {
      await load(createLoadEvent('http://localhost:5173/dashboard'));
      expect.unreachable('Should have thrown redirect');
    } catch (err: unknown) {
      if (!isRedirectError(err)) throw err;
      expect(err.status).toBe(307);
      expect(err.location).toBe('/auth/login?redirect=%2Fdashboard');
    }
  });

  it('redirects unauthenticated user visiting subpath with query to login with full query encoded', async () => {
    try {
      await load(createLoadEvent('http://localhost:5173/projects?status=active'));
      expect.unreachable('Should have thrown redirect');
    } catch (err: unknown) {
      if (!isRedirectError(err)) throw err;
      expect(err.status).toBe(307);
      expect(err.location).toBe('/auth/login?redirect=%2Fprojects%3Fstatus%3Dactive');
    }
  });
});
