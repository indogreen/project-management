<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class AuthRegistrationSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_with_unauthorized_domain_is_rejected_pm_biz_001(): void
    {
        Config::set('auth.registration.allowed_domain', 'indogreen.id');

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Attacker',
            'email' => 'employee@external-phishing.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        $this->assertStringContainsString(
            '@indogreen.id',
            $response->json('errors.email.0') ?? $response->json('message') ?? ''
        );

        $this->assertDatabaseMissing('users', [
            'email' => 'employee@external-phishing.com',
        ]);
    }

    public function test_registration_with_official_domain_succeeds_pm_biz_001(): void
    {
        Config::set('auth.registration.allowed_domain', 'indogreen.id');

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Riza Fahdan',
            'email' => 'riza@indogreen.id',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'riza@indogreen.id',
            'name' => 'Riza Fahdan',
        ]);

        // Verifikasi User mengimplementasikan interface MustVerifyEmail
        $user = User::where('email', 'riza@indogreen.id')->firstOrFail();
        $this->assertInstanceOf(MustVerifyEmail::class, $user);
    }

    public function test_registration_email_domain_is_case_insensitive(): void
    {
        Config::set('auth.registration.allowed_domain', 'indogreen.id');

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Case Insensitive User',
            'email' => 'staff.field@INDOGREEN.ID',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'staff.field@INDOGREEN.ID',
        ]);
    }

    public function test_registration_fails_when_registration_is_disabled(): void
    {
        Config::set('auth.registration.enabled', false);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Any User',
            'email' => 'any@indogreen.id',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'Pendaftaran akun publik saat ini dinonaktifkan.',
        ]);

        $this->assertDatabaseMissing('users', [
            'email' => 'any@indogreen.id',
        ]);
    }

    public function test_registration_validates_password_confirmation_and_length(): void
    {
        $responseShort = $this->postJson('/api/auth/register', [
            'name' => 'User Short',
            'email' => 'short@indogreen.id',
            'password' => 'Pass1',
            'password_confirmation' => 'Pass1',
        ]);
        $responseShort->assertStatus(422);
        $responseShort->assertJsonValidationErrors(['password']);

        $responseMismatch = $this->postJson('/api/auth/register', [
            'name' => 'User Mismatch',
            'email' => 'mismatch@indogreen.id',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ]);
        $responseMismatch->assertStatus(422);
        $responseMismatch->assertJsonValidationErrors(['password']);
    }

    public function test_auth_features_returns_registration_enabled_status(): void
    {
        Config::set('auth.registration.enabled', true);
        Config::set('auth.registration.allowed_domain', 'indogreen.id');

        $response = $this->getJson('/api/auth/features');

        $response->assertStatus(200);
        $response->assertJson([
            'registration_enabled' => true,
            'allowed_domain' => 'indogreen.id',
        ]);
    }

    public function test_auth_features_returns_registration_disabled_status(): void
    {
        Config::set('auth.registration.enabled', false);

        $response = $this->getJson('/api/auth/features');

        $response->assertStatus(200);
        $response->assertJson([
            'registration_enabled' => false,
        ]);
    }
}
