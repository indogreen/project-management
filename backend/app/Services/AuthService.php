<?php

namespace App\Services;

use App\Mail\AccountRegisteredMail;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected ActivityLogService $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    public function login(array $credentials): string
    {
        $loginInput = trim((string) ($credentials['login'] ?? $credentials['email'] ?? $credentials['username'] ?? ''));
        $password = (string) ($credentials['password'] ?? '');

        $token = null;
        if (filter_var($loginInput, FILTER_VALIDATE_EMAIL)) {
            $token = Auth::attempt(['email' => $loginInput, 'password' => $password]);
        } else {
            // Coba via username terlebih dahulu
            $token = Auth::attempt(['username' => $loginInput, 'password' => $password]);
            if (! $token) {
                // Fallback via name
                $token = Auth::attempt(['name' => $loginInput, 'password' => $password]);
            }
        }

        if (! $token) {
            throw ValidationException::withMessages([
                'login' => ['Email/username atau password salah.'],
                'email' => ['Email/username atau password salah.'],
            ]);
        }

        $this->logActivity('login', 'User logged in successfully');
        return $token;
    }

    public function logout(): void
    {
        $this->logActivity('logout', 'User logged out');
        Auth::logout();
    }

    public function me(): ?User
    {
        return Auth::user();
    }

    public function updateProfile(User $user, array $data): User
    {
        $user->update($data);
        return $user;
    }

    public function changePassword(User $user, array $data): void
    {
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password lama tidak cocok.'],
            ]);
        }

        if (Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Password baru tidak boleh sama dengan password lama.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();

        $this->logActivity('password_update', 'User changed password');
    }

    public function forgotPassword(string $email): array
    {
        $user = User::where('email', strtolower(trim($email)))->first();

        if ($user) {
            // Generate kode verifikasi 6 digit numerik
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Simpan token (di-hash) ke tabel password_reset_tokens
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($code),
                    'created_at' => now(),
                ]
            );

            $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
            $resetUrl = $frontendUrl . '/auth/reset-password?email=' . urlencode($user->email) . '&token=' . $code;

            // Kirim email via Mailable
            Mail::to($user->email)->send(new ResetPasswordMail(
                name: $user->name,
                code: $code,
                resetUrl: $resetUrl,
            ));

            $this->activityLogService->log(
                'forgot_password_request',
                User::class,
                $user->id,
                $user->name,
                'User requested password reset verification code'
            );
        }

        return [
            'message' => 'Jika email terdaftar pada sistem, kode verifikasi reset password telah dikirim ke email Anda.',
        ];
    }

    public function resetPassword(array $data): void
    {
        $email = strtolower(trim($data['email']));
        $token = trim((string) $data['token']);

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record) {
            throw ValidationException::withMessages([
                'token' => ['Kode verifikasi tidak valid atau telah kedaluwarsa.'],
            ]);
        }

        $expireMinutes = (int) config('auth.passwords.users.expire', 60);
        if (Carbon::parse($record->created_at)->addMinutes($expireMinutes)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Kode verifikasi telah kedaluwarsa. Silakan ajukan lupa password kembali.'],
            ]);
        }

        if (! Hash::check($token, $record->token)) {
            throw ValidationException::withMessages([
                'token' => ['Kode verifikasi tidak cocok.'],
            ]);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['User tidak ditemukan.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();

        // Hapus token yang sudah digunakan
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        $this->activityLogService->log(
            'password_reset_success',
            User::class,
            $user->id,
            $user->name,
            'User successfully reset password using verification token'
        );
    }

    public function register(array $data): User
    {
        $username = $data['username'] ?? null;
        if (empty($username)) {
            $emailPrefix = explode('@', (string) $data['email'])[0] ?? '';
            $baseUsername = Str::slug($emailPrefix ?: (string) $data['name'], '_');
            if (empty($baseUsername)) {
                $baseUsername = 'user_' . Str::lower(Str::random(6));
            }

            $username = $baseUsername;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . '_' . $counter;
                $counter++;
            }
        }

        $user = User::create([
            'name' => $data['name'],
            'username' => $username,
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        // Generate kode autentikasi / verifikasi akun untuk dikirimkan via email
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $loginUrl = $frontendUrl . '/auth/login';

        Mail::to($user->email)->send(new AccountRegisteredMail(
            name: $user->name,
            username: $user->username,
            emailAddress: $user->email,
            code: $code,
            loginUrl: $loginUrl,
        ));

        $this->activityLogService->log(
            'register',
            User::class,
            $user->id,
            $user->name,
            'User registered successfully and authentication code sent via email'
        );

        return $user;
    }

    /**
     * Mendapatkan status tata kelola registrasi dan fitur otentikasi publik.
     *
     * @return array{registration_enabled: bool, allowed_domain: string}
     */
    public function getRegistrationStatus(): array
    {
        return [
            'registration_enabled' => (bool) config('auth.registration.enabled', true),
            'allowed_domain' => (string) config('auth.registration.allowed_domain', 'indogreen.id'),
        ];
    }

    protected function logActivity(string $action, ?string $description = null): void
    {
        $this->activityLogService->log(
            $action,
            User::class,
            Auth::id(),
            Auth::user() ? Auth::user()->name : 'Unknown User',
            $description
        );
    }
}
