# Fitur: Progressive Web App (PWA)

> **Status Fitur:** Selesai Penuh (Fase 5 Selesai: Mekanisme Pembaruan Versi, UpdatePrompt UI, dan Deteksi Deploy Baru)

---

## 1. Ringkasan Fitur

Aplikasi **Indogreen Project Management** dikonfigurasi sebagai Progressive Web App (PWA) agar pengguna di perangkat seluler (Android & iOS) dan desktop dapat menginstal aplikasi langsung ke home screen dengan tampilan mandiri (*standalone app*) tanpa address bar browser.

Service Worker pada aplikasi dirancang dengan prinsip **minimal-invasif** dan **zero-side-effect**:
- **TIDAK MENGUBAH** perilaku jaringan yang sudah ada.
- **TIDAK MENCACHE** endpoint API (`/api/*`), file storage (`/storage/*`), data SSR (`/__data.json`), request non-GET, request lintas origin, atau request ber-Authorization.
- Menyediakan fallback navigasi halaman offline yang ramah pengguna (`offline.html`) saat koneksi terputus.

---

## 2. Service Worker (`src/service-worker.ts`) & Routing Classifier

### A. Strategi Cache & Klasifikasi Request (`src/lib/pwa/sw-routing.ts`)
Setiap request jaringan masuk dievaluasi melalui fungsi murni `classifyRequest` dengan urutan ketat:

1. **`bypass` (Diteruskan langsung ke jaringan tanpa intersep):**
   - Method bukan `GET` (POST, PUT, DELETE, PATCH, OPTIONS).
   - Origin berbeda dari origin Service Worker (lintas origin).
   - Path diawali `/api` (termasuk `/api/proxy/...`) atau `/storage` (file lampiran).
   - Path berakhiran `/__data.json` (data load SSR dinamis).
   - Header `x-sveltekit-action` ada (form action SvelteKit).
   - Header `Accept` meminta `application/json`.
   - Header `Authorization` ada (JWT Bearer token).
2. **`navigation` (Navigasi halaman utama):**
   - Mode request adalah `'navigate'`.
   - **Strategi: Network-Only dengan Offline Fallback.** Browser selalu meminta dokumen HTML terbaru dari jaringan. Jika jaringan mati, Service Worker mengembalikan `/offline.html`. HTML aplikasi **tidak pernah disimpan di cache** untuk mencegah stale session atau kebocoran state.
3. **`immutable-asset` (Aset build ber-hash Vite):**
   - Path diawali `/_app/immutable/`.
   - **Strategi: Cache-First** ke `indogreen-assets-${version}`.
   - Hanya menyimpan respons jaringan berstatus **HTTP 200** dan bertipe **`basic`** (bukan opaque, bukan error, bukan redirect).
   - **Batas Kapasitas:** Maksimal 150 entri (`MAX_IMMUTABLE_ASSETS = 150`). Pemangkasan entri tertua dilakukan secara otomatis via fungsi murni `pruneCache` (FIFO) di latar belakang (`event.waitUntil`).
4. **`static-asset` (Aset statis terverifikasi origin sendiri):**
   - Berkas `/offline.html`, `/manifest.webmanifest`, `/indogreen.png`, `/favicon.png`, `/favicon.ico`, dan `/icons/*`.
   - **Strategi: Stale-While-Revalidate (SWR)** ke `indogreen-static-${version}`.
   - Jika aset sudah ada di cache, Service Worker langsung menyajikan dari cache seketika (0ms latency), sembari melakukan fetch di background untuk memperbarui cache bila ada perubahan di server.
   - Jika aset belum ada di cache (mis. logo `/indogreen.png` pada kunjungan pertama), aset diunduh dari jaringan, disimpan ke cache, dan dibatasi maksimal 50 entri (`MAX_STATIC_ASSETS = 50`).

### B. Pemangkasan Cache (Cache Pruning Logic)
Untuk mencegah akumulasi penyimpanan browser tanpa kendali, modul `src/lib/pwa/sw-routing.ts` mengekspor dua fungsi murni:
- `getExcessKeys(keys, maxItems)`: Menghitung daftar key yang harus dipangkas berdasarkan selisih kapasitas dengan urutan FIFO (First-In, First-Out: item tertua yang pertama kali masuk akan dihapus terlebih dahulu).
- `pruneCache(cache, maxItems)`: Mengeksekusi pemangkasan key berlebih secara asinkron dengan penanganan error terisolasi per-item agar tidak memutus rantai proses cache lainnya.

