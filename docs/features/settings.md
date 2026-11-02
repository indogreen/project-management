# Feature: Settings

## Deskripsi

Halaman settings memungkinkan user mengelola profil, mengubah password, mengatur tema tampilan, dan (khusus admin) mengelola role & permission user lain.

## Route

- Frontend: `/settings`

## Komponen Utama

- `src/routes/settings/+page.svelte` — Halaman settings
- `src/routes/settings/_components/` — Tab components

## Data Source

- Service: `src/lib/services/settingsService.ts`
- Service: `src/lib/services/authService.ts`

## Fitur yang Tersedia

### 1. Update Profil
- Endpoint: `PUT /api/auth/profile`
- Input: `{ name }`
- Mengubah nama tampilan user

### 2. Ubah Password
- Endpoint: `PUT /api/auth/password`
- Input: `{ current_password, password, password_confirmation }`
- Validasi ketat (min 8 karakter, huruf besar+kecil, berbeda dari password lama)

### 3. Tema
- Disimpan di Svelte store (`src/lib/stores/theme.ts`)
- Mendukung dark mode dan light mode
- Persisten melalui localStorage

### 4. Manajemen User (Admin)
- Endpoint: `GET /api/auth/role/users`, `PUT /api/auth/role`, `GET /api/auth/role/config`
- Hanya dapat diakses oleh `super_admin` dan `admin`
- Mengelola role dan permission per user
- Lihat dokumentasi [Role & Permission](../role-permission.md) untuk detail

### 5. Aplikasi Web (PWA)
- Komponen: `src/lib/components/pwa/InstallButton.svelte` (varian card)
- Terintegrasi di tab Profile settings untuk memfasilitasi pemasangan PWA mandiri ke desktop maupun perangkat seluler.
- Menampilkan lencana status *"Aplikasi Terpasang"* saat diakses dalam mode standalone (terpasang).
- Menyediakan panduan visual interaktif untuk pengguna Apple iOS Safari.

## Status

✅ Aktif — Profil, password, tema, manajemen user, dan status PWA sudah berfungsi.
