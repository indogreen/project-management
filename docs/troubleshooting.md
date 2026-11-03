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

## Ekstraksi Dokumen AI gagal — "Gagal memproses dokumen via AI"

**Kemungkinan penyebab:**

- Kredensial AI (`GEMINI_API_KEY` atau provider AI) tidak valid, kuota habis, atau belum dikonfigurasi di backend.
- Dokumen yang diunggah tidak terbaca atau rusak.
- Server pihak ketiga sedang mengalami downtime atau timeout jaringan.

**Penjelasan Keamanan (PM-INJ-002):**

- Pesan kesalahan internal (seperti exception class, raw response provider, token, atau path file) sengaja tidak dikembalikan ke browser klien untuk mencegah kebocoran informasi teknis.
- Detail exception teknis dicatat secara aman di log internal Laravel (`storage/logs/laravel.log`).

**Solusi:**

1. Periksa file log backend:
   ```bash
   tail -n 50 backend/storage/logs/laravel.log
   ```
2. Pastikan konfigurasi environment variable AI API terisi dengan benar di backend `.env`.
3. Coba upload ulang dokumen berformat standar (PDF atau gambar yang jelas).

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
- Konfigurasikan trusted proxies di `backend/bootstrap/app.php` (telah aktif per Fase 8):
  ```php
  $middleware->trustProxies(at: '*');
  ```
- Bersihkan cache throttle sementara jika terkena lockout: `php artisan cache:clear`.

---

## Cloudflare Tunnel — Upload lampiran gagal 403 Forbidden (CSRF / Origin Check)

**Penyebab:** Dev server SvelteKit melakukan verifikasi Origin header pada HTTP POST multipart form submission dan mendapati origin berbeda dengan local host.

**Solusi:**

