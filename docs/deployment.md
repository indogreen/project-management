# Deployment

## Overview

Aplikasi ini terdiri dari dua bagian yang perlu di-deploy terpisah:

1. **Backend (Laravel)** — Bisa di-deploy ke VPS, shared hosting, atau cloud service yang mendukung PHP 8.4.
2. **Frontend (SvelteKit)** — Bisa di-deploy ke Vercel, Netlify, Cloudflare Pages, atau VPS.

> **Catatan:** Belum ada konfigurasi Vercel atau deployment platform lain yang terdeteksi di repository. Panduan ini bersifat umum.

## Continuous Integration (GitHub Actions)

Workflow CI didefinisikan pada `.github/workflows/ci.yml` dan berjalan otomatis saat terdapat `push` atau `pull_request` ke branch **`main`** dan **`development`** (serta mendukung pemicu manual `workflow_dispatch`):

1. **Backend Job (`backend`)**:
   - Runner: `ubuntu-latest`, PHP 8.4 (shivammathur/setup-php@v2).
   - Ekstensi: `mbstring`, `xml`, `ctype`, `iconv`, `intl`, `pdo`, `sqlite`, `pdo_sqlite`, `bcmath`, `curl`, `zip`.
   - Dependency Caching: Cache direktori composer files.
   - Setup Environment: Salin `.env.example`, generate app key, dan clear config cache.
   - Test Execution: Menjalankan `php artisan test` menggunakan database SQLite in-memory (`:memory:`).

2. **Frontend Job (`frontend`)**:
   - Runner: `ubuntu-latest`, Node.js 22 (actions/setup-node@v4 dengan cache npm).
   - Dependency Installation: `npm ci`.
   - Code Style & Linter: `npm run lint` (Prettier code style + ESLint 9).
   - Type Safety Diagnostics: `npm run check` (`svelte-check` dengan tsconfig).
   - Browser Component Dependencies: `npx playwright install --with-deps chromium`.
   - Unit & Component Tests: `npm run test` (Vitest test runner).
   - Production Build: `npm run build` (Vite 7 build verification).

## Prasyarat Production

### Backend

- PHP 8.4+
- MySQL 8.0+
- Composer
- Web server (Nginx/Apache) dengan PHP-FPM
- SSL/HTTPS wajib untuk production
- Storage yang writable untuk file upload

### Frontend

- Node.js 18+ (untuk build)
- Adapter SvelteKit yang sesuai target deployment

## Build Command

### Backend

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
php artisan migrate --force
```

### Frontend

```bash
cd frontend
npm ci
npm run build
```

## Environment Production

### Backend `.env`

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

# Generate fresh untuk production
APP_KEY=base64:xxxx
JWT_SECRET=xxxx

# Matikan log verbose
LOG_LEVEL=warning
```

### Frontend `.env`

```env
PUBLIC_API_BASE_URL=https://api.your-domain.com/api
PUBLIC_STORAGE_BASE_URL=https://api.your-domain.com/storage
```

## CORS Configuration

Saat ini `config/cors.php` menggunakan `allowed_origins => ['*']`. Untuk production, **sangat disarankan** membatasi ke domain frontend saja:

```php
'allowed_origins' => ['https://your-frontend-domain.com'],
```

## Pre-deployment Checklist

### Backend

- [ ] `APP_ENV=production` dan `APP_DEBUG=false`
- [ ] `APP_KEY` dan `JWT_SECRET` sudah di-generate (fresh, bukan dari `.env.example`)
- [ ] Database production sudah dibuat dan migration sudah dijalankan
- [ ] `php artisan storage:link` sudah dijalankan
- [ ] CORS sudah dibatasi ke domain frontend
- [ ] File `.env` tidak ter-commit ke repository
- [ ] Build berhasil tanpa error
- [ ] Rate limiting sudah dikonfigurasi dengan tepat
- [ ] Log level di-set ke `warning` atau `error`

### Frontend

- [ ] `PUBLIC_API_BASE_URL` mengarah ke backend production
- [ ] `PUBLIC_STORAGE_BASE_URL` mengarah ke storage production
- [ ] `PUBLIC_PWA_ENABLED=true` aktif di `.env` frontend
- [ ] Build berhasil (`npm run build`)
- [ ] Svelte check berhasil (`npm run check`)
- [ ] Lint berhasil (`npm run lint`)
- [ ] SvelteKit adapter sudah dikonfigurasi sesuai target (auto/node/static/vercel)
- [ ] Header keamanan server aktif via `hooks.server.ts` (`nosniff`, `strict-origin`, no-cache SW/manifest)

### Umum

- [ ] HTTPS aktif untuk semua domain
- [ ] DNS sudah dikonfigurasi
- [ ] Backup database production tersedia
- [ ] Monitoring dan error tracking sudah disiapkan

## Post-deployment Checklist

