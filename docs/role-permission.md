# Role & Permission

## Overview

Aplikasi menggunakan **Spatie Laravel Permission** untuk mengimplementasikan RBAC (Role-Based Access Control) dengan guard `api` (JWT).

## Daftar Role

| Role          | Level    | Deskripsi                                             |
| ------------- | -------- | ----------------------------------------------------- |
| `super_admin` | Tertinggi| Akses penuh ke semua fitur termasuk delete             |
| `admin`       | Tinggi   | Akses penuh kecuali aksi delete                        |
| `staff`       | Menengah | Permission fleksibel, diatur per user oleh admin       |
| `user`        | Rendah   | Permission fleksibel, diatur per user oleh admin       |

## Daftar Permission

Permission mengikuti format `{module}-{action}`.

| Modul            | View | Create | Update | Delete |
| ---------------- | ---- | ------ | ------ | ------ |
| `project`        | ✅   | ✅     | ✅     | ✅     |
| `activity`       | ✅   | ✅     | ✅     | ✅     |
| `mitra`          | ✅   | ✅     | ✅     | ✅     |
| `bc`             | ✅   | ✅     | ✅     | ✅     |
| `certificate`    | ✅   | ✅     | ✅     | ✅     |
| `finance`        | ✅   | —      | ✅     | —      |
| `category`       | ✅   | ✅     | ✅     | ✅     |
| `warehouse`      | ✅   | ✅     | ✅     | ✅     |
| `item`           | ✅   | ✅     | ✅     | ✅     |
| `stock-movement` | ✅   | ✅     | ✅     | ✅     |

**Total permission:** 38

## Mapping Role → Permission

| Role          | Permission                                   |
| ------------- | -------------------------------------------- |
| `super_admin` | Semua 38 permission                          |
| `admin`       | Semua kecuali yang berakhiran `-delete`       |
| `staff`       | Kosong dari role (diatur per user oleh admin) |
| `user`        | Kosong dari role (diatur per user oleh admin) |

## Hierarki & Proteksi

### Aturan modifikasi role

1. **Super Admin** dapat memodifikasi role & permission semua user kecuali dirinya sendiri (hanya memilih dari role kanonikal: `super_admin`, `admin`, `staff`, `user`).
2. **Admin** dapat memodifikasi role & permission user `staff` dan `user` saja.
3. **Admin TIDAK boleh:**
   - Mengubah user yang memiliki role `admin` atau `super_admin`
   - Memberikan role `admin` atau `super_admin` ke user lain
4. **Semua user** tidak boleh mengubah role dirinya sendiri.
5. **Proteksi Injeksi Role & Permission (PM-AC-001):**
   - Role wajib divalidasi terhadap *allowlist* kanonikal sistem via `Rule::in()`. Admin hanya diizinkan memilih `staff` atau `user`.
   - Nama role arbitrer atau tak terdaftar langsung ditolak dengan HTTP 422.
   - Permission wajib berupa bagian dari 38 permission kanonikal sistem; setiap permission tak dikenal akan ditolak dengan HTTP 422.
   - Endpoint menggunakan lookup role/permission yang sudah terdaftar (`first()` dan `whereIn()`), bukan `firstOrCreate()`, sehingga menjamin integritas tabel `roles` dan `permissions` dari manipulasi input.

### Endpoint manajemen role

| Endpoint                  | Method | Akses                 | Deskripsi                       |
| ------------------------- | ------ | --------------------- | ------------------------------- |
| `/api/auth/role/users`    | GET    | `super_admin`, `admin`| Daftar user yang bisa dikelola  |
| `/api/auth/role`          | PUT    | `super_admin`, `admin`| Update role & permission user   |
| `/api/auth/role/config`   | GET    | `super_admin`, `admin`| Config modul, role, dan aksi    |

### Payload update role

```json
{
  "user_id": 2,
  "role": "staff",
  "permissions": {
    "project-view": true,
    "project-create": true,
    "activity-view": true,
    "mitra-view": true
  }
}
```

## Implementasi di Frontend

### Store

```typescript
// src/lib/stores/permissions.ts
export const userPermissions = writable<string[]>([]);
export const userRoles = writable<string[]>([]);
```

### Pengisian data

Data role dan permission diambil dari response `GET /api/auth/me` yang mengembalikan:

```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@example.com",
  "roles": ["super_admin"],
  "permissions": ["project-view", "project-create", ...]
}
```

### Pengecekan permission di UI

Frontend menggunakan data dari store `userPermissions` untuk menampilkan/menyembunyikan tombol dan menu berdasarkan permission yang dimiliki user.

## Activity Logging

Setiap perubahan role & permission dicatat di activity log dengan format:

- **Action:** `role_assignment`
- **Previous snapshot:** Role & permission sebelum perubahan
- **Current snapshot:** Role & permission setelah perubahan
- **Description:** `"Role & permission user diperbarui oleh {actor_name}"`
