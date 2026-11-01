# Frontend Guidelines

## Teknologi

- **Framework:** SvelteKit 5 (Svelte 5 dengan Runes)
- **Styling:** Tailwind CSS 4 + `@tailwindcss/forms` + `@tailwindcss/typography`
- **HTTP Client:** Axios
- **Charts:** Chart.js
- **Dialogs:** SweetAlert2
- **UI Components:** @tailwindplus/elements
- **SSR:** Dimatikan (`ssr = false`) — aplikasi berjalan sepenuhnya sebagai SPA

## Aturan Bahasa UI

- Semua teks UI user-facing menggunakan **Bahasa Indonesia**.
- Istilah teknis seperti "login", "email", "password", "dashboard" boleh tetap dalam Bahasa Inggris.
- Pesan error dan validasi menggunakan Bahasa Indonesia.
- Confirm dialog menggunakan Bahasa Indonesia (contoh: "Apakah Anda yakin ingin logout?").

## Aturan Komponen

### Struktur

| Jenis          | Lokasi                            | Keterangan                        |
| -------------- | --------------------------------- | --------------------------------- |
| Page           | `src/routes/{module}/`            | File-based routing SvelteKit      |
| Layout         | `src/routes/+layout.svelte`       | Shared layout (sidebar, topnav)   |
| Reusable UI    | `src/lib/components/`             | Komponen yang dipakai > 1 halaman |
| Page-specific  | `src/routes/{module}/_components/`| Komponen khusus halaman tertentu  |

### Konvensi penamaan

- File Svelte: `PascalCase.svelte` (contoh: `Pagination.svelte`, `FileAttachment.svelte`)
- File TypeScript: `camelCase.ts` (contoh: `authService.ts`, `formatters.ts`)
- Route folder: `kebab-case` (contoh: `barang-certificates`, `stock-movements`)

## Aturan Service Layer

- Setiap modul memiliki file service di `src/lib/services/`.
- Service menggunakan `axiosClient` (bukan axios langsung).
- Service mengembalikan data yang sudah di-unwrap dari response.
- Tipe data didefinisikan di `src/lib/types/`.

Contoh pola:

```typescript
// src/lib/services/projectService.ts
import axiosClient from '$lib/axiosClient';

export async function getProjects(params) {
  const { data } = await axiosClient.get('/projects', { params });
  return data;
}
```

## Aturan Store

- Gunakan Svelte `writable` store untuk state global.
- Store disimpan di `src/lib/stores/`.
- Store saat ini:
  - `user.ts` — Data user yang sedang login
  - `permissions.ts` — Roles dan permissions user
  - `theme.ts` — Dark/light theme preference
  - `pwa.ts` — Status pembaruan PWA (`updateReady`, `registration`)

## Aturan Form

- Setiap form harus memiliki validasi (client-side dan/atau server-side).
- Gunakan SweetAlert2 untuk feedback (success toast, error toast).
- Setiap submit button harus memiliki loading state.
- Form yang mengandung file upload menggunakan `FormData` (lihat `utils/form-data.ts`).

## Aturan Loading State

- Tampilkan loading indicator saat menunggu API response.
- Gunakan skeleton atau spinner yang sesuai konteks.
- Disable tombol submit selama proses berlangsung.

## Aturan Empty State

- Tampilkan pesan informatif ketika tidak ada data.
- Berikan guidance ke user tentang cara menambah data.

## Aturan Error State

- Tampilkan error message yang user-friendly dalam Bahasa Indonesia.
- Jangan membocorkan detail internal (stack trace, SQL error).
- Gunakan `utils/errors.ts` untuk standardisasi error handling.
- Gunakan `utils/toast.ts` untuk menampilkan notifikasi error.

## Format Data

### Mata Uang

- Format: Rupiah (Rp)
- Gunakan formatter dari `utils/formatters.ts`

### Tanggal

- Format tampilan: Bahasa Indonesia (contoh: "8 Juni 2026")
- Format input: ISO format `YYYY-MM-DD`

### Angka

- Gunakan pemisah ribuan sesuai locale Indonesia

## Tema & Sinkronisasi Theme-Color PWA

Aplikasi mendukung **dark mode** dan **light mode** melalui store `theme.ts`. Konfigurasi CSS menggunakan variabel CSS custom di `app.css`.

- **Palet Warna:**
  - Background: light `#f3f4f6` / dark `#262626`
  - Card & TopNav: light `#ffffff` / dark `#000000`
  - Primary Accent: `#4f46e5` (Indigo)
- **Sinkronisasi Meta Tag (`<meta name="theme-color">`):**
  - Pada `app.html`, disiapkan default media queries: `#ffffff` untuk light mode dan `#000000` untuk dark mode.
  - Pada `+layout.svelte`, pemanggilan `theme.subscribe()` secara dinamis memperbarui nilai `content` pada `<meta name="theme-color">` di runtime saat user melakukan toggle manual, sehingga warna status bar browser mobile (Chrome/Safari) langsung mengikuti tema aktif.

## PWA & Web App Manifest

- File manifest berlokasi di `frontend/static/manifest.webmanifest`.
- Standar aset ikon tersimpan di `frontend/static/icons/`:
  - `icon-192.png`: 192x192 px (purpose `any`, latar solid)
  - `icon-512.png`: 512x512 px (purpose `any`, latar solid)
  - `icon-maskable-512.png`: 512x512 px (purpose `maskable`, konten dalam safe zone 80% dengan padding solid)
  - `apple-touch-icon-180.png`: 180x180 px (latar solid, tanpa transparansi untuk iOS Home Screen)
- Standar mode tampilan: `display: standalone`, `orientation: any`, `start_url: /dashboard`.
- Standar shortcut aplikasi: Dashboard, Project, Aktivitas, Keuangan.

## Responsive Design

- Layout menggunakan sidebar desktop (`lg:pl-64`) + mobile sidebar (drawer).
- Konten utama bersifat responsive dengan padding yang berbeda per breakpoint.
- Gunakan class Tailwind responsive (`md:`, `lg:`) untuk menyesuaikan layout.

## Component Library

- **@tailwindplus/elements** digunakan untuk komponen UI dasar.
- Komponen custom meliputi: `Modal`, `Drawer`, `Pagination`, `FileAttachment`, `ConfirmDialog`.
- Styling konsisten menggunakan Tailwind utility classes.
