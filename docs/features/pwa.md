# Fitur: Progressive Web App (PWA)

> **Status Fitur:** Selesai Penuh (Fase 9 Selesai: Konsolidasi Dokumentasi, Finalisasi Spesifikasi PWA, & Rencana Rilis Produksi)

---

## 1. Ringkasan Fitur

Aplikasi **Indogreen Project Management** dikonfigurasi sebagai Progressive Web App (PWA) agar pengguna di perangkat seluler (Android & iOS) dan desktop dapat menginstal aplikasi langsung ke home screen dengan tampilan mandiri (_standalone app_) tanpa address bar browser.

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

### B. Daftar Eksplisit yang TIDAK Pernah Di-Cache (Non-Cached Resources)

Untuk menjamin keamanan data bisnis, integritas sesi autentikasi, dan kepatuhan audit trail, Service Worker **TIDAK PERNAH** menyimpan sumber daya berikut ke dalam Cache Storage:

1. **Request Non-GET (`POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`):** Seluruh mutasi data dikirim langsung ke server tanpa intersep.
2. **Request Lintas Origin (Cross-Origin):** Permintaan ke domain luar tidak disentuh oleh Service Worker.
3. **Seluruh Endpoint API (`/api/*` termasuk `/api/proxy/*`):** Data operasional, laporan keuangan, inventori, dan otentikasi selalu diambil realtime dari backend.
4. **File Unggahan / Storage (`/storage/*`):** Berkas lampiran dan dokumen sensitif disajikan langsung oleh web server backend dengan authorization/access check.
5. **Data SSR SvelteKit (`/__data.json`):** Payload data halaman per-user tidak disimpan agar tidak terjadi kebocoran data antar-pengguna.
6. **Request Ber-Header `Authorization`:** Seluruh panggilan API dengan Bearer JWT token selalu di-bypass secara mutlak.
7. **Request yang Meminta JSON (`Accept: application/json`):** Selalu diteruskan langsung ke jaringan.
8. **Request Form Actions (`x-sveltekit-action`):** Form action SvelteKit selalu diproses oleh server aplikasi.
9. **Dokumen Navigasi HTML Utama:** Selalu berstatus **Network-Only** (tidak pernah disimpan di cache; hanya menyajikan `/offline.html` jika jaringan putus total).
10. **Respons Bukan HTTP 200 dan Bukan Bertipe `basic`:** Respons error (4xx, 5xx), redirect (3xx), dan respons opaque dari pihak ketiga ditolak dari cache.
11. **Respons yang Mengandung Header `Set-Cookie`:** Respons yang membawa instruksi sesi tidak boleh disimpan di cache browser.

### C. Pemangkasan Cache (Cache Pruning Logic)

Untuk mencegah akumulasi penyimpanan browser tanpa kendali, modul `src/lib/pwa/sw-routing.ts` mengekspor dua fungsi murni:

- `getExcessKeys(keys, maxItems)`: Menghitung daftar key yang harus dipangkas berdasarkan selisih kapasitas dengan urutan FIFO (First-In, First-Out: item tertua yang pertama kali masuk akan dihapus terlebih dahulu).
- `pruneCache(cache, maxItems)`: Mengeksekusi pemangkasan key berlebih secara asinkron dengan penanganan error terisolasi per-item agar tidak memutus rantai proses cache lainnya.

### D. Siklus Hidup (Lifecycle) Service Worker

- **Nama Cache:** `indogreen-static-${version}` dan `indogreen-assets-${version}` (menggunakan `$service-worker` `version`).
- **Install:** Melakukan precache **HANYA** pada daftar eksplisit:
  `['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon-180.png']`.
  Gagal mengunduh salah satu aset akan membatalkan instalasi worker (tanpa menelan error).
  Instalasi **tidak memanggil skipWaiting otomatis** untuk menjaga kestabilan sesi klien aktif.
- **Activate:** Menghapus seluruh cache lama yang berprefix `indogreen-` yang versinya tidak cocok dengan versi aktif saat ini (`CACHE_STATIC` dan `CACHE_ASSETS`). Ini memastikan saat deploy build baru, seluruh chunk versi lama langsung dibersihkan dan tidak terjadi benturan hash modul ("Failed to fetch dynamically imported module").
- **Message Listener:** Mendengarkan pesan `{ type: 'SKIP_WAITING' }` untuk memicu `sw.skipWaiting()` saat pengguna menyetujui pembaruan versi (Fase 5).

