<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ActivityLogServiceSecurityTest extends TestCase
{
    protected ActivityLogService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->service = app(ActivityLogService::class);
    }

    public function test_activity_log_path_is_strictly_integer_and_prevents_traversal_pm_log_001(): void
    {
        $logData = [
            'id' => 'log_test_123',
            'user_id' => 42,
            'user_name' => 'Test User',
            'action' => 'test_action',
            'timestamp' => now()->toISOString(),
        ];

        // Memanggil readUserLogs via getLogs
        $logs = $this->service->getLogs([], 42);
        $this->assertIsArray($logs);

        // Memastikan Storage membaca direktori integer yang tepat
        $expectedDir = 'activity-logs/user_42';
        $this->assertFalse(Storage::exists($expectedDir)); // belum ada file ditulis

        // Pastikan parameter integer strict di-enforce
        $reflection = new \ReflectionMethod(ActivityLogService::class, 'readUserLogs');
        $params = $reflection->getParameters();
        $this->assertEquals('int', (string) $params[0]->getType());
    }

    public function test_get_all_users_returns_strict_integers(): void
    {
        Storage::makeDirectory('activity-logs/user_10');
        Storage::makeDirectory('activity-logs/user_25');
        Storage::makeDirectory('activity-logs/invalid_folder');

        $reflection = new \ReflectionMethod(ActivityLogService::class, 'getAllUsers');
        $users = $reflection->invoke($this->service);

        $this->assertIsArray($users);
        $this->assertContains(10, $users);
        $this->assertContains(25, $users);
        $this->assertNotContains('invalid_folder', $users);

        foreach ($users as $user) {
            $this->assertIsInt($user);
        }
    }
}
