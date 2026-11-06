<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Mengembalikan status fitur publik auth (misal: registrasi aktif atau nonaktif).
     */
    public function features(): JsonResponse
    {
        return response()->json($this->authService->getRegistrationStatus());
    }

    public function register(Request $request): UserResource|JsonResponse
    {
        $registrationEnabled = (bool) config('auth.registration.enabled', true);
        if (! $registrationEnabled) {
            return response()->json([
                'message' => 'Pendaftaran akun publik saat ini dinonaktifkan.',
            ], 403);
        }

        $allowedDomain = config('auth.registration.allowed_domain', 'indogreen.id');
        $emailRules = ['required', 'string', 'email', 'max:255', 'unique:users,email'];

        if (! empty($allowedDomain)) {
            $domainSuffix = '@' . ltrim(strtolower($allowedDomain), '@');
            $emailRules[] = function (string $attribute, mixed $value, \Closure $fail) use ($domainSuffix) {
                if (! is_string($value) || ! str_ends_with(strtolower($value), $domainSuffix)) {
                    $fail("Pendaftaran akun hanya diizinkan untuk alamat email resmi perusahaan ({$domainSuffix}).");
                }
            };
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255|alpha_dash|unique:users,username',
            'email' => $emailRules,
            'password' => 'required|confirmed|min:8',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'username.alpha_dash' => 'Username hanya boleh berisi huruf, angka, minus (-), dan garis bawah (_).',
            'username.unique' => 'Username sudah digunakan oleh pengguna lain.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data yang diberikan tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $this->authService->register($validator->validated());

        return new UserResource($user);
    }

    public function login(Request $request): JsonResponse
    {
        $loginInput = $request->input('login') ?? $request->input('email') ?? $request->input('username');
        $password = $request->input('password');

        try {
            $token = $this->authService->login([
                'login' => $loginInput,
                'password' => $password,
            ]);
            return $this->respondWithToken($token);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        }
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
        ], [
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data yang diberikan tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->authService->forgotPassword((string) $request->input('email'));

        return response()->json($result);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'token' => 'required|string',
            'password' => [
                'required', 'string', 'min:8', 'confirmed',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
            ],
        ], [
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'token.required' => 'Kode verifikasi / token wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password minimal harus 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.regex' => 'Password harus mengandung huruf kecil dan huruf besar.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data yang diberikan tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $this->authService->resetPassword($validator->validated());
            return response()->json([
                'message' => 'Password berhasil direset. Silakan masuk menggunakan password baru Anda.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function me(): UserResource
    {
        return new UserResource($this->authService->me());
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(): JsonResponse
    {
        return $this->respondWithToken(Auth::refresh());
    }

    public function updateProfile(Request $request): UserResource|JsonResponse
    {
        $user = $this->authService->me();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                \Illuminate\Validation\Rule::unique('users', 'username')->ignore($user->id),
            ],
        ], [
            'name.required' => 'Nama wajib diisi.',
            'username.alpha_dash' => 'Username hanya boleh berisi huruf, angka, minus (-), dan garis bawah (_).',
            'username.unique' => 'Username sudah digunakan oleh pengguna lain.',
        ]);

        $user = $this->authService->updateProfile($user, $validated);

        return (new UserResource($user))->response()->setStatusCode(200);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required', 'string', 'min:8', 'confirmed',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'different:current_password',
            ],
        ], [
            'password.regex' => 'Password harus mengandung huruf kecil dan huruf besar.',
            'password.different' => 'Password baru tidak boleh sama dengan password lama.',
        ]);

        $user = $this->authService->me();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $this->authService->changePassword($user, $validated);
            return response()->json(['message' => 'Password berhasil diperbarui']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    protected function respondWithToken(string $token): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::factory()->getTTL() * 60
        ]);
    }
}
