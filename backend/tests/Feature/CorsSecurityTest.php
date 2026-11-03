<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class CorsSecurityTest extends TestCase
{
    public function test_cors_allows_configured_frontend_origin(): void
    {
        $allowedOrigin = config('cors.allowed_origins.0', 'http://localhost:5173');

        $response = $this->withHeaders([
            'Origin' => $allowedOrigin,
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'Authorization, Content-Type',
        ])->options('/api/projects');

        $response->assertStatus(204);
        $response->assertHeader('Access-Control-Allow-Origin', $allowedOrigin);
    }

    public function test_cors_blocks_unauthorized_external_origin_pm_cors_001(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'https://malicious-external-site.com',
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'Authorization',
        ])->options('/api/projects');

        // Middleware CORS Laravel tidak menyematkan Access-Control-Allow-Origin untuk origin asing
        $this->assertNull(
            $response->headers->get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Origin must not be present or wildcard for unauthorized origins.'
        );
        $this->assertNotEquals('*', (string) $response->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_cors_allowed_methods_are_explicit_not_wildcard(): void
    {
        $allowedOrigin = config('cors.allowed_origins.0', 'http://localhost:5173');

        $response = $this->withHeaders([
            'Origin' => $allowedOrigin,
            'Access-Control-Request-Method' => 'POST',
        ])->options('/api/projects');

        $allowMethods = (string) $response->headers->get('Access-Control-Allow-Methods');
        $this->assertNotEquals('*', $allowMethods);
        $this->assertStringContainsString('POST', $allowMethods);
    }
}
