/**
 * Utilitas Deteksi Platform dan Mode PWA (Fungsi Murni)
 */

export interface PlatformCheckOptions {
  userAgent?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
  displayModeStandalone?: boolean;
}

/**
 * Memeriksa apakah aplikasi sedang berjalan dalam mode standalone (terpasang di home screen / OS window).
 * Mendeteksi standar CSS display-mode: standalone dan properti legacy iOS navigator.standalone.
 */
export function isStandalone(options?: PlatformCheckOptions): boolean {
  if (options?.standalone !== undefined) {
    return options.standalone;
  }
  if (options?.displayModeStandalone !== undefined) {
    return options.displayModeStandalone;
  }

  if (typeof window !== 'undefined') {
    if (window.matchMedia?.('(display-mode: standalone)')?.matches) {
      return true;
    }
  }

  if (typeof navigator !== 'undefined') {
    const nav = navigator as unknown as { standalone?: boolean };
    if (nav.standalone === true) {
      return true;
    }
  }

  return false;
}

/**
 * Memeriksa apakah perangkat yang digunakan berbasis iOS (iPhone, iPad, iPod).
 * Menangani deteksi iPadOS 13+ yang melaporkan diri sebagai 'Macintosh' dengan multi-touch points.
 */
export function isIOS(options?: PlatformCheckOptions | string, maxTouchPoints?: number): boolean {
  let ua: string;
  let touchPoints: number;

  if (typeof options === 'string') {
    ua = options;
    touchPoints = maxTouchPoints ?? 0;
  } else {
    ua = options?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    touchPoints =
      options?.maxTouchPoints ?? (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0);
  }

  if (!ua) return false;

  // Deteksi iPhone, iPad, iPod standar
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }

  // Deteksi iPadOS 13+ yang menggunakan User Agent macOS desktop
  if (/Macintosh/.test(ua) && touchPoints > 1) {
    return true;
  }

  return false;
}

/**
 * Memeriksa apakah browser yang digunakan adalah Safari asli di lingkungan iOS.
 * Membedakan dari browser pihak ketiga (Chrome/CriOS, Firefox/FxiOS, Edge/EdgiOS, Opera/OPiOS)
 * karena hanya Safari di iOS yang mendukung pemasangan PWA via menu 'Add to Home Screen'.
 */
export function isIOSSafari(
  options?: PlatformCheckOptions | string,
  maxTouchPoints?: number
): boolean {
  let ua: string;
  let touchPoints: number;

  if (typeof options === 'string') {
    ua = options;
    touchPoints = maxTouchPoints ?? 0;
  } else {
    ua = options?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    touchPoints =
      options?.maxTouchPoints ?? (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0);
  }

  if (!isIOS(ua, touchPoints)) {
    return false;
  }

  // Identifikasi browser pihak ketiga di iOS
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
  if (isOtherBrowser) {
    return false;
  }

  // iOS Safari selalu mengandung WebKit dan Safari
  return /WebKit/i.test(ua) && /Safari/i.test(ua);
}

/**
 * Menentukan apakah petunjuk instalasi manual iOS dapat ditampilkan ke pengguna.
 * Hanya bernilai true jika:
 * - Pengguna berada di browser Safari iOS asli.
 * - Aplikasi belum berada dalam mode standalone (belum diinstal).
 */
export function canShowIOSInstallHint(options?: PlatformCheckOptions): boolean {
  if (isStandalone(options)) {
    return false;
  }
  return isIOSSafari(options);
}

