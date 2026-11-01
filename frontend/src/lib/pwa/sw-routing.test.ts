import { describe, expect, it, vi } from 'vitest';
import {
  classifyRequest,
  getExcessKeys,
  pruneCache,
  MAX_IMMUTABLE_ASSETS,
  MAX_STATIC_ASSETS,
  type CachePrunable
} from './sw-routing';

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

    it('harus mengklasifikasikan logo indogreen.png dan favicon sebagai static-asset', () => {
      for (const path of ['/indogreen.png', '/favicon.png', '/favicon.ico']) {
        expect(
          classifyRequest({
            url: `${APP_ORIGIN}${path}`,
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

  describe('11. Cache Pruning Pure Logic: getExcessKeys', () => {
    it('harus mengembalikan array kosong jika jumlah keys <= maxItems', () => {
      expect(getExcessKeys(['a', 'b'], 5)).toEqual([]);
      expect(getExcessKeys(['a', 'b', 'c'], 3)).toEqual([]);
    });

    it('harus mengembalikan array kosong jika keys kosong', () => {
      expect(getExcessKeys([], 10)).toEqual([]);
    });

    it('harus mengembalikan elemen tertua (FIFO) jika keys > maxItems', () => {
      const keys = ['chunk-1.js', 'chunk-2.js', 'chunk-3.js', 'chunk-4.js', 'chunk-5.js'];
      // Jika maxItems = 3, maka 2 elemen tertua (chunk-1 dan chunk-2) harus dipangkas
      const excess = getExcessKeys(keys, 3);
      expect(excess).toEqual(['chunk-1.js', 'chunk-2.js']);
    });

    it('harus mengembalikan seluruh keys jika maxItems <= 0', () => {
      const keys = ['chunk-1.js', 'chunk-2.js'];
      expect(getExcessKeys(keys, 0)).toEqual(['chunk-1.js', 'chunk-2.js']);
      expect(getExcessKeys(keys, -5)).toEqual(['chunk-1.js', 'chunk-2.js']);
    });

    it('harus bekerja dengan objek Request browser standard', () => {
      const req1 = new Request('https://app-pm-idg.zed.ai.id/_app/immutable/1.js');
      const req2 = new Request('https://app-pm-idg.zed.ai.id/_app/immutable/2.js');
      const req3 = new Request('https://app-pm-idg.zed.ai.id/_app/immutable/3.js');

      const excess = getExcessKeys([req1, req2, req3], 2);
      expect(excess).toEqual([req1]);
    });
  });

  describe('12. Cache Pruning Async Logic: pruneCache', () => {
    it('tidak memanggil delete jika jumlah entri dalam cache masih di bawah batas', async () => {
      const deleteFn = vi.fn().mockResolvedValue(true);
      const mockCache: CachePrunable = {
        keys: vi.fn().mockResolvedValue(['entry1', 'entry2']),
        delete: deleteFn
      };

      const deletedCount = await pruneCache(mockCache, 10);
      expect(deletedCount).toBe(0);
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it('menghapus entri tertua hingga jumlah entri mencapai batas maxItems', async () => {
      const deletedItems: (Request | string)[] = [];
      const mockCache: CachePrunable = {
        keys: vi.fn().mockResolvedValue(['old1', 'old2', 'new1', 'new2', 'new3']),
        delete: vi.fn().mockImplementation(async (key: Request | string) => {
          deletedItems.push(key);
          return true;
        })
      };

      const deletedCount = await pruneCache(mockCache, 3);
      expect(deletedCount).toBe(2);
      expect(deletedItems).toEqual(['old1', 'old2']);
    });

    it('mengembalikan 0 jika maxItems negatif', async () => {
      const mockCache: CachePrunable = {
        keys: vi.fn().mockResolvedValue(['a', 'b']),
        delete: vi.fn().mockResolvedValue(true)
      };

      const deletedCount = await pruneCache(mockCache, -1);
      expect(deletedCount).toBe(0);
    });

    it('tahan terhadap error jika cache.keys() melempar pengecualian (resilient)', async () => {
      const mockCache: CachePrunable = {
        keys: vi.fn().mockRejectedValue(new Error('Storage access denied')),
        delete: vi.fn().mockResolvedValue(true)
      };

      const deletedCount = await pruneCache(mockCache, 5);
      expect(deletedCount).toBe(0);
    });

    it('tetap melanjutkan pemangkasan jika salah satu operasi delete melempar error', async () => {
      const deleteFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Disk I/O error'))
        .mockResolvedValueOnce(true);

      const mockCache: CachePrunable = {
        keys: vi.fn().mockResolvedValue(['item1', 'item2', 'item3', 'item4']),
        delete: deleteFn
      };

      // Ingin pangkas dari 4 ke 2 (harus hapus item1 dan item2)
      // item1 gagal (throw), item2 sukses
      const deletedCount = await pruneCache(mockCache, 2);
      expect(deletedCount).toBe(1);
      expect(deleteFn).toHaveBeenCalledTimes(2);
    });

    it('memiliki konstanta batas entri yang terdefinisi dengan rasional', () => {
      expect(MAX_IMMUTABLE_ASSETS).toBe(150);
      expect(MAX_STATIC_ASSETS).toBe(50);
    });
  });
});
