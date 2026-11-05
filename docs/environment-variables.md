# Environment Variables

## Backend (Laravel)

Lokasi file: `backend/.env` (salin dari `backend/.env.example`)

### Core Application

| Variable    | Scope  | Required | Default            | Deskripsi                             |
| ----------- | ------ | -------- | ------------------ | ------------------------------------- |
| `APP_NAME`  | Server | Yes      | `Laravel`          | Nama aplikasi                         |
| `APP_ENV`   | Server | Yes      | `local`            | Environment: `local`, `production`    |
| `APP_KEY`   | Server | Yes      | —                  | Encryption key (generate via artisan) |
| `APP_DEBUG` | Server | Yes      | `true`             | Debug mode, `false` di production     |
| `APP_URL`   | Server | Yes      | `http://localhost` | Base URL aplikasi backend             |

### Database

| Variable        | Scope  | Required | Default     | Deskripsi                               |
| --------------- | ------ | -------- | ----------- | --------------------------------------- |
| `DB_CONNECTION` | Server | Yes      | `sqlite`    | Driver database (`mysql` di production) |
| `DB_HOST`       | Server | Yes      | `127.0.0.1` | Host database                           |
| `DB_PORT`       | Server | Yes      | `3306`      | Port database                           |
| `DB_DATABASE`   | Server | Yes      | `laravel`   | Nama database                           |
| `DB_USERNAME`   | Server | Yes      | `root`      | Username database                       |
| `DB_PASSWORD`   | Server | Yes      | —           | Password database                       |

### JWT Authentication

| Variable     | Scope  | Required | Default | Deskripsi                             |
| ------------ | ------ | -------- | ------- | ------------------------------------- |
| `JWT_SECRET` | Server | Yes      | —       | Secret key JWT (generate via artisan) |
| `JWT_ALGO`   | Server | No       | `HS256` | Algoritma signing JWT                 |

### Frontend & CORS Security

| Variable               | Scope  | Required | Default                 | Deskripsi                                                        |
| ---------------------- | ------ | -------- | ----------------------- | ---------------------------------------------------------------- |
| `FRONTEND_URL`         | Server | No       | `http://localhost:5173` | Origin utama frontend yang diizinkan CORS                        |
| `CORS_ALLOWED_ORIGINS` | Server | No       | —                       | Daftar origin tambahan yang diizinkan CORS (dipisahkan tanda koma)|

### Registration Governance

| Variable                           | Scope  | Required | Default        | Deskripsi                                                        |
| ---------------------------------- | ------ | -------- | -------------- | ---------------------------------------------------------------- |
| `AUTH_REGISTRATION_ENABLED`        | Server | No       | `true`         | Sakelar pendaftaran publik (`true`/`false`)                     |
| `AUTH_REGISTRATION_ALLOWED_DOMAIN` | Server | No       | `indogreen.id` | Domain email resmi perusahaan yang diizinkan untuk registrasi    |

### AI Integration

| Variable      | Scope  | Required | Default | Deskripsi                    |
| ------------- | ------ | -------- | ------- | ---------------------------- |
| `AI_DRIVER`   | Server | No       | —       | Driver AI (contoh: `gemini`) |
| `AI_BASE_URL` | Server | No       | —       | Base URL API provider AI     |
| `AI_API_KEY`  | Server | No       | —       | API key provider AI          |
| `AI_MODEL`    | Server | No       | —       | Model AI yang digunakan      |

### Server (Development & Local)

| Variable      | Scope  | Required | Default     | Deskripsi                                           |
| ------------- | ------ | -------- | ----------- | --------------------------------------------------- |
| `SERVER_HOST` | Server | No       | `127.0.0.1` | Host untuk `artisan serve` (`0.0.0.0` untuk tunnel) |
| `SERVER_PORT` | Server | No       | `8000`      | Port untuk `artisan serve` (`8004` untuk tunnel)    |

### Konfigurasi Khusus Dev Cloudflare Tunnel (Backend)

Pada lingkungan dev via Cloudflare Tunnel (`backend/.env`):

```env
APP_URL=https://api-pm-idg.zed.ai.id
SERVER_HOST=0.0.0.0
SERVER_PORT=8004
```

### Konfigurasi Production Domain via Tailscale + Caddy (Backend)

Pada lingkungan production berbasis Tailscale Subnet Router + Caddy HTTPS (`backend/.env`):

```env
APP_URL=https://api-pm.indogreen.id
FRONTEND_URL=https://pm.indogreen.id
CORS_ALLOWED_ORIGINS=https://pm.indogreen.id,http://localhost:8005,http://192.168.1.34:8005
```

### Lainnya

| Variable           | Scope  | Required | Default    | Deskripsi             |
| ------------------ | ------ | -------- | ---------- | --------------------- |
| `SESSION_DRIVER`   | Server | No       | `database` | Driver session        |
| `QUEUE_CONNECTION` | Server | No       | `database` | Driver queue          |
| `CACHE_STORE`      | Server | No       | `database` | Driver cache          |
| `FILESYSTEM_DISK`  | Server | No       | `local`    | Default storage disk  |
| `BCRYPT_ROUNDS`    | Server | No       | `12`       | Bcrypt hashing rounds |

---

## Frontend (SvelteKit)

