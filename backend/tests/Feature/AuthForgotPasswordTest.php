<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_via_email_succeeds(): void
    {
        $user = User::factory()->create([
            'email' => 'user1@indogreen.id',
            'username' => 'user_one',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'user1@indogreen.id',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token', 'token_type', 'expires_in']);
    }

    public function test_login_via_username_succeeds(): void
    {
        $user = User::factory()->create([
            'email' => 'user2@indogreen.id',
            'username' => 'custom_username',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'custom_username',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token', 'token_type', 'expires_in']);
    }

    public function test_login_via_invalid_credentials_fails(): void
    {
        $user = User::factory()->create([
            'email' => 'user3@indogreen.id',
            'username' => 'valid_user',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'valid_user',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401);
    }

    public function test_forgot_password_sends_email_with_verification_code_and_stores_token(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'riza@indogreen.id',
            'name' => 'Riza Syahputra',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'riza@indogreen.id',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        // Pastikan tabel password_reset_tokens memiliki record
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'riza@indogreen.id',
        ]);

        Mail::assertSent(ResetPasswordMail::class, function (ResetPasswordMail $mail) {
            return $mail->hasTo('riza@indogreen.id')
                && strlen($mail->code) === 6
                && str_contains($mail->resetUrl, '/auth/reset-password');
        });
    }

    public function test_forgot_password_with_unknown_email_returns_generic_success_without_sending_mail(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'unknown@indogreen.id',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        Mail::assertNothingSent();
    }

    public function test_reset_password_succeeds_with_valid_token_and_resets_password(): void
    {
        $user = User::factory()->create([
            'email' => 'reset_test@indogreen.id',
            'password' => Hash::make('OldPassword123!'),
        ]);

        $code = '654321';
        DB::table('password_reset_tokens')->insert([
            'email' => 'reset_test@indogreen.id',
            'token' => Hash::make($code),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'reset_test@indogreen.id',
            'token' => $code,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Password berhasil direset. Silakan masuk menggunakan password baru Anda.');

        // Token harus dihapus dari tabel
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'reset_test@indogreen.id',
        ]);

        // Password user harus berubah
        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123!', $user->password));

        // Bisa login dengan password baru
        $loginResponse = $this->postJson('/api/auth/login', [
            'login' => 'reset_test@indogreen.id',
            'password' => 'NewPassword123!',
        ]);
        $loginResponse->assertStatus(200);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset_invalid@indogreen.id',
            'password' => Hash::make('OldPassword123!'),
        ]);

        DB::table('password_reset_tokens')->insert([
            'email' => 'reset_invalid@indogreen.id',
            'token' => Hash::make('111111'),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'reset_invalid@indogreen.id',
            'token' => '999999',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_reset_password_fails_with_expired_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset_expired@indogreen.id',
            'password' => Hash::make('OldPassword123!'),
        ]);

        DB::table('password_reset_tokens')->insert([
            'email' => 'reset_expired@indogreen.id',
            'token' => Hash::make('123456'),
            'created_at' => Carbon::now()->subMinutes(65),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'reset_expired@indogreen.id',
            'token' => '123456',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }
}
