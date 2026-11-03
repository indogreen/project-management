# Indogreen Project Management — AI Agent Operating Manual

File ini adalah **instruksi repository-level** yang berlaku untuk semua AI coding assistant yang bekerja di repo ini, termasuk **Antigravity, Qoder, Claude Code, Codex, OpenClaw, dan Hermes**.

Baca file ini sepenuhnya sebelum mengerjakan task apapun.

---

## 1. Project Overview

**Indogreen Project Management** adalah aplikasi manajemen proyek internal berbasis arsitektur separated fullstack:

| Layer    | Teknologi                                                           |
| -------- | ------------------------------------------------------------------- |
| Frontend | SvelteKit 5, Svelte 5 Runes, Tailwind CSS 4, Vite 7                 |
| Backend  | Laravel 13, PHP 8.4                                                 |
| Auth     | JWT (HS256) via `php-open-source-saver/jwt-auth`                    |
| RBAC     | Spatie Laravel Permission (4 tier: super_admin, admin, staff, user) |
| Database | MySQL — diakses via Eloquent ORM                                    |

Frontend dan backend berjalan sebagai dua aplikasi terpisah dan berkomunikasi melalui **REST API + JWT Bearer Token**.

---

## 2. Source of Truth

Sebelum mengubah apapun, pahami hierarki kepercayaan ini:

1. **Source code aktual** — kebenaran utama untuk behavior aplikasi.
2. **`docs/`** — kebenaran dokumentasi; harus selalu mencerminkan behavior aktual, bukan rencana.
3. **`docs/ai-development-rules.md`** — aturan kerja AI di repo ini (diperkuat oleh file ini).
4. **`docs/architecture.md`** — kebenaran untuk alur sistem, flow request, dan stack komunikasi.
5. **`.env.example`** — hanya boleh berisi nama variable dan placeholder aman. **Jangan expose nilai secret.**

> Jika dokumentasi dan source code berbeda: **percaya source code dulu**, lalu update dokumentasi yang relevan dalam task yang sama.

---

## 3. Required Workflow

### Sebelum Mengubah File

1. Jalankan `git status --short` untuk memetakan kondisi repo.
2. Baca file source code yang relevan — jangan menebak struktur atau behavior.
3. Baca dokumentasi terkait di `docs/` menggunakan tabel Documentation Contract di seksi 5.
4. Jangan pernah menebak schema database — baca `database/migrations/` yang ada.
5. Identifikasi area perubahan: backend, frontend, database, auth, env, deployment, atau security.

### Saat Mengubah File

- Ikuti pola kode dan konvensi yang sudah ada di repo.
- Jangan ubah routing yang sudah ada kecuali diminta eksplisit oleh user.
- Jangan menambah dependency baru tanpa alasan kuat dan konfirmasi user.
- Jangan hapus kode yang tidak terkait dengan task.
- Jangan mengubah migration lama yang sudah production — buat migration baru jika perlu.
- Jangan membuat commit Git secara otomatis kecuali user meminta eksplisit.

### Sebelum Final Response

1. Periksa tabel Documentation Contract — apakah ada file `docs/` yang perlu diperbarui?
2. Jalankan validasi yang relevan (lint, type-check, build check).
3. Pisahkan kegagalan dari perubahan baru vs. debt lama yang sudah ada sebelumnya.
4. Siapkan **Suggested Conventional Commit message** lengkap dengan subject dan body teknis.

---

## 4. Coding Standards

### Backend (Laravel 13)

- **Service Layer pattern** — semua business logic di `app/Services/`, bukan di controller.
- **Form Request** untuk validasi input (`app/Http/Requests/`).
- **API Resource** untuk transformasi response (`app/Http/Resources/`).
- Model menggunakan **PHP 8.4 Attributes** (`#[Fillable]`, `#[Table]`, `#[Appends]`).
- Semua model yang memiliki CRUD wajib menggunakan trait `LogsActivity`.
- Route baru ditambahkan di `routes/api.php` dengan middleware `auth:api`.
- Gunakan `DB::transaction()` untuk operasi yang melibatkan multiple table writes.
- `StockMovement` mendukung update dan delete dengan penyesuaian/reversal stok otomatis di warehouse (lihat `docs/features/inventori.md`).

### Frontend (SvelteKit 5)

- Gunakan **Svelte 5 Runes**: `$state`, `$derived`, `$effect`, `$props`.
- API calls melalui **service layer** (`src/lib/services/`) — jangan panggil langsung dari komponen.
- Gunakan `axiosClient` (bukan `axios` langsung) untuk otomatis attach JWT dan handle refresh.
- Tipe data didefinisikan di `src/lib/types/`.
- Teks UI dalam **Bahasa Indonesia** kecuali istilah teknis.
- Format mata uang: **Rupiah**. Format tanggal: **Bahasa Indonesia**.
- **PWA & Service Worker Hygiene** — Dilarang keras menambahkan `/api/*`, `/storage/*`, `__data.json`, atau request ber-`Authorization` ke dalam cache Service Worker. Caching hanya untuk aset statis terverifikasi dan chunk build ber-hash (`/_app/immutable/**`). Dokumen HTML navigasi wajib Network-Only.

