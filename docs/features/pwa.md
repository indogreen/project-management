# Fitur: Progressive Web App (PWA)

> **Status Fitur:** Dalam Pengerjaan (Fase 2 Selesai: Manifest, Ikon Standar, & Sinkronisasi Tema)

---

## 1. Ringkasan Fitur

Aplikasi **Indogreen Project Management** dikonfigurasi sebagai Progressive Web App (PWA) agar pengguna di perangkat seluler (Android & iOS) dan desktop dapat menginstal aplikasi langsung ke home screen dengan tampilan mandiri (*standalone app*) tanpa address bar browser.

---

## 2. Palet Warna & Metadata Tema

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
- [ ] **Fase 3:** Service Worker, Precache App Shell, & Offline Fallback Navigation
- [ ] **Fase 4:** PWA Install Prompt Banner & UX Flow