Lokasi file: `frontend/.env` (salin dari `frontend/.env.example`)

### Public (terekspos ke browser)

| Variable                  | Scope  | Required | Default                         | Deskripsi                                                                                                                         |
| ------------------------- | ------ | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_API_BASE_URL`     | Public | Yes      | `http://127.0.0.1:8000/api`     | Base URL API backend                                                                                                              |
| `PUBLIC_STORAGE_BASE_URL` | Public | Yes      | `http://127.0.0.1:8000/storage` | Base URL file storage backend                                                                                                     |
| `PUBLIC_PWA_ENABLED`      | Public | No       | `true`                          | Sakelar darurat (kill-switch) Service Worker. Jika di-set `false`, worker langsung dibatalkan dan seluruh cache lokal dibersihkan |

### Development Server & HMR

| Variable            | Scope  | Required | Default     | Deskripsi                                               |
| ------------------- | ------ | -------- | ----------- | ------------------------------------------------------- |
| `DEV_HOST`          | Server | No       | `localhost` | Host untuk dev server (`0.0.0.0` untuk tunnel)          |
| `DEV_PORT`          | Server | No       | `5174`      | Port untuk dev server (`8005` untuk tunnel)             |
| `DEV_ALLOWED_HOSTS`     | Server | No       | —           | Daftar hostname yang diizinkan Vite Dev Server (dipisah koma)      |
| `PREVIEW_HOST`          | Server | No       | `localhost` | Host untuk preview server                                         |
| `PREVIEW_PORT`          | Server | No       | `4174`      | Port untuk preview server                                         |
| `PREVIEW_ALLOWED_HOSTS` | Server | No       | —           | Daftar hostname yang diizinkan Vite Preview di production (dipisah koma) |
| `HMR_HOST`          | Server | No       | `localhost` | Host untuk WebSocket Hot Module Replacement             |
| `HMR_PORT`          | Server | No       | `24679`     | Port internal HMR jika menggunakan port terpisah        |
| `HMR_PROTOCOL`      | Server | No       | `wss`       | Protokol HMR (`ws` untuk HTTP lokal, `wss` untuk HTTPS) |
| `HMR_CLIENT_PORT`   | Server | No       | —           | Client port HMR (misal `443` jika lewat tunnel HTTPS)   |

### Internal Server-Side API

| Variable                | Scope  | Required | Default                     | Deskripsi                                   |
| ----------------------- | ------ | -------- | --------------------------- | ------------------------------------------- |
| `INTERNAL_API_BASE_URL` | Server | No       | `http://localhost:8004/api` | Alamat internal server SvelteKit ke Laravel |

### Konfigurasi Khusus Dev Cloudflare Tunnel (Frontend)

Pada lingkungan dev via Cloudflare Tunnel (`frontend/.env`):

```env
DEV_HOST=0.0.0.0
DEV_PORT=8005
DEV_ALLOWED_HOSTS=app-pm-idg.zed.ai.id

HMR_HOST=app-pm-idg.zed.ai.id
HMR_PROTOCOL=wss
HMR_CLIENT_PORT=443
# HMR_PORT dikosongkan

PUBLIC_STORAGE_BASE_URL=https://api-pm-idg.zed.ai.id/storage
PUBLIC_API_BASE_URL=https://api-pm-idg.zed.ai.id/api
INTERNAL_API_BASE_URL=http://localhost:8004/api
```

### Konfigurasi Production Domain via Tailscale + Caddy (Frontend)

Pada lingkungan production berbasis Tailscale Subnet Router + Caddy HTTPS (`frontend/.env`):

```env
PREVIEW_HOST=0.0.0.0
PREVIEW_PORT=8005
PREVIEW_ALLOWED_HOSTS=pm.indogreen.id,192.168.1.34,localhost

PUBLIC_API_BASE_URL=https://api-pm.indogreen.id/api
PUBLIC_STORAGE_BASE_URL=https://api-pm.indogreen.id/storage
PUBLIC_PWA_ENABLED=true
INTERNAL_API_BASE_URL=http://localhost:8004/api
```

> ⚠️ **Catatan Cookie Sesi:**
> Jika mengimplementasikan cookie sesi, cookie harus bersifat **host-only** pada domain `app-pm-idg.zed.ai.id` (jangan menggunakan atribut `Domain` agar tidak bocor atau tertukar dengan subdomain lain).
>
> ⚠️ **Catatan Rebuild / Restart Frontend:**
> Nilai variable `PUBLIC_*` dikompilasi secara statis pada saat bundle dibuat. Setiap kali mengubah `PUBLIC_API_BASE_URL` atau `PUBLIC_STORAGE_BASE_URL`, restart dev server (`npm run dev`) atau rebuild aplikasi.

---

## Catatan Keamanan

> ⚠️ **PENTING:**
>
> - Jangan pernah commit file `.env` ke repository.
> - File `.env.example` TIDAK BOLEH berisi secret asli.
> - `JWT_SECRET`, `APP_KEY`, `AI_API_KEY`, dan `DB_PASSWORD` adalah **rahasia** — generate per environment.
> - Di production, set `APP_DEBUG=false` untuk mencegah kebocoran informasi.
> - Variable `PUBLIC_*` di frontend terekspos ke browser — jangan simpan secret di sini.
