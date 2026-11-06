# Database Schema

## Ringkasan

Database menggunakan **MySQL** dengan total **18 tabel** (termasuk tabel sistem Laravel). Berikut dokumentasi untuk setiap tabel yang dibuat melalui migration.

---

## Tabel `users`

Menyimpan data akun pengguna.

| Column              | Type           | Nullable | Default        | Deskripsi                  |
| ------------------- | -------------- | -------- | -------------- | -------------------------- |
| `id`                | bigint (PK)    | No       | auto_increment | Primary key                |
| `name`              | varchar(255)   | No       | —              | Nama pengguna              |
| `username`          | varchar(255)   | Yes      | NULL           | Username unik untuk login  |
| `email`             | varchar(255)   | No       | —              | Email (unique)             |
| `email_verified_at` | timestamp      | Yes      | NULL           | Waktu verifikasi email     |
| `password`          | varchar(255)   | No       | —              | Password (hashed bcrypt)   |
| `remember_token`    | varchar(100)   | Yes      | NULL           | Token remember me          |
| `created_at`        | timestamp      | Yes      | NULL           | Waktu dibuat               |
| `updated_at`        | timestamp      | Yes      | NULL           | Waktu terakhir diubah      |

**Index:** `users_email_unique` (UNIQUE pada `email`), `users_username_unique` (UNIQUE pada `username`)

---

## Tabel `password_reset_tokens`

Token untuk reset password.

| Column       | Type         | Nullable | Default | Deskripsi                  |
| ------------ | ------------ | -------- | ------- | -------------------------- |
| `email`      | varchar (PK) | No       | —       | Email user                 |
| `token`      | varchar(255) | No       | —       | Token reset password       |
| `created_at` | timestamp    | Yes      | NULL    | Waktu token dibuat         |

---

## Tabel `sessions`

Session management (driver: database).

| Column          | Type         | Nullable | Default | Deskripsi                  |
| --------------- | ------------ | -------- | ------- | -------------------------- |
| `id`            | varchar (PK) | No       | —       | Session ID                 |
| `user_id`       | bigint (FK)  | Yes      | NULL    | User pemilik session       |
| `ip_address`    | varchar(45)  | Yes      | NULL    | IP address                 |
| `user_agent`    | text         | Yes      | NULL    | Browser user agent         |
| `payload`       | longtext     | No       | —       | Session data               |
| `last_activity` | integer      | No       | —       | Timestamp aktivitas terakhir|

---

## Tabel `partners`

Menyimpan data mitra (customer & vendor). Model Eloquent: `Mitra`.

| Column            | Type         | Nullable | Default | Deskripsi                  |
| ----------------- | ------------ | -------- | ------- | -------------------------- |
| `id`              | bigint (PK)  | No       | auto    | Primary key                |
| `nama`            | varchar(255) | No       | —       | Nama mitra                 |
| `is_pribadi`      | boolean      | No       | `false` | Flag: mitra pribadi        |
| `is_perusahaan`   | boolean      | No       | `false` | Flag: mitra perusahaan     |
| `is_customer`     | boolean      | No       | `false` | Flag: sebagai customer     |
| `is_vendor`       | boolean      | No       | `false` | Flag: sebagai vendor       |
| `alamat`          | text         | No       | —       | Alamat mitra               |
| `website`         | varchar(255) | Yes      | NULL    | Website                    |
| `email`           | varchar(255) | Yes      | NULL    | Email                      |
| `kontak_1`        | varchar(255) | Yes      | NULL    | Nomor kontak 1             |
| `kontak_1_nama`   | varchar(255) | Yes      | NULL    | Nama kontak 1              |
| `kontak_1_jabatan`| varchar(255) | Yes      | NULL    | Jabatan kontak 1           |
| `kontak_2_nama`   | varchar(255) | Yes      | NULL    | Nama kontak 2              |
| `kontak_2`        | varchar(255) | Yes      | NULL    | Nomor kontak 2             |
| `kontak_2_jabatan`| varchar(255) | Yes      | NULL    | Jabatan kontak 2           |
| `created_at`      | timestamp    | Yes      | NULL    | Waktu dibuat               |
| `updated_at`      | timestamp    | Yes      | NULL    | Waktu terakhir diubah      |

---

## Tabel `projects`

Menyimpan data proyek PLTS/PJUTS.

