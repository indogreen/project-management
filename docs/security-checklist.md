# Security Checklist

## Laravel / Backend

- [ ] `APP_DEBUG=false` di production.
- [ ] `APP_KEY` dan `JWT_SECRET` di-generate per environment (jangan pakai value dari `.env.example` atau dari repository).
- [ ] File `.env` tidak ter-commit ke Git (sudah ada di `.gitignore`).
- [x] CORS dibatasi ke domain frontend terdaftar (`FRONTEND_URL` & `CORS_ALLOWED_ORIGINS`), wildcard origin dihapus (`PM-CORS-001`).
- [ ] Rate limiting aktif untuk semua endpoint (Sliding Window Throttle).
- [ ] Semua input divalidasi melalui Form Request.
- [ ] Password di-hash menggunakan bcrypt (12 rounds).
- [ ] Password baru harus minimal 8 karakter, mengandung huruf besar dan kecil.

## JWT Token

- [ ] `JWT_SECRET` cukup panjang dan random (generate via `php artisan jwt:secret`).
- [ ] JWT algorithm menggunakan HS256.
- [ ] Token disimpan di `localStorage` — memahami risiko XSS.
- [ ] Token TTL dikonfigurasi dengan tepat (default 60 menit).
- [ ] Refresh token berfungsi untuk perpanjangan session otomatis.
- [x] Endpoint `/auth/login` dan `/auth/register` memiliki rate limiting ketat (5 req/60s).
- [x] Registrasi publik dibatasi khusus email resmi perusahaan (`@indogreen.id`) dan mendukung sakelar disable (`PM-BIZ-001`).
- [x] Model `User` mengimplementasikan interface `MustVerifyEmail`.

## Role & Permission

- [x] RBAC aktif menggunakan Spatie Laravel Permission.
- [x] Endpoint manajemen role hanya bisa diakses `super_admin` dan `admin`.
- [x] Admin tidak bisa mengubah user setingkat atau di atasnya.
- [x] User tidak bisa mengubah role dirinya sendiri.
- [x] Role dan permission allowlist aktif; pembuatan dinamis via `firstOrCreate` dihapus (`PM-AC-001`).
- [ ] Permission diperiksa di backend (bukan hanya di frontend).

## File Upload / Storage

- [ ] File upload menggunakan Laravel Storage disk `public`.
- [ ] Symlink `storage:link` sudah dibuat.
- [ ] Pastikan tidak ada file upload yang bisa di-execute sebagai kode (PHP, shell).
- [ ] Validasi MIME type dan ukuran file di backend.

## Frontend

- [ ] Tidak ada secret yang disimpan di variable `PUBLIC_*`.
- [ ] Error message tidak membocorkan detail internal (SQL, stack trace).
- [ ] Axios interceptor menangani 401 dan redirect ke login.
- [ ] Token dihapus dari `localStorage` saat logout atau refresh gagal.

## Database

- [ ] Database credentials tidak di-commit ke repository.
- [ ] Database user production memiliki privilege minimal yang diperlukan.
- [ ] Query menggunakan Eloquent ORM (terproteksi dari SQL injection).
- [ ] Foreign key constraint aktif untuk menjaga integritas data.
- [ ] StockMovement bersifat immutable (tidak bisa diubah/dihapus).

## Progressive Web App (PWA) & Service Worker

- [ ] Service Worker mem-bypass seluruh request `/api/*` dan `/storage/*` (tanpa caching data bisnis/keuangan).
- [ ] Service Worker mem-bypass seluruh request non-GET (POST, PUT, DELETE, PATCH).
- [ ] Service Worker mem-bypass seluruh request yang membawa header `Authorization` atau meminta JSON (`Accept: application/json`).
- [ ] HTML dokumen navigasi tidak pernah disimpan ke cache (Network-Only dengan `/offline.html` fallback).
- [ ] Cache terisolasi per versi build (`indogreen-static-${version}` & `indogreen-assets-${version}`).
- [ ] Emergency Kill-Switch runtime tersedia (`PUBLIC_PWA_ENABLED=false`).
- [ ] Mode development secara otomatis mematikan dan membersihkan Service Worker lama (`unregisterAndClean()`).

## Deployment & Cloudflare Tunnel (PWA Dev / Staging)

