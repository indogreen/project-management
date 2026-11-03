<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\BarangCertificate;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\Item;
use App\Models\Mitra;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttachmentMimeSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Project $project;
    protected Mitra $mitra;
    private array $tempFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->seed(RolePermissionSeeder::class);

        $this->user = User::factory()->create([
            'email' => 'staff@indogreen.id',
        ]);
        $this->user->assignRole('super_admin');

        $this->mitra = Mitra::create([
            'nama' => 'Indogreen Partner Utama',
            'alamat' => 'Jl. Hijau No. 10 Jakarta',
            'is_perusahaan' => true,
        ]);

        $this->project = Project::create([
            'name' => 'Test Project',
            'description' => 'Project Description',
            'status' => 'Ongoing',
            'start_date' => now()->toDateString(),
            'mitra_id' => $this->mitra->id,
        ]);
    }

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            if (file_exists($file)) {
                @unlink($file);
            }
        }

        parent::tearDown();
    }

    private function createSpoofedUploadedFile(string $clientName, string $clientMime, string $content): UploadedFile
    {
        $tmp = tempnam(sys_get_temp_dir(), 'mime_sec_');
        file_put_contents($tmp, $content);
        $this->tempFiles[] = $tmp;

        return new UploadedFile($tmp, $clientName, $clientMime, null, true);
    }

    public function test_activity_attachment_mime_is_detected_server_side_pm_inj_001(): void
    {
        $this->actingAs($this->user, 'api');

        // Buat file PNG valid tapi nyatakan Content-Type palsu text/html di header multipart
        $pngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $spoofedFile = $this->createSpoofedUploadedFile('malicious.html', 'text/html', $pngContent);

        $response = $this->postJson('/api/activities', [
            'project_id' => $this->project->id,
            'name' => 'Pemasangan Sensor',
            'description' => 'Deskripsi kegiatan',
            'kategori' => 'Other',
            'activity_date' => now()->toDateString(),
            'jenis' => 'Internal',
            'attachments' => [$spoofedFile],
            'attachment_names' => ['Evidence Sensor'],
        ]);

        $response->assertStatus(201);

        // Pastikan kolom 'mime' di database menyimpan MIME server-detected (image/png), bukan spoofed text/html
        $this->assertDatabaseMissing('activity_attachments', [
            'mime' => 'text/html',
        ]);
        $this->assertDatabaseHas('activity_attachments', [
            'name' => 'Evidence Sensor',
            'mime' => 'image/png',
        ]);
    }

    public function test_certificate_attachment_mime_is_detected_server_side_pm_inj_001(): void
    {
        $this->actingAs($this->user, 'api');

        $barang = BarangCertificate::create([
            'name' => 'Sensor Suhu',
            'no_seri' => 'SN-12345',
            'mitra_id' => $this->mitra->id,
        ]);

        $pngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $spoofedFile = $this->createSpoofedUploadedFile('exploit.svg', 'image/svg+xml', $pngContent);

        $response = $this->postJson('/api/certificates', [
            'project_id' => $this->project->id,
            'barang_certificate_id' => $barang->id,
            'name' => 'Sertifikat Kalibrasi',
            'no_certificate' => 'CERT-2026-001',
            'status' => 'Aktif',
            'attachments' => [$spoofedFile],
            'attachment_names' => ['Dokumen Kalibrasi'],
        ]);

        $response->assertSuccessful();

        $this->assertDatabaseMissing('certificate_attachments', [
            'mime' => 'image/svg+xml',
        ]);
        $this->assertDatabaseHas('certificate_attachments', [
            'name' => 'Dokumen Kalibrasi',
            'mime' => 'image/png',
        ]);
    }

    public function test_item_attachment_mime_is_detected_server_side_pm_inj_001(): void
    {
        $this->actingAs($this->user, 'api');

        $category = Category::create([
            'name' => 'Pipa PVC',
            'type' => 'item',
        ]);

        $pngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $spoofedFile = $this->createSpoofedUploadedFile('malware.html', 'text/html', $pngContent);

        $response = $this->postJson('/api/items', [
            'name' => 'Pipa 3 Inch',
            'sku' => 'SKU-PIPA-001',
            'category_id' => $category->id,
            'minimum_stock' => 5,
            'unit' => 'pcs',
            'attachments' => [$spoofedFile],
            'attachment_names' => ['Foto Item'],
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseMissing('item_attachments', [
            'mime' => 'text/html',
        ]);
        $this->assertDatabaseHas('item_attachments', [
            'name' => 'Foto Item',
            'mime' => 'image/png',
        ]);
    }
}