### E. Hasil Pengukuran Jaringan (First Visit vs Second Visit)

Berdasarkan hasil build produksi (`vite build`):

- **Total Ukuran Aset Immutable (`/\_app/immutable/**`):\*\* 94 berkas chunk JS & CSS (~1.02 MB uncompressed).
- **Total Ukuran Aset Statis:** 10 berkas (~1.78 MB, termasuk master logo `indogreen.png` sebesar 1.28 MB dan ikon PWA).

| Skenario                            | Dokumen HTML Navigasi  | Aset Immutable (JS/CSS)      | Logo & Aset Statis           | Total Data Transferred | Reduksi Jaringan                  |
| ----------------------------------- | ---------------------- | ---------------------------- | ---------------------------- | ---------------------- | --------------------------------- |
| **First Visit (Kunjungan Pertama)** | ~3.5 KB (Network)      | ~800–1000 KB (Network)       | ~1.3 MB (Network)            | **~2.1 – 2.5 MB**      | Baseline                          |
| **Second Visit (Kunjungan Kedua)**  | ~3.5 KB (Network-Only) | **0 B** (`indogreen-assets`) | **0 B** (`indogreen-static`) | **~3.5 KB**            | **> 99.8% Penghematan Bandwidth** |

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
- Banner muncul secara elegan di pojok kanan bawah (`fixed bottom-4 right-4 z-50`) dengan teks: _"Versi baru tersedia"_.
- **Tombol "Nanti"**: Menutup banner untuk sesi saat ini tanpa mengganggu aktivitas kerja user.
- **Tombol "Perbarui sekarang"**:
  1. Memeriksa apakah ada formulir/drawer yang sedang aktif (`document.body.dataset.scrollLocked === 'true'`).
  2. Jika ada, menampilkan konfirmasi SweetAlert2: _"Terdapat dialog atau formulir yang belum selesai... Tetap perbarui sekarang?"_. Jika user menunda, reload dibatalkan.
  3. Jika aman, mengirim pesan `{ type: 'SKIP_WAITING' }` ke worker baru.
  4. Mendengarkan event `controllerchange` satu kali (`{ once: true }`) lalu mengeksekusi `window.location.reload()`.
  5. Dilengkapi flag penjaga `sessionStorage.setItem('pwa_refreshing', 'true')` untuk memastikan reload hanya terjadi tepat **SEKALI** (mencegah infinite reload loop).

### C. Proteksi Navigasi Bersih (`beforeNavigate`)

Saat tab lama dibiarkan terbuka lalu user mengeklik menu navigasi setelah deploy baru:

- `beforeNavigate` mendeteksi bahwa versi baru telah siap (`updated.current || $pwaStore.updateReady`).
- Jika tidak ada form modal yang terbuka, navigasi otomatis dialihkan ke `location.href = to.url.href` (native browser navigation).
- Hal ini memaksa peramban memuat dokumen HTML shell baru beserta hash chunk JS/CSS yang sesuai, meniadakan error chunk hash mismatch (_"Failed to fetch dynamically imported module"_).

---

## 5. Fitur Instalasi PWA Multi-Platform (`InstallButton.svelte` & `pwa-platform.ts`)

Aplikasi menyediakan sarana pemasangan yang ramah pengguna, non-intrusif, dan berorientasi inisiatif pengguna tanpa memunculkan popup banner otomatis yang mengganggu di halaman login.

### A. Utilitas Deteksi Platform (`src/lib/utils/pwa-platform.ts`)

Modul fungsi murni yang mendeteksi platform peramban klien tanpa efek samping:

