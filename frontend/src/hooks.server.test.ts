import { describe, expect, it } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handle } from './hooks.server';

describe('Server Security Headers Hook (hooks.server.ts)', () => {
  it('menyematkan header keamanan lengkap (nosniff, referrer, clickjacking, permissions, CSP)', async () => {
    const mockEvent = {
      url: new URL('https://app-pm-idg.zed.ai.id/dashboard'),
      request: {
        headers: new Headers({ 'x-forwarded-proto': 'https' })
      }
    } as unknown as RequestEvent;

    const mockResolve = async () => new Response('OK', { status: 200 });

    const response = await handle({ event: mockEvent, resolve: mockResolve });

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(response.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    
    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");

    // Verifikasi HSTS pada koneksi HTTPS
    expect(response.headers.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains'
    );
  });

  it('tidak menyematkan HSTS pada koneksi HTTP biasa', async () => {
    const mockEvent = {
      url: new URL('http://localhost:5173/dashboard'),
      request: {
        headers: new Headers()
      }
    } as unknown as RequestEvent;

    const mockResolve = async () => new Response('OK', { status: 200 });

    const response = await handle({ event: mockEvent, resolve: mockResolve });

    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('menyematkan Cache-Control no-cache untuk /service-worker.js', async () => {
    const mockEvent = {
      url: new URL('https://app-pm-idg.zed.ai.id/service-worker.js'),
      request: { headers: new Headers() }
    } as unknown as RequestEvent;

    const mockResolve = async () => new Response('// SW', { status: 200 });

    const response = await handle({ event: mockEvent, resolve: mockResolve });

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
  });

  it('menyematkan Cache-Control no-cache untuk /manifest.webmanifest', async () => {
    const mockEvent = {
      url: new URL('https://app-pm-idg.zed.ai.id/manifest.webmanifest'),
      request: { headers: new Headers() }
    } as unknown as RequestEvent;

    const mockResolve = async () => new Response('{}', { status: 200 });

    const response = await handle({ event: mockEvent, resolve: mockResolve });

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
  });
});
