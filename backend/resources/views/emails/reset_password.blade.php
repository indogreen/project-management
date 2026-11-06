<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Verifikasi Reset Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
            padding: 32px 28px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 32px 28px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
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
            background-color: #f1f5f9;
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 24px 0;
        }
        .code-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .code-value {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #4f46e5;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .btn-wrapper {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .note {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            margin-top: 24px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 28px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Indogreen Project Management</h1>
        </div>
        <div class="content">
            <div class="greeting">Halo, {{ $name }}</div>
            <p class="text">
                Kami menerima permintaan pengaturan ulang kata sandi (reset password) untuk akun Anda. Gunakan kode verifikasi di bawah ini atau klik tombol tautan langsung untuk melanjutkan:
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