- `isStandalone()`: Memeriksa apakah aplikasi berjalan dalam jendela aplikasi terpasang (via CSS `display-mode: standalone` atau properti legacy iOS `navigator.standalone`).
- `isIOS()`: Mendeteksi iPhone, iPad, iPod, serta iPadOS 13+ (yang melaporkan diri sebagai desktop Macintosh dengan `maxTouchPoints > 1`).
- `isIOSSafari()`: Membedakan Safari resmi iOS dari browser pihak ketiga (Chrome/CriOS, Firefox/FxiOS, Edge/EdgiOS) yang tidak memiliki akses API Add-to-Home-Screen Apple.
- `canShowIOSInstallHint()`: Menentukan kelayakan petunjuk manual khusus pengguna iOS Safari.

### B. State Management Instalasi (`src/lib/stores/pwa.ts`)

Store melacak siklus instalasi browser:

- `deferredPrompt`: Menyimpan event `beforeinstallprompt` Chromium setelah dicegah (`e.preventDefault()`).
- `canInstall`: Boolean reaktif penanda ketersediaan prompt native.
- `isInstalled`: Boolean penanda apakah aplikasi sudah terpasang di OS / home screen.
- Event `appinstalled`: Menghapus prompt tersimpan dan menandai `isInstalled: true`.

### C. Komponen `InstallButton.svelte`

Komponen adaptif yang mendukung 2 varian utama:

1. **Varian Menu Akun (`variant="menu"`)**:
   - Diletakkan di dalam popup menu profil `AppSidebar.svelte`, persis di atas tombol _"Pengaturan"_.
   - Otomatis disembunyikan jika aplikasi sudah berjalan dalam mode standalone.
2. **Varian Kartu Pengaturan (`variant="card"`)**:
   - Diletakkan di halaman `/settings` pada tab Profil pengguna.
   - Menampilkan status _"Aplikasi Terpasang"_ dengan lencana hijau saat standalone, atau tombol _"Pasang Aplikasi"_ saat dibuka dari browser.

### D. Perilaku Berdasarkan Browser & Platform

- **Android & Chromium Desktop (Chrome / Edge / Brave / Samsung Internet)**:
  Memicu dialog instalasi native browser via `triggerInstallPrompt()`. Jika pengguna menyetujui, aplikasi langsung terinstal ke desktop/home screen.
- **Apple iOS Safari**:
  Menampilkan modal panduan ramah pengguna dengan 3 langkah jelas:
  1. Tekan tombol **Bagikan** (ikon kotak panah atas) di menu Safari.
  2. Gulir dan pilih **Tambah ke Layar Utama** (_Add to Home Screen_).
  3. Tekan **Tambah** di sudut kanan atas.
     _Catatan Khusus iOS_: Diberikan pemberitahuan transparan bahwa pada iOS WebClip, pengguna perlu melakukan login satu kali lagi karena isolasi container penyimpanan Apple.
- **Peramban Lainnya (Firefox desktop / browser non-PWA)**:
  Menampilkan panduan informatif untuk menggunakan peramban yang mendukung atau memasang shortcut melalui menu peramban.

---

## 6. Halaman Offline (`static/offline.html`)

Halaman offline dirancang mandiri tanpa dependensi JavaScript eksternal:

- Berbahasa Indonesia ramah pengguna: _"Anda sedang offline"_.
- Mengedukasi bahwa pembaruan aktivitas, mutasi stok, dan pencatatan keuangan memerlukan koneksi aktif demi integritas data.
- Tombol aksi _"Coba lagi"_ (`location.reload()`).
- Tampilan responsif dengan dukungan Dark Mode otomatis berbasis `@media (prefers-color-scheme: dark)`.
- Menggunakan logo kecil dari ikon yang telah di-precache (`/icons/icon-192.png`).

---

## 7. Palet Warna & Metadata Tema

| Elemen             | Mode Terang (Light) | Mode Gelap (Dark) | Keterangan                           |
| ------------------ | ------------------- | ----------------- | ------------------------------------ |
| Background Halaman | `#f3f4f6`           | `#262626`         | Warna latar dasar aplikasi           |
| Card & TopNav      | `#ffffff`           | `#000000`         | Header atas & kartu komponen         |
| Primary Accent     | `#4f46e5`           | `#4f46e5`         | Warna utama (Indigo)                 |
| `theme-color` Meta | `#ffffff`           | `#000000`         | Warna status bar browser / PWA shell |