---

## 5. Documentation Contract

Setiap task **wajib melewati documentation gate** ini. Jika area berikut berubah, cek dan update dokumen terkait:

| Area Perubahan                             | Dokumen yang Wajib Dicek & Diperbarui                    |
| ------------------------------------------ | -------------------------------------------------------- |
| API endpoint baru atau berubah             | `docs/api-reference.md`                                  |
| Fitur atau halaman baru                    | `docs/features/{fitur}.md` (buat jika belum ada)         |
| PWA, Service Worker, atau Web App Manifest | `docs/features/pwa.md`                                   |
| Database schema atau migration             | `docs/database-schema.md`, `docs/database-migrations.md` |
| Auth, session, atau token                  | `docs/jwt-auth.md`, `docs/security-checklist.md`         |
| Role atau permission                       | `docs/role-permission.md`                                |
| Environment variable                       | `docs/environment-variables.md`                          |
| Deployment atau CI                         | `docs/deployment.md`                                     |
| Struktur folder                            | `docs/folder-structure.md`                               |
| Security-related                           | `docs/security-checklist.md`                             |
| Setup atau onboarding                      | `docs/setup-local.md`, `README.md`                       |
| Bug fix yang menyentuh edge case           | `docs/troubleshooting.md`                                |
| Perubahan arsitektur                       | `docs/architecture.md`                                   |

> Jika tidak ada dokumentasi yang perlu diperbarui, final response **tetap wajib menyebutkan alasannya**.

---

## 6. Final Response Contract

Setiap task selesai **harus ditutup** dengan struktur berikut (ringkas tapi teknis):

```
## Summary
[Apa yang dikerjakan dan mengapa]

## Files Changed
- path/to/file — [deskripsi singkat perubahan]

## Validation
- [Hasil lint/type-check/build, atau keterangan kenapa tidak dijalankan]

## Documentation Updated
- docs/xxx.md — [apa yang diperbarui]
- atau: "Tidak ada dokumentasi yang perlu diperbarui karena [alasan]."

## Suggested Commit
[Conventional Commit message siap pakai — lihat seksi 7]
```

---

## 7. Commit Message Contract

Selalu berikan **Suggested Conventional Commit message** dalam **Bahasa Inggris** di setiap akhir task. Message harus siap dipakai di terminal dan berisi subject + body teknis.

### Format

```text
type(scope): imperative summary in English

Explain the technical change in concrete terms.
Mention files changed, validation run, migrations, API changes,
or documentation updates when relevant.
```

### Type

| Type       | Kapan Digunakan                          |
| ---------- | ---------------------------------------- |
| `feat`     | Fitur baru                               |
| `fix`      | Bug fix                                  |
| `docs`     | Dokumentasi atau instruksi agent         |
| `refactor` | Restrukturisasi tanpa perubahan behavior |
| `test`     | Penambahan atau perubahan test           |
| `chore`    | Maintenance, dependency, tooling         |
| `build`    | Build tooling atau dependency            |
| `perf`     | Optimasi performa                        |

### Scope

Gunakan nama area yang berubah: `auth`, `api`, `database`, `frontend`, `projects`, `activities`, `inventory`, `finance`, `certificates`, `mitras`, `settings`, `docs`, `deployment`, `config`.

### Contoh

```text
feat(inventory): add stock transfer validation between warehouses

Add business logic in WarehouseService to validate source warehouse stock
before processing transfer. Prevents over-allocation when concurrent
requests target the same warehouse.

Updated: docs/database-schema.md (StockMovement immutability note).
```

```text
fix(auth): resolve JWT refresh loop on expired token edge case

Axios response interceptor now properly handles 401 from /auth/refresh
endpoint by clearing localStorage and redirecting to /auth/login
instead of retrying the refresh indefinitely.
```

```text
docs(agents): add repository-level AI agent operating manual

Create AGENTS.md with documentation contract, commit message format,
required workflow, and quality rules for all AI coding assistants.
```

---

## 8. Changelog Contract

Setiap perubahan signifikan (fitur baru, fix penting, breaking change, perubahan arsitektur) **wajib menambahkan entry** ke `docs/changelog.md` dengan format:

```markdown
## [YYYY-MM-DD] — type(scope): summary

- Apa yang berubah
- File yang diubah
- Dampak yang perlu diketahui
```

> Perubahan kecil seperti typo fix, minor style tweak, atau refactor internal tidak perlu masuk changelog.

---

## 9. Scope Guard

Tabel berikut mendefinisikan apa yang boleh dikerjakan agent secara mandiri vs. yang membutuhkan konfirmasi user eksplisit:

