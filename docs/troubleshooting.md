# Troubleshooting

## Login gagal — "Terlalu banyak permintaan"

**Penyebab:** Rate limiting Sliding Window Throttle aktif (5 request/60 detik untuk auth).

**Solusi:**
- Tunggu 60 detik sebelum mencoba kembali.
- Cek header `Retry-After` di response 429 untuk mengetahui sisa waktu tunggu.
- Jika terjadi di development, bersihkan cache: `php artisan cache:clear`.

---

## Login gagal — 401 Unauthorized

**Kemungkinan penyebab:**
- Email atau password salah.
- JWT_SECRET belum di-generate.

**Solusi:**
- Pastikan credential benar.
- Jalankan `php artisan jwt:secret` jika belum.
- Restart server setelah mengubah `.env`.

---

## Token refresh gagal — redirect ke login terus menerus

**Kemungkinan penyebab:**
- JWT_SECRET berubah (token lama invalid).
- Token TTL sudah terlalu lama expired.

**Solusi:**
- Hapus `jwt_token` dari localStorage browser (DevTools → Application → Local Storage).
- Login ulang.
- Pastikan `JWT_SECRET` konsisten antara generate dan runtime.

---

## CORS error — "Access-Control-Allow-Origin"

**Kemungkinan penyebab:**
- Frontend mengakses backend dari origin yang berbeda.
- CORS config belum dikonfigurasi.

**Solusi:**
- Cek `backend/config/cors.php` — pastikan `allowed_origins` mencakup URL frontend.
- Untuk development, `['*']` sudah diatur.
- Restart backend server setelah mengubah config.

---

## Build error frontend — "Cannot find module"

**Kemungkinan penyebab:**
- Dependency belum diinstall.
- Versi Node.js terlalu lama.

**Solusi:**
```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

---

## Build error frontend — Svelte check error

**Solusi:**
```bash
cd frontend
npm run check
```

Perhatikan error TypeScript yang ditampilkan dan perbaiki sesuai instruksi.

---

## Data tidak muncul — API mengembalikan data kosong

**Kemungkinan penyebab:**
- Database kosong (belum di-seed).
- Filter query terlalu ketat.
- Token user tidak valid.

**Solusi:**
- Jalankan `php artisan db:seed` untuk data contoh.
- Coba request tanpa filter terlebih dahulu.
- Cek console browser untuk error 401/403.

---

## File upload gagal — 404 atau file tidak muncul

**Kemungkinan penyebab:**
- Symlink storage belum dibuat.
- Disk permission tidak memadai.
- `FILESYSTEM_DISK` tidak dikonfigurasi.

**Solusi:**
```bash
cd backend
php artisan storage:link
```

Pastikan folder `storage/app/public` writable.

---

## Migration gagal — foreign key error

**Kemungkinan penyebab:**
- Urutan migration tidak benar (tabel referensi belum ada).
- Data existing melanggar constraint.

**Solusi:**
- Untuk fresh install: `php artisan migrate:fresh --seed`
- Untuk production: periksa data yang melanggar constraint sebelum menjalankan migration baru.

---

## Tidak bisa akses dari HP / perangkat lain di jaringan lokal

**Kemungkinan penyebab:**
- Backend hanya listen di `127.0.0.1` (localhost).
- Frontend hanya listen di `localhost`.
- `PUBLIC_API_BASE_URL` masih mengarah ke `localhost`.

**Solusi:**
1. Edit `backend/.env`:
   ```
   SERVER_HOST=0.0.0.0
   # atau IP spesifik: SERVER_HOST=192.168.1.x
   ```
2. Edit `frontend/.env`:
   ```
   DEV_HOST=0.0.0.0
   HMR_HOST=192.168.1.x
   PUBLIC_API_BASE_URL=http://192.168.1.x:8000/api
   PUBLIC_STORAGE_BASE_URL=http://192.168.1.x:8000/storage
   ```
3. Restart kedua server.
4. Akses dari HP menggunakan `http://192.168.1.x:5174`.

---

## Error "Warehouse cannot be deleted"

**Penyebab:** Gudang masih memiliki inventori atau riwayat mutasi stok.

**Solusi:**
- Pindahkan/keluarkan semua stok dari gudang terlebih dahulu.
- Gudang dengan riwayat mutasi tidak bisa dihapus untuk menjaga integritas data.

---

## Error "Stock movements are immutable"

