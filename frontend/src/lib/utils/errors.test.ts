import { describe, expect, it } from 'vitest';
import {
  extractApiErrors,
  FALLBACK_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  SERVER_UNAVAILABLE_MESSAGE
} from './errors';

describe('Error Categorization Utility (errors.ts)', () => {
  describe('Kasus a: Permintaan tanpa response (ERR_NETWORK / timeout)', () => {
    it('mengembalikan pesan network error saat Axios error tidak memiliki response', () => {
      const err = {
        isAxiosError: true,
        message: 'Network Error',
        code: 'ERR_NETWORK',
        request: {}
      };
      expect(extractApiErrors(err)).toBe(NETWORK_ERROR_MESSAGE);
    });

    it('mengembalikan pesan network error saat request timeout (ECONNABORTED)', () => {
      const err = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
        request: {}
      };
      expect(extractApiErrors(err)).toBe(NETWORK_ERROR_MESSAGE);
    });

    it('mengembalikan pesan network error bila error memiliki request namun response undefined', () => {
      const err = {
        request: {},
        message: 'Network Error'
      };
      expect(extractApiErrors(err)).toBe(NETWORK_ERROR_MESSAGE);
    });
  });

  describe('Kasus b: Server sedang tidak dapat dihubungi (502 / 503 / 504)', () => {
    it('mengembalikan pesan server unavailable saat status 502 (Bad Gateway)', () => {
      const err = {
        response: {
          status: 502,
          data: '<html>Bad Gateway</html>'
        }
      };
      expect(extractApiErrors(err)).toBe(SERVER_UNAVAILABLE_MESSAGE);
    });

    it('mengembalikan pesan server unavailable saat status 503 (Service Unavailable)', () => {
      const err = {
        response: {
          status: 503,
          data: { message: 'Cloudflare Tunnel Error' }
        }
      };
      expect(extractApiErrors(err)).toBe(SERVER_UNAVAILABLE_MESSAGE);
    });

    it('mengembalikan pesan server unavailable saat status 504 (Gateway Timeout)', () => {
      const err = {
        response: {
          status: 504,
          data: null
        }
      };
      expect(extractApiErrors(err)).toBe(SERVER_UNAVAILABLE_MESSAGE);
    });
  });

  describe('Kasus c: Penanganan pesan standar Laravel / generic errors', () => {
    it('mengekstrak daftar validasi 422 Laravel', () => {
      const err = {
        response: {
          status: 422,
          data: {
            message: 'Data yang diberikan tidak valid.',
            errors: {
              name: ['Nama proyek wajib diisi.'],
              code: ['Kode proyek sudah digunakan.']
            }
          }
        }
      };
      expect(extractApiErrors(err)).toBe('Nama proyek wajib diisi.\nKode proyek sudah digunakan.');
    });

    it('mengekstrak string message dari respons API', () => {
      const err = {
        response: {
          status: 400,
          data: {
            message: 'Stok tidak mencukupi untuk transfer gudang.'
          }
        }
      };
      expect(extractApiErrors(err)).toBe('Stok tidak mencukupi untuk transfer gudang.');
    });

    it('mengekstrak string error dari respons API', () => {
      const err = {
        response: {
          status: 403,
          data: {
            error: 'Anda tidak memiliki hak akses untuk tindakan ini.'
          }
        }
      };
      expect(extractApiErrors(err)).toBe('Anda tidak memiliki hak akses untuk tindakan ini.');
    });

    it('mengembalikan Error.message untuk error JavaScript biasa', () => {
      const err = new Error('Operasi dibatalkan.');
      expect(extractApiErrors(err)).toBe('Operasi dibatalkan.');
    });

    it('mengembalikan pesan fallback default bila data error tidak dikenali', () => {
      expect(extractApiErrors(null)).toBe(FALLBACK_ERROR_MESSAGE);
      expect(extractApiErrors({})).toBe(FALLBACK_ERROR_MESSAGE);
    });
  });
});