| Aksi                                                           | Status                                           |
| -------------------------------------------------------------- | ------------------------------------------------ |
| Membaca dan menganalisa file apapun                            | ✅ Mandiri                                       |
| Mengubah kode frontend (komponen, service, type, utility)      | ✅ Mandiri                                       |
| Mengubah kode backend (controller, service, resource, request) | ✅ Mandiri                                       |
| Membuat migration baru                                         | ✅ Mandiri (dengan penjelasan di final response) |
| Mengubah atau menghapus migration lama                         | ❌ Butuh konfirmasi eksplisit                    |
| Menambah dependency baru                                       | ❌ Butuh konfirmasi eksplisit                    |
| Mengubah `routes/api.php` secara struktural                    | ❌ Butuh konfirmasi eksplisit                    |
| Menghapus file atau folder                                     | ❌ Butuh konfirmasi eksplisit                    |
| Mengekspos atau mengubah `.env` aktual                         | ❌ Dilarang sepenuhnya                           |
| Membuat commit Git secara otomatis                             | ❌ Dilarang kecuali diminta eksplisit            |

---

## 10. Quality & Safety Rules

- **Jangan expose** secret, token, API key, service key, atau credential apapun — di kode, dokumentasi, log, atau response.
- **Jangan revert** perubahan user yang tidak berkaitan dengan task saat ini.
- **Jangan jalankan** command destruktif (`DROP TABLE`, `php artisan migrate:fresh`, `rm -rf`, dll) tanpa instruksi eksplisit.
- **Jangan dokumentasikan** fitur yang belum benar-benar tersedia di kode.
- **Jangan klaim** test passing jika belum dijalankan secara aktual.
- **Jangan asumsikan** file, fungsi, atau API tersedia jika belum dibaca dari repo secara aktif.
- **Jangan ubah** business logic yang sudah ada kecuali diminta secara eksplisit.

---

## 11. Agent Compatibility Notes

Beberapa agent memiliki kapabilitas berbeda. Gunakan panduan ini untuk memilih agent yang tepat:

| Kapabilitas                 | Antigravity | Qoder | Claude Code | Codex | OpenClaw | Hermes |
| --------------------------- | :---------: | :---: | :---------: | :---: | :------: | :----: |
| Baca & tulis file           |     ✅      |  ✅   |     ✅      |  ✅   |    ✅    |   ✅   |
| Jalankan terminal command   |     ✅      |  ✅   |     ✅      |  ✅   |    ✅    |   ✅   |
| Buka browser / DevTools     |     ✅      |   —   |      —      |   —   |    —     |   —    |
| Spawn subagent              |     ✅      |   —   |      —      |   —   |    —     |   —    |
| Akses internet / search web |     ✅      |   —   |     ✅      |   —   |    ✅    |   ✅   |

> Kolom `—` berarti kapabilitas tidak diketahui atau tidak relevan untuk agent tersebut. Update tabel ini saat menemukan perbedaan behavior aktual.

---

## 12. ECC (Everything Claude Code) Framework Integration

Repositori ini telah mengintegrasikan framework **ECC (Everything Claude Code)** ([affaan-m/ECC](https://github.com/affaan-m/ECC)) yang disesuaikan secara presisi dengan arsitektur **Laravel 13 + SvelteKit 5**:

1. **`CLAUDE.md` (Project Kernel)**: Entry point utama untuk Claude Code di root repositori yang memuat Prompt Defense Baseline, arsitektur, standar coding, perintah slash, daftar subagent, dan pemetaan skill.
2. **`.claude/` (Claude Code Workspace)**:
   - `rules/`: Memuat aturan prompt defense (`ecc-guardrails.md`), `common/` (security, testing, git-workflow, code-review), `php/` (Laravel/PHP 8.4 standards), dan `typescript/` (Svelte 5/Vite standards).
   - `agents/`: Subagent terspesialisasi (`planner`, `code-reviewer`, `tdd-guide`, `architect`, `database-reviewer`, `security-reviewer`, `build-error-resolver`, `doc-updater`, `php-reviewer`, `typescript-reviewer`).
   - `commands/`: Shims slash command (`/plan`, `/tdd`, `/code-review`, `/build-fix`, `/quality-gate`, `/security-scan`, `/refactor-clean`, dll).
   - `skills/`: Workflow skills tervalidasi untuk domain proyek.
3. **`.agents/skills/` (Universal Agent Skills)**:
   - Menyediakan skill agentik yang sama (`laravel-patterns`, `laravel-security`, `laravel-tdd`, `laravel-verification`, `vite-patterns`, `tdd-workflow`, `database-migrations`, `git-workflow`, `security-review`, `security-audit`, `docs-governance`) untuk digunakan oleh **Antigravity**, **Codex**, dan **OpenClaw**.

---

_File ini adalah living document. Update jika ada perubahan workflow, konvensi baru, atau temuan penting saat bekerja dengan agent di repo ini._
