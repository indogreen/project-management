<?php

$configuredOrigins = array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))));
$frontendUrl = trim((string) env('FRONTEND_URL', 'http://localhost:5173'));

if ($frontendUrl !== '' && ! in_array($frontendUrl, $configuredOrigins, true)) {
    $configuredOrigins[] = $frontendUrl;
}

// Tambahkan varian 127.0.0.1 untuk kenyamanan development lokal jika localhost:5173 aktif
if (in_array('http://localhost:5173', $configuredOrigins, true) && ! in_array('http://127.0.0.1:5173', $configuredOrigins, true)) {
    $configuredOrigins[] = 'http://127.0.0.1:5173';
}

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_values(array_unique($configuredOrigins)),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-CSRF-TOKEN'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
 