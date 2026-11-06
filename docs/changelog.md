# Changelog

## [2026-11-06] — feat(ci): add automated production deployment workflow via github self-hosted runner

- Pembuatan workflow Continuous Deployment (CD) pada `.github/workflows/cd.yml`:
  - Menggunakan GitHub Self-Hosted Runner (`runs-on: self-hosted`) yang berjalan langsung di server VirtualBox (`indogreen-VirtualBox`).
  - Menjalankan sinkronisasi git otomatis (`git fetch` & `git reset --hard origin/main`), instalasi dependensi backend production (`composer install --no-dev`), migrasi database, pembersihan dan regenerasi cache Laravel, build produksi frontend (`npm ci && npm run build`), restart service systemd (`indogreen-backend` dan `indogreen-frontend`), serta health check internal port `8004/up` dan `8005`.
  - Dilengkapi kontrol concurrency per-branch dengan pembatalan otomatis proses lama (`concurrency.group: cd-${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true`) dan dukungan manual trigger (`workflow_dispatch`).
- Dokumentasi:
  - Memperbarui `docs/deployment.md` dengan panduan komprehensif setup GitHub Self-Hosted Runner di VirtualBox, konfigurasi sudo `NOPASSWD` untuk systemctl, dan alur kerja eksekusi otomatis.
- File yang diubah:
  - `.github/workflows/cd.yml`
  - `docs/deployment.md`
  - `docs/changelog.md`


## [2026-11-05] — feat(config): support PREVIEW_ALLOWED_HOSTS and configure indogreen.id HTTPS via Tailscale

