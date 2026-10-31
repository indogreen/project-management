import { describe, expect, it } from 'vitest';
import { classifyRequest } from './sw-routing';

const APP_ORIGIN = 'https://app-pm-idg.zed.ai.id';

describe('classifyRequest (Service Worker Request Classifier)', () => {
  describe('1. Bypass Evaluasi: Method Non-GET', () => {
    it('harus mem-bypass request POST form action', () => {
      const result = classifyRequest({
        url: `${APP_ORIGIN}/projects`,
        method: 'POST',
        mode: 'navigate',
        origin: APP_ORIGIN
      });
      expect(result).toBe('bypass');
    });

    it('harus mem-bypass method non-GET lainnya (PUT, DELETE, PATCH, OPTIONS)', () => {
      for (const method of ['PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
        expect(
          classifyRequest({
            url: `${APP_ORIGIN}/items/1`,
            method,
            origin: APP_ORIGIN
          })
        ).toBe('bypass');
      }
    });
  });

  describe('2. Bypass Evaluasi: Lintas Origin', () => {
    it('harus mem-bypass request ke backend API host yang berbeda', () => {
      const result = classifyRequest({
        url: 'https://api-pm-idg.zed.ai.id/api/auth/me',
        method: 'GET',
        origin: APP_ORIGIN
      });
      expect(result).toBe('bypass');
    });

    it('harus mem-bypass request ke third-party domain', () => {
      const result = classifyRequest({
        url: 'https://cdn.example.com/analytics.js',
        method: 'GET',
        origin: APP_ORIGIN
      });
      expect(result).toBe('bypass');
    });
  });

  describe('3. Bypass Evaluasi: Path /api & /storage', () => {
    it('harus mem-bypass path /api dan sub-path /api/*', () => {
      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/api/projects`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');

      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/api`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');
    });

    it('harus mem-bypass path proxy /api/proxy/...', () => {
      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/api/proxy/activities/5`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');
    });

    it('harus mem-bypass path /storage dan /storage/*', () => {
      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/storage/attachments/invoice.pdf`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');

      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/storage`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');
    });
  });

  describe('4. Bypass Evaluasi: __data.json', () => {
    it('harus mem-bypass request data SSR berakhiran /__data.json', () => {
      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/dashboard/__data.json`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');

      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/projects/12/__data.json?x=1`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');
    });
  });

  describe('5. Bypass Evaluasi: Header x-sveltekit-action & Accept JSON', () => {
    it('harus mem-bypass jika terdapat header x-sveltekit-action', () => {
      const result = classifyRequest({
        url: `${APP_ORIGIN}/auth/login`,
        method: 'GET',
        mode: 'navigate',
        origin: APP_ORIGIN,
        headers: { 'x-sveltekit-action': 'true' }
      });
      expect(result).toBe('bypass');
    });

    it('harus mem-bypass jika header Accept mengandung application/json', () => {
      const result = classifyRequest({
        url: `${APP_ORIGIN}/users/me`,
        method: 'GET',
        origin: APP_ORIGIN,
        headers: { accept: 'application/json, text/plain, */*' }
      });
      expect(result).toBe('bypass');
    });

    it('harus mengenali Headers instance browser standard', () => {
      const headers = new Headers();
      headers.set('Accept', 'application/json');

      const result = classifyRequest({
        url: `${APP_ORIGIN}/data`,
        method: 'GET',
        origin: APP_ORIGIN,
        headers
      });
      expect(result).toBe('bypass');
    });
  });

  describe('6. Bypass Evaluasi: Header Authorization', () => {
    it('harus mem-bypass request yang membawa Authorization header', () => {
      const result = classifyRequest({
        url: `${APP_ORIGIN}/protected-resource`,
        method: 'GET',
        origin: APP_ORIGIN,
        headers: { Authorization: 'Bearer mock_jwt_token_value' }
      });
      expect(result).toBe('bypass');
    });
  });

  describe('7. Klasifikasi: Navigation', () => {
    it('harus mengklasifikasikan navigasi /dashboard sebagai navigation', () => {
      const result = classifyRequest({
        url: `${APP_ORIGIN}/dashboard`,
        method: 'GET',
        mode: 'navigate',
        origin: APP_ORIGIN
      });
      expect(result).toBe('navigation');
    });

    it('harus mengklasifikasikan navigasi rute halaman lainnya sebagai navigation', () => {
      for (const path of ['/projects', '/activities', '/mitras/5', '/finance']) {
        expect(
          classifyRequest({
            url: `${APP_ORIGIN}${path}`,
            method: 'GET',
            mode: 'navigate',
            origin: APP_ORIGIN
          })
        ).toBe('navigation');
      }
    });

    it('tetap mem-bypass jika navigasi mengarah ke rute /api', () => {
      const result = classifyRequest({
        url: `${APP_ORIGIN}/api/docs`,
        method: 'GET',
        mode: 'navigate',
        origin: APP_ORIGIN
      });
      expect(result).toBe('bypass');
    });
  });

  describe('8. Klasifikasi: Immutable Assets', () => {
    it('harus mengklasifikasikan path /_app/immutable/* sebagai immutable-asset', () => {
      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/_app/immutable/chunks/bundle.B18e9a.js`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('immutable-asset');

      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/_app/immutable/assets/entry.99a8b.css`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('immutable-asset');
    });
  });

  describe('9. Klasifikasi: Static Assets', () => {
    it('harus mengklasifikasikan offline.html, manifest, dan icons sebagai static-asset', () => {
      const staticUrls = [
        `${APP_ORIGIN}/offline.html`,
        `${APP_ORIGIN}/manifest.webmanifest`,
        `${APP_ORIGIN}/icons/icon-192.png`,
        `${APP_ORIGIN}/icons/icon-512.png`,
        `${APP_ORIGIN}/icons/icon-maskable-512.png`,
        `${APP_ORIGIN}/icons/apple-touch-icon-180.png`
      ];

      for (const url of staticUrls) {
        expect(
          classifyRequest({
            url,
            method: 'GET',
            origin: APP_ORIGIN
          })
        ).toBe('static-asset');
      }
    });
  });

  describe('10. Penanganan URL Aneh & Fallback', () => {
    it('harus menangani URL malformed tanpa melempar error', () => {
      expect(
        classifyRequest({
          url: 'javascript:void(0)',
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');

      expect(
        classifyRequest({
          url: 'not-a-valid-url://??%%',
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');
    });

    it('harus mem-bypass file umum lainnya seperti robots.txt', () => {
      expect(
        classifyRequest({
          url: `${APP_ORIGIN}/robots.txt`,
          method: 'GET',
          origin: APP_ORIGIN
        })
      ).toBe('bypass');
    });
  });
});

