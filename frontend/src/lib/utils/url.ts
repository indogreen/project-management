// src/lib/utils/url.ts
import { STORAGE_BASE_URL } from '$lib/config';

// Ambil host backend tanpa suffix /api
const BACKEND_HOST = STORAGE_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Validates and sanitizes internal redirect URLs to prevent Open Redirect vulnerabilities (PM-REDIRECT-001).
 * Ensures the target is strictly an internal, origin-relative path starting with a single '/'
 * and prevents protocol-relative ('//'), backslash ('/\'), or auth loops ('/auth/*').
 */
export function getSafeInternalRedirect(
  target: string | URL | null | undefined,
  fallback = '/dashboard'
): string {
  let path = '';

  if (target instanceof URL) {
    path = target.searchParams.get('redirect') || target.searchParams.get('next') || '';
  } else if (typeof target === 'string') {
    path = target.trim();
  }

  if (!path || path === '/' || path.startsWith('/?')) {
    return fallback;
  }

  // Reject paths containing backslashes or null/control characters
  if (/[\\<>'"\0\r\n\t]/.test(path)) {
    return fallback;
  }

  // Strictly require a single leading forward slash, disallowing protocol-relative '//'
  if (!path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }

  // Prevent redirect loops back to authentication endpoints
  if (path.startsWith('/auth/') || path === '/auth') {
    return fallback;
  }

  return path;
}

/**
 * Resolves a storage path relative to the backend host.
 * Protects against dangerous URI schemes (javascript:, data:, vbscript:).
 */
export function storageUrl(path: string | null | undefined): string {
  if (!path) return '';
  const trimmed = path.trim();

  // Reject dangerous pseudo-protocols explicitly
  if (/^(?:javascript|data|vbscript|file):/i.test(trimmed)) {
    return '';
  }

  // Kalau backend sudah mengembalikan URL absolut HTTP/HTTPS, pakai apa adanya
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Normal case: path = 'attachments/...' or '/storage/...'
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${BACKEND_HOST}/${cleanPath}`;
}

/**
 * Sanitizes an attachment URL or relative path, ensuring the result is strictly an HTTP/HTTPS URL.
 * Rejects javascript:, data:, or other dangerous schemes.
 */
export function safeAttachmentUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // If already absolute HTTP/HTTPS
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Reject dangerous pseudo-protocols explicitly
  if (/^(?:javascript|data|vbscript|blob|file):/i.test(trimmed)) {
    return '';
  }

  // If relative path, resolve via storageUrl
  return storageUrl(trimmed);
}