- Daftarkan trusted origins di `frontend/svelte.config.js`:
  ```javascript
  kit: {
    csrf: {
      trustedOrigins: ["https://app-pm-idg.zed.ai.id"];
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

---

## Service Worker — Terjebak ("Stuck") atau Menampilkan Versi Lama

**Penyebab:** Siklus hidup Service Worker secara sengaja tidak menggunakan `skipWaiting` otomatis agar tab aktif tidak crash di tengah pekerjaan pengguna. Service Worker baru berada pada status `waiting to activate`.

**Solusi:**

1. Tutup seluruh tab aplikasi Indogreen di browser, lalu buka kembali.
2. Di lingkungan development / testing:
   - Buka Chrome DevTools > Tab **Application** > **Service Workers**.
   - Centang opsi **Update on reload** selama proses development aktif.
   - Klik **Skip waiting** secara manual jika worker baru berstatus waiting.
3. Untuk membersihkan secara paksa: Klik tombol **Unregister** di tab Service Workers dan **Clear site data** di tab Storage.

---

## PWA — Konflik Aset saat Berpindah antara Mode BUILD dan Mode DEV

**Penyebab:** Menjalankan mode build (`preview` atau server produksi) mendaftarkan Service Worker ke origin/port lokal. Saat kembali ke mode dev (`npm run dev`), Service Worker lama berpotensi menyajikan berkas hasil build lama yang sudah basi.

**Solusi:**

- Kode `src/lib/pwa/register.ts` sudah dilengkapi pembersih otomatis: saat `!import.meta.env.PROD`, script otomatis memanggil `unregisterAndClean()` dan menghapus seluruh cache `indogreen-*`.
- Jika browser masih menyajikan aset lama sebelum script sempat dieksekusi:
  1. Buka DevTools > Tab **Application** > **Storage**.
  2. Klik **Clear site data**.
  3. Lakukan hard reload (`Cmd + Shift + R` di Mac atau `Ctrl + Shift + R` di Windows/Linux).

---

## PWA — Halaman Offline Tidak Muncul Saat Koneksi Terputus

**Penyebab:** Berkas `offline.html` gagal di-precache saat instalasi Service Worker, atau request navigasi terintersep oleh aturan bypass yang tidak tepat.

**Solusi:**

1. Buka DevTools > Tab **Application** > **Cache Storage** > Periksa apakah `indogreen-static-v...` memuat entri `/offline.html`.
2. Pastikan request navigasi berstatus mode `'navigate'`.
3. Cek log console: pastikan tidak ada network error saat fase `install` Service Worker berlangsung.

---

## PWA — Emergency Kill-Switch (Mematikan SW dari Sisi Server)

**Kebutuhan:** Terjadi bug kritis pada Service Worker di lingkungan produksi dan seluruh pengguna harus segera dibersihkan dari worker.

**Langkah:**

1. Pada file `.env` server host, ubah:
   ```env
   PUBLIC_PWA_ENABLED=false
   ```
2. Restart service frontend (`npm run build` & restart process).
3. Setiap pengguna yang membuka halaman web akan secara otomatis mengeksekusi `unregisterAndClean()`: Service Worker di-unregister dan seluruh cache lokal dihapus seketika.

---

## PWA — Error "Failed to fetch dynamically imported module" Setelah Deploy Baru

**Penyebab:** Pengguna membuka tab aplikasi sebelum deployment baru dilakukan. Ketika user berpindah halaman via navigasi client-side (SPA routing), browser mencari chunk hash JavaScript lama yang sudah digantikan oleh hash versi baru di server.

**Solusi:**

- Sistem sudah dilengkapi deteksi otomatis di `src/lib/components/pwa/UpdatePrompt.svelte` dan `src/routes/+layout.svelte`.
- SvelteKit Version Polling (`kit.version.pollInterval`) dan Service Worker `updatefound` akan memunculkan banner _"Versi baru tersedia"_.
- Jika pengguna mengeklik tautan navigasi di tab lama tanpa menekan banner, hook `beforeNavigate` otomatis mendeteksi perubahan versi dan mengeksekusi navigasi penuh (`location.href = to.url.href`), memuat HTML shell baru dan hash chunk terkini tanpa memunculkan error chunk.

---

## PWA — Mencegah Kehilangan Data Formulir Saat Pembaruan Muncul

**Kebutuhan:** Pengguna sedang mengisi form panjang atau membuka drawer saat banner pembaruan versi baru terdeteksi.

**Mekanisme Pengamanan:**

- Komponen `UpdatePrompt.svelte` dan hook navigasi memeriksa indikator `document.body.dataset.scrollLocked === 'true'` (yang dipasang oleh `scroll-lock.ts` saat Modal atau Drawer terbuka).
- Jika formulir/drawer terbuka, auto-reload dibatalkan sepenuhnya.
- Jika pengguna menekan tombol _"Perbarui sekarang"_, aplikasi menampilkan dialog konfirmasi SweetAlert2: _"Terdapat dialog atau formulir yang belum selesai... Tetap perbarui sekarang?"_.
- Pengguna dapat memilih _"Tunda"_ untuk menyelesaikan input data terlebih dahulu.

---

## Pesan Error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."

**Penyebab:**

- Perangkat klien terputus dari jaringan internet atau sinyal seluler hilang.
- Request mengalami timeout (`ECONNABORTED`) atau gagal terkirim (`ERR_NETWORK`).
- Layanan DNS gagal menyelesaikan nama host aplikasi.

**Solusi:**

1. Periksa indikator banner oranye _"Anda offline. Perubahan tidak dapat disimpan"_ di bagian atas layar.
2. Periksa koneksi WiFi atau data seluler perangkat Anda.
3. Setelah koneksi kembali normal, banner offline akan hilang otomatis dan formulir dapat dikirim ulang.

---

## Pesan Error: "Server sedang tidak dapat dihubungi. Coba lagi beberapa saat."

**Penyebab:**

- Backend Laravel atau service PHP-FPM sedang mati, crash, atau restart.
- Cloudflare Tunnel (`cloudflared`) terputus dari edge Cloudflare atau tidak dapat menghubungi port lokal 8004.
- Upstream server mengembalikan HTTP 502 (Bad Gateway), 503 (Service Unavailable), atau 504 (Gateway Timeout).

**Solusi:**

1. Periksa status service backend:
   ```bash
   cd backend
   php artisan serve --port=8004
   ```
2. Periksa log proses `cloudflared`:
   ```bash
   cloudflared tunnel run <TUNNEL_NAME>
   ```
3. Pastikan database MySQL aktif dan dapat diakses oleh Laravel.

---

## PWA Standalone — Tombol "Kembali" di Halaman Detail

**Karakteristik Desain:**

- Tombol panah "Kembali" di sebelah judul TopNav **hanya muncul saat aplikasi berjalan dalam mode standalone** (`isStandalone() === true`) pada rute detail (`/projects/[id]`, `/activities/[id]`, `/mitras/[id]`, `/certificates/[id]`, `/barang-certificates/[id]`).
- Pada peramban web standar (tab Chrome/Safari biasa), tombol ini sengaja disembunyikan karena peramban sudah memiliki tombol navigasi bawaan browser (_browser back button_).
- Jika pengguna membuka rute detail secara langsung (deep-link standalone tanpa riwayat), tombol secara pintar melakukan fallback navigasi ke daftar rute induk (contoh: kembali ke `/projects`).

---

## PWA Standalone — Pengunduhan Lampiran Dokumen pada iOS dan Android

**Karakteristik & Solusi:**

- Seluruh tautan unduhan lampiran menggunakan elemen `<a href={file.url} target="_blank" rel="noopener" download>`.
- Rute `/storage/*` dan permintaan ke host backend di-bypass sepenuhnya oleh Service Worker.
- **Di Android Chrome (Standalone):** Pengunduhan berjalan native melalui Android Download Manager. Berkas tersimpan di folder _Download_.
- **Di Apple iOS Safari (Standalone / Home Screen):** WebKit membuka penampil file terisolasi (PDF/gambar). Pengguna dapat menekan tombol aksi bawaan iOS (ikon Share) untuk memilih _"Save to Files"_ (_Simpan ke File_).