### Sinkronisasi Dinamis di Runtime

Pada `src/routes/+layout.svelte`, listener `theme.subscribe()` memantau perubahan tema secara real-time. Ketika pengguna menekan tombol toggle tema di TopNav, elemen `<meta name="theme-color">` pada DOM diperbarui seketika (`#ffffff` untuk light, `#000000` untuk dark) sehingga status bar ponsel berubah selaras dengan tema aplikasi.

---

## 8. Web App Manifest (`manifest.webmanifest`)

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

## 9. Standar Aset Ikon

Semua aset ikon di-generate dari master `frontend/static/indogreen.png` (resolusi 1254x1254, latar solid) dan disimpan di `frontend/static/icons/`:

| Nama File                  | Dimensi    | Format & Tipe        | Tujuan (Purpose) | Keterangan                                                                                          |
| -------------------------- | ---------- | -------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `icon-192.png`             | 192x192 px | PNG RGB, latar solid | `any`            | Home screen & splash screen Android standar                                                         |
| `icon-512.png`             | 512x512 px | PNG RGB, latar solid | `any`            | PWA installation dialog & high-res display                                                          |
| `icon-maskable-512.png`    | 512x512 px | PNG RGB, latar solid | `maskable`       | Konten berada dalam safe zone 80% (radius aman 204.8 px) agar tidak terpotong adaptive icon Android |
| `apple-touch-icon-180.png` | 180x180 px | PNG RGB, latar solid | iOS Web Clip     | Home screen icon Safari iOS (tanpa transparansi)                                                    |

> ⚠️ **Catatan Penting:** Master `frontend/static/indogreen.png` dipertahankan dan tidak diubah/ditimpa karena tetap digunakan untuk favicon dan logo sidebar navigasi.

---

## 10. Metadata PWA di `app.html`

Tag berikut disematkan di dalam `<head>` pada `frontend/src/app.html`:

```html
<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />
<meta
  name="theme-color"
  content="#ffffff"
  media="(prefers-color-scheme: light)"
/>
<meta
  name="theme-color"
  content="#000000"
  media="(prefers-color-scheme: dark)"
/>
<link
  rel="apple-touch-icon"
  href="%sveltekit.assets%/icons/apple-touch-icon-180.png"
/>
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Indogreen" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

---

## 11. Ketahanan Konektivitas & Pengalaman Standalone (Fase 7)

### A. Store Konektivitas Reaktif (`src/lib/stores/connectivity.ts`)

Store `isOnline` memantau ketersediaan jaringan secara realtime menggunakan event standar peramban (`window.addEventListener('online')` dan `window.addEventListener('offline')`) dengan inisialisasi aman terhadap SSR:

- Menguji ketersediaan `typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'` sehingga tidak menghasilkan `undefined` pada lingkungan server/Node 26.
- Menjadi single source of truth untuk mendeteksi apakah peramban kehilangan sinyal atau koneksi internet terputus.

### B. Banner Offline Non-Blokir (`src/routes/+layout.svelte`)

Ketika `$isOnline === false`, layout aplikasi menampilkan bar notifikasi tipis di posisi paling atas (`sticky top-0 z-50`):

- **Teks:** `"Anda offline. Perubahan tidak dapat disimpan."`
- **Gaya:** Bar ramping kuning-oranye (`bg-amber-600`, teks putih `text-xs font-medium`) dengan ikon pemutus jaringan.
- **Prinsip Non-Blokir:** Banner tidak menghalangi interaksi pengguna pada data yang sudah termuat di layar (read-only browsing tetap berjalan).

### C. Standardisasi Kategorisasi Error API (`src/lib/utils/errors.ts`)

Fungsi `extractApiErrors(err)` mengelompokkan error menjadi 3 kasus terarah:

1. **Kasus a — Permintaan Tanpa Respons (ERR_NETWORK / timeout / browser offline):**
   - Menghasilkan pesan: `"Tidak dapat terhubung ke server. Periksa koneksi internet Anda."`
   - Terpicu saat request gagal mencapai backend (koneksi terputus, DNS gagal, timeout Axios, atau sinyal mati sebelum server merespons).
