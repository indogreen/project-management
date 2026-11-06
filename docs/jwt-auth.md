# JWT Authentication

## Mekanisme Auth

Aplikasi menggunakan **JWT (JSON Web Token)** melalui package `php-open-source-saver/jwt-auth` dengan algoritma **HS256**.

- **Guard default:** `api` (bukan `web`)
- **Token storage:** `localStorage` di browser
- **Token type:** Bearer token
- **Token lifetime:** Dikonfigurasi di `config/jwt.php` (default 60 menit)
- **Rate limiting bypass:** Rate limiting (throttle) di-bypass sepenuhnya setelah user berhasil terautentikasi (login). Rate limiting tetap aktif untuk guest/user yang belum login.

## Auth Provider

- Email/Password (registrasi dan login)

> **Catatan:** Google OAuth dan social login **belum diimplementasikan**.

## File Terkait

### Backend

| File | Deskripsi |
|------|-----------|
| `app/Http/Controllers/AuthController.php` | Controller login, register, logout, refresh, profile |
| `app/Services/AuthService.php` | Business logic autentikasi |
| `app/Models/User.php` | Model user dengan `JWTSubject` |
| `config/auth.php` | Konfigurasi guard JWT sebagai default |
| `config/jwt.php` | Konfigurasi JWT (TTL, secret, algo) |
| `routes/api.php` | Route group `/api/auth/*` |

### Frontend

| File | Deskripsi |
|------|-----------|
| `src/lib/services/authService.ts` | Fungsi login, register, logout, getMe, refreshToken |
| `src/lib/axiosClient.ts` | Axios instance dengan JWT interceptor |
| `src/lib/stores/user.ts` | Svelte store untuk current user |
| `src/lib/stores/permissions.ts` | Svelte store untuk roles & permissions |
| `src/routes/+layout.ts` | Auth guard — redirect ke login jika tidak ada token |
| `src/routes/+layout.svelte` | Load user data via `/auth/me` |
| `src/routes/auth/login/` | Halaman login |
| `src/routes/auth/register/` | Halaman register |

## Register Flow

1. Frontend memuat konfigurasi fitur otentikasi melalui `GET /api/auth/features`. Jika `registration_enabled: false`:
   - Menu tautan pendaftaran (*"Belum punya akun? Daftar disini"*) pada halaman login otomatis disembunyikan.
   - Akses langsung ke URL `/auth/register` otomatis dialihkan (*redirect*) ke `/auth/login` dengan notifikasi kesalahan.
2. Saat aktif (`registration_enabled: true`), user mengisi form register (name, username opsional, email, password, password_confirmation).
3. Frontend mengirim `POST /api/auth/register`.
4. Backend memvalidasi input:
   - Status registrasi aktif (`AUTH_REGISTRATION_ENABLED=true`).
   - Domain email dibatasi ketat untuk alamat resmi perusahaan (`@indogreen.id` via `AUTH_REGISTRATION_ALLOWED_DOMAIN`).
   - Username (opsional/otomatis dibuat jika kosong, unique, format `alpha_dash`).
   - Email valid & unique, password minimal 8 karakter, dan password confirmed.
5. Model `User` mengimplementasikan `MustVerifyEmail`.
6. Backend membuat user baru (password di-hash bcrypt).
7. Backend mengirimkan email berisi **kode autentikasi akun** (`AccountRegisteredMail`) ke email pendaftar via SMTP.
8. User pertama otomatis mendapat role `super_admin` via `RolePermissionSeeder`.
9. Response: `UserResource` (tanpa token — user harus login manual).

## Login Flow

1. User mengisi form login (menggunakan **Email** atau **Username**, dan password).
2. Frontend mengirim `POST /api/auth/login` dengan payload `{ login, password }` (mendukung email dan username secara transparan).
3. Rate limiting: maksimal **5 request / 60 detik** (Sliding Window Throttle).
4. Backend memvalidasi credential via JWT Auth.
5. Jika berhasil → Response: `{ access_token, token_type, expires_in }`.
6. Frontend menyimpan `access_token` ke `localStorage`.
7. Frontend redirect ke halaman dashboard (atau URL redirect dari query string).
8. Frontend memanggil `GET /api/auth/me` untuk mendapatkan data user, roles, dan permissions.
9. Data disimpan ke Svelte store (`currentUser`, `userRoles`, `userPermissions`).

