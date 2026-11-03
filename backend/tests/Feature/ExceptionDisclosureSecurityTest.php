<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExceptionDisclosureSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->seed(RolePermissionSeeder::class);

        $this->user = User::factory()->create([
            'email' => 'admin@indogreen.id',
        ]);
        $this->user->assignRole('super_admin');

        $this->project = Project::create([
            'name' => 'Proyek AI',
            'description' => 'Deskripsi Proyek AI',
            'start_date' => now()->toDateString(),
            'status' => 'Ongoing',
        ]);
    }

    public function test_ai_extraction_exception_does_not_leak_internal_details_pm_inj_002(): void
    {
        $this->actingAs($this->user, 'api');

        // Unggah dokumen teks tanpa konfigurasi API KEY AI aktif untuk memicu exception
        $file = UploadedFile::fake()->create('dokumen.txt', 100);

        $response = $this->postJson('/api/activities', [
            'action' => 'extract',
            'project_id' => $this->project->id,
            'document' => $file,
        ]);

        $response->assertStatus(500);

        // Pesan error ramah pengguna, bukan raw RuntimeException
        $response->assertJson([
            'message' => 'Failed to extract document',
            'error' => 'Gagal memproses dokumen via AI. Silakan coba beberapa saat lagi atau hubungi administrator.',
        ]);

        // Pastikan internal configuration / trace tidak bocor ke JSON
        $this->assertStringNotContainsString('RuntimeException', (string) $response->getContent());
        $this->assertStringNotContainsString('AI_API_KEY', (string) $response->getContent());
    }
}
