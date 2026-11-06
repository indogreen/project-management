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
            color: #1e293b;
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
            box-shadow: 0 10px 25px -5px rgba(0, 177, 0, 0.15);
        }
        .header {
            background-color: #00b100;
            padding: 38px 20px;
            text-align: center;
        }
        .brand-name {
            font-size: 36px;
            font-weight: 900;
            letter-spacing: 0.05em;
            line-height: 1;
            font-family: 'Arial Black', Impact, -apple-system, BlinkMacSystemFont, sans-serif;
            text-transform: uppercase;
            display: inline-block;
        }
        .brand-indo {
            color: #ffffff;
        }
        .brand-green {
            color: #ffff00;
        }
        .content {
            padding: 32px 28px;
        }
        .greeting {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #0f172a;
        }
        .text {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 24px;
        }
        .code-box {
            background-color: #f0fdf4;
            border: 2px dashed #00b100;
            border-radius: 16px;
            padding: 22px;
            text-align: center;
            margin: 26px 0;
        }
        .code-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #008a00;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .code-value {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #008a00;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .btn-wrapper {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background-color: #00b100;
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            padding: 14px 38px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(0, 177, 0, 0.35);
        }
        .note {
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            margin-top: 24px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px 28px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand-name">
                <span class="brand-indo">INDO</span><span class="brand-green">GREEN</span>
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
