import { describe, expect, it } from 'vitest';
import { getSafeInternalRedirect, safeAttachmentUrl, storageUrl } from './url';

describe('getSafeInternalRedirect (PM-REDIRECT-001)', () => {
  it('returns valid relative paths as-is', () => {
    expect(getSafeInternalRedirect('/dashboard')).toBe('/dashboard');
    expect(getSafeInternalRedirect('/projects')).toBe('/projects');
    expect(getSafeInternalRedirect('/projects/42?tab=activity&view=list')).toBe(
      '/projects/42?tab=activity&view=list'
    );
    expect(getSafeInternalRedirect('/settings')).toBe('/settings');
  });

  it('rejects protocol-relative URLs (//) and falls back to default', () => {
    expect(getSafeInternalRedirect('//evil.com')).toBe('/dashboard');
    expect(getSafeInternalRedirect('///evil.com/path')).toBe('/dashboard');
    expect(getSafeInternalRedirect('//attacker.example.org')).toBe('/dashboard');
  });

  it('rejects backslash traversal (/\\ or /\\\\) and falls back to default', () => {
    expect(getSafeInternalRedirect('/\\evil.com')).toBe('/dashboard');
    expect(getSafeInternalRedirect('/\\\\evil.com')).toBe('/dashboard');
    expect(getSafeInternalRedirect('\\evil.com')).toBe('/dashboard');
    expect(getSafeInternalRedirect('/projects\\settings')).toBe('/dashboard');
  });

  it('rejects absolute URLs with external schemes', () => {
    expect(getSafeInternalRedirect('https://evil.com')).toBe('/dashboard');
    expect(getSafeInternalRedirect('http://attacker.com/login')).toBe('/dashboard');
    expect(getSafeInternalRedirect('javascript:alert(1)')).toBe('/dashboard');
    expect(getSafeInternalRedirect('data:text/html,test')).toBe('/dashboard');
  });

  it('rejects auth routes to prevent redirect loops', () => {
    expect(getSafeInternalRedirect('/auth/login')).toBe('/dashboard');
    expect(getSafeInternalRedirect('/auth/register')).toBe('/dashboard');
    expect(getSafeInternalRedirect('/auth/logout')).toBe('/dashboard');
    expect(getSafeInternalRedirect('/auth')).toBe('/dashboard');
  });

  it('handles URL object inputs from $page.url', () => {
    const urlWithRedirect = new URL('http://localhost:5173/auth/login?redirect=/projects/10');
    expect(getSafeInternalRedirect(urlWithRedirect)).toBe('/projects/10');

    const urlWithMaliciousRedirect = new URL(
      'http://localhost:5173/auth/login?redirect=//evil.com'
    );
    expect(getSafeInternalRedirect(urlWithMaliciousRedirect)).toBe('/dashboard');

    const urlWithNext = new URL('http://localhost:5173/auth/register?next=/activities');
    expect(getSafeInternalRedirect(urlWithNext)).toBe('/activities');

    const urlWithMaliciousNext = new URL('http://localhost:5173/auth/register?next=/\\evil.com');
    expect(getSafeInternalRedirect(urlWithMaliciousNext)).toBe('/dashboard');
  });

  it('returns custom fallback when provided', () => {
    expect(getSafeInternalRedirect('//evil.com', '/fallback')).toBe('/fallback');
    expect(getSafeInternalRedirect('', '/custom')).toBe('/custom');
    expect(getSafeInternalRedirect(null, '')).toBe('');
    expect(getSafeInternalRedirect(undefined, '/home')).toBe('/home');
  });
});

describe('storageUrl and safeAttachmentUrl', () => {
  it('storageUrl resolves relative paths against backend host', () => {
    const result = storageUrl('attachments/activities/1/doc.pdf');
    expect(result).toMatch(/\/attachments\/activities\/1\/doc\.pdf$/);
  });

  it('storageUrl preserves already-absolute HTTP/HTTPS URLs', () => {
    expect(storageUrl('https://cdn.example.com/file.pdf')).toBe('https://cdn.example.com/file.pdf');
    expect(storageUrl('http://example.com/file.pdf')).toBe('http://example.com/file.pdf');
  });

  it('storageUrl rejects dangerous pseudo-protocols', () => {
    expect(storageUrl('javascript:alert(1)')).toBe('');
    expect(storageUrl('data:text/html;base64,...')).toBe('');
    expect(storageUrl('vbscript:msgbox(1)')).toBe('');
    expect(storageUrl('file:///etc/passwd')).toBe('');
  });

  it('safeAttachmentUrl safely handles relative, absolute, and dangerous protocols', () => {
    expect(safeAttachmentUrl('https://example.com/doc.pdf')).toBe('https://example.com/doc.pdf');
    expect(safeAttachmentUrl('attachments/cert.pdf')).toMatch(/\/attachments\/cert\.pdf$/);
    expect(safeAttachmentUrl('javascript:alert(1)')).toBe('');
    expect(safeAttachmentUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(safeAttachmentUrl(null)).toBe('');
    expect(safeAttachmentUrl(undefined)).toBe('');
  });
});