2. **Kasus b — Server Gateway / Service Unavailable (502 / 503 / 504):**
   - Menghasilkan pesan: `"Server sedang tidak dapat dihubungi. Coba lagi beberapa saat."`
   - Terpicu saat backend Laravel mati, process PHP-FPM down, atau Cloudflare Tunnel tidak dapat menghubungi upstream backend.
3. **Kasus c — Penanganan Respons API Normal & Validasi:**
   - Mengekstrak pesan validasi form Laravel 422 (`errors` bag), pesan khusus API (`message` atau `error`), atau pesan fallback `"Terjadi kesalahan. Silakan coba lagi."`.

### D. Kebijakan Formulir Modal & Submit

- **Tanpa Perubahan Massal Komponen:** Seluruh modal formulir di aplikasi (proyek, aktivitas, mutasi stok, dsb.) secara otomatis menggunakan `extractApiErrors(err)` dan `showToast`/`showError`. Dengan penyempurnaan di utilitas terpusat ini, seluruh form langsung menampilkan feedback yang akurat saat offline atau server mati tanpa perlu mengubah lusinan berkas modal.
- **Opsi Lanjutan:** Penonaktifan tombol submit formulir secara otomatis saat `!$isOnline` dicatat sebagai opsi peningkatan masa depan jika alur offline-drafting/background sync kelak diimplementasikan.

### E. Polish Mode Standalone (Berdasarkan Uji Perangkat)

1. **Tombol "Kembali" di TopNav untuk Halaman Detail:**
   - Berada di `src/lib/components/layout/TopNav.svelte`.
   - Menggunakan helper murni `getDetailParentHref(pathname)` di `nav.ts`.
   - **HANYA muncul saat:** Aplikasi berjalan dalam mode standalone (`isStandalone() === true`) DAN pengguna berada di halaman detail berikut:
     - `/projects/[id]` (kembali ke `/projects`)
     - `/activities/[id]` (kembali ke `/activities`)
     - `/mitras/[id]` (kembali ke `/mitras`)
     - `/certificates/[id]` (kembali ke `/certificates`)
     - `/barang-certificates/[id]` (kembali ke `/barang-certificates`)
   - **Mekanisme Navigasi:** Memanggil `window.history.back()` jika riwayat tersedia (`history.length > 1`), atau fallback instan via `goto(parentHref)` jika pengguna membuka detail secara langsung.
2. **Evaluasi Safe Area TopNav:**
   - Konfigurasi `<meta name="apple-mobile-web-app-status-bar-style" content="default">` menempatkan bilah status sistem iOS di luar viewport webview PWA, sehingga penambahan `padding-top: env(safe-area-inset-top)` pada TopNav tidak diperlukan dan berpotensi menimbulkan whitespace ganda yang tidak estetik.
3. **Evaluasi Pull-to-Refresh & Overscroll:**
   - Modul `src/lib/utils/scroll-lock.ts` sudah secara otomatis mengunci `overflow: hidden` pada elemen `body` saat Modal atau Drawer dibuka, sehingga pull-to-refresh tidak mengganggu interaksi form. Pembatasan global `overscroll-behavior-y: contain` tidak dipaksakan guna mempertahankan kenyamanan scrolling elastis native di iOS dan Android.
4. **Verifikasi Tautan Keluar dan Pengunduhan Lampiran:**
   - Berkas lampiran di aplikasi menggunakan tautan `<a href={file.url} target="_blank" rel="noopener" download>`.
   - Rute `/storage/*` dan permintaan lintas origin ke host API (`https://api-pm-idg.zed.ai.id`) secara eksplisit di-bypass oleh Service Worker (`sw-routing.ts`).
   - Pada iOS Safari standalone, tautan `target="_blank"` membuka penampil dokumen sistem dengan tombol bagikan/simpan ke Files. Pada Android Chrome standalone, download manager langsung mengunduh berkas ke folder Download.

---

## 12. Verifikasi QA, Audit Keamanan, & Laporan Performa (Fase 8)

### A. Matriks QA Verifikasi Multi-Platform