- [ ] HTTPS aktif untuk semua domain via Cloudflare Tunnel (`app-pm-idg.zed.ai.id`, `api-pm-idg.zed.ai.id`).
- [ ] Agent `cloudflared` berjalan di host yang sama dengan server aplikasi dan auto-restart via systemd.
- [ ] File kredensial tunnel (`<TUNNEL_ID>.json`) disimpan di luar repositori (`/etc/cloudflared/`).
- [ ] Cloudflare Access (Email OTP) aktif untuk domain frontend `app-pm-idg.zed.ai.id`.
- [ ] Bypass rule pada Cloudflare Access untuk file PWA publik (`/manifest.webmanifest`, `/icons/*`, `/service-worker.js`).
- [x] Header keamanan dikonfigurasi (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` via `hooks.server.ts` & `app.html`).
- [x] Header `Cache-Control: no-cache, no-store, must-revalidate` terpasang untuk `/service-worker.js` dan `/manifest.webmanifest`.
- [x] Trusted Proxies di Laravel dikonfigurasi (`$middleware->trustProxies(at: '*')`) untuk mendukung resolusi IP per-user nyata di balik Cloudflare Tunnel.
- [ ] Laravel debug bar/telescope dimatikan di production.
- [ ] Log level minimal `warning` di production.

---

## Content Security Policy (CSP) Recommendation

> **Catatan Rekomendasi:** Penegakan Content Security Policy (CSP) ketat via HTTP header ditunda untuk audit komprehensif karena pustaka runtime UI (SweetAlert2 dialog styling, Chart.js canvas rendering, dan Tailwind CSS runtime utilities) membutuhkan evaluasi hash/nonce atau `'unsafe-inline'` agar tidak memblokir render grafis dan modal interaktif.
>
> Rekomendasi baseline CSP untuk tahap evaluasi:
>
> ```text
> default-src 'self';
> script-src 'self' 'unsafe-inline';
> style-src 'self' 'unsafe-inline';
> img-src 'self' data: blob: https://api-pm-idg.zed.ai.id;
> connect-src 'self' https://api-pm-idg.zed.ai.id wss://app-pm-idg.zed.ai.id;
> font-src 'self';
> object-src 'none';
> base-uri 'self';
> form-action 'self';
> frame-ancestors 'none';
> ```

---

## Content Security Policy (CSP) Recommendation

> **Catatan Rekomendasi:** Penegakan Content Security Policy (CSP) ketat via HTTP header ditunda untuk audit komprehensif karena pustaka runtime UI (SweetAlert2 dialog styling, Chart.js canvas rendering, dan Tailwind CSS runtime utilities) membutuhkan evaluasi hash/nonce atau `'unsafe-inline'` agar tidak memblokir render grafis dan modal interaktif.
>
> Rekomendasi baseline CSP untuk tahap evaluasi:
> ```text
> default-src 'self';
> script-src 'self' 'unsafe-inline';
> style-src 'self' 'unsafe-inline';
> img-src 'self' data: blob: https://api-pm-idg.zed.ai.id;
> connect-src 'self' https://api-pm-idg.zed.ai.id wss://app-pm-idg.zed.ai.id;
> font-src 'self';
> object-src 'none';
> base-uri 'self';
> form-action 'self';
> frame-ancestors 'none';
> ```

---

## Security Notes

### ⚠️ Temuan & Panduan Keamanan Penting

1. **CORS terlalu permisif** — `config/cors.php` saat ini menggunakan `allowed_origins => ['*']`. Jika browser memanggil API secara langsung ke `https://api-pm-idg.zed.ai.id`, disarankan membatasi `allowed_origins` ke `https://app-pm-idg.zed.ai.id`.

2. **JWT di localStorage vs HttpOnly Cookie** — Token JWT saat ini disimpan di `localStorage`. Jika di masa mendatang beralih ke cookie sesi, pastikan atribut cookie adalah **Host-only** (tanpa parameter `Domain`), `HttpOnly`, `Secure`, dan `SameSite=Lax` untuk mencegah manipulasi dan kebocoran lintas domain.

3. **Risiko Rate Limiting di Balik Reverse Proxy / Tunnel** — Jika request ke Laravel diteruskan via proxy internal tanpa konfigurasi `$middleware->trustProxies()`, Laravel membaca semua request dari IP `127.0.0.1`. Ini menyebabkan rate limit 5 request/60s untuk login menjadi global (lockout massal) dan audit log mencatat IP internal. Header `CF-Connecting-IP` / `X-Forwarded-For` harus diteruskan dan dipercaya oleh Laravel.

4. **Risiko CSRF / Origin Validation pada Dev Server SvelteKit** — Saat diakses melalui domain tunnel publik, SvelteKit memvalidasi origin header pada form actions (POST multipart upload). Jika terjadi HTTP 403 Forbidden pada upload lampiran, origin `https://app-pm-idg.zed.ai.id` harus didaftarkan di `csrf.trustedOrigins` pada `svelte.config.js`.

5. **Akses LAN vs HTTPS PWA** — Dengan penggunaan cookie Secure dan PWA Service Worker, akses melalui IP LAN lokal (`http://192.168.1.x`) tidak lagi didukung untuk otentikasi aman; pengujian mobile bergantung sepenuhnya pada koneksi HTTPS via Cloudflare Tunnel.

6. **Batas Upload Request Cloudflare** — Cloudflare Free membatasi request body maksimum 100 MB. Pastikan batch upload file lampiran tidak melebihi batas ini.

7. **`supports_credentials` disabled** — CORS `supports_credentials` saat ini `false`, yang konsisten dengan otentikasi JWT Bearer token di header.