| Column            | Type         | Nullable | Default         | Deskripsi                   |
| ----------------- | ------------ | -------- | --------------- | --------------------------- |
| `id`              | bigint (PK)  | No       | auto            | Primary key                 |
| `name`            | varchar(255) | No       | —               | Nama proyek                 |
| `mitra_id`        | bigint (FK)  | Yes      | NULL            | Relasi ke `partners.id`     |
| `kategori`        | enum         | No       | `PLTS Hybrid`   | Kategori proyek (lihat enum)|
| `lokasi`          | text         | Yes      | NULL            | Lokasi proyek               |
| `status`          | enum         | No       | `Ongoing`       | Status proyek (lihat enum)  |
| `no_po`           | text         | Yes      | NULL            | Nomor Purchase Order        |
| `no_so`           | text         | Yes      | NULL            | Nomor Sales Order           |
| `description`     | text         | No       | —               | Deskripsi proyek            |
| `start_date`      | date         | No       | —               | Tanggal mulai               |
| `finish_date`     | date         | Yes      | NULL            | Tanggal selesai             |
| `is_cert_projects`| boolean      | No       | `false`         | Flag: proyek sertifikasi    |
| `created_at`      | timestamp    | Yes      | NULL            | Waktu dibuat                |
| `updated_at`      | timestamp    | Yes      | NULL            | Waktu terakhir diubah       |

**Enum `kategori`:** `PLTS Hybrid`, `PLTS Ongrid`, `PLTS Offgrid`, `PJUTS All In One`, `PJUTS Two In One`, `PJUTS Konvensional`

**Enum `status`:** `Ongoing`, `Prospect`, `Complete`, `Cancel`

**Foreign Key:** `mitra_id` → `partners.id` (ON DELETE SET NULL)

---

## Tabel `activities`

Pencatatan aktivitas keuangan/dokumen per proyek.

| Column          | Type          | Nullable | Default          | Deskripsi                    |
| --------------- | ------------- | -------- | ---------------- | ---------------------------- |
| `id`            | bigint (PK)   | No       | auto             | Primary key                  |
| `name`          | varchar(255)  | No       | —                | Nama aktivitas               |
| `project_id`    | bigint (FK)   | No       | —                | Relasi ke `projects.id`      |
| `jenis`         | enum          | No       | `Internal`       | Jenis aktivitas (lihat enum) |
| `mitra_id`      | bigint (FK)   | Yes      | NULL             | Relasi ke `partners.id`      |
| `kategori`      | enum          | No       | `Expense Report` | Kategori dokumen (lihat enum)|
| `from`          | text          | Yes      | NULL             | Dari (pengirim)              |
| `to`            | text          | Yes      | NULL             | Kepada (penerima)            |
| `short_desc`    | text          | Yes      | NULL             | Deskripsi singkat            |
| `description`   | text          | No       | —                | Deskripsi lengkap            |
| `value`         | decimal(15,2) | No       | `0`              | Nilai transaksi (Rupiah)     |
| `activity_date` | date          | No       | —                | Tanggal aktivitas            |
| `created_at`    | timestamp     | Yes      | NULL             | Waktu dibuat                 |
| `updated_at`    | timestamp     | Yes      | NULL             | Waktu terakhir diubah        |

**Enum `jenis`:** `Internal`, `Customer`, `Vendor`

**Enum `kategori`:** `Expense Report`, `Invoice`, `Invoice & FP`, `Purchase Order`, `Purchase Requisition`, `Payment`, `Quotation`, `Faktur Pajak`, `Kasbon`, `Laporan Teknis`, `Surat Masuk`, `Surat Keluar`, `Kontrak`, `Berita Acara`, `Receive Item`, `Delivery Order`, `Legalitas`, `Other`

**Foreign Key:**
- `project_id` → `projects.id` (ON DELETE CASCADE)
- `mitra_id` → `partners.id` (ON DELETE SET NULL)

---

## Tabel `activity_attachments`

File lampiran aktivitas (sistem baru, menggantikan kolom `attachment` legacy).

| Column        | Type         | Nullable | Default | Deskripsi                  |
| ------------- | ------------ | -------- | ------- | -------------------------- |
| `id`          | bigint (PK)  | No       | auto    | Primary key                |
| `activity_id` | bigint (FK) | No       | —       | Relasi ke `activities.id`  |
| `name`        | varchar(255) | No       | —       | Nama file                  |
| `description` | text         | Yes      | NULL    | Deskripsi file             |
| `file_path`   | varchar(255) | No       | —       | Path file di storage       |
| `mime`        | varchar(191) | Yes      | NULL    | MIME type                  |
| `size`        | bigint       | Yes      | NULL    | Ukuran file (bytes)        |
| `created_at`  | timestamp    | Yes      | NULL    | Waktu dibuat               |
| `updated_at`  | timestamp    | Yes      | NULL    | Waktu terakhir diubah      |

