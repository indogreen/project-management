# Fitur: Progressive Web App (PWA)

> **Status Fitur:** Dalam Pengerjaan (Fase 3 Selesai: Service Worker, Routing Classifier, & Offline Fallback Navigation)

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
3. **`immutable-asset` (Aset build ber-hash):**
   - Path diawali `/_app/immutable/`.
   - Pada Fase 3 berstatus *bypass* (akan diaktifkan strategi cache-first pada Fase 4).
4. **`static-asset` (Aset statis terverifikasi):**
   - Berkas `/offline.html`, `/manifest.webmanifest`, dan `/icons/*`.
   - **Strategi: Cache-First.** Mengambil dari cache statis jika tersedia, dengan network fallback.

### B. Siklus Hidup (Lifecycle) Service Worker
- **Nama Cache:** `indogreen-static-${version}` dan `indogreen-assets-${version}` (menggunakan `$service-worker` `version`).
- **Install:** Melakukan precache **HANYA** pada daftar eksplisit:
  `['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon-180.png']`.
  Gagal mengunduh salah satu aset akan membatalkan instalasi worker (tanpa menelan error).
  Instalasi **tidak memanggil skipWaiting otomatis** untuk menjaga kestabilan sesi klien aktif.
- **Activate:** Menghapus seluruh cache lama yang berprefix `indogreen-` yang versinya tidak cocok dengan versi aktif saat ini.
- **Message Listener:** Mendengarkan pesan `{ type: 'SKIP_WAITING' }` untuk memicu `sw.skipWaiting()` saat pengguna menyetujui pembaruan versi (Fase 5).

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

## 4. Halaman Offline (`static/offline.html`)

Halaman offline dirancang mandiri tanpa dependensi JavaScript eksternal:
- Berbahasa Indonesia ramah pengguna: *"Anda sedang offline"*.
- Mengedukasi bahwa pembaruan aktivitas, mutasi stok, dan pencatatan keuangan memerlukan koneksi aktif demi integritas data.
- Tombol aksi *"Coba lagi"* (`location.reload()`).
- Tampilan responsif dengan dukungan Dark Mode otomatis berbasis `@media (prefers-color-scheme: dark)`.
- Menggunakan logo kecil dari ikon yang telah di-precache (`/icons/icon-192.png`).

---

## 5. Palet Warna & Metadata Tema

| Elemen | Mode Terang (Light) | Mode Gelap (Dark) | Keterangan |
|---|---|---|---|
| Background Halaman | `#f3f4f6` | `#262626` | Warna latar dasar aplikasi |
| Card & TopNav | `#ffffff` | `#000000` | Header atas & kartu komponen |
| Primary Accent | `#4f46e5` | `#4f46e5` | Warna utama (Indigo) |
| `theme-color` Meta | `#ffffff` | `#000000` | Warna status bar browser / PWA shell |

### Sinkronisasi Dinamis di Runtime
Pada `src/routes/+layout.svelte`, listener `theme.subscribe()` memantau perubahan tema secara real-time. Ketika pengguna menekan tombol toggle tema di TopNav, elemen `<meta name="theme-color">` pada DOM diperbarui seketika (`#ffffff` untuk light, `#000000` untuk dark) sehingga status bar ponsel berubah selaras dengan tema aplikasi.

---

## 3. Web App Manifest (`manifest.webmanifest`)

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

## 4. Standar Aset Ikon

Semua aset ikon di-generate dari master `frontend/static/indogreen.png` (resolusi 1254x1254, latar solid) dan disimpan di `frontend/static/icons/`:

| Nama File | Dimensi | Format & Tipe | Tujuan (Purpose) | Keterangan |
|---|---|---|---|---|
| `icon-192.png` | 192x192 px | PNG RGB, latar solid | `any` | Home screen & splash screen Android standar |
| `icon-512.png` | 512x512 px | PNG RGB, latar solid | `any` | PWA installation dialog & high-res display |
| `icon-maskable-512.png` | 512x512 px | PNG RGB, latar solid | `maskable` | Konten berada dalam safe zone 80% (radius aman 204.8 px) agar tidak terpotong adaptive icon Android |
| `apple-touch-icon-180.png` | 180x180 px | PNG RGB, latar solid | iOS Web Clip | Home screen icon Safari iOS (tanpa transparansi) |

> ⚠️ **Catatan Penting:** Master `frontend/static/indogreen.png` dipertahankan dan tidak diubah/ditimpa karena tetap digunakan untuk favicon dan logo sidebar navigasi.

---

## 5. Metadata PWA di `app.html`

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

## 6. Roadmap PWA Selanjutnya

- [x] **Fase 0:** Audit Kesiapan PWA & Arsitektur
- [x] **Fase 1:** Konfigurasi Dev HTTPS via Cloudflare Tunnel
- [x] **Fase 2:** Web App Manifest, Aset Ikon, & Sinkronisasi Tema
- [x] **Fase 3:** Service Worker, Precache App Shell, & Offline Fallback Navigation
- [ ] **Fase 4:** PWA Install Prompt Banner & Caching Aset Immutable

