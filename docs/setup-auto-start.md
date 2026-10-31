# Panduan Setup Auto-Start Service & Cloudflare Tunnel

Dokumen ini menjelaskan konfigurasi auto-start berbasis **systemd** pada server/VM development sehingga seluruh layanan (Backend Laravel, Frontend SvelteKit, dan Cloudflare Tunnel) dapat berjalan otomatis saat booting dan melakukan auto-restart saat terjadi kegagalan.

> ⚠️ **Catatan Operator:** Jalankan perintah-perintah ini di server/VM host dengan hak akses `sudo` / `root`. Jangan menyimpan token rahasia di dalam repositori Git.

---

## 1. Arsitektur Layanan

```text
               Internet (HTTPS / Data Seluler)
                             │
                             ▼
              ┌─────────────────────────────┐
              │      Cloudflare Edge        │
              │  (DNS, SSL/TLS, WAF, Access) │
              └──────────────┬──────────────┘
                             │ Cloudflare Tunnel (gRPC / QUIC)
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Host / VM Server                                        │
│                                                         │
│   cloudflared.service                                   │
│     ├── app-pm-idg.zed.ai.id ──► http://localhost:8005  │
│     └── api-pm-idg.zed.ai.id ──► http://localhost:8004  │
│                                                         │
│   indogreen-frontend.service (Port 8005)                │
│     └── Vite Dev Server / SvelteKit                     │
│                                                         │
│   indogreen-backend.service (Port 8004)                 │
│     └── PHP Artisan Serve / Laravel                     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Unit Systemd: Backend Laravel

Buat file unit systemd di `/etc/systemd/system/indogreen-backend.service`:

```ini
[Unit]
Description=Indogreen Project Management - Backend Laravel
After=network.target mysql.service

[Service]
Type=simple
User=kupzed
Group=kupzed
WorkingDirectory=/home/kupzed/Code/kupzed/project-management/backend
ExecStart=/usr/bin/php artisan serve --host=0.0.0.0 --port=8004
Restart=always
RestartSec=5
StandardOutput=append:/var/log/indogreen-backend.log
StandardError=append:/var/log/indogreen-backend.error.log
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
```

> **Catatan Penyesuaian:** Sesuaikan `User`, `Group`, path binary `php`, dan `WorkingDirectory` dengan direktori aktual di server Anda.

---

## 3. Unit Systemd: Frontend SvelteKit

Buat file unit systemd di `/etc/systemd/system/indogreen-frontend.service`:

```ini
[Unit]
Description=Indogreen Project Management - Frontend SvelteKit
After=network.target indogreen-backend.service

[Service]
Type=simple
User=kupzed
Group=kupzed
WorkingDirectory=/home/kupzed/Code/kupzed/project-management/frontend
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=5
StandardOutput=append:/var/log/indogreen-frontend.log
StandardError=append:/var/log/indogreen-frontend.error.log
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
```

---

## 4. Unit Systemd: Cloudflare Tunnel (`cloudflared`)

`cloudflared` **harus berjalan di mesin/VM yang sama** dengan kedua service agar target routing `http://localhost:8004` dan `http://localhost:8005` valid.

File credentials tunnel (`<TUNNEL_ID>.json`) disimpan di luar repository, misalnya di `/etc/cloudflared/`.

Buat atau perbarui file `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel Agent
After=network.target indogreen-backend.service indogreen-frontend.service
Wants=indogreen-backend.service indogreen-frontend.service

[Service]
TimeoutStartSec=0
Type=notify
ExecStart=/usr/local/bin/cloudflared tunnel run
Restart=always
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

*Jika menggunakan token tunnel (remote-managed):*
```ini
ExecStart=/usr/local/bin/cloudflared tunnel run --token <TUNNEL_TOKEN>
```
*(Pastikan token tunnel tidak ter-commit ke Git).*

---

## 5. Aktivasi & Manajemen Service

Jalankan perintah berikut untuk memuat dan mengaktifkan service:

```bash
# 1. Reload daemon systemd
sudo systemctl daemon-reload

# 2. Enable auto-start saat boot
sudo systemctl enable indogreen-backend.service
sudo systemctl enable indogreen-frontend.service
sudo systemctl enable cloudflared.service

# 3. Jalankan service secara berurutan
sudo systemctl start indogreen-backend.service
sudo systemctl start indogreen-frontend.service
sudo systemctl start cloudflared.service

# 4. Verifikasi status
sudo systemctl status indogreen-backend.service
sudo systemctl status indogreen-frontend.service
sudo systemctl status cloudflared.service
```

---

## 6. Monitoring & Troubleshooting Log

Untuk memantau log secara real-time:

```bash
# Monitor log backend
journalctl -u indogreen-backend.service -f

# Monitor log frontend
journalctl -u indogreen-frontend.service -f

# Monitor log cloudflared
journalctl -u cloudflared.service -f
```

---

## 7. Verifikasi Pasca-Reboot

Setelah VM di-reboot (`sudo reboot`), jalankan pemeriksaan berikut:

1. `curl -I http://localhost:8004/up` ➔ HTTP 200 OK
2. `curl -I http://localhost:8005` ➔ HTTP 200 OK
3. Dari luar server (HP dengan data seluler):
   - Akses `https://app-pm-idg.zed.ai.id`
   - Akses `https://api-pm-idg.zed.ai.id/up`