**Penyebab:** Attempt untuk mengubah atau menghapus record `stock_movements`.

**Solusi:**
- Record mutasi stok memang sengaja dibuat immutable (tidak bisa diubah/dihapus).
- Untuk koreksi stok, buat mutasi baru (inbound/outbound) sebagai penyesuaian.

---

## Permission denied — 403 Forbidden

**Kemungkinan penyebab:**
- User tidak memiliki permission yang diperlukan.
- Role user belum dikonfigurasi.

**Solusi:**
- Minta admin/super_admin untuk menambahkan permission yang diperlukan melalui Settings → Manajemen User.
- Cek endpoint `GET /api/auth/me` untuk melihat permission aktual user.

---

## Cloudflare Tunnel — Vite Dev Server "Host Not Allowed" / 403 Invalid Host header

**Penyebab:** Vite v6/v7 membatasi hostname yang boleh mengakses dev server untuk mencegah DNS rebinding attacks. Host `app-pm-idg.zed.ai.id` belum terdaftar di `allowedHosts`.

**Solusi:**
1. Tambahkan hostname di `frontend/.env`:
   ```env
   DEV_ALLOWED_HOSTS=app-pm-idg.zed.ai.id
   ```
2. Restart Vite dev server (`npm run dev`).

---

## Cloudflare Tunnel — HMR WebSocket error / Reconnecting loop

**Penyebab:** Client Vite mencoba membuka koneksi WebSocket ke port internal atau protokol tidak aman (`ws://`), bukan `wss://` melalui port 443 Cloudflare Edge.

**Solusi:**
1. Pastikan konfigurasi HMR di `frontend/.env`:
   ```env
   HMR_HOST=app-pm-idg.zed.ai.id
   HMR_PROTOCOL=wss
   HMR_CLIENT_PORT=443
   # Pastikan HMR_PORT kosong / tidak diisi
   ```
2. Restart dev server dan muat ulang browser mobile.

---

## Cloudflare Tunnel — Login gagal 429 Too Many Requests (Lockout Massal)

**Penyebab:** Semua request dari tunnel atau proxy lokal masuk ke backend Laravel dari IP `127.0.0.1`. Middleware `SlidingWindowThrottle` menganggap seluruh pengunjung adalah user yang sama, sehingga limit 5 request/60s habis seketika.

**Solusi:**
- Pastikan reverse proxy meneruskan header `CF-Connecting-IP` atau `X-Forwarded-For`.
- Konfigurasikan trusted proxies di `backend/bootstrap/app.php`:
  ```php
  $middleware->trustProxies(at: '*'); // atau IP internal proxy
  ```
- Bersihkan cache throttle sementara: `php artisan cache:clear`.

---

## Cloudflare Tunnel — Upload lampiran gagal 403 Forbidden (CSRF / Origin Check)

**Penyebab:** Dev server SvelteKit melakukan verifikasi Origin header pada HTTP POST multipart form submission dan mendapati origin berbeda dengan local host.

**Solusi:**
- Daftarkan trusted origins di `frontend/svelte.config.js`:
  ```javascript
  kit: {
    csrf: {
      trustedOrigins: ['https://app-pm-idg.zed.ai.id']
    }
  }
  ```

---

## Cloudflare Tunnel — PWA tidak bisa diinstall / Manifest 302 Redirect

**Penyebab:** Cloudflare Access (Zero Trust) memblokir request browser terhadap `/manifest.webmanifest` atau `/icons/*` dan mengembalikan redirect (302) ke halaman login Cloudflare Access.

**Solusi:**
- Buka Cloudflare Zero Trust Dashboard > **Access** > **Applications** > Pilih aplikasi `app-pm-idg`.
- Tambahkan **Bypass Policy**:
  - Selector: Path
  - Values: `/manifest.webmanifest`, `/icons/*`, `/service-worker.js`

---

## Akses LAN (http://192.168.1.x) Tidak Bisa Login

**Penyebab:** Ketika cookie dikonfigurasi dengan flag `Secure`, browser menolak menyimpan cookie melalui HTTP biasa (non-localhost IP).

**Solusi:**
- Gunakan koneksi HTTPS via Cloudflare Tunnel (`https://app-pm-idg.zed.ai.id`) untuk seluruh pengujian mobile.
- Akses via IP lokal tidak lagi mendukung session login berbasis cookie Secure.