### C. Siklus Hidup (Lifecycle) Service Worker
- **Nama Cache:** `indogreen-static-${version}` dan `indogreen-assets-${version}` (menggunakan `$service-worker` `version`).
- **Install:** Melakukan precache **HANYA** pada daftar eksplisit:
  `['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon-180.png']`.
  Gagal mengunduh salah satu aset akan membatalkan instalasi worker (tanpa menelan error).
  Instalasi **tidak memanggil skipWaiting otomatis** untuk menjaga kestabilan sesi klien aktif.
- **Activate:** Menghapus seluruh cache lama yang berprefix `indogreen-` yang versinya tidak cocok dengan versi aktif saat ini (`CACHE_STATIC` dan `CACHE_ASSETS`). Ini memastikan saat deploy build baru, seluruh chunk versi lama langsung dibersihkan dan tidak terjadi benturan hash modul ("Failed to fetch dynamically imported module").
- **Message Listener:** Mendengarkan pesan `{ type: 'SKIP_WAITING' }` untuk memicu `sw.skipWaiting()` saat pengguna menyetujui pembaruan versi (Fase 5).

### D. Hasil Pengukuran Jaringan (First Visit vs Second Visit)
Berdasarkan hasil build produksi (`vite build`):
- **Total Ukuran Aset Immutable (`/_app/immutable/**`):** 94 berkas chunk JS & CSS (~1.02 MB uncompressed).
- **Total Ukuran Aset Statis:** 10 berkas (~1.78 MB, termasuk master logo `indogreen.png` sebesar 1.28 MB dan ikon PWA).

| Skenario | Dokumen HTML Navigasi | Aset Immutable (JS/CSS) | Logo & Aset Statis | Total Data Transferred | Reduksi Jaringan |
|---|---|---|---|---|---|
| **First Visit (Kunjungan Pertama)** | ~3.5 KB (Network) | ~800–1000 KB (Network) | ~1.3 MB (Network) | **~2.1 – 2.5 MB** | Baseline |
| **Second Visit (Kunjungan Kedua)** | ~3.5 KB (Network-Only) | **0 B** (`indogreen-assets`) | **0 B** (`indogreen-static`) | **~3.5 KB** | **> 99.8% Penghematan Bandwidth** |

> Catatan: Navigasi dokumen HTML tetap berstatus Network-Only untuk menjaga kesegaran data user/sesi, sedangkan seluruh beban JS, CSS, dan aset visual ditanggung sepenuhnya oleh Service Worker Cache Storage.

---

## 3. Registrasi & Kill-Switch Runtime (`src/lib/pwa/register.ts`)

Registrasi Service Worker diatur secara manual melalui `svelte.config.js` (`kit.serviceWorker.register = false`) dan dipanggil via `onMount` di `src/routes/+layout.svelte`.

### Prosedur Kill-Switch Runtime & Penanganan Konflik DEV/BUILD:
Aplikasi dilengkapi dua lapis pengaman untuk menghentikan Service Worker jika terjadi anomali:

1. **Lapis 1 (Environment Variable Kill-Switch):**
   - Set `PUBLIC_PWA_ENABLED=false` pada environment server/host lalu restart aplikasi.
   - Fungsi `registerServiceWorker()` mendeteksi nilai ini dan secara otomatis memanggil `unregisterAndClean()`:
     - Membatalkan registrasi (`unregister()`) semua worker aktif.
     - Menghapus seluruh cache storage berprefix `indogreen-*`.
     - Setiap klien yang memuat atau me-refresh halaman akan langsung bersih dari Service Worker.
2. **Lapis 2 (Otomatis pada Mode Development):**
   - Jika aplikasi dijalankan di mode development (`!import.meta.env.PROD`, contoh `npm run dev`), script secara otomatis memanggil `unregisterAndClean()`. Ini mencegah Service Worker dari mode build terdahulu menyajikan aset basi saat developer berpindah ke dev server pada port yang sama.