- Implementasi konfigurasi domain `indogreen.id` (`pm.indogreen.id` & `api-pm.indogreen.id`) dan pemisahan host header di Vite:
  - Frontend:
    - Memperbarui `frontend/vite.config.ts` untuk mendukung variabel `PREVIEW_ALLOWED_HOSTS` (serta alias `PREVIEW_ALLOWED_HOST`) pada blok `preview: { ... }` dengan fallback aman ke `DEV_ALLOWED_HOSTS`.
    - Memperbarui `frontend/.env` dan `frontend/.env.example` dengan domain HTTPS `pm.indogreen.id` dan `api-pm.indogreen.id`.
  - Backend:
    - Menyesuaikan `APP_URL`, `FRONTEND_URL`, dan `CORS_ALLOWED_ORIGINS` di `backend/.env` dan `backend/.env.example` ke `https://api-pm.indogreen.id` dan `https://pm.indogreen.id`.
  - Dokumentasi & Arsitektur:
    - Menambahkan panduan deployment arsitektur Tailscale Subnet Router + Caddy HTTPS (Let's Encrypt DNS-01 via Rumahweb) pada `docs/deployment.md`.
    - Menambahkan dokumentasi variabel `PREVIEW_ALLOWED_HOSTS` pada `docs/environment-variables.md`.
- File yang diubah:
  - `frontend/vite.config.ts`
  - `frontend/.env`
  - `frontend/.env.example`
  - `backend/.env`
  - `backend/.env.example`
  - `docs/environment-variables.md`
  - `docs/deployment.md`
  - `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Server Vite preview kini dapat diakses melalui host domain custom `pm.indogreen.id` tanpa terblokir proteksi host header. Akses HTTPS siap di-reverse proxy oleh Caddy ke port internal `8005` dan `8004`.

## [2026-11-05] — fix(frontend): eliminate redundant redirect query parameter when navigating to root route

- Perbaikan pengalihan rute otentikasi saat mengakses root (`/`):
  - Mengubah auth guard pada `frontend/src/routes/+layout.ts` agar saat pengguna belum login mengakses root (`/`), pengalihan langsung mengarah ke `/auth/login` tanpa menyertakan query parameter redundan `?redirect=%2F`.
  - Memperbarui `frontend/src/lib/axiosClient.ts` agar pembersihan sesi saat gagal refresh tidak menambahkan `?redirect=%2F` jika pengguna berada pada root `/` atau rute auth.
  - Memperbarui `getSafeInternalRedirect` di `frontend/src/lib/utils/url.ts` agar memperlakukan root path (`/`) atau query root sebagai kondisi fallback default (`/dashboard`), menghindari siklus redirect tambahan setelah login.
  - Menambahkan unit test di `frontend/src/routes/layout.test.ts` dan memperluas pengujian di `frontend/src/lib/utils/url.test.ts`.
- File yang diubah:
  - `frontend/src/routes/+layout.ts`
  - `frontend/src/routes/layout.test.ts`
  - `frontend/src/lib/axiosClient.ts`
  - `frontend/src/lib/utils/url.ts`
  - `frontend/src/lib/utils/url.test.ts`
  - `docs/jwt-auth.md`
  - `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Membuka halaman utama (`/`) dalam keadaan belum terotentikasi kini menghasilkan URL bersih `/auth/login`, sementara membuka halaman spesifik (seperti `/dashboard` atau `/projects`) tetap mempertahankan query parameter `redirect` sesuai tujuan.


## [2026-11-04] — docs(security): synchronize documentation and complete full regression quality gate (Fase 5)

- Penuntasan Fase 5 (Comprehensive Quality Gate & Documentation Synchronization):
  - Sinkronisasi Dokumentasi Sistem:
    - Memperbarui `docs/api-reference.md` dengan batasan domain `@indogreen.id` pada `/auth/register`, *allowlist* RBAC pada `/auth/role`, serta catatan deteksi MIME server-side dan penanganan error pada `/activities`.
    - Melakukan verifikasi konsistensi seluruh dokumen panduan (`docs/role-permission.md`, `docs/jwt-auth.md`, `docs/environment-variables.md`, `docs/security-checklist.md`, `docs/troubleshooting.md`).
  - Eksekusi Full Regression Quality Gate:
    - Backend: 40/40 test suite PHPUnit berhasil lolos (190 assertions, 0 failures).
    - Frontend: 93/93 test suite Vitest berhasil lolos (8 test files, 0 failures).
    - Type check: `svelte-check` 0 error, 0 warning.
    - Production build: `vite build` selesai dengan sukses tanpa peringatan atau error *bundling*.
  - Seluruh 8 temuan audit keamanan (`PM-AC-001`, `PM-CORS-001`, `PM-BIZ-001`, `PM-REDIRECT-001`, `PM-AUTH-001`, `PM-INJ-001`, `PM-INJ-002`, `PM-LOG-001`) dinyatakan tuntas termitigasi.
- File yang diubah:
  - `docs/api-reference.md`
  - `docs/changelog.md`

## [2026-11-03] — fix(security): enforce server-side MIME detection, sanitize error messages, and type-hint activity logging (PM-INJ-001, PM-INJ-002, PM-LOG-001)

- Penuntasan temuan keamanan Fase 4 (`PM-INJ-001`, `PM-INJ-002`, `PM-LOG-001`):
  - Deteksi MIME Server-Side untuk Lampiran File (`PM-INJ-001`):
    - Mengganti penggunaan `$file->getClientMimeType()` yang berasal dari header untrusted klien dengan `$file->getMimeType() ?? 'application/octet-stream'` berbasis file inspection (`finfo` PHP/Symfony) pada `ActivityService`, `CertificateService`, dan `ItemService`.
    - Memperbarui `AIDocumentExtractionService` untuk mendeteksi MIME server-side pada ekstraksi dokumen AI.
  - Sanitasi Pesan Kesalahan Ekstraksi AI & Controller (`PM-INJ-002`):
    - Membersihkan blok `catch (\Exception $e)` pada `ActivityController` (metode `extract` dan `show`) agar tidak lagi mengembalikan pesan exception mentah (`$e->getMessage()`) ke response JSON klien.
    - Menjaga audit trail internal tetap lengkap dengan mencatat detail stack trace aman ke `Log::error`.
  - Sanitasi Tipe Data & Proteksi Path Traversal pada Audit Logging (`PM-LOG-001`):
    - Memperketat `ActivityLogService` dengan type-hinting integer eksplisit (`int $userId`, `?int $userId`) untuk mencegah interpolasi string atau path traversal pada direktori penyimpanan log pengguna.
    - Memperbarui `getUserDirectory` dan `getAllUsers` agar memvalidasi integer disk format (`user_{id}`) secara aman.
  - Penambahan Tests:
    - Menambahkan `AttachmentMimeSecurityTest` (3 feature tests) yang memvalidasi bahwa spoofing MIME header oleh klien ditolak dan MIME server-side tersimpan dengan benar di database.
    - Menambahkan `ExceptionDisclosureSecurityTest` untuk memverifikasi bahwa kegagalan AI tidak membocorkan exception internal atau kredensial ke response API.
    - Menambahkan `ActivityLogServiceSecurityTest` (2 unit tests) untuk menguji proteksi path traversal dan sanitasi folder logging pengguna.
- File yang diubah:
  - `backend/app/Services/ActivityService.php`
  - `backend/app/Services/CertificateService.php`
  - `backend/app/Services/ItemService.php`
  - `backend/app/Services/AIDocumentExtractionService.php`
  - `backend/app/Http/Controllers/ActivityController.php`
  - `backend/app/Services/ActivityLogService.php`
  - `backend/tests/Feature/AttachmentMimeSecurityTest.php`
  - `backend/tests/Feature/ExceptionDisclosureSecurityTest.php`
  - `backend/tests/Unit/ActivityLogServiceSecurityTest.php`
  - `docs/security-checklist.md`
  - `docs/troubleshooting.md`
  - `docs/changelog.md`
- Dampak yang perlu diketahui:
  - MIME type lampiran file di database kini mencerminkan isi biner berkas yang sebenarnya, bukan klaim peramban. Respon API pada kegagalan layanan AI tidak lagi mengekspos rincian exception teknis.

## [2026-11-03] — fix(frontend): eliminate open redirect and harden client security headers (PM-REDIRECT-001, PM-AUTH-001)

- Penuntasan temuan keamanan Fase 3 (`PM-REDIRECT-001` - Medium Severity & `PM-AUTH-001` / Client Hardening):
  - Mitigasi Open Redirect (`PM-REDIRECT-001`):
    - Penambahan fungsi sanitasi terpusat `getSafeInternalRedirect` di `frontend/src/lib/utils/url.ts` yang memvalidasi bahwa path redirect diawali tepat satu slash (`/`), secara ketat menolak URL protokol-relatif (`//`), backslash (`/\` atau `/\\`), skema absolut (`javascript:`, `https:`), dan rute loop `/auth/*`.
    - Mengganti fungsi redirect lokal di `frontend/src/routes/auth/login/+page.svelte` dan `frontend/src/routes/auth/register/_components/RegisterPageClient.svelte` dengan `getSafeInternalRedirect`.
  - Hardening Header Keamanan Server (`PM-AUTH-001` / Hygiene):
    - Memperbarui `frontend/src/hooks.server.ts` dengan menyematkan `X-Frame-Options: SAMEORIGIN` (proteksi clickjacking), `Permissions-Policy: camera=(), microphone=(), geolocation=()`, baseline `Content-Security-Policy` yang kompatibel dengan runtime UI Svelte/Tailwind/Chart.js/SweetAlert2, serta `Strict-Transport-Security` untuk koneksi HTTPS.
  - Sanitasi Skema Tautan Lampiran:
    - Menambahkan `safeAttachmentUrl` dan memperketat `storageUrl` di `frontend/src/lib/utils/url.ts` untuk menolak skema manipulatif (`javascript:`, `data:`, `vbscript:`).
    - Memperbarui komponen `CertificateFormModal.svelte`, `ActivityFormModal.svelte`, `ActivityDetail.svelte`, dan `CertificatesDetail.svelte` agar menggunakan `safeAttachmentUrl`.
  - Penambahan Unit Tests:
    - Membuat `frontend/src/lib/utils/url.test.ts` (11 test case) untuk memverifikasi seluruh vektor eksploitasi URL dan sanitasi lampiran.
    - Memperbarui `frontend/src/hooks.server.test.ts` untuk memverifikasi kehadiran seluruh header keamanan modern.
- File yang diubah:
  - `frontend/src/lib/utils/url.ts`
  - `frontend/src/routes/auth/login/+page.svelte`
  - `frontend/src/routes/auth/register/_components/RegisterPageClient.svelte`
  - `frontend/src/hooks.server.ts`
  - `frontend/src/lib/components/form/CertificateFormModal.svelte`
  - `frontend/src/lib/components/form/ActivityFormModal.svelte`
  - `frontend/src/lib/components/detail/ActivityDetail.svelte`
  - `frontend/src/lib/components/detail/CertificatesDetail.svelte`
  - `frontend/src/lib/utils/url.test.ts`
  - `frontend/src/hooks.server.test.ts`
  - `docs/security-checklist.md`
  - `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Pengguna tidak lagi dapat diarahkan ke situs eksternal phishing via parameter redirect atau next pada halaman login dan registrasi. Seluruh render halaman frontend kini terlindungi dari clickjacking dan eksploitasi skema URI berbahaya.

## [2026-11-03] — fix(security): enforce strict CORS allowlist and restrict registration to @indogreen.id (PM-CORS-001, PM-BIZ-001)

- Penuntasan temuan keamanan Fase 2 (`PM-CORS-001` & `PM-BIZ-001` - Medium Severity):
  - Pengamanan Boundary CORS (`PM-CORS-001`):
    - Mengganti wildcard origin `['*']` dan header `['*']` di `backend/config/cors.php` dengan origin terdaftar berbasis `FRONTEND_URL` (default: `http://localhost:5173`) dan `CORS_ALLOWED_ORIGINS`.
    - Membatasi HTTP methods ke `['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']` dan HTTP headers eksplisit (`Content-Type`, `Authorization`, `Accept`, `X-Requested-With`, `X-CSRF-TOKEN`).
    - Penambahan `CorsSecurityTest` untuk memvalidasi pemblokiran origin asing (`https://malicious-external-site.com`) tanpa eksposur header ACAO wildcard.
  - Tata Kelola & Pengamanan Registrasi Publik (`PM-BIZ-001`):
    - Membatasi endpoint `POST /api/auth/register` khusus untuk domain email resmi perusahaan (`@indogreen.id`) via konfigurasi `auth.registration.allowed_domain`.
    - Menambahkan sakelar enable/disable registrasi (`AUTH_REGISTRATION_ENABLED`).
    - Mengaktifkan interface `MustVerifyEmail` pada model `App\Models\User`.
    - Menyelaraskan format response error validasi registrasi menjadi standard bag (`errors`) untuk konsistensi integrasi dengan client SvelteKit.
    - Penambahan `AuthRegistrationSecurityTest` (5 test cases) memvalidasi penolakan domain luar, keberhasilan domain resmi (case-insensitive), sakelar disable registrasi (HTTP 403), dan validasi password.
  - Pembaruan konfigurasi lingkungan:
    - Menambahkan placeholder `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `AUTH_REGISTRATION_ENABLED`, dan `AUTH_REGISTRATION_ALLOWED_DOMAIN` pada `backend/.env.example`.
- File yang diubah:
  - `backend/config/cors.php`
  - `backend/config/auth.php`
  - `backend/app/Http/Controllers/AuthController.php`
  - `backend/app/Models/User.php`
  - `backend/.env.example`
  - `backend/tests/Feature/CorsSecurityTest.php`
  - `backend/tests/Feature/AuthRegistrationSecurityTest.php`
  - `docs/jwt-auth.md`
  - `docs/environment-variables.md`
  - `docs/security-checklist.md`
  - `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Seluruh request API lintas domain dari origin tidak terdaftar akan diblokir oleh Same-Origin Policy browser.
  - Pendaftaran akun baru di aplikasi kini secara ketat mewajibkan alamat email `@indogreen.id`.

## [2026-11-03] — fix(auth): enforce strict role and permission allowlist in RoleController (PM-AC-001)

- Penuntasan temuan keamanan Fase 1 (`PM-AC-001` - High Severity):
  - Menghapus sink dinamis `Role::firstOrCreate` dan `Permission::firstOrCreate` pada `backend/app/Http/Controllers/RoleController.php`.
  - Menerapkan *allowlist* kanonikal untuk role (`Rule::in(['staff', 'user'])` untuk admin, dan `['super_admin', 'admin', 'staff', 'user']` untuk super_admin).
  - Menerapkan validasi ketat terhadap 38 permission kanonikal; setiap key permission tak dikenal langsung ditolak dengan status HTTP 422.
  - Menambahkan konfigurasi `system_roles` dan `system_modules` pada `backend/config/permission.php`.
  - Mengamankan endpoint `/auth/role/config` agar hanya menyajikan role resmi aplikasi.
  - Penambahan comprehensive test suite `backend/tests/Feature/RolePermissionSecurityTest.php` (11 test case) mencakup pencegahan injeksi role arbitrer, pencegahan injeksi permission liar, isolasi hierarki admin, serta verifikasi pembaruan sah.
- File yang diubah:
  - `backend/app/Http/Controllers/RoleController.php`
  - `backend/config/permission.php`
  - `backend/tests/Feature/RolePermissionSecurityTest.php`
  - `docs/role-permission.md`
  - `docs/security-checklist.md`
  - `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Aktor admin maupun super_admin tidak lagi dapat menyuntikkan nama role baru atau permission liar ke dalam database via API role assignment. Seluruh role dan permission wajib terdaftar dan ter-seed sebelumnya.

## [2026-11-03] — feat(ci): add GitHub Actions workflow and security-audit skill

- Penambahan GitHub Actions workflow (`.github/workflows/ci.yml`):
  - Dikonfigurasi untuk berjalan otomatis hanya pada branch `main` dan `development` (push & pull_request) serta mendukung pemicu manual `workflow_dispatch`.
  - Menggunakan concurrency group untuk membatalkan build usang saat commit baru didorong.
  - Job `backend`: setup PHP 8.4, dependency cache Composer, verifikasi environment (generasi `APP_KEY` dan `JWT_SECRET`), serta fallback `JWT_SECRET` di `phpunit.xml` untuk test execution in-memory SQLite.
  - Job `frontend`: setup Node.js 22, dependency cache NPM, otomatisasi penyiapan `.env` dari `.env.example` sebelum `svelte-kit sync`, pengecekan lint & style (Prettier + ESLint), typecheck (svelte-check), instalasi browser Playwright Chromium, unit & component test runner (Vitest), dan verifikasi build produksi (Vite).
- Penambahan skill `security-audit` dari workspace `catatz`:
  - Diintegrasikan ke `.agents/skills/security-audit/` dan `.claude/skills/security-audit/` lengkap dengan 20 panduan domain, skema laporan vulnerability, dan script verifikasi finding.
  - Pembaruan pemetaan skill pada `CLAUDE.md`, `AGENTS.md`, `docs/folder-structure.md`, dan `docs/deployment.md`.
- File yang diubah:
  - `.github/workflows/ci.yml`, `.agents/skills/security-audit/**`, `.claude/skills/security-audit/**`, `CLAUDE.md`, `AGENTS.md`, `docs/deployment.md`, `docs/folder-structure.md`, `docs/changelog.md`.
- Dampak yang perlu diketahui:
  - Setiap perubahan ke branch `main` dan `development` akan divalidasi secara otomatis dan terisolasi di GitHub CI. Tim pengembang dan AI assistant kini dapat menjalankan audit keamanan mendalam berbasis artefak evidence terstruktur.

## [2026-11-03] — feat(agents): implement ECC framework for multi-agent workflows

- Integrasi framework Everything Claude Code (ECC, `affaan-m/ECC`) ke dalam repositori:
  - Penambahan `CLAUDE.md` di root sebagai project kernel untuk Claude Code dengan Prompt Defense Baseline, arsitektur sistem, aturan coding, daftar perintah slash, daftar subagent, dan pemetaan skill.
  - Penambahan konfigurasi `.claude/` yang memuat aturan modular (`rules/`), subagent personas (`agents/`), perintah slash (`commands/`), dan workflow skills (`skills/`).
  - Penambahan `.agents/skills/` untuk menyediakan skill ECC universal yang dapat diakses oleh Antigravity, Codex, dan OpenClaw.
  - Kurasi skill & aturan yang diselaraskan dengan stack proyek: Laravel 13 (`laravel-patterns`, `laravel-security`, `laravel-tdd`, `laravel-verification`), SvelteKit 5 & Vite 7 (`vite-patterns`), serta alur kualitas (`tdd-workflow`, `conventional-commit-review`, `database-migrations`, `git-workflow`, `security-review`, `docs-governance`).
  - Pembaruan `AGENTS.md`, `docs/folder-structure.md`, dan `docs/ai-development-rules.md` untuk sinkronisasi dokumentasi AI agent.
- File yang diubah:
  - `CLAUDE.md`, `.claude/**`, `.agents/**`, `AGENTS.md`, `docs/folder-structure.md`, `docs/ai-development-rules.md`, `docs/changelog.md`.
- Dampak yang perlu diketahui:
  - Claude Code, Antigravity, dan AI coding assistant lainnya kini dapat mendelegasikan tugas ke subagent spesifik, menjalankan workflow TDD/code review, dan mengikuti standar keamanan secara konsisten tanpa overhead token berlebih.

## [2026-11-03] — chore(deps): upgrade dependencies to latest stable versions across frontend and backend

- Pembaruan dependensi backend (Laravel 13):
  - `laravel/framework` diperbarui dari `v13.12.0` ke `v13.39.0`.
  - `laravel/sanctum` diperbarui ke `v4.3.3`.
  - `php-open-source-saver/jwt-auth` diperbarui ke `v2.9.3`.
  - `spatie/laravel-permission` diperbarui ke `v7.4.2` (versi stabil branch v7).
  - `laravel/ai` diperbarui ke `v0.6.8`.
  - Dev dependencies diperbarui: `fakerphp/faker` v1.24, `laravel/pail` v1.2.7, `laravel/pint` v1.32.1, `laravel/sail` v1.69.0, `mockery/mockery` v1.6.15, `nunomaduro/collision` v8.9.5, `phpunit/phpunit` v11.5.57.
  - Penyelarasan route dan test stock-movements: mempertahankan ketersediaan route `update` dan `destroy` pada `backend/routes/api.php` serta memperbarui unit test di `WarehouseModuleTest.php` agar memverifikasi ketersediaan route edit/delete sesuai implementasi fitur riil (stok reversal) di frontend dan backend.
  - Penyesuaian kompatibilitas PHP 8.5 pada `backend/config/database.php` untuk konstanta `PDO::MYSQL_ATTR_SSL_CA`.
- Pembaruan dependensi frontend (SvelteKit & Vite):
  - `@sveltejs/kit` diperbarui ke `^2.70.3` dan `@sveltejs/vite-plugin-svelte` ke `^6.2.4`.
  - `svelte` diperbarui ke `^5.57.3` dan `svelte-check` ke `^4.7.8`.
  - `vite` diperbarui ke `^7.3.7`.
  - `tailwindcss` dan `@tailwindcss/vite` diperbarui ke `^4.3.3`.
  - `@tailwindplus/elements` diperbarui ke `^1.0.22`.
  - `axios` diperbarui ke `^1.21.0`.
  - `chart.js` diperbarui ke `^4.6.1`.
  - `sweetalert2` diperbarui ke `^11.26.25`.
  - `typescript` diperbarui ke `^5.9.3` dan `typescript-eslint` ke `^8.72.1`.
  - `eslint` diperbarui ke `^9.39.5` dan `eslint-plugin-svelte` ke `^3.23.1`.
  - `vitest` dan `@vitest/browser` diperbarui ke `^3.2.7`, `playwright` ke `^1.64.1`.
  - `postcss` diperbarui ke `^8.5.32`, `autoprefixer` ke `^10.6.2`.
- Validasi & Stabilitas:
  - Frontend typecheck (`svelte-check`), linting (`eslint` + `prettier`), unit tests (`vitest`), dan build produksi (`vite build`) lulus tanpa error.
  - Backend automated tests (`php artisan test`) 15 passed, 81 assertions lulus 100%.
- Dampak yang perlu diketahui:
  - Seluruh pustaka runtime dan dev-tools beroperasi pada rilis mutakhir dan aman dari kerentanan tanpa mengubah arsitektur, struktur routing, atau fungsionalitas UI yang berjalan.


## [2026-11-02] — docs(pwa): phase 9 documentation consolidation and production release plan

- Finalisasi spesifikasi komprehensif PWA pada `docs/features/pwa.md`: detail arsitektur, strategi cache, daftar eksplisit 11 kategori yang tidak di-cache, siklus update terisolasi, 3 lapis kill-switch, batasan iOS WebKit standalone, panduan debug DevTools, dan rencana rilis bertahap 2 minggu dengan prosedur rollback.
- Pembaruan dokumen repositori:
  - `docs/overview.md`: pembaruan status PWA menjadi aktif dan penegasan batasan operasional offline (hanya fallback navigasi, tanpa penulisan data offline).
  - `README.md` & `docs/README.md`: penambahan fitur PWA pada ringkasan utama dan indeks dokumentasi.
  - `docs/architecture.md`: penambahan layer Service Worker, server security hooks, dan trusted proxies pada diagram alur dan tabel stack komunikasi.
  - `docs/folder-structure.md`: dokumentasi lengkap file PWA, server hooks, store pwa/connectivity, utilitas platform, dan komponen UI.
  - `docs/deployment.md`: penambahan checklist pre/post-deployment PWA dan instruksi monitoring.
  - `docs/environment-variables.md`: dokumentasi variabel `PUBLIC_PWA_ENABLED` (kill-switch runtime).
  - `AGENTS.md`: penambahan aturan kebersihan cache Service Worker (zero-sensitive data) dan kontrak dokumentasi PWA untuk seluruh coding assistant.

## [2026-11-01] — test(pwa): phase 8 QA matrix, security verification, and performance report

- Verifikasi menyeluruh checklist keamanan PWA, performa Lighthouse, dan kapasitas Cache Storage.
- Penambahan konfigurasi Trusted Proxies di Laravel (`backend/bootstrap/app.php`: `$middleware->trustProxies(at: '*')`) agar rate limiter SlidingWindowThrottle mengenali IP pengguna asli peramban di balik Cloudflare Tunnel, dilengkapi unit test di `RateLimiterTest.php`.
- Penguatan Service Worker caching (`src/service-worker.ts`) dengan pengecekan `!networkResponse.headers.has('set-cookie')` untuk mencegah caching respons sensitif ber-cookie.
- Penambahan server handle hook (`src/hooks.server.ts` & unit test) yang menyematkan header keamanan HTTP (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) dan header `Cache-Control: no-cache, no-store, must-revalidate` pada `/service-worker.js` dan `/manifest.webmanifest`.
- Penambahan meta tag referrer policy di `src/app.html`.
- Pengujian otomatis: 81 unit test Vitest lulus, svelte-check 0 error, build produksi Vite sukses, dan pengujian backend Laravel rate limiter lulus.
- Pembaruan dokumen: `docs/security-checklist.md`, `docs/features/pwa.md`, `docs/troubleshooting.md`, `docs/changelog.md`.

## [2026-11-01] — feat(pwa): phase 7 connectivity store, offline banner, error handling, and standalone polish

- Pembuatan store reaktif `src/lib/stores/connectivity.ts` (`isOnline`) berbasis `navigator.onLine` dan event window `online`/`offline` dengan penanganan aman untuk SSR/Node 26 serta 2 unit test Vitest.
- Pemasangan banner notifikasi offline tipis non-blokir di `src/routes/+layout.svelte` (_"Anda offline. Perubahan tidak dapat disimpan."_) dengan gaya amber ramping `sticky top-0 z-50`.
- Standardisasi penanganan error API pada `src/lib/utils/errors.ts` (`extractApiErrors`) ke dalam 3 kategori terarah lengkap dengan 11 unit test Vitest:
  - Kasus a (tanpa respons / network drop / timeout): _"Tidak dapat terhubung ke server. Periksa koneksi internet Anda."_
  - Kasus b (server gateway 502/503/504): _"Server sedang tidak dapat dihubungi. Coba lagi beberapa saat."_
  - Kasus c (respons standar Laravel): penanganan validasi 422, custom error message, atau fallback default.
- Seluruh formulir modal aplikasi otomatis terproteksi oleh pesan error terarah tanpa perubahan massal komponen.
- Penambahan tombol "Kembali" pada `TopNav.svelte` khusus untuk mode standalone saat berada di rute detail (`/projects/[id]`, `/activities/[id]`, `/mitras/[id]`, `/certificates/[id]`, `/barang-certificates/[id]`) dengan helper murni `getDetailParentHref(pathname)` di `nav.ts` (7 unit test) dan fallback navigasi ke rute induk.
- Verifikasi dan dokumentasi audit pengalaman standalone: evaluasi safe-area TopNav, isolasi pull-to-refresh melalui `scroll-lock.ts`, dan mekanisme unduhan berkas lampiran lintas origin di iOS Safari & Android Chrome.
- File yang diubah:
  - Frontend: `src/lib/stores/connectivity.ts`, `src/lib/stores/connectivity.test.ts`, `src/lib/utils/errors.ts`, `src/lib/utils/errors.test.ts`, `src/lib/components/layout/nav.ts`, `src/lib/components/layout/nav.test.ts`, `src/lib/components/layout/TopNav.svelte`, `src/routes/+layout.svelte`
  - Docs: `docs/features/pwa.md`, `docs/frontend-guidelines.md`, `docs/troubleshooting.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Pengguna mendapatkan umpan balik konektivitas seketika saat jaringan putus tanpa mengunci navigasi data yang sudah dimuat.
  - Pengguna mode standalone di ponsel cerdas memiliki navigasi "Kembali" yang jelas di halaman detail tanpa kehilangan tombol drawer menu.

## [2026-11-01] — feat(pwa): phase 6 install button, multi-platform detection, and standalone handling

- Pembuatan modul pure utility `src/lib/utils/pwa-platform.ts` dengan 18 unit test: mendeteksi `isStandalone()`, `isIOS()`, `isIOSSafari()`, dan `canShowIOSInstallHint()`.
- Perluasan store `src/lib/stores/pwa.ts`: menambahkan `deferredPrompt`, `canInstall`, `isInstalled`, penangkapan event `beforeinstallprompt` (preventDefault + capture) dan `appinstalled`, serta fungsi `triggerInstallPrompt()`.
- Pembuatan komponen `src/lib/components/pwa/InstallButton.svelte` dengan dukungan multi-varian:
  - Varian `menu`: tombol _"Pasang Aplikasi"_ di menu akun sidebar (`AppSidebar.svelte`), persis di atas opsi _"Pengaturan"_.
  - Varian `card`: kartu status dan aksi _"Aplikasi Web (PWA)"_ di halaman pengaturan (`ProfileSettingsTab.svelte`).
  - Penanganan native prompt pada peramban Chromium desktop dan Android.
  - Dialog modal instruksi 3 langkah untuk Apple iOS Safari ("Bagikan" -> "Tambah ke Layar Utama" -> "Tambah") lengkap dengan catatan penting login ulang.
  - Sembunyi otomatis saat aplikasi sudah berjalan dalam mode standalone.
  - Tanpa popup banner otomatis yang mengganggu di halaman login atau saat awal memuat.
- File yang diubah:
  - Frontend: `src/lib/utils/pwa-platform.ts`, `src/lib/utils/pwa-platform.test.ts`, `src/lib/stores/pwa.ts`, `src/lib/stores/pwa.test.ts`, `src/lib/pwa/register.ts`, `src/lib/components/pwa/InstallButton.svelte`, `src/lib/components/layout/AppSidebar.svelte`, `src/routes/settings/_components/ProfileSettingsTab.svelte`
  - Docs: `docs/features/pwa.md`, `docs/features/settings.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Pengguna di perangkat Android, Desktop, maupun iOS Safari kini dapat menginstal aplikasi PWA secara intuitif melalui menu akun atau pengaturan tanpa terganggu oleh popup banner otomatis.

## [2026-11-01] — feat(pwa): phase 5 update prompt UI, version polling, and chunk reload guard

- Pembuatan store PWA terpusat (`src/lib/stores/pwa.ts`) dengan properti writable `{ updateReady, registration }` dan unit test Vitest lengkap.
- Penambahan deteksi worker baru pada `src/lib/pwa/register.ts`: deteksi status `waiting` dan event `updatefound -> statechange 'installed'` saat controller aktif.
- Penambahan polling berkala `registration.update()` pada Service Worker saat tab `visibilityState === 'visible'` dan tiap ~60 menit.
- Pengaktifan SvelteKit version polling `kit.version.pollInterval: 300000` (5 menit) pada `svelte.config.js`.
- Pembuatan komponen banner update non-blokir (`src/lib/components/pwa/UpdatePrompt.svelte`) dengan tombol "Perbarui sekarang" dan "Nanti":
  - Komunikasi `postMessage({ type: 'SKIP_WAITING' })` ke worker baru.
  - Listener `controllerchange` dengan guard flag `pwa_refreshing` untuk mencegah reload loop.
  - Proteksi modal/drawer terbuka (`body[data-scroll-locked='true']`): menunda auto-reload dan menampilkan dialog konfirmasi SweetAlert2 sebelum user menyetujui reload.
- Penanganan navigasi stale tab via hook `beforeNavigate`: memaksa full reload native saat versi baru terdeteksi sehingga terhindar dari chunk mismatch error (_"Failed to fetch dynamically imported module"_).
- Pemasangan `<UpdatePrompt />` di root layout (`src/routes/+layout.svelte`) agar aktif di seluruh rute termasuk halaman autentikasi.
- File yang diubah:
  - Frontend: `src/lib/stores/pwa.ts`, `src/lib/stores/pwa.test.ts`, `src/lib/pwa/register.ts`, `src/lib/components/pwa/UpdatePrompt.svelte`, `src/routes/+layout.svelte`, `svelte.config.js`
  - Docs: `docs/features/pwa.md`, `docs/frontend-guidelines.md`, `docs/troubleshooting.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Pengguna secara otomatis mendapatkan pemberitahuan visual elegan saat versi baru dirilis tanpa kehilangan pekerjaan yang sedang diinput di dalam modal atau formulir.
  - Navigasi pada tab lama setelah deploy baru akan memuat bundle terbaru secara mulus tanpa error modul.

## [2026-11-01] — feat(pwa): phase 4 immutable asset caching and cache pruning

- Implementasi strategi **Cache-First** untuk aset immutable (`/_app/immutable/**`) ke cache `indogreen-assets-${version}`.
- Penambahan filter respons ketat: hanya menyimpan respons berstatus `status === 200` dan `type === 'basic'` (mencegah cache respons opaque, redirect, atau error).
- Implementasi strategi **Stale-While-Revalidate (SWR)** untuk aset statis origin sendiri (`/icons/*`, `/indogreen.png`, `/favicon.*`, manifest, dan offline page) ke cache `indogreen-static-${version}`.
- Pembuatan fungsi murni pemangkasan cache (`getExcessKeys` dan `pruneCache`) berbasis FIFO (First-In, First-Out) dengan batasan kapasitas:
  - Maksimal 150 entri untuk cache aset immutable (`MAX_IMMUTABLE_ASSETS = 150`).
  - Maksimal 50 entri untuk cache aset statis (`MAX_STATIC_ASSETS = 50`).
- Penambahan 12 unit test baru di `src/lib/pwa/sw-routing.test.ts` (total 31 unit test lulus): menguji identifikasi aset logo/favicon, logika pemangkasan FIFO, penanganan batas negatif/nol, dan ketahanan terhadap error I/O storage.
- Jaminan proteksi tetap aktif: `/api/*`, `/storage/*`, `__data.json`, navigasi HTML, non-GET, lintas origin, respons selain 200, dan request ber-Authorization tetap di-bypass 100%.
- Pembersihan cache versi lama secara otomatis pada siklus `activate` Service Worker sehingga tidak ada benturan hash modul pada deploy berturut-turut.
- File yang diubah:
  - Frontend: `src/service-worker.ts`, `src/lib/pwa/sw-routing.ts`, `src/lib/pwa/sw-routing.test.ts`
  - Docs: `docs/features/pwa.md`, `docs/architecture.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Pada kunjungan kedua (second visit), transfer jaringan untuk aset JS/CSS turun menjadi **0 B** (penghematan bandwidth >99.8%).
  - Navigasi dokumen HTML tetap Network-Only untuk menjaga kesegaran sesi dan otentikasi.

## [2026-10-31] — feat(pwa): phase 3 service worker, routing classifier, and offline fallback

- Implementasi Service Worker (`src/service-worker.ts`) menggunakan modul bawaan SvelteKit `$service-worker`.
- Penambahan pure request classifier (`src/lib/pwa/sw-routing.ts`) dengan 19 unit test Vitest (project server): menjamin bahwa `/api/*`, `/storage/*`, `__data.json`, request non-GET, lintas origin, dan request ber-Authorization tidak pernah diintersep/dicache.
- Pembuatan halaman offline mandiri (`static/offline.html`) dengan CSS inline, dukungan Dark Mode, dan tombol muat ulang.
- Strategi caching terpisah: precache eksplisit untuk aset statis dasar (offline, manifest, icons), network-only untuk navigasi dokumen HTML dengan offline fallback, dan bypass penuh untuk request dinamis.
- Modul pendaftaran dan kill-switch runtime (`src/lib/pwa/register.ts`) dengan auto-cleanup saat berada di mode DEV atau saat `PUBLIC_PWA_ENABLED=false`.
- Konfigurasi `svelte.config.js` (`kit.serviceWorker.register = false`) untuk registrasi manual terkontrol.
- File yang diubah:
  - Frontend: `src/service-worker.ts`, `src/lib/pwa/sw-routing.ts`, `src/lib/pwa/sw-routing.test.ts`, `src/lib/pwa/register.ts`, `static/offline.html`, `svelte.config.js`, `src/routes/+layout.svelte`, `.env.example`
  - Docs: `docs/features/pwa.md`, `docs/architecture.md`, `docs/security-checklist.md`, `docs/troubleshooting.md`, `docs/folder-structure.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Aplikasi kini memiliki Service Worker aktif pada mode produksi yang menyediakan fallback halaman offline saat koneksi terputus.
  - Perilaku jaringan untuk API, upload/unduh berkas, dan autentikasi tetap 100% normal tanpa risiko stale data.

## [2026-10-31] — feat(pwa): phase 2 manifest, icons, and theme synchronization

- Penambahan file Web App Manifest (`manifest.webmanifest`) dengan metadata PWA lengkap dan 4 shortcut aplikasi (Dashboard, Project, Aktivitas, Keuangan).
- Pembuatan aset ikon standar di `frontend/static/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (safe zone 80% terverifikasi), dan `apple-touch-icon-180.png` dari master `indogreen.png`.
- Pemasangan metadata PWA dan link manifest pada `src/app.html`.
- Sinkronisasi dinamis `<meta name="theme-color">` pada `src/routes/+layout.svelte` saat toggle tema manual.
- Pembuatan dokumentasi fitur `docs/features/pwa.md` dan pembaruan `folder-structure.md` serta `frontend-guidelines.md`.
- File yang diubah:
  - Frontend: `frontend/static/manifest.webmanifest`, `frontend/static/icons/*`, `frontend/src/app.html`, `frontend/src/routes/+layout.svelte`
  - Docs: `docs/features/pwa.md`, `docs/folder-structure.md`, `docs/frontend-guidelines.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Browser mobile kini dapat mengenali aplikasi sebagai Progressive Web App (PWA) yang siap di-install.
  - Perilaku aplikasi dan alur auth `/auth/*` tetap identik dengan sebelumnya.

## [2026-10-31] — feat(pwa): phase 1 cloudflare tunnel setup & dev environment

- Konfigurasi environment development HTTPS via Cloudflare Tunnel untuk pengujian PWA mobile via data seluler.
- Penambahan dukungan `DEV_ALLOWED_HOSTS`, `HMR_PROTOCOL`, dan `HMR_CLIENT_PORT` pada `vite.config.ts`.
- Template ingress `cloudflared` (locally-managed dan remote-managed) untuk port 8005 (frontend) dan port 8004 (backend).
- Dokumentasi unit systemd auto-start (`setup-auto-start.md`), checklist dashboard Cloudflare, troubleshooting tunnel, dan pembaruan arsitektur.
- File yang diubah:
  - Frontend: `frontend/vite.config.ts`, `frontend/.env.example`
  - Backend: `backend/.env.example`
  - Docs: `docs/deployment.md`, `docs/setup-auto-start.md`, `docs/environment-variables.md`, `docs/security-checklist.md`, `docs/troubleshooting.md`, `docs/architecture.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - Operator dapat menjalankan dev server di belakang Cloudflare Tunnel tanpa error `Invalid Host header` atau HMR WebSocket failure.
  - Akses LAN via HTTP tidak lagi mendukung pengujian session login jika menggunakan cookie Secure.

## [2026-09-25] — feat(activities): add Purchase Requisition category

- Menambahkan opsi kategori 'Purchase Requisition' pada aktivitas proyek (DB enum, validasi request backend, AI document extraction, factory, serta tipe dan opsi frontend).
- Disediakan query DDL ALTER TABLE langsung untuk database production tanpa menjalankan migration.
- File yang diubah:
  - Backend: `database/migrations/2025_06_13_075840_create_activities_table.php`, `app/Http/Requests/ActivityRequest.php`, `app/Services/ActivityService.php`, `app/Services/AIDocumentExtractionService.php`, `database/factories/ActivityFactory.php`
  - Frontend: `src/lib/types/activity.ts`, `src/lib/constants/activity.ts`
  - Docs: `docs/database-schema.md`, `docs/database-migrations.md`, `docs/features/aktivitas.md`, `docs/changelog.md`
- Dampak yang perlu diketahui:
  - User dapat memilih 'Purchase Requisition' saat membuat/mengedit aktivitas atau memfilter aktivitas berdasarkan kategori tersebut.
  - Perlu menjalankan query `ALTER TABLE activities MODIFY COLUMN ...` pada database produksi.

## [2026-06-24] — feat(inventory): add item attachments, placement, and stock movement CRUD

- Menambahkan fitur lampiran (attachments) untuk master data items/material (file upload, rename, delete).
- Menambahkan field `placement` (rak/lokasi penyimpanan) pada tabel `inventories` dan menampilkan lokasinya di detail drawer gudang serta tabel item.
- Menghapus batasan immutable pada mutasi stok (stock movements) dan mengimplementasikan CRUD (show detail dengan informasi placement/rak, edit quantity/catatan/waktu/placement, dan delete mutasi dengan penyesuaian stok otomatis).
- File yang diubah:
  - Backend: `database/migrations/2026_06_24_000001_create_item_attachments_table.php`, `database/migrations/2026_06_01_000004_create_inventories_table.php`, `app/Models/ItemAttachment.php`, `app/Models/Item.php`, `app/Models/Inventory.php`, `app/Models/StockMovement.php`, `app/Services/ItemService.php`, `app/Services/WarehouseService.php`, `app/Http/Controllers/ItemController.php`, `app/Http/Controllers/StockMovementController.php`, `app/Http/Requests/ItemRequest.php`, `app/Http/Requests/StockMovementUpdateRequest.php`, `app/Http/Resources/ItemResource.php`, `app/Http/Resources/WarehouseResource.php`, `database/seeders/RolePermissionSeeder.php`, `app/Http/Controllers/RoleController.php`, `routes/api.php`
  - Frontend: `src/lib/inventory.ts`, `src/lib/services/inventoryService.ts`, `src/routes/items/_components/ItemsPageClient.svelte`, `src/routes/items/_components/ItemTable.svelte`, `src/routes/warehouses/_components/WarehousesPageClient.svelte`, `src/routes/stock-movements/_components/stock-movement.ts`, `src/routes/stock-movements/_components/StockMovementsPageClient.svelte`, `src/routes/stock-movements/_components/StockMovementModal.svelte`
- Dampak yang perlu diketahui:
  - Perlu menjalankan `php artisan migrate` atau `php artisan migrate:fresh` untuk memperbarui skema database (tabel `item_attachments` baru dan kolom `placement` pada `inventories`).
  - Mutasi stok sekarang bisa diedit dan didelete, dan akan melakukan adjustment otomatis pada jumlah stok barang di gudang asal/tujuan.

## [2026-06-23] — feat(api): bypass rate limiting for authenticated users

- Menghindari rate limiting (SlidingWindowThrottle) ketika user sudah terautentikasi (login), dan tetap menerapkannya jika user belum login.
- File yang diubah:
  - `app/Http/Middleware/SlidingWindowThrottle.php`
  - `tests/Feature/RateLimiterTest.php`
  - `docs/api-reference.md`
  - `docs/jwt-auth.md`
  - `docs/architecture.md`
- Dampak yang perlu diketahui:
  - User terautentikasi tidak akan lagi dibatasi oleh rate limiter pada endpoint API/auth terlindungi.
  - Rate limiter (5 req/60s) tetap membatasi guest pada endpoint register & login.

## [Unreleased]

### Added

- Dokumentasi project lengkap di folder `docs/`.
  - Overview dan arsitektur aplikasi.
  - Database schema dari 18 migration.
  - Panduan database migration.
  - Dokumentasi JWT authentication flow.
  - Dokumentasi role & permission (RBAC).
  - API reference lengkap.
  - Frontend guidelines.
  - Dokumentasi fitur: Dashboard, Proyek, Aktivitas, Mitra, Sertifikat, Keuangan, Inventori, Settings, Auth.
  - Panduan deployment.
  - Security checklist.
  - Troubleshooting guide.
  - AI development rules.
  - Folder structure documentation.
  - Setup local development guide.
  - Environment variables documentation.
- `README.md` root yang ringkas dan mengarahkan ke `docs/`.
