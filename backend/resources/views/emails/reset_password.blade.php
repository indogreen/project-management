<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Verifikasi Reset Password - Indogreen</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f0fdf4;
            color: #14532d;
            margin: 0;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            border: 1px solid #bbf7d0;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(22, 163, 74, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #008a00 0%, #00a800 60%, #16a34a 100%);
            padding: 36px 28px;
            text-align: center;
        }
        .brand-badge {
            display: inline-block;
            background: rgba(0, 0, 0, 0.12);
            padding: 10px 24px;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .brand-name {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 0.05em;
            line-height: 1.1;
        }
        .brand-indo {
            color: #ffffff;
        }
        .brand-green {
            color: #bbf7d0;
        }
        .brand-sub {
            font-size: 10px;
            letter-spacing: 0.18em;
            color: #dcfce7;
            margin-top: 5px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .content {
            padding: 32px 28px;
        }
        .greeting {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #14532d;
        }
        .text {
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            margin-bottom: 24px;
        }
        .code-box {
            background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px dashed #4ade80;
            border-radius: 16px;
            padding: 22px;
            text-align: center;
            margin: 26px 0;
        }
        .code-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #15803d;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .code-value {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #15803d;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .btn-wrapper {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #008a00 0%, #16a34a 100%);
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            padding: 13px 36px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
        }
        .note {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.5;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
            margin-top: 24px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px 28px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand-badge">
                <div class="brand-name">
                    <span class="brand-indo">INDO</span><span class="brand-green">GREEN</span>
                </div>
                <div class="brand-sub">Perusahaan Listrik Tenaga Surya</div>
            </div>
        </div>
        <div class="content">
            <div class="greeting">Halo, {{ $name }}</div>
            <p class="text">
                Kami menerima permintaan pengaturan ulang kata sandi (reset password) untuk akun Anda di <strong>Indogreen Project Management</strong>. Gunakan kode verifikasi di bawah ini atau klik tombol tautan langsung untuk melanjutkan:
            </p>

            <div class="code-box">
                <div class="code-label">Kode Verifikasi Reset Password</div>
                <div class="code-value">{{ $code }}</div>
            </div>

            <div class="btn-wrapper">
                <a href="{{ $resetUrl }}" class="btn" target="_blank">Reset Kata Sandi Sekarang</a>
            </div>

            <div class="note">
                • Kode verifikasi dan tautan di atas hanya berlaku selama <strong>60 menit</strong>.<br>
                • Jika Anda tidak pernah meminta perubahan kata sandi ini, Anda dapat mengabaikan email ini dengan aman. Akun Anda tetap terlindungi.
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Indogreen Project Management. All rights reserved.
        </div>
    </div>
</body>
</html>