- [ ] Aplikasi bisa diakses melalui browser
- [ ] Login/register berfungsi
- [ ] File upload berfungsi
- [ ] API response tidak menampilkan debug info
- [ ] CORS tidak memblokir request frontend
- [ ] SSL certificate valid
- [ ] Service Worker terdaftar (DevTools Application > Service Workers: status activated and running)
- [ ] Web App Manifest valid di panel DevTools Application
- [ ] Cache Storage hanya berisi chunk ber-hash dan aset statis, bebas dari dokumen HTML atau respons API
- [ ] Header respons `/service-worker.js` dan `/manifest.webmanifest` berstatus `no-cache, no-store, must-revalidate`

---

## Dev via Cloudflare Tunnel

Lingkungan development ini digunakan untuk pengujian Progressive Web App (PWA) di perangkat mobile (Android/iOS) melalui jaringan seluler nyata. Service Worker dan Web App Install Banner **wajib menggunakan protokol HTTPS valid**.

### 1. Arsitektur Domain & Port

| Komponen     | Domain Publik (Cloudflare)     | Target Layanan Internal | Protokol & Keterangan          |
| ------------ | ------------------------------ | ----------------------- | ------------------------------ |
| **Frontend** | `https://app-pm-idg.zed.ai.id` | `http://localhost:8005` | Vite dev / SvelteKit (SSR/SPA) |
| **Backend**  | `https://api-pm-idg.zed.ai.id` | `http://localhost:8004` | PHP Artisan Serve (Laravel)    |

> ⚠️ **PENTING — Syarat Mesin:**
> Agent `cloudflared` **WAJIB berjalan di mesin / VM yang sama** dengan kedua layanan aplikasi (Frontend & Backend). Jika `cloudflared` berjalan di server berbeda, target `http://localhost:8004` dan `http://localhost:8005` akan salah mengarah.

### 2. Konfigurasi Ingress `cloudflared`

Terdapat dua metode pengelolaan Cloudflare Tunnel:

#### Cara A: Locally-Managed (`config.yml`)

Simpan file konfigurasi di luar repositori Git, misalnya di `/etc/cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json

ingress:
  # 1. Backend Laravel API & Storage
  - hostname: api-pm-idg.zed.ai.id
    service: http://localhost:8004
    originRequest:
      connectTimeout: 30s
      noTLSVerify: true

  # 2. Frontend SvelteKit / Vite Dev Server
  - hostname: app-pm-idg.zed.ai.id
    service: http://localhost:8005
    originRequest:
      connectTimeout: 30s
      noTLSVerify: true

  # 3. Catch-all fallback
  - service: http_status:404
```

#### Cara B: Remote-Managed (Cloudflare Zero Trust Dashboard)

Pada dashboard Cloudflare Zero Trust:

1. Buka **Networks** > **Tunnels** > Pilih Tunnel Anda.
2. Tab **Public Hostname**, tambahkan dua entri:
   - Hostname: `api-pm-idg.zed.ai.id` ➔ Service: `HTTP` `localhost:8004`
   - Hostname: `app-pm-idg.zed.ai.id` ➔ Service: `HTTP` `localhost:8005`
3. Jalankan `cloudflared` menggunakan token:
   ```bash
   cloudflared tunnel run --token <TUNNEL_TOKEN>
   ```

### 3. Checklist Manual Dashboard Cloudflare

Lakukan langkah konfigurasi berikut pada dashboard Cloudflare:

1. **Cache Rules (Bypass Cache untuk Dev):**
   - Buka **Caching** > **Cache Rules** > **Create Rule**.
   - Rule 1 (Frontend): `(http.host eq "app-pm-idg.zed.ai.id")` ➔ **Bypass Cache**.
   - Rule 2 (Backend API & Storage): `(http.host eq "api-pm-idg.zed.ai.id" and (starts_with(http.request.uri.path, "/api/") or starts_with(http.request.uri.path, "/storage/")))` ➔ **Bypass Cache**.
2. **Speed & Optimization:**
   - **Matikan Rocket Loader** (Speed > Optimization > Content Optimization) untuk mencegah interferensi eksekusi script Svelte 5 hydration.
   - **Aktifkan Always Use HTTPS** (SSL/TLS > Edge Certificates).
   - **HSTS (HTTP Strict Transport Security):** Ditunda sampai Fase 10 (Production Readiness).
3. **Cloudflare Access (Zero Trust Email OTP):**
   - Direkomendasikan melindungi `https://app-pm-idg.zed.ai.id` dengan Cloudflare Access Policy (Email OTP).
   - **WAJIB Bypass Policy** untuk file manifest dan worker agar browser mobile dapat mengunduh aset PWA tanpa terhalang login Access:
     - Path: `/manifest.webmanifest`
     - Path: `/icons/*`
     - Path: `/service-worker.js`
4. **Batas Upload Request:**
   - Paket Cloudflare Free memiliki batas upload **100 MB per HTTP request**.
   - Konfigurasi aplikasi mengizinkan upload hingga 10 file x 10 MB per request (maksimal 100 MB). Operator harus memastikan total payload tidak melampaui batas 100 MB Cloudflare.
