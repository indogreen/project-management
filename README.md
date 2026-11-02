# Indogreen Project Management

Aplikasi manajemen proyek internal **Indogreen** untuk mengelola proyek energi surya (PLTS/PJUTS), aktivitas, mitra, sertifikat, keuangan, dan inventori gudang.

## Tech Stack

| Layer     | Teknologi                                               |
| --------- | ------------------------------------------------------- |
| Frontend  | SvelteKit 5, Svelte 5, Tailwind CSS 4, Vite 7, Chart.js |
| Backend   | Laravel 13, PHP 8.4                                     |
| Auth      | JWT (php-open-source-saver/jwt-auth)                    |
| RBAC      | Spatie Laravel Permission                               |
| Database  | MySQL                                                   |
| Dev Tools | ESLint, Prettier, Vitest, PHPUnit, Laravel Pint         |

## Fitur Utama

- **Dashboard** — Statistik proyek, tren bulanan, distribusi status & kategori, top customer
- **Proyek** — CRUD proyek PLTS/PJUTS dengan filter, sorting, dan relasi mitra
- **Aktivitas** — Pencatatan aktivitas proyek (invoice, PO, expense report, dll) dengan attachment
- **Mitra** — Manajemen customer & vendor (pribadi/perusahaan)
- **Sertifikat** — Manajemen barang sertifikat dan sertifikat proyek
- **Keuangan** — Laporan keuangan proyek
- **Inventori** — Gudang, item, kategori, mutasi stok (inbound/outbound/transfer/alokasi proyek)
- **Role & Permission** — RBAC 4-tier (super_admin, admin, staff, user) dengan permission per modul
- **Activity Log** — Audit trail otomatis untuk semua operasi CRUD
- **Settings** — Pengaturan profil, password, tema, dan manajemen user
- **Progressive Web App (PWA)** — Dukungan instalasi mandiri (desktop/Android/iOS standalone), caching aset build ultra-cepat (0 B second visit), deteksi status konektivitas realtime, dan fallback navigasi offline

## Quick Start

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve
```

### Frontend (SvelteKit)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Dokumentasi

Dokumentasi teknis lengkap tersedia di folder [`docs/`](./docs/README.md).

## Lisensi

[MIT License](./LICENSE) — Copyright © 2026 Indogreen