## Token Refresh Flow

1. Request API mengembalikan **401 Unauthorized**.
2. Axios response interceptor otomatis mengirim `POST /api/auth/refresh`.
3. Jika refresh berhasil:
   - Token baru disimpan ke `localStorage`.
   - Request yang gagal di-retry dengan token baru.
   - Request lain yang di-queue selama refresh di-resolve.
4. Jika refresh gagal:
   - Token dihapus dari `localStorage`.
   - User store di-clear.
   - Redirect ke `/auth/login` dengan parameter `redirect`.

> **Catatan:** Request ke `/auth/refresh` dan `/auth/login` sendiri **tidak** di-intercept untuk menghindari infinite loop.

## Logout Flow

1. User klik tombol logout.
2. SweetAlert2 confirm dialog ditampilkan.
3. Jika dikonfirmasi:
   - Frontend mengirim `POST /api/auth/logout`.
   - Backend invalidate JWT token.
   - Frontend menghapus token dari `localStorage`.
   - Frontend mengosongkan store (user, roles, permissions).
   - Redirect ke `/auth/login`.
4. Jika logout API gagal (network error, dll):
   - Token tetap dihapus dari client.
   - User tetap di-redirect ke login.

## Update Profile

- Endpoint: `PUT /api/auth/profile`
- Input: `{ name, username }`
- Validasi: `name` required string max 255; `username` nullable/string max 255 unique alpha_dash (ignore current user)

## Change Password

- Endpoint: `PUT /api/auth/password`
- Input: `{ current_password, password, password_confirmation }`
- Validasi:
  - `current_password` harus cocok
  - `password` min 8 karakter
  - `password` harus mengandung huruf kecil dan huruf besar
  - `password` harus berbeda dari `current_password`
  - `password` harus dikonfirmasi (`password_confirmation`)

## Reset Password

Fitur reset password publik melalui verifikasi email telah aktif penuh:

1. **Permintaan Kode Verifikasi (Forgot Password):**
   - URL Frontend: `/auth/forgot-password`
   - Endpoint Backend: `POST /api/auth/forgot-password`
   - Input: `{ email }`
   - Rate limit: **3 request / 60 detik** (`sliding_throttle:3,60,auth`)
   - Backend menghasilkan kode OTP 6-digit numerik yang disimpan dalam bentuk hash di tabel `password_reset_tokens` (masa berlaku: 60 menit).
   - Email dikirim menggunakan SMTP Relay (Brevo) dengan format HTML responsif yang memuat kode verifikasi 6 digit dan tombol tautan langsung (`/auth/reset-password?email=...&token=...`).

2. **Eksekusi Reset Password:**
   - URL Frontend: `/auth/reset-password`
   - Endpoint Backend: `POST /api/auth/reset-password`
   - Input: `{ email, token, password, password_confirmation }`
   - Rate limit: **5 request / 60 detik** (`sliding_throttle:5,60,auth`)
   - Validasi: token cocok, belum kadaluarsa (<60 menit), password minimal 8 karakter, kombinasi huruf besar dan kecil, konfirmasi cocok.
   - Setelah berhasil, record token dihapus dari database, aktivitas dicatat di activity log, dan user dapat login kembali menggunakan password baru.

## Protected Route (Frontend)

Semua route di frontend dilindungi melalui `+layout.ts` di root:

```typescript
export const ssr = false;     // SSR dimatikan
export const prerender = false;

export async function load({ url }) {
  if (url.pathname.startsWith('/auth')) return {};

  const token = localStorage.getItem('jwt_token');
  if (!token) {
    const redirectUrl =
      url.pathname === '/'
        ? '/auth/login'
        : `/auth/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(307, redirectUrl);
  }
  return {};
}
```

Route `/auth/*` (login, register) tidak memerlukan token dan ditampilkan tanpa sidebar/navigation.
