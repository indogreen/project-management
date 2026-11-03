# API Reference

## Base URL

```
http://127.0.0.1:8000/api
```

## Autentikasi

Semua endpoint (kecuali login & register) memerlukan JWT Bearer token:

```
Authorization: Bearer {access_token}
```

## Rate Limiting

| Grup Route   | Limit             | Middleware                          |
| ------------ | ----------------- | ----------------------------------- |
| Auth routes  | 5 req / 60 detik  | `sliding_throttle:5,60,auth`        |
| API routes   | 15 req / 60 detik | `sliding_throttle:15,60,api`        |

> **Catatan:** Rate limiting hanya berlaku untuk user yang belum terautentikasi (guest). Setelah user berhasil login/terautentikasi, rate limiting (throttle) akan di-bypass sepenuhnya.

---

## Auth

| Method | Endpoint                | Auth | Deskripsi                      |
| ------ | ----------------------- | ---- | ------------------------------ |
| POST   | `/auth/register`        | No   | Registrasi user baru (khusus email resmi `@indogreen.id`, dapat dinonaktifkan via `AUTH_REGISTRATION_ENABLED`) |
| POST   | `/auth/login`           | No   | Login dan dapatkan JWT token   |
| POST   | `/auth/logout`          | Yes  | Invalidate token               |
| POST   | `/auth/refresh`         | Yes  | Refresh JWT token              |
| GET    | `/auth/me`              | Yes  | Data user + roles + permissions|
| PUT    | `/auth/profile`         | Yes  | Update nama profil             |
| PUT    | `/auth/password`        | Yes  | Ubah password                  |

## Role Management

| Method | Endpoint                | Auth | Role Required          | Deskripsi                |
| ------ | ----------------------- | ---- | ---------------------- | ------------------------ |
| GET    | `/auth/role/users`      | Yes  | `super_admin`, `admin` | Daftar user yang dikelola|
| PUT    | `/auth/role`            | Yes  | `super_admin`, `admin` | Update role & permission (dibatasi ketat pada allowlist peran dan permission kanonikal, `PM-AC-001`) |
| GET    | `/auth/role/config`     | Yes  | `super_admin`, `admin` | Config modul & aksi      |

## Projects

| Method | Endpoint              | Auth | Deskripsi                |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/projects`           | Yes  | List proyek (paginated, filterable) |
| POST   | `/projects`           | Yes  | Buat proyek baru         |
| GET    | `/projects/{id}`      | Yes  | Detail proyek            |
| PUT    | `/projects/{id}`      | Yes  | Update proyek            |
| DELETE | `/projects/{id}`      | Yes  | Hapus proyek             |

**Filter query:** `status`, `kategori`, `customer_id`, `is_cert_projects`, `date_from`, `date_to`, `search`, `sort_by`, `sort_dir`

## Activities

| Method | Endpoint              | Auth | Deskripsi                |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/activities`         | Yes  | List aktivitas (paginated, filterable) |
| POST   | `/activities`         | Yes  | Buat aktivitas (multipart/form-data untuk file) atau ekstraksi AI (`action=extract`) |
| GET    | `/activities/{id}`    | Yes  | Detail aktivitas         |
| PUT    | `/activities/{id}`    | Yes  | Update aktivitas         |
| DELETE | `/activities/{id}`    | Yes  | Hapus aktivitas          |

> **Catatan Keamanan Lampiran & AI (`PM-INJ-001`, `PM-INJ-002`):**
> - Lampiran file diinspeksi secara server-side via magic bytes (`finfo`) untuk mencegah MIME header spoofing.
> - Pada payload `action=extract`, kegagalan ekstraksi AI mengembalikan response error sanitasi (HTTP 500) tanpa membocorkan trace atau kredensial internal.

**Filter query:** `project_id`, `jenis`, `kategori`, `mitra_id`, `date_from`, `date_to`, `search`, `sort_by`, `sort_dir`

## Mitras (Partners)

