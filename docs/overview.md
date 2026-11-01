# Project Overview

## Deskripsi

Indogreen Project Management adalah aplikasi web internal yang dibangun untuk perusahaan **Indogreen** guna mengelola proyek-proyek energi surya (PLTS dan PJUTS). Aplikasi ini mencakup manajemen proyek, pencatatan aktivitas keuangan, pengelolaan mitra (customer & vendor), sertifikasi peralatan, serta sistem inventori gudang.

## Tujuan

1. Menyediakan platform terpusat untuk mengelola seluruh siklus proyek PLTS/PJUTS.
2. Mencatat setiap aktivitas keuangan dan dokumen yang terkait proyek.
3. Mengelola hubungan dengan mitra (customer dan vendor).
4. Melacak sertifikasi peralatan beserta masa berlakunya.
5. Mengelola inventori barang dengan sistem mutasi stok yang teraudit.
6. Menyediakan dashboard analitik untuk pemantauan bisnis.
7. Mengimplementasikan kontrol akses berbasis role (RBAC) untuk keamanan data.

## Target Penggunaan

- **Internal perusahaan** — digunakan oleh tim manajemen, admin, dan staff Indogreen.
- **Multi-role** — mendukung 4 level akses: Super Admin, Admin, Staff, dan User.
- **Responsive** — dapat diakses melalui desktop dan perangkat mobile.

## Fitur Utama

| Modul             | Deskripsi                                                          |
| ----------------- | ------------------------------------------------------------------ |
| Dashboard         | Statistik proyek, tren 12 bulan, distribusi status/kategori        |
| Proyek            | CRUD proyek PLTS/PJUTS dengan filter, sorting, relasi mitra        |
| Aktivitas         | Pencatatan aktivitas (invoice, PO, payment, dll) dengan attachment |
| Mitra             | Manajemen customer & vendor (pribadi/perusahaan)                   |
| Barang Sertifikat | Master data barang yang memiliki sertifikat                        |
| Sertifikat        | Manajemen sertifikat proyek dengan tracking masa berlaku           |
| Keuangan          | Laporan keuangan per proyek                                        |
| Kategori          | Kategori untuk item, proyek, aktivitas, dan sertifikat             |
| Gudang            | Manajemen lokasi penyimpanan barang                                |
| Item              | Master data barang inventori dengan SKU dan minimum stock          |
| Mutasi Stok       | Pencatatan inbound, outbound, transfer, dan alokasi proyek         |
| Role & Permission | RBAC 4-tier dengan permission per modul per aksi                   |
| Activity Log      | Audit trail otomatis untuk setiap operasi CRUD                     |
| Settings          | Profil user, ubah password, tema, manajemen user (admin)           |

## Status Project

| Aspek                  | Status                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| Core features          | ✅ Aktif                                                               |
| Sistem inventori       | ✅ Aktif                                                               |
| Role & permission      | ✅ Aktif                                                               |
| Activity logging       | ✅ Aktif                                                               |
| Dashboard analytics    | ✅ Aktif                                                               |
| AI document extraction | ✅ Aktif                                                               |
| Unit testing           | 🔧 Parsial                                                             |
| PWA                    | ✅ Aktif (App shell caching, offline navigation fallback, installable) |
| Email notification     | ❌ Belum ada                                                           |
| Export/report PDF      | ❌ Belum ada                                                           |

## Batasan Aplikasi

- Aplikasi hanya mendukung satu tenant (single-company use).
- Tidak ada fitur multi-bahasa (UI hanya Bahasa Indonesia).
- Password reset belum diimplementasikan melalui email (hanya via admin atau endpoint langsung).
- **Batasan Offline PWA:** Aplikasi mendukung instalasi PWA (_standalone app_) serta caching aset statis & chunk build (_immutable assets_) untuk pemuatan instan. Namun, mode offline dibatasi secara ketat pada navigasi fallback (tampilan `/offline.html` dan banner konektivitas non-blokir); aplikasi **tidak mendukung** pembuatan, penyuntingan, atau penghapusan data transaksi saat offline karena seluruh request data bisnis (`/api/*`) wajib terhubung ke backend Laravel untuk verifikasi JWT dan integritas audit log.