**Foreign Key:** `activity_id` → `activities.id` (ON DELETE CASCADE)

---

## Tabel `barang_certificates`

Master data barang yang memiliki sertifikat.

| Column     | Type         | Nullable | Default | Deskripsi                  |
| ---------- | ------------ | -------- | ------- | -------------------------- |
| `id`       | bigint (PK)  | No       | auto    | Primary key                |
| `name`     | varchar(255) | No       | —       | Nama barang                |
| `no_seri`  | varchar(30)  | No       | —       | Nomor seri barang          |
| `mitra_id` | bigint (FK)  | Yes      | NULL    | Relasi ke `partners.id`    |
| `created_at` | timestamp  | Yes      | NULL    | Waktu dibuat               |
| `updated_at` | timestamp  | Yes      | NULL    | Waktu terakhir diubah      |

**Foreign Key:** `mitra_id` → `partners.id` (ON DELETE SET NULL)

---

## Tabel `certificates`

Sertifikat yang terhubung ke proyek dan barang sertifikat.

| Column                  | Type         | Nullable | Default  | Deskripsi                       |
| ----------------------- | ------------ | -------- | -------- | ------------------------------- |
| `id`                    | bigint (PK)  | No       | auto     | Primary key                     |
| `name`                  | varchar(255) | No       | —        | Nama sertifikat                 |
| `no_certificate`        | varchar(30)  | No       | —        | Nomor sertifikat                |
| `project_id`            | bigint (FK)  | Yes      | NULL     | Relasi ke `projects.id`         |
| `barang_certificate_id` | bigint (FK)  | Yes      | NULL     | Relasi ke `barang_certificates` |
| `status`                | enum         | No       | `Belum`  | Status sertifikat (lihat enum)  |
| `date_of_issue`         | date         | Yes      | NULL     | Tanggal terbit                  |
| `date_of_expired`       | date         | Yes      | NULL     | Tanggal kadaluarsa              |
| `created_at`            | timestamp    | Yes      | NULL     | Waktu dibuat                    |
| `updated_at`            | timestamp    | Yes      | NULL     | Waktu terakhir diubah           |

**Enum `status`:** `Belum`, `Tidak Aktif`, `Aktif`

**Foreign Key:**
- `project_id` → `projects.id` (ON DELETE SET NULL)
- `barang_certificate_id` → `barang_certificates.id` (ON DELETE SET NULL)

---

## Tabel `certificate_attachments`

File lampiran sertifikat.

| Column           | Type         | Nullable | Default | Deskripsi                    |
| ---------------- | ------------ | -------- | ------- | ---------------------------- |
| `id`             | bigint (PK)  | No       | auto    | Primary key                  |
| `certificate_id` | bigint (FK) | No       | —       | Relasi ke `certificates.id`  |
| `name`           | varchar(255) | No       | —       | Nama file                    |
| `description`    | text         | Yes      | NULL    | Deskripsi file               |
| `file_path`      | varchar(255) | No       | —       | Path file di storage         |
| `mime`           | varchar(191) | Yes      | NULL    | MIME type                    |
| `size`           | bigint       | Yes      | NULL    | Ukuran file (bytes)          |
| `created_at`     | timestamp    | Yes      | NULL    | Waktu dibuat                 |
| `updated_at`     | timestamp    | Yes      | NULL    | Waktu terakhir diubah        |

**Foreign Key:** `certificate_id` → `certificates.id` (ON DELETE CASCADE)

---

## Tabel `categories`

Kategori umum yang digunakan oleh beberapa modul (item, project, activity, certificate).

| Column       | Type         | Nullable | Default | Deskripsi                     |
| ------------ | ------------ | -------- | ------- | ----------------------------- |
| `id`         | bigint (PK)  | No       | auto    | Primary key                   |
| `name`       | varchar(255) | No       | —       | Nama kategori                 |
| `type`       | enum         | No       | —       | Tipe kategori (lihat enum)    |
| `created_at` | timestamp    | Yes      | NULL    | Waktu dibuat                  |
| `updated_at` | timestamp    | Yes      | NULL    | Waktu terakhir diubah         |