5. **CORS Recommendation:**
   - Konfigurasi backend `config/cors.php` saat ini masih menggunakan `allowed_origins => ['*']`.
   - Direkomendasikan membatasi origin ke `https://app-pm-idg.zed.ai.id` saat pengujian domain publik berlangsung.

### 4. Checklist Verifikasi (Pengujian Mobile dengan Data Seluler)

Lakukan verifikasi menggunakan smartphone dengan koneksi **DATA SELULER (bukan WiFi kantor/LAN)**:

- [ ] Buka `https://app-pm-idg.zed.ai.id` di Chrome (Android) dan Safari (iOS): halaman terbuka tanpa pesan `Invalid Host header` atau `Host not allowed`.
- [ ] Buka DevTools / Console: Hot Module Replacement (HMR) terhubung via `wss://app-pm-idg.zed.ai.id` tanpa reconnecting loop.
- [ ] Login ke aplikasi: berhasil masuk, sesi bertahan setelah refresh halaman.
- [ ] Buka modul Project dan Activity: buat aktivitas baru dan unggah lampiran file 10 MB.
- [ ] Buka dan unduh kembali lampiran dari `https://api-pm-idg.zed.ai.id/storage/...`.
- [ ] Periksa Console browser: tidak ada error _Mixed Content_ (seluruh resource dimuat melalui HTTPS).
- [ ] Uji respons header: `curl -I https://app-pm-idg.zed.ai.id` menunjukkan header `cf-cache-status: BYPASS` atau `DYNAMIC`.
- [ ] Uji Reboot VM: setelah server restart, seluruh service (`indogreen-backend`, `indogreen-frontend`, `cloudflared`) hidup kembali secara otomatis sesuai panduan [setup-auto-start.md](setup-auto-start.md).

---

## Production Deployment via Tailscale Subnet Router + Caddy (indogreen.id)

Lingkungan production ini berjalan pada server lokal (`192.168.1.34`) di balik CGNAT ISP, diakses oleh klien melalui **Tailscale Subnet Router** (`192.168.1.0/24`) dengan custom domain `indogreen.id` dan protokol **HTTPS valid** (Let's Encrypt) tanpa Nginx dan tanpa Cloudflare Tunnel.

### 1. Arsitektur Domain & Port

| Komponen | Domain Target | Port Layanan Internal | Reverse Proxy & Protokol |
| :--- | :--- | :--- | :--- |
| **Frontend** | `https://pm.indogreen.id` | `http://127.0.0.1:8005` | Caddy (HTTPS 443) ➔ `npm run preview` |
| **Backend** | `https://api-pm.indogreen.id` | `http://127.0.0.1:8004` | Caddy (HTTPS 443) ➔ `php artisan serve` |

### 2. Konfigurasi DNS di Rumahweb

Tambahkan **A Record** pada DNS Management Rumahweb:
- `pm.indogreen.id` ➔ `192.168.1.34` (TTL: 3600)
- `api-pm.indogreen.id` ➔ `192.168.1.34` (TTL: 3600)

### 3. Penerbitan Sertifikat SSL Let's Encrypt (DNS-01 ACME)

Jalankan perintah berikut di server Linux Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y certbot
sudo certbot certonly --manual --preferred-challenges dns -d pm.indogreen.id -d api-pm.indogreen.id
```
Tambahkan TXT record `_acme-challenge.pm` dan `_acme-challenge.api-pm` pada DNS Rumahweb sesuai token yang ditampilkan Certbot, tunggu 1-2 menit, lalu tekan Enter. Sertifikat akan tersimpan di `/etc/letsencrypt/live/pm.indogreen.id/`.

### 4. Konfigurasi Caddy (`/etc/caddy/Caddyfile`)

```caddyfile
pm.indogreen.id {
    tls /etc/letsencrypt/live/pm.indogreen.id/fullchain.pem /etc/letsencrypt/live/pm.indogreen.id/privkey.pem
    reverse_proxy 127.0.0.1:8005
}

api-pm.indogreen.id {
    tls /etc/letsencrypt/live/pm.indogreen.id/fullchain.pem /etc/letsencrypt/live/pm.indogreen.id/privkey.pem
    reverse_proxy 127.0.0.1:8004
}
```

Jalankan dan aktifkan Caddy:
```bash
sudo systemctl restart caddy
sudo systemctl enable caddy
```

### 5. Frontend & Backend Environment Checklist

- **`frontend/.env`**:
  - `PREVIEW_HOST=0.0.0.0`
  - `PREVIEW_PORT=8005`
  - `PREVIEW_ALLOWED_HOSTS=pm.indogreen.id,192.168.1.34,localhost`
  - `PUBLIC_API_BASE_URL=https://api-pm.indogreen.id/api`
  - `PUBLIC_STORAGE_BASE_URL=https://api-pm.indogreen.id/storage`
  - `PUBLIC_PWA_ENABLED=true`
- **`backend/.env`**:
  - `APP_URL=https://api-pm.indogreen.id`
  - `FRONTEND_URL=https://pm.indogreen.id`
  - `CORS_ALLOWED_ORIGINS=https://pm.indogreen.id,http://localhost:8005,http://192.168.1.34:8005`
