# Database Migrations

## Daftar Migration

| #   | File                                                        | Tujuan                                                                              | Status |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------ |
| 1   | `0001_01_01_000000_create_users_table.php`                  | Membuat tabel `users`, `password_reset_tokens`, `sessions`                          | Active |
| 2   | `0001_01_01_000001_create_cache_table.php`                  | Membuat tabel `cache` dan `cache_locks`                                             | Active |
| 3   | `0001_01_01_000002_create_jobs_table.php`                   | Membuat tabel `jobs`, `job_batches`, `failed_jobs`                                  | Active |
| 4   | `2025_06_13_032748_create_personal_access_tokens_table.php` | Membuat tabel `personal_access_tokens` (Sanctum)                                    | Active |
| 5   | `2025_06_13_075820_create_partners_table.php`               | Membuat tabel `partners` untuk mitra/customer/vendor                                | Active |
| 6   | `2025_06_13_075830_create_projects_table.php`               | Membuat tabel `projects` dengan enum kategori dan status                            | Active |
| 7   | `2025_06_13_075840_create_activities_table.php`             | Membuat tabel `activities` dengan 18 enum kategori                                  | Active |
| 8   | `2025_08_08_093916_barang_certificates.php`                 | Membuat tabel `barang_certificates`                                                 | Active |
| 9   | `2025_08_08_094631_certificates.php`                        | Membuat tabel `certificates` dengan status enum                                     | Active |
| 10  | `2025_10_06_092030_activity_attachments.php`                | Membuat tabel `activity_attachments`                                                | Active |
| 11  | `2025_10_06_092420_certificate_attachments.php`             | Membuat tabel `certificate_attachments`                                             | Active |
| 12  | `2025_12_02_064833_create_permission_tables.php`            | Membuat tabel Spatie Permission (roles, permissions, pivot)                         | Active |
| 13  | `2026_06_01_000001_create_categories_table.php`             | Membuat tabel `categories` dengan unique constraint                                 | Active |
| 14  | `2026_06_01_000002_create_warehouses_table.php`             | Membuat tabel `warehouses`                                                          | Active |
| 15  | `2026_06_01_000003_create_items_table.php`                  | Membuat tabel `items` dengan SKU unique                                             | Active |
| 16  | `2026_06_01_000004_create_inventories_table.php`            | Membuat tabel `inventories` dengan unique item+warehouse (ditambah kolom placement) | Active |
| 17  | `2026_06_01_000005_create_stock_movements_table.php`        | Membuat tabel `stock_movements` dengan multiple index                               | Active |
| 18  | `2026_06_01_000006_create_project_materials_table.php`      | Membuat tabel `project_materials`                                                   | Active |
| 19  | `2026_06_24_000001_create_item_attachments_table.php`       | Membuat tabel `item_attachments`                                                    | Active |
| 20  | `2026_11_06_000001_add_username_to_users_table.php`         | Menambahkan kolom `username` (unique, nullable) pada tabel `users` dan backfill data | Active |

## Daftar Seeder

| #   | Seeder                    | Tujuan                                                       |
| --- | ------------------------- | ------------------------------------------------------------ |
| 1   | `UserSeeder`              | Membuat user default                                         |
| 2   | `MitraSeeder`             | Data contoh mitra                                            |
| 3   | `ProjectSeeder`           | Data contoh proyek                                           |
| 4   | `InventorySeeder`         | Data contoh inventori (categories, warehouses, items, stock) |
| 5   | `BarangCertificateSeeder` | Data contoh barang sertifikat                                |
| 6   | `CertificateSeeder`       | Data contoh sertifikat                                       |
| 7   | `ActivitySeeder`          | Data contoh aktivitas                                        |
| 8   | `RolePermissionSeeder`    | Role & permission (super_admin, admin, staff, user)          |

Urutan seeding diatur di `DatabaseSeeder.php` untuk menjaga integritas foreign key.

## Aturan Pengelolaan Migration

### ✅ Yang Harus Dilakukan

1. **Buat migration baru** untuk setiap perubahan schema.
2. **Test migration di local** sebelum push ke repository.
3. **Pastikan method `down()`** tersedia untuk rollback.
4. **Jalankan `php artisan migrate:fresh --seed`** di local untuk memastikan seluruh rantai migration berjalan.
5. **Pastikan migration aman untuk data existing** — gunakan nullable atau default value.
6. **Backup database production** sebelum menjalankan migration baru.

### ❌ Yang Tidak Boleh Dilakukan

1. **Jangan mengubah migration lama** yang sudah dijalankan di production.
2. **Jangan drop column/table** tanpa backup dan validasi data.
3. **Jangan rename column** langsung — buat migration baru dengan add column baru → copy data → drop column lama.
4. **Jangan mengubah enum value** di migration yang sudah production — buat migration baru untuk menambah value.

### Checklist Sebelum Deploy Migration ke Production

- [ ] Migration berhasil dijalankan di local (`php artisan migrate`).
- [ ] Migration berhasil di-rollback di local (`php artisan migrate:rollback`).
- [ ] Fresh migration berhasil (`php artisan migrate:fresh --seed`).
- [ ] Tidak ada data loss pada data existing.
- [ ] Foreign key constraint tidak memblokir migration.
- [ ] Index yang diperlukan sudah ditambahkan.
- [ ] Database production sudah di-backup.