**Enum `type`:** `item`, `project`, `activity`, `certificate`

**Index:** `categories_name_type_unique` (UNIQUE pada `name` + `type`)

---

## Tabel `warehouses`

Lokasi penyimpanan barang.

| Column       | Type         | Nullable | Default | Deskripsi                  |
| ------------ | ------------ | -------- | ------- | -------------------------- |
| `id`         | bigint (PK)  | No       | auto    | Primary key                |
| `name`       | varchar(255) | No       | —       | Nama gudang                |
| `location`   | text         | Yes      | NULL    | Lokasi/alamat gudang       |
| `created_at` | timestamp    | Yes      | NULL    | Waktu dibuat               |
| `updated_at` | timestamp    | Yes      | NULL    | Waktu terakhir diubah      |

---

## Tabel `items`

Master data barang inventori.

| Column          | Type          | Nullable | Default | Deskripsi                  |
| --------------- | ------------- | -------- | ------- | -------------------------- |
| `id`            | bigint (PK)   | No       | auto    | Primary key                |
| `sku`           | varchar(100)  | No       | —       | SKU barang (unique)        |
| `category_id`   | bigint (FK)   | No       | —       | Relasi ke `categories.id`  |
| `name`          | varchar(255)  | No       | —       | Nama barang                |
| `unit`          | varchar(50)   | No       | —       | Satuan (pcs, meter, dll)   |
| `minimum_stock` | unsigned int  | No       | `0`     | Minimum stok peringatan    |
| `created_at`    | timestamp     | Yes      | NULL    | Waktu dibuat               |
| `updated_at`    | timestamp     | Yes      | NULL    | Waktu terakhir diubah      |

**Index:** `items_sku_unique` (UNIQUE pada `sku`), `items_sku_index`

**Foreign Key:** `category_id` → `categories.id` (RESTRICT ON DELETE)

---

## Tabel `item_attachments`

File lampiran item/material.

| Column        | Type         | Nullable | Default | Deskripsi                  |
| ------------- | ------------ | -------- | ------- | -------------------------- |
| `id`          | bigint (PK)  | No       | auto    | Primary key                |
| `item_id`     | bigint (FK)  | No       | —       | Relasi ke `items.id`       |
| `name`        | varchar(255) | No       | —       | Nama file                  |
| `description` | text         | Yes      | NULL    | Deskripsi file             |
| `file_path`   | varchar(255) | No       | —       | Path file di storage       |
| `mime`        | varchar(191) | Yes      | NULL    | MIME type                  |
| `size`        | bigint       | Yes      | NULL    | Ukuran file (bytes)        |
| `created_at`  | timestamp    | Yes      | NULL    | Waktu dibuat               |
| `updated_at`  | timestamp    | Yes      | NULL    | Waktu terakhir diubah      |

**Foreign Key:** `item_id` → `items.id` (ON DELETE CASCADE)

---

## Tabel `inventories`

Stok barang per gudang (snapshot current quantity).

| Column         | Type         | Nullable | Default | Deskripsi                  |
| -------------- | ------------ | -------- | ------- | -------------------------- |
| `id`           | bigint (PK)  | No       | auto    | Primary key                |
| `item_id`      | bigint (FK)  | No       | —       | Relasi ke `items.id`       |
| `warehouse_id` | bigint (FK)  | No       | —       | Relasi ke `warehouses.id`  |
| `quantity`     | unsigned int | No       | `0`     | Jumlah stok saat ini       |
| `placement`    | varchar(100) | Yes      | NULL    | Posisi rak penyimpanan     |
| `created_at`   | timestamp    | Yes      | NULL    | Waktu dibuat               |
| `updated_at`   | timestamp    | Yes      | NULL    | Waktu terakhir diubah      |

**Constraint:** `inventories_item_warehouse_unique` (UNIQUE pada `item_id` + `warehouse_id`)

**Foreign Key:**
- `item_id` → `items.id` (RESTRICT)
- `warehouse_id` → `warehouses.id` (RESTRICT)

---

## Tabel `stock_movements`

Catatan mutasi stok (mutable — mendukung edit dan delete dengan penyesuaian stok otomatis).

