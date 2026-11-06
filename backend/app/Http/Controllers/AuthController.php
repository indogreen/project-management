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
            'email' => $emailRules,
            'password' => 'required|confirmed|min:8',
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
        $credentials = $request->only('email', 'password');

        try {
            $token = $this->authService->login($credentials);
            return $this->respondWithToken($token);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
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
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = $this->authService->me();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = $this->authService->updateProfile($user, $validated);

        return new UserResource($user);
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