| Method | Endpoint              | Auth | Deskripsi                |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/mitras`             | Yes  | List mitra (paginated, filterable) |
| POST   | `/mitras`             | Yes  | Buat mitra baru          |
| GET    | `/mitras/{id}`        | Yes  | Detail mitra             |
| PUT    | `/mitras/{id}`        | Yes  | Update mitra             |
| DELETE | `/mitras/{id}`        | Yes  | Hapus mitra              |

**Filter query:** `kategori` (pribadi/perusahaan/customer/vendor), `date_from`, `date_to`, `search`

## Barang Certificates

| Method | Endpoint                    | Auth | Deskripsi                |
| ------ | --------------------------- | ---- | ------------------------ |
| GET    | `/barang-certificates`      | Yes  | List barang sertifikat   |
| POST   | `/barang-certificates`      | Yes  | Buat barang sertifikat   |
| GET    | `/barang-certificates/{id}` | Yes  | Detail barang sertifikat |
| PUT    | `/barang-certificates/{id}` | Yes  | Update barang sertifikat |
| DELETE | `/barang-certificates/{id}` | Yes  | Hapus barang sertifikat  |

**Filter query:** `mitra_id`, `search`, `sort_by`, `sort_dir`

## Certificates

| Method | Endpoint                | Auth | Deskripsi                |
| ------ | ----------------------- | ---- | ------------------------ |
| GET    | `/certificates`         | Yes  | List sertifikat          |
| POST   | `/certificates`         | Yes  | Buat sertifikat          |
| GET    | `/certificates/{id}`    | Yes  | Detail sertifikat        |
| PUT    | `/certificates/{id}`    | Yes  | Update sertifikat        |
| DELETE | `/certificates/{id}`    | Yes  | Hapus sertifikat         |

**Filter query:** `status`, `project_id`, `barang_certificate_id`, `date_from`, `date_to`, `search`

## Dashboard

| Method | Endpoint       | Auth | Deskripsi                |
| ------ | -------------- | ---- | ------------------------ |
| GET    | `/dashboard`   | Yes  | Data dashboard (totals, trend, distribution, top customers) |

## Finance

| Method | Endpoint          | Auth | Deskripsi                |
| ------ | ----------------- | ---- | ------------------------ |
| GET    | `/finance`        | Yes  | List data keuangan       |
| PUT    | `/finance/{id}`   | Yes  | Update data keuangan     |

## Categories

| Method | Endpoint              | Auth | Deskripsi                |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/categories`         | Yes  | List kategori            |
| POST   | `/categories`         | Yes  | Buat kategori            |
| GET    | `/categories/{id}`    | Yes  | Detail kategori          |
| PUT    | `/categories/{id}`    | Yes  | Update kategori          |
| DELETE | `/categories/{id}`    | Yes  | Hapus kategori           |

## Warehouses

| Method | Endpoint              | Auth | Deskripsi                |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/warehouses`         | Yes  | List gudang              |
| POST   | `/warehouses`         | Yes  | Buat gudang              |
| GET    | `/warehouses/{id}`    | Yes  | Detail gudang + inventori|
| PUT    | `/warehouses/{id}`    | Yes  | Update gudang            |
| DELETE | `/warehouses/{id}`    | Yes  | Hapus gudang (jika kosong)|

## Items

| Method | Endpoint              | Auth | Deskripsi                |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/items`              | Yes  | List item inventori      |
| POST   | `/items`              | Yes  | Buat item                |
| GET    | `/items/{id}`         | Yes  | Detail item              |
| PUT    | `/items/{id}`         | Yes  | Update item              |
| DELETE | `/items/{id}`         | Yes  | Hapus item               |

## Stock Movements

| Method | Endpoint                              | Auth | Deskripsi                        |
| ------ | ------------------------------------- | ---- | -------------------------------- |
| GET    | `/stock-movements`                    | Yes  | List mutasi stok                 |
| GET    | `/stock-movements/{id}`               | Yes  | Detail mutasi stok               |
| POST   | `/stock-movements/inbound`            | Yes  | Catat barang masuk               |
| POST   | `/stock-movements/outbound`           | Yes  | Catat barang keluar              |
| POST   | `/stock-movements/transfer`           | Yes  | Transfer antar gudang            |
| POST   | `/stock-movements/allocate-project`   | Yes  | Alokasi barang ke proyek         |
| PUT    | `/stock-movements/{id}`               | Yes  | Update mutasi stok               |
| DELETE | `/stock-movements/{id}`               | Yes  | Hapus mutasi stok                |

> **Catatan:** Edit/delete stock movement diperbolehkan untuk mengubah `quantity` (penyesuaian stok otomatis), `notes`, `occurred_at`, dan `placement` (untuk tipe inbound & transfer).

## Activity Logs

| Method | Endpoint                                       | Auth | Deskripsi                       |
| ------ | ---------------------------------------------- | ---- | ------------------------------- |
| GET    | `/activity-logs`                               | Yes  | List semua activity log         |
| GET    | `/activity-logs/recent`                        | Yes  | Activity log terbaru            |
| GET    | `/activity-logs/stats`                         | Yes  | Statistik activity log          |
| GET    | `/activity-logs/filter-options`                | Yes  | Opsi filter                     |
| GET    | `/activity-logs/{modelType}/{modelId}`         | Yes  | Log per model                   |
| GET    | `/activity-logs/export`                        | Yes  | Export activity log              |
| DELETE | `/activity-logs`                               | Yes  | Hapus log user sendiri           |

---

## Format Response

### Sukses (Resource)

```json
{
  "data": { ... }
}
```

### Sukses (Paginated)

```json
{
  "data": [...],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 72 }
}
```

### Error Validasi (422)

```json
{
  "field_name": ["Error message"]
}
```

### Error Auth (401)

```json
{
  "message": "Unauthenticated"
}
```

### Rate Limited (429)

```json
{
  "success": false,
  "message": "Terlalu banyak permintaan. Silakan coba lagi dalam X detik."
}
```