| Column                    | Type         | Nullable | Default     | Deskripsi                     |
| ------------------------- | ------------ | -------- | ----------- | ----------------------------- |
| `id`                      | bigint (PK)  | No       | auto        | Primary key                   |
| `type`                    | enum         | No       | —           | Tipe mutasi (lihat enum)      |
| `item_id`                 | bigint (FK)  | No       | —           | Relasi ke `items.id`          |
| `source_warehouse_id`     | bigint (FK)  | Yes      | NULL        | Gudang asal                   |
| `destination_warehouse_id`| bigint (FK)  | Yes      | NULL        | Gudang tujuan                 |
| `project_id`              | bigint (FK)  | Yes      | NULL        | Proyek terkait (alokasi)      |
| `quantity`                | unsigned int | No       | —           | Jumlah barang                 |
| `placement`               | varchar(100) | Yes      | NULL        | Posisi rak penyimpanan        |
| `notes`                   | text         | Yes      | NULL        | Catatan                       |
| `occurred_at`             | timestamp    | No       | `CURRENT`   | Waktu mutasi terjadi          |
| `created_at`              | timestamp    | Yes      | NULL        | Waktu dibuat                  |
| `updated_at`              | timestamp    | Yes      | NULL        | Waktu terakhir diubah         |

**Enum `type`:** `inbound`, `outbound`, `transfer`, `project_allocation`

**Index:**
- `stock_movements_type_index`
- `stock_movements_item_date_idx` (`item_id`, `occurred_at`)
- `stock_movements_wh_flow_idx` (`source_warehouse_id`, `destination_warehouse_id`)
- `stock_movements_project_idx` (`project_id`)

**Foreign Key:**
- `item_id` → `items.id` (RESTRICT)
- `source_warehouse_id` → `warehouses.id` (RESTRICT)
- `destination_warehouse_id` → `warehouses.id` (RESTRICT)
- `project_id` → `projects.id` (RESTRICT)

**Business Rule:** Model ini bersifat **mutable** — mendukung edit dan delete dengan penyesuaian stok otomatis.

---

## Tabel `project_materials`

Material yang dialokasikan ke proyek dari gudang.

| Column              | Type         | Nullable | Default   | Deskripsi                       |
| ------------------- | ------------ | -------- | --------- | ------------------------------- |
| `id`                | bigint (PK)  | No       | auto      | Primary key                     |
| `project_id`        | bigint (FK)  | No       | —         | Relasi ke `projects.id`         |
| `item_id`           | bigint (FK)  | No       | —         | Relasi ke `items.id`            |
| `warehouse_id`      | bigint (FK)  | No       | —         | Gudang asal material            |
| `stock_movement_id` | bigint (FK)  | No       | —         | Relasi ke `stock_movements.id`  |
| `quantity`          | unsigned int | No       | —         | Jumlah material                 |
| `allocated_at`      | timestamp    | No       | `CURRENT` | Waktu alokasi                   |
| `notes`             | text         | Yes      | NULL      | Catatan                         |
| `created_at`        | timestamp    | Yes      | NULL      | Waktu dibuat                    |
| `updated_at`        | timestamp    | Yes      | NULL      | Waktu terakhir diubah           |

**Index:** `project_materials_project_item_idx` (`project_id`, `item_id`)

**Foreign Key:** Semua FK menggunakan `RESTRICT ON DELETE`.

---

## Tabel Spatie Permission

Migration `create_permission_tables` membuat tabel-tabel berikut (dikelola oleh package Spatie):

- `permissions` — Daftar permission
- `roles` — Daftar role
- `model_has_permissions` — Relasi user ↔ permission
- `model_has_roles` — Relasi user ↔ role
- `role_has_permissions` — Relasi role ↔ permission

---

## Tabel Sistem Laravel

- `personal_access_tokens` — Token Sanctum (tersedia, tapi auth utama menggunakan JWT)
- `cache` + `cache_locks` — Cache driver database
- `jobs`, `job_batches`, `failed_jobs` — Queue driver database

---

## Relasi Database

```
users ──────────────────── model_has_roles ──── roles
                           model_has_permissions ── permissions

partners (mitra) ──┬────── projects
                   ├────── activities
                   └────── barang_certificates

projects ──────────┬────── activities
                   ├────── certificates
                   ├────── stock_movements (project_allocation)
                   └────── project_materials

activities ─────── activity_attachments

barang_certificates ───── certificates

certificates ──────────── certificate_attachments

categories ────────────── items

warehouses ────────┬────── inventories
                   ├────── stock_movements (source/destination)
                   └────── project_materials

items ─────────────┬────── inventories
                    ├────── stock_movements
                    ├────── project_materials
                    └────── item_attachments

stock_movements ───────── project_materials
```
