import { describe, expect, it } from 'vitest';
import { isStandalone, isIOS, isIOSSafari, canShowIOSInstallHint } from './pwa-platform';

const MOCK_UA = {
  iPhoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  iPhoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1',
  iPhoneFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/605.1.15',
  iPhoneEdge:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/124.0.2478.67 Mobile/15E148 Safari/605.1.15',
  iPadSafari:
    'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  iPadOS13Macintosh:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  macOSDesktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

describe('pwa-platform.ts (PWA Platform Utilities)', () => {
  describe('isStandalone', () => {
    it('mengembalikan true jika options.standalone bernilai true', () => {
      expect(isStandalone({ standalone: true })).toBe(true);
    });

    it('mengembalikan true jika options.displayModeStandalone bernilai true', () => {
      expect(isStandalone({ displayModeStandalone: true })).toBe(true);
    });

    it('mengembalikan false jika options standalone bernilai false', () => {
      expect(isStandalone({ standalone: false })).toBe(false);
      expect(isStandalone({ displayModeStandalone: false })).toBe(false);
    });

    it('mengembalikan false jika di lingkungan tanpa window / matchMedia standalone', () => {
      expect(isStandalone()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('mendeteksi perangkat iPhone', () => {
      expect(isIOS(MOCK_UA.iPhoneSafari)).toBe(true);
      expect(isIOS(MOCK_UA.iPhoneChrome)).toBe(true);
    });

    it('mendeteksi perangkat iPad klasik', () => {
      expect(isIOS(MOCK_UA.iPadSafari)).toBe(true);
    });

    it('mendeteksi iPadOS modern (Macintosh dengan multi-touch > 1)', () => {
      expect(isIOS(MOCK_UA.iPadOS13Macintosh, 5)).toBe(true);
      expect(isIOS({ userAgent: MOCK_UA.iPadOS13Macintosh, maxTouchPoints: 5 })).toBe(true);
    });

    it('tidak menandai macOS desktop sebagai iOS jika maxTouchPoints <= 1', () => {
      expect(isIOS(MOCK_UA.macOSDesktop, 0)).toBe(false);
      expect(isIOS({ userAgent: MOCK_UA.macOSDesktop, maxTouchPoints: 0 })).toBe(false);
    });

    it('mengembalikan false untuk Android dan Windows', () => {
      expect(isIOS(MOCK_UA.androidChrome)).toBe(false);
      expect(isIOS(MOCK_UA.windowsChrome)).toBe(false);
    });

    it('mengembalikan false jika user agent kosong', () => {
      expect(isIOS('')).toBe(false);
    });
  });

  describe('isIOSSafari', () => {
    it('mengembalikan true untuk Safari resmi di iPhone & iPad', () => {
      expect(isIOSSafari(MOCK_UA.iPhoneSafari)).toBe(true);
      expect(isIOSSafari(MOCK_UA.iPadSafari)).toBe(true);
      expect(isIOSSafari({ userAgent: MOCK_UA.iPadOS13Macintosh, maxTouchPoints: 5 })).toBe(true);
    });

    it('mengembalikan false untuk Chrome di iOS (CriOS)', () => {
      expect(isIOSSafari(MOCK_UA.iPhoneChrome)).toBe(false);
    });

    it('mengembalikan false untuk Firefox di iOS (FxiOS)', () => {
      expect(isIOSSafari(MOCK_UA.iPhoneFirefox)).toBe(false);
    });

    it('mengembalikan false untuk Edge di iOS (EdgiOS)', () => {
      expect(isIOSSafari(MOCK_UA.iPhoneEdge)).toBe(false);
    });

    it('mengembalikan false untuk Android Chrome dan Desktop macOS Safari', () => {
      expect(isIOSSafari(MOCK_UA.androidChrome)).toBe(false);
      expect(isIOSSafari(MOCK_UA.macOSDesktop, 0)).toBe(false);
    });
  });

  describe('canShowIOSInstallHint', () => {
    it('mengembalikan true untuk iOS Safari yang belum terpasang', () => {
      expect(
        canShowIOSInstallHint({
          userAgent: MOCK_UA.iPhoneSafari,
          standalone: false
        })
      ).toBe(true);
    });

    it('mengembalikan false jika iOS Safari sudah terpasang (mode standalone)', () => {
      expect(
        canShowIOSInstallHint({
          userAgent: MOCK_UA.iPhoneSafari,
          standalone: true
        })
      ).toBe(false);
    });

    it('mengembalikan false untuk Android Chrome atau Chrome di iOS', () => {
      expect(
        canShowIOSInstallHint({
          userAgent: MOCK_UA.androidChrome,
          standalone: false
        })
      ).toBe(false);
      expect(
        canShowIOSInstallHint({
          userAgent: MOCK_UA.iPhoneChrome,
          standalone: false
        })
      ).toBe(false);
    });
  });
});