3. **Lapis 3 (Cadangan Darurat — Emergency Cleaner SW):**
   - Jika diperlukan pembersihan massal tanpa redeploy bundle, deploy berkas Service Worker kosong sementara yang pada event `activate` memanggil `caches.keys().then(...)` untuk menghapus cache `indogreen-*`, memanggil `registration.unregister()`, dan melakukan reload pada semua klien aktif via `clients.matchAll()`.

---

## 4. Mekanisme Pembaruan Versi & UI Prompt (`UpdatePrompt.svelte`)

Untuk memastikan pengguna selalu mendapatkan rilis kode terbaru tanpa merusak sesi kerja aktif, sistem pembaruan mengombinasikan SvelteKit Version Polling dan Service Worker Lifecycle Management:

### A. Alur Deteksi Pembaruan
1. **PWA Store (`src/lib/stores/pwa.ts`)**:
   Store writable terpusat yang menyimpan `{ updateReady: boolean, registration?: ServiceWorkerRegistration }`.
2. **Event Listener Service Worker (`src/lib/pwa/register.ts`)**:
   - Memeriksa apakah `registration.waiting` sudah ada saat inisialisasi.
   - Mendengarkan `registration.onupdatefound` -> mendeteksi ketika `installingWorker.state === 'installed'`.
   - Update hanya ditandai siap (`setUpdateReady`) jika `navigator.serviceWorker.controller` sudah ada (bukan fresh install pertama kali).
   - Memanggil `registration.update()` setiap kali tab kembali aktif (`visibilitychange` ke `visible`) dan polling berkala tiap ~60 menit.
3. **SvelteKit Version Polling (`kit.version.pollInterval = 300000`)**:
   - Diatur 5 menit pada `svelte.config.js`. SvelteKit secara mandiri mem-polling `/_app/version.json`.
   - Ketika deploy baru terdeteksi, `updated.current` dari `$app/state` menjadi `true`.

### B. Komponen Banner Non-Blokir (`src/lib/components/pwa/UpdatePrompt.svelte`)
- Diletakkan di level tertinggi `src/routes/+layout.svelte` sehingga aktif di seluruh rute (termasuk halaman `/auth/*`).
- Banner muncul secara elegan di pojok kanan bawah (`fixed bottom-4 right-4 z-50`) dengan teks: *"Versi baru tersedia"*.
- **Tombol "Nanti"**: Menutup banner untuk sesi saat ini tanpa mengganggu aktivitas kerja user.
- **Tombol "Perbarui sekarang"**:
  1. Memeriksa apakah ada formulir/drawer yang sedang aktif (`document.body.dataset.scrollLocked === 'true'`).
  2. Jika ada, menampilkan konfirmasi SweetAlert2: *"Terdapat dialog atau formulir yang belum selesai... Tetap perbarui sekarang?"*. Jika user menunda, reload dibatalkan.
  3. Jika aman, mengirim pesan `{ type: 'SKIP_WAITING' }` ke worker baru.
  4. Mendengarkan event `controllerchange` satu kali (`{ once: true }`) lalu mengeksekusi `window.location.reload()`.
  5. Dilengkapi flag penjaga `sessionStorage.setItem('pwa_refreshing', 'true')` untuk memastikan reload hanya terjadi tepat **SEKALI** (mencegah infinite reload loop).

### C. Proteksi Navigasi Bersih (`beforeNavigate`)
Saat tab lama dibiarkan terbuka lalu user mengeklik menu navigasi setelah deploy baru:
- `beforeNavigate` mendeteksi bahwa versi baru telah siap (`updated.current || $pwaStore.updateReady`).
- Jika tidak ada form modal yang terbuka, navigasi otomatis dialihkan ke `location.href = to.url.href` (native browser navigation).
- Hal ini memaksa peramban memuat dokumen HTML shell baru beserta hash chunk JS/CSS yang sesuai, meniadakan error chunk hash mismatch (*"Failed to fetch dynamically imported module"*).

---

## 5. Halaman Offline (`static/offline.html`)

Halaman offline dirancang mandiri tanpa dependensi JavaScript eksternal:
- Berbahasa Indonesia ramah pengguna: *"Anda sedang offline"*.
- Mengedukasi bahwa pembaruan aktivitas, mutasi stok, dan pencatatan keuangan memerlukan koneksi aktif demi integritas data.
- Tombol aksi *"Coba lagi"* (`location.reload()`).
- Tampilan responsif dengan dukungan Dark Mode otomatis berbasis `@media (prefers-color-scheme: dark)`.
- Menggunakan logo kecil dari ikon yang telah di-precache (`/icons/icon-192.png`).

