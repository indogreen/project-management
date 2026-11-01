<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RateLimiterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear cache before each test to ensure rate limiter counter is reset
        Cache::flush();
    }

    public function test_unauthenticated_requests_are_throttled(): void
    {
        // Route /api/auth/login has sliding_throttle:5,60,auth
        // We will make 5 requests, which should all return 401 (validation error / unauthorized due to empty credentials) instead of 429
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/auth/login', []);
            $response->assertStatus(401);
        }

        // The 6th request should be throttled (429)
        $response = $this->postJson('/api/auth/login', []);
        $response->assertStatus(429);
        $response->assertJsonPath('success', false);
        $response->assertJsonStructure(['success', 'message']);
    }

    public function test_unauthenticated_requests_are_throttled_per_client_ip_via_forwarded_headers(): void
    {
        // Client A hits limit (5 requests)
        for ($i = 0; $i < 5; $i++) {
            $response = $this->withServerVariables([
                'REMOTE_ADDR' => '127.0.0.1',
                'HTTP_X_FORWARDED_FOR' => '203.0.113.10',
            ])->postJson('/api/auth/login', []);
            $response->assertStatus(401);
        }

        // 6th request from Client A is throttled (429)
        $responseA = $this->withServerVariables([
            'REMOTE_ADDR' => '127.0.0.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.10',
        ])->postJson('/api/auth/login', []);
        $responseA->assertStatus(429);

        // Client B from different forwarded IP is NOT throttled
        $responseB = $this->withServerVariables([
            'REMOTE_ADDR' => '127.0.0.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.20',
        ])->postJson('/api/auth/login', []);
        $responseB->assertStatus(401);
    }

    public function test_authenticated_requests_bypass_throttle(): void
    {
        // Create the permission first
        $guard = 'api';
        \Spatie\Permission\Models\Permission::firstOrCreate([
            'name' => 'project-view',
            'guard_name' => $guard,
        ]);

        $user = User::factory()->create();
        $user->givePermissionTo('project-view');
        
        // actingAs sets the authenticated user on the request
        $this->actingAs($user, $guard);

        // Route /api/projects has auth:api and sliding_throttle:15,60,api
        // Since the user is authenticated, they should not be throttled even after 20 requests.
        // We make 20 requests, which should return 200 (or other status except 429)
        // If they were throttled, we'd get a 429 after 15 requests.
        for ($i = 0; $i < 20; $i++) {
            $response = $this->getJson('/api/projects');
            // Since the user is authenticated, it should not return 429.
            // (It will return 200 OK with empty projects array because the database is empty)
            $response->assertStatus(200);
        }
    }
}