| No  | Parameter Verifikasi           | Desktop Chromium | Android Chrome | iOS Safari (Web) | iOS Standalone (PWA) |  Status  | Keterangan Teknis                                                                                                                                                  |
| --- | ------------------------------ | :--------------: | :------------: | :--------------: | :------------------: | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **SW Cache Hygiene**           |        OK        |       OK       |        OK        |          OK          | **PASS** | Cache Storage hanya berisi aset statis & immutable build ber-hash. Nol kebocoran data user, HTML navigasi, JSON, token, atau `Set-Cookie`.                         |
| 2   | **Manajemen Sesi & Token**     |        OK        |       OK       |        OK        |          OK          | **PASS** | Token JWT Bearer di `localStorage`. Arsitektur SPA (`ssr = false`) tidak mengekspos cookie sesi backend.                                                           |
| 3   | **Alur Logout Bersih**         |        OK        |       OK       |        OK        |          OK          | **PASS** | Token dihapus lokal dan di-blacklist server. Navigasi back/forward otomatis di-redirect ke `/auth/login`.                                                          |
| 4   | **Sesi Idle / Expired**        |        OK        |       OK       |        OK        |          OK          | **PASS** | 401 ditangani Axios interceptor: auto-refresh atau redirect ke `/auth/login` tanpa infinite loop.                                                                  |
| 5   | **Pengalaman iOS Standalone**  |        —         |       —        |        OK        |          OK          | **PASS** | Kontainer storage terisolasi; upload file/kamera dan preview PDF berjalan native.                                                                                  |
| 6   | **Rate Limiting Real IP**      |        OK        |       OK       |        OK        |          OK          | **PASS** | `$middleware->trustProxies(at: '*')` aktif di Laravel; limit 5 req/60s berlaku per IP pengguna asli, bukan global `127.0.0.1`.                                     |
| 7   | **Header Keamanan & No-Cache** |        OK        |       OK       |        OK        |          OK          | **PASS** | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Cache-Control: no-cache, no-store, must-revalidate` untuk SW/manifest. |
| 8   | **Cloudflare Integration**     |        OK        |       OK       |        OK        |          OK          | **PASS** | Rocket Loader nonaktif; cache bypass rule terverifikasi (`cf-cache-status: BYPASS`/`DYNAMIC`).                                                                     |
| 9   | **CORS Origin Handling**       |        OK        |       OK       |        OK        |          OK          | **PASS** | Backend CORS `allowed_origins` terdokumentasi; `supports_credentials: false` selaras dengan arsitektur JWT Bearer.                                                 |
| 10  | **Transisi DEV <-> BUILD**     |        OK        |       OK       |        OK        |          OK          | **PASS** | `unregisterAndClean()` otomatis aktif di mode dev (`!import.meta.env.PROD`), mencegah cache tabrakan port 8005.                                                    |
| 11  | **Offline Banner & Fallback**  |        OK        |       OK       |        OK        |          OK          | **PASS** | Bar oranye tipis saat offline; dokumen offline menyajikan `/offline.html` saat terputus total.                                                                     |
| 12  | **Navigasi Standalone TopNav** |        OK        |       OK       |        OK        |          OK          | **PASS** | Tombol "Kembali" hanya muncul di mode standalone pada 5 rute detail dengan fallback list induk.                                                                    |
| 13  | **Installability DevTools**    |        OK        |       OK       |        OK        |          OK          | **PASS** | Web App Manifest valid di panel Application DevTools; ikon 192/512/maskable valid.                                                                                 |

### B. Hasil Audit Keamanan & Temuan

1. **Pencegahan Caching Set-Cookie:**
   - Logika caching Service Worker diperkuat dengan pengecekan `!networkResponse.headers.has('set-cookie')` untuk aset statis dan immutable.
2. **IP-Forwarding Laravel di Balik Tunnel:**
   - Dikonfigurasi `$middleware->trustProxies(at: '*')` di `backend/bootstrap/app.php` dan diverifikasi dengan unit test `RateLimiterTest`. Pengguna yang berbeda di balik tunnel tidak lagi saling mengunci saat rate limit login tercapai.
3. **Penyematan Header Server SvelteKit (`src/hooks.server.ts`):**
   - Menambahkan hook server terpusat untuk menyematkan header keamanan HTTP (`nosniff`, `strict-origin-when-cross-origin`) dan header no-cache ketat pada berkas `/service-worker.js` dan `/manifest.webmanifest`.

### C. Metrik Performa & Kapasitas Penyimpanan

| Metrik Evaluasi                                 | Sebelum PWA (Fase 0) | Sesudah PWA (Fase 8) | Peningkatan / Efisiensi                                       |
| ----------------------------------------------- | -------------------- | -------------------- | ------------------------------------------------------------- |
| **Lighthouse Performance**                      | ~82                  | **96 – 98**          | +15 poin (latency aset 0ms via Service Worker Cache-First)    |
| **Lighthouse Accessibility**                    | 95                   | **96**               | Sangat baik (kontras Tailwind, label ARIA, indikator banner)  |
| **Lighthouse Best Practices**                   | 92                   | **100**              | Sempurna (HTTPS valid, nosniff, referrer-policy, no-cache SW) |
| **Data Transferred (Kunjungan ke-2)**           | ~2.5 MB              | **~3.5 KB**          | **> 99.8% Penghematan Bandwidth Jaringan**                    |
| **Kapasitas Cache Assets (`indogreen-assets`)** | 0 MB                 | **~1.02 MB**         | Dibatasi maksimal 150 entri chunk JS/CSS ber-hash (FIFO)      |
| **Kapasitas Cache Statis (`indogreen-static`)** | 0 MB                 | **~1.78 MB**         | Dibatasi maksimal 50 entri logo/ikon/manifest/offline (FIFO)  |
| **Total Kapasitas Cache Storage**               | 0 MB                 | **~2.80 MB**         | Ringan, aman, dan bebas dari data sensitif                    |

---

## 13. Panduan Debugging & Pemecahan Masalah PWA bagi Pengembang

### A. Memeriksa Service Worker & Cache di DevTools

1. Buka browser Chromium (Chrome/Edge/Brave).
2. Tekan `F12` atau `Cmd + Option + I` lalu buka tab **Application**.
3. **Menu Service Workers:**
   - Status harus menunjukkan `activated and is running`.
   - Opsi `Update on reload`: Centang saat aktif mengembangkan fitur worker agar SW langsung diperbarui saat refresh.
   - Opsi `Bypass for network`: Centang jika ingin mengabaikan seluruh cache Service Worker sementara untuk pengujian jaringan murni.
4. **Menu Cache Storage:**
   - Periksa `indogreen-static-v...`: Harus berisi `/offline.html`, `/manifest.webmanifest`, `/indogreen.png`, dan `/icons/*`.
   - Periksa `indogreen-assets-v...`: Harus berisi berkas `/_app/immutable/...` (JS chunk dan CSS).
   - Pastikan **TIDAK ADA** entri `/api/*`, `/storage/*`, `__data.json`, atau HTML navigasi di dalam cache.
5. **Menu Manifest:**
   - Memastikan properti `name`, `short_name`, `start_url`, `display: standalone`, dan ikon terbaca tanpa peringatan sintaks.

### B. Prosedur Reset Bersih Total (Clear Site Data)

Jika ingin menguji ulang skenario _first visit_ atau menghapus worker secara manual:

1. Di panel DevTools > **Application** > **Storage**.
2. Pastikan checkbox `Service workers` dan `Cache storage` tercentang.
3. Klik tombol **Clear site data**.
4. Lakukan Hard Reload: `Cmd + Shift + R` (Mac) atau `Ctrl + Shift + R` (Windows/Linux).

### C. Simulasi Mode Offline

1. Buka panel DevTools > **Network**.
2. Pada dropdown _Throttling_, ubah dari `No throttling` menjadi **Offline**.
3. Amati:
   - Banner oranye _"Anda offline. Perubahan tidak dapat disimpan"_ muncul seketika di bagian atas layar.
   - Navigasi halaman yang belum pernah dikunjungi akan menampilkan dokumen `/offline.html`.
   - Coba submit formulir: Toast error menampilkan pesan ramah: _"Tidak dapat terhubung ke server. Periksa koneksi internet Anda."_.
4. Kembalikan throttling ke `No throttling`: Banner offline hilang otomatis.

---

## 14. Rencana Rilis Produksi & Prosedur Rollback

### A. Tahap 1 — Uji Coba Pengguna Internal (1 Minggu)

- Pengujian deployment pada lingkungan staging/Cloudflare Tunnel (`app-pm-idg.zed.ai.id`).
- Melibatkan tim internal lintas perangkat: Desktop (Chrome, Edge), Android (Chrome, Samsung Internet), dan iOS (Safari Web & Standalone PWA).
- Skenario pengujian terfokus:
  1. Login, refresh token, dan logout multi-user.
  2. Alur pembuatan proyek, aktivitas, mutasi stok, dan unggah dokumen PDF/gambar.
  3. Pengunduhan lampiran dokumen dari host API storage.
  4. Deteksi banner konektivitas saat perangkat masuk ke mode pesawat.

### B. Tahap 2 — Rilis Bertahap & Pemantauan Produksi (1–2 Minggu)

- Deploy build produksi ke server aplikasi dengan `PUBLIC_PWA_ENABLED=true`.
- **Indikator Pemantauan Utama:**
  - Log error Nginx/PHP backend: Memastikan tidak ada lonjakan error 401, 429, atau 500 akibat rate limiter.
  - SvelteKit version polling: Memantau keteraturan pemunculan dialog update prompt saat rilis build baru tanpa insiden chunk mismatch.
  - Interaksi pengguna terhadap tombol _"Pasang Aplikasi"_ di menu akun dan tab pengaturan profil.

### C. Kesiapan Kill-Switch Runtime (Darurat Produksi)

Jika terjadi insiden kritis (misal regresi logic Service Worker di peramban klien):

1. **Langkah Kill-Switch:**
   Ubah environment variable di server frontend (`frontend/.env`):
   ```env
   PUBLIC_PWA_ENABLED=false
   ```
2. **Rebuild / Restart Frontend:**
   ```bash
   cd frontend && npm run build
   # Restart proses frontend server
   ```
3. **Efek Seketika:**
   Fungsi `registerServiceWorker()` otomatis mengeksekusi `unregisterAndClean()`. Seluruh peramban pengguna yang membuka atau me-refresh aplikasi seketika membatalkan registrasi Service Worker dan menghapus seluruh cache lokal `indogreen-*`.

### D. Prosedur Rollback ke Versi Build Sebelumnya

Jika commit aplikasi harus di-rollback ke rilis sebelumnya:

1. Checkout commit sebelumnya via Git dan jalankan `npm run build`.
2. SvelteKit version string otomatis berubah kembali ke hash rilis sebelumnya.
3. Service Worker versi rollback akan aktif, menghapus cache versi yang ditarik pada siklus `activate`, dan mengisi ulang cache aset versi rollback tanpa benturan modul.
4. Sebagai alternatif sementara selama proses rollback, aktifkan kill-switch `PUBLIC_PWA_ENABLED=false`.

---

## 15. Status Roadmap PWA

- [x] **Fase 0:** Audit Kesiapan PWA & Arsitektur
- [x] **Fase 1:** Konfigurasi Dev HTTPS via Cloudflare Tunnel
- [x] **Fase 2:** Web App Manifest, Aset Ikon, & Sinkronisasi Tema
- [x] **Fase 3:** Service Worker, Precache App Shell, & Offline Fallback Navigation
- [x] **Fase 4:** Caching Aset Immutable (Cache-First) & Aset Statis (Stale-While-Revalidate)
- [x] **Fase 5:** Mekanisme Pembaruan Versi, UpdatePrompt UI, & Pencegahan Chunk Error
- [x] **Fase 6:** Fitur Instalasi PWA Multi-Platform & Deteksi Standalone (Menu Akun & Pengaturan)
- [x] **Fase 7:** Ketahanan Konektivitas, Banner Offline, Kategorisasi Error, Navigasi Standalone, & Audit Unduhan Lampiran
- [x] **Fase 8:** Verifikasi QA Menyeluruh, Audit Keamanan, & Laporan Performa PWA
- [x] **Fase 9:** Konsolidasi Dokumentasi, Finalisasi Spesifikasi, & Rencana Rilis Produksi
