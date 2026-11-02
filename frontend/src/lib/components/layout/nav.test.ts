import { describe, expect, it } from 'vitest';
import { getDetailParentHref, getPageTitle } from './nav';

describe('Navigation Helpers (nav.ts)', () => {
  describe('getDetailParentHref', () => {
    it('mengembalikan rute induk untuk /projects/[id]', () => {
      expect(getDetailParentHref('/projects/123')).toBe('/projects');
      expect(getDetailParentHref('/projects/abc-def')).toBe('/projects');
    });

    it('mengembalikan rute induk untuk /activities/[id]', () => {
      expect(getDetailParentHref('/activities/456')).toBe('/activities');
    });

    it('mengembalikan rute induk untuk /mitras/[id]', () => {
      expect(getDetailParentHref('/mitras/789')).toBe('/mitras');
    });

    it('mengembalikan rute induk untuk /certificates/[id]', () => {
      expect(getDetailParentHref('/certificates/999')).toBe('/certificates');
    });

    it('mengembalikan rute induk untuk /barang-certificates/[id]', () => {
      expect(getDetailParentHref('/barang-certificates/321')).toBe('/barang-certificates');
    });

    it('mengembalikan null untuk rute index atau non-detail', () => {
      expect(getDetailParentHref('/projects')).toBeNull();
      expect(getDetailParentHref('/projects/')).toBeNull();
      expect(getDetailParentHref('/activities')).toBeNull();
      expect(getDetailParentHref('/dashboard')).toBeNull();
      expect(getDetailParentHref('/settings')).toBeNull();
    });
  });

  describe('getPageTitle', () => {
    it('menghasilkan judul detail yang sesuai', () => {
      expect(getPageTitle('/projects/123')).toBe('Detail Project');
      expect(getPageTitle('/dashboard')).toBe('Dashboard');
    });
  });
});

