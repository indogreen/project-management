import { describe, expect, it } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handle } from './hooks.server';

describe('Server Security Headers Hook (hooks.server.ts)', () => {
  it('menyematkan header keamanan X-Content-Type-Options dan Referrer-Policy', async () => {
    const mockEvent = {
      url: new URL('https://app-pm-idg.zed.ai.id/dashboard')
    } as unknown as RequestEvent;

    const mockResolve = async () => new Response('OK', { status: 200 });

    const response = await handle({ event: mockEvent, resolve: mockResolve });

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('menyematkan Cache-Control no-cache untuk /service-worker.js', async () => {
    const mockEvent = {
      url: new URL('https://app-pm-idg.zed.ai.id/service-worker.js')
    } as unknown as RequestEvent;

    const mockResolve = async () => new Response('// SW', { status: 200 });

    const response = await handle({ event: mockEvent, resolve: mockResolve });

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
  });

  it('menyematkan Cache-Control no-cache untuk /manifest.webmanifest', async () => {
    const mockEvent = {
      url: new URL('https://app-pm-idg.zed.ai.id/manifest.webmanifest')
    } as unknown as RequestEvent;

    const mockResolve = async () => new Response('{}', { status: 200 });

    const response = await handle({ event: mockEvent, resolve: mockResolve });

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
  });
});