---

## 6. Palet Warna & Metadata Tema

| Elemen | Mode Terang (Light) | Mode Gelap (Dark) | Keterangan |
|---|---|---|---|
| Background Halaman | `#f3f4f6` | `#262626` | Warna latar dasar aplikasi |
| Card & TopNav | `#ffffff` | `#000000` | Header atas & kartu komponen |
| Primary Accent | `#4f46e5` | `#4f46e5` | Warna utama (Indigo) |
| `theme-color` Meta | `#ffffff` | `#000000` | Warna status bar browser / PWA shell |

### Sinkronisasi Dinamis di Runtime
Pada `src/routes/+layout.svelte`, listener `theme.subscribe()` memantau perubahan tema secara real-time. Ketika pengguna menekan tombol toggle tema di TopNav, elemen `<meta name="theme-color">` pada DOM diperbarui seketika (`#ffffff` untuk light, `#000000` untuk dark) sehingga status bar ponsel berubah selaras dengan tema aplikasi.

---

## 7. Web App Manifest (`manifest.webmanifest`)

File manifest berlokasi di `frontend/static/manifest.webmanifest` dengan properti:

```json
{
  "id": "/",
  "name": "Indogreen Project Management",
  "short_name": "Indogreen",
  "description": "Aplikasi sistem manajemen proyek internal PT Indogreen",
  "lang": "id",
  "dir": "ltr",
  "start_url": "/dashboard",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#f3f4f6",
  "theme_color": "#ffffff",
  "categories": ["business", "productivity"]
}
```

### App Shortcuts
PWA menyediakan akses cepat (long-press pada ikon aplikasi di home screen):
1. **Dashboard** (`/dashboard`)
2. **Project** (`/projects`)
3. **Aktivitas** (`/activities`)
4. **Keuangan** (`/finance`)

---

## 8. Standar Aset Ikon

Semua aset ikon di-generate dari master `frontend/static/indogreen.png` (resolusi 1254x1254, latar solid) dan disimpan di `frontend/static/icons/`:

| Nama File | Dimensi | Format & Tipe | Tujuan (Purpose) | Keterangan |
|---|---|---|---|---|
| `icon-192.png` | 192x192 px | PNG RGB, latar solid | `any` | Home screen & splash screen Android standar |
| `icon-512.png` | 512x512 px | PNG RGB, latar solid | `any` | PWA installation dialog & high-res display |
| `icon-maskable-512.png` | 512x512 px | PNG RGB, latar solid | `maskable` | Konten berada dalam safe zone 80% (radius aman 204.8 px) agar tidak terpotong adaptive icon Android |
| `apple-touch-icon-180.png` | 180x180 px | PNG RGB, latar solid | iOS Web Clip | Home screen icon Safari iOS (tanpa transparansi) |

> ⚠️ **Catatan Penting:** Master `frontend/static/indogreen.png` dipertahankan dan tidak diubah/ditimpa karena tetap digunakan untuk favicon dan logo sidebar navigasi.

---

## 9. Metadata PWA di `app.html`

Tag berikut disematkan di dalam `<head>` pada `frontend/src/app.html`:

```html
<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
<link rel="apple-touch-icon" href="%sveltekit.assets%/icons/apple-touch-icon-180.png" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Indogreen" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

---

## 10. Status Roadmap PWA

- [x] **Fase 0:** Audit Kesiapan PWA & Arsitektur
- [x] **Fase 1:** Konfigurasi Dev HTTPS via Cloudflare Tunnel
- [x] **Fase 2:** Web App Manifest, Aset Ikon, & Sinkronisasi Tema
- [x] **Fase 3:** Service Worker, Precache App Shell, & Offline Fallback Navigation
- [x] **Fase 4:** Caching Aset Immutable (Cache-First) & Aset Statis (Stale-While-Revalidate)
- [x] **Fase 5:** Mekanisme Pembaruan Versi, UpdatePrompt UI, & Pencegahan Chunk Error

