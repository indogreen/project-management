# Changelog

## [2026-10-31] — feat(pwa): phase 2 manifest, icons, and theme synchronization

- Penambahan file Web App Manifest (`manifest.webmanifest`) dengan metadata PWA lengkap dan 4 shortcut aplikasi (Dashboard, Project, Aktivitas, Keuangan).
- Pembuatan aset ikon standar di `frontend/static/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (safe zone 80% terverifikasi), dan `apple-touch-icon-180.png` dari master `indogreen.png`.
- Pemasangan metadata PWA dan link manifest pada `src/app.html`.
- Sinkronisasi dinamis `<meta name="theme-color">` pada `src/routes/+layout.svelte` saat toggle tema manual.
- Pembuatan dokumentasi fitur `docs/features/pwa.md` dan pembaruan `folder-structure.md` serta `frontend-guidelines.md`.
- File yang diubah:
  - Frontend: `frontend/static/manifest.webmanifest`, `frontend/static/icons/*`, `frontend/src/app.html`, `frontend/src/routes/+layout.svelte`
  - Docs: `docs/features/pwa.md`, `docs/folder-structure.md`, `docs/frontend-guidelines.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Browser mobile kini dapat mengenali aplikasi sebagai Progressive Web App (PWA) yang siap di-install.
  - Perilaku aplikasi dan alur auth `/auth/*` tetap identik dengan sebelumnya.

## [2026-10-31] — feat(pwa): phase 1 cloudflare tunnel setup & dev environment

- Konfigurasi environment development HTTPS via Cloudflare Tunnel untuk pengujian PWA mobile via data seluler.
- Penambahan dukungan `DEV_ALLOWED_HOSTS`, `HMR_PROTOCOL`, dan `HMR_CLIENT_PORT` pada `vite.config.ts`.
- Template ingress `cloudflared` (locally-managed dan remote-managed) untuk port 8005 (frontend) dan port 8004 (backend).
- Dokumentasi unit systemd auto-start (`setup-auto-start.md`), checklist dashboard Cloudflare, troubleshooting tunnel, dan pembaruan arsitektur.
- File yang diubah:
  - Frontend: `frontend/vite.config.ts`, `frontend/.env.example`
  - Backend: `backend/.env.example`
  - Docs: `docs/deployment.md`, `docs/setup-auto-start.md`, `docs/environment-variables.md`, `docs/security-checklist.md`, `docs/troubleshooting.md`, `docs/architecture.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Operator dapat menjalankan dev server di belakang Cloudflare Tunnel tanpa error `Invalid Host header` atau HMR WebSocket failure.
  - Akses LAN via HTTP tidak lagi mendukung pengujian session login jika menggunakan cookie Secure.

## [2026-09-25] — feat(activities): add Purchase Requisition category

- Menambahkan opsi kategori 'Purchase Requisition' pada aktivitas proyek (DB enum, validasi request backend, AI document extraction, factory, serta tipe dan opsi frontend).
- Disediakan query DDL ALTER TABLE langsung untuk database production tanpa menjalankan migration.
- File yang diubah:
  - Backend: `database/migrations/2025_06_13_075840_create_activities_table.php`, `app/Http/Requests/ActivityRequest.php`, `app/Services/ActivityService.php`, `app/Services/AIDocumentExtractionService.php`, `database/factories/ActivityFactory.php`
  - Frontend: `src/lib/types/activity.ts`, `src/lib/constants/activity.ts`
  - Docs: `docs/database-schema.md`, `docs/database-migrations.md`, `docs/features/aktivitas.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - User dapat memilih 'Purchase Requisition' saat membuat/mengedit aktivitas atau memfilter aktivitas berdasarkan kategori tersebut.
  - Perlu menjalankan query `ALTER TABLE activities MODIFY COLUMN ...` pada database produksi.

## [2026-06-24] — feat(inventory): add item attachments, placement, and stock movement CRUD

- Menambahkan fitur lampiran (attachments) untuk master data items/material (file upload, rename, delete).
- Menambahkan field `placement` (rak/lokasi penyimpanan) pada tabel `inventories` dan menampilkan lokasinya di detail drawer gudang serta tabel item.
- Menghapus batasan immutable pada mutasi stok (stock movements) dan mengimplementasikan CRUD (show detail dengan informasi placement/rak, edit quantity/catatan/waktu/placement, dan delete mutasi dengan penyesuaian stok otomatis).
- File yang diubah:
  - Backend: `database/migrations/2026_06_24_000001_create_item_attachments_table.php`, `database/migrations/2026_06_01_000004_create_inventories_table.php`, `app/Models/ItemAttachment.php`, `app/Models/Item.php`, `app/Models/Inventory.php`, `app/Models/StockMovement.php`, `app/Services/ItemService.php`, `app/Services/WarehouseService.php`, `app/Http/Controllers/ItemController.php`, `app/Http/Controllers/StockMovementController.php`, `app/Http/Requests/ItemRequest.php`, `app/Http/Requests/StockMovementUpdateRequest.php`, `app/Http/Resources/ItemResource.php`, `app/Http/Resources/WarehouseResource.php`, `database/seeders/RolePermissionSeeder.php`, `app/Http/Controllers/RoleController.php`, `routes/api.php`
  - Frontend: `src/lib/inventory.ts`, `src/lib/services/inventoryService.ts`, `src/routes/items/_components/ItemsPageClient.svelte`, `src/routes/items/_components/ItemTable.svelte`, `src/routes/warehouses/_components/WarehousesPageClient.svelte`, `src/routes/stock-movements/_components/stock-movement.ts`, `src/routes/stock-movements/_components/StockMovementsPageClient.svelte`, `src/routes/stock-movements/_components/StockMovementModal.svelte`
- Dampak yang perlu diketahui:
  - Perlu menjalankan `php artisan migrate` atau `php artisan migrate:fresh` untuk memperbarui skema database (tabel `item_attachments` baru dan kolom `placement` pada `inventories`).
  - Mutasi stok sekarang bisa diedit dan didelete, dan akan melakukan adjustment otomatis pada jumlah stok barang di gudang asal/tujuan.

## [2026-06-23] — feat(api): bypass rate limiting for authenticated users

- Menghindari rate limiting (SlidingWindowThrottle) ketika user sudah terautentikasi (login), dan tetap menerapkannya jika user belum login.
- File yang diubah:
  - `app/Http/Middleware/SlidingWindowThrottle.php`
  - `tests/Feature/RateLimiterTest.php`
  - `docs/api-reference.md`
  - `docs/jwt-auth.md`
  - `docs/architecture.md`
- Dampak yang perlu diketahui:
  - User terautentikasi tidak akan lagi dibatasi oleh rate limiter pada endpoint API/auth terlindungi.
  - Rate limiter (5 req/60s) tetap membatasi guest pada endpoint register & login.

## [Unreleased]

### Added

- Dokumentasi project lengkap di folder `docs/`.
  - Overview dan arsitektur aplikasi.
  - Database schema dari 18 migration.
  - Panduan database migration.
  - Dokumentasi JWT authentication flow.
  - Dokumentasi role & permission (RBAC).
  - API reference lengkap.
  - Frontend guidelines.
  - Dokumentasi fitur: Dashboard, Proyek, Aktivitas, Mitra, Sertifikat, Keuangan, Inventori, Settings, Auth.
  - Panduan deployment.
  - Security checklist.
  - Troubleshooting guide.
  - AI development rules.
  - Folder structure documentation.
  - Setup local development guide.
  - Environment variables documentation.
- `README.md` root yang ringkas dan mengarahkan ke `docs/`.
