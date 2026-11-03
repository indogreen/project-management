<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolePermissionSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $admin;
    protected User $staff;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions kanonikal
        $this->seed(RolePermissionSeeder::class);

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@indogreen.id',
        ]);
        $this->superAdmin->assignRole('super_admin');

        $this->admin = User::factory()->create([
            'name' => 'Admin Operational',
            'email' => 'admin@indogreen.id',
        ]);
        $this->admin->assignRole('admin');

        $this->staff = User::factory()->create([
            'name' => 'Staff User',
            'email' => 'staff@indogreen.id',
        ]);
        $this->staff->assignRole('staff');

        $this->user = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@indogreen.id',
        ]);
        $this->user->assignRole('user');
    }

    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->staff->id,
            'role' => 'staff',
        ]);

        $response->assertStatus(401);
    }

    public function test_non_admin_user_is_forbidden_with_403(): void
    {
        $this->actingAs($this->staff, 'api');

        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->user->id,
            'role' => 'user',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_create_or_assign_arbitrary_role_name_pm_ac_001(): void
    {
        $this->actingAs($this->admin, 'api');

        $rolesCountBefore = Role::count();

        // Admin mencoba menyuntikkan nama role baru yang tidak ada dalam allowlist
        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->staff->id,
            'role' => 'super_admin_v2',
            'permissions' => [
                'project-view' => true,
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);

        // Pastikan tidak ada role baru yang tercipta di database
        $this->assertDatabaseMissing('roles', [
            'name' => 'super_admin_v2',
        ]);
        $this->assertEquals($rolesCountBefore, Role::count());

        // Pastikan role staff target tidak berubah
        $this->assertTrue($this->staff->fresh()->hasRole('staff'));
        $this->assertFalse($this->staff->fresh()->hasRole('super_admin_v2'));
    }

    public function test_admin_cannot_assign_super_admin_or_admin_role(): void
    {
        $this->actingAs($this->admin, 'api');

        // Admin mencoba memberikan role admin ke user biasa
        $responseAdmin = $this->putJson('/api/auth/role', [
            'user_id' => $this->user->id,
            'role' => 'admin',
        ]);
        $responseAdmin->assertStatus(422);
        $responseAdmin->assertJsonValidationErrors(['role']);

        // Admin mencoba memberikan role super_admin ke user biasa
        $responseSuperAdmin = $this->putJson('/api/auth/role', [
            'user_id' => $this->user->id,
            'role' => 'super_admin',
        ]);
        $responseSuperAdmin->assertStatus(422);
        $responseSuperAdmin->assertJsonValidationErrors(['role']);

        $this->assertTrue($this->user->fresh()->hasRole('user'));
    }

    public function test_admin_cannot_modify_other_admin_or_super_admin_user(): void
    {
        $this->actingAs($this->admin, 'api');

        $otherAdmin = User::factory()->create([
            'email' => 'otheradmin@indogreen.id',
        ]);
        $otherAdmin->assignRole('admin');

        $response = $this->putJson('/api/auth/role', [
            'user_id' => $otherAdmin->id,
            'role' => 'staff',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'Admin tidak boleh mengubah user dengan role admin atau super_admin.',
        ]);

        $this->assertTrue($otherAdmin->fresh()->hasRole('admin'));
    }

    public function test_admin_cannot_inject_arbitrary_permission_names_pm_ac_001(): void
    {
        $this->actingAs($this->admin, 'api');

        $permissionsCountBefore = Permission::count();

        // Admin mencoba menyuntikkan permission arbitrer yang tidak dikenal
        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->staff->id,
            'role' => 'staff',
            'permissions' => [
                'project-view' => true,
                'financial_approval_all' => true,
                'system_export_master' => true,
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Izin tidak dikenal: financial_approval_all, system_export_master',
        ]);

        // Pastikan permission arbitrer tidak disimpan di tabel permissions
        $this->assertDatabaseMissing('permissions', ['name' => 'financial_approval_all']);
        $this->assertDatabaseMissing('permissions', ['name' => 'system_export_master']);
        $this->assertEquals($permissionsCountBefore, Permission::count());

        // Pastikan permissions staff tidak terkontaminasi
        $this->assertFalse($this->staff->fresh()->getAllPermissions()->pluck('name')->contains('financial_approval_all'));
    }

    public function test_user_cannot_modify_their_own_role(): void
    {
        $this->actingAs($this->admin, 'api');

        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->admin->id,
            'role' => 'staff',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'Kamu tidak boleh mengubah role milik akun kamu sendiri.',
        ]);
    }

    public function test_admin_can_successfully_update_staff_with_valid_role_and_permissions(): void
    {
        $this->actingAs($this->admin, 'api');

        $rolesCountBefore = Role::count();
        $permissionsCountBefore = Permission::count();

        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->staff->id,
            'role' => 'user',
            'permissions' => [
                'project-view' => true,
                'project-create' => true,
                'activity-view' => true,
                'activity-delete' => false, // false tidak boleh ditambahkan
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'user' => ['id', 'name', 'email', 'roles', 'permissions'],
        ]);

        // Database checks
        $this->assertEquals($rolesCountBefore, Role::count());
        $this->assertEquals($permissionsCountBefore, Permission::count());

        $freshStaff = $this->staff->fresh();
        $this->assertTrue($freshStaff->hasRole('user'));
        $this->assertFalse($freshStaff->hasRole('staff'));
        $this->assertTrue($freshStaff->hasPermissionTo('project-view'));
        $this->assertTrue($freshStaff->hasPermissionTo('project-create'));
        $this->assertTrue($freshStaff->hasPermissionTo('activity-view'));
        $this->assertFalse($freshStaff->hasPermissionTo('activity-delete'));
    }

    public function test_super_admin_can_assign_admin_role_and_permissions(): void
    {
        $this->actingAs($this->superAdmin, 'api');

        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->staff->id,
            'role' => 'admin',
            'permissions' => [
                'project-view' => true,
                'finance-view' => true,
            ],
        ]);

        $response->assertStatus(200);

        $freshStaff = $this->staff->fresh();
        $this->assertTrue($freshStaff->hasRole('admin'));
        $this->assertTrue($freshStaff->hasPermissionTo('project-view'));
        $this->assertTrue($freshStaff->hasPermissionTo('finance-view'));
    }

    public function test_super_admin_cannot_assign_arbitrary_role_name(): void
    {
        $this->actingAs($this->superAdmin, 'api');

        $response = $this->putJson('/api/auth/role', [
            'user_id' => $this->staff->id,
            'role' => 'custom_hacked_role',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);
        $this->assertDatabaseMissing('roles', ['name' => 'custom_hacked_role']);
    }

    public function test_role_config_endpoint_filters_roles_properly_for_admin_and_super_admin(): void
    {
        // Admin: tidak boleh melihat admin & super_admin di pilihan roles
        $this->actingAs($this->admin, 'api');
        $responseAdmin = $this->getJson('/api/auth/role/config');
        $responseAdmin->assertStatus(200);
        $rolesForAdmin = collect($responseAdmin->json('roles'))->pluck('key')->all();
        $this->assertEquals(['staff', 'user'], $rolesForAdmin);

        // Super Admin: melihat semua roles
        $this->actingAs($this->superAdmin, 'api');
        $responseSuperAdmin = $this->getJson('/api/auth/role/config');
        $responseSuperAdmin->assertStatus(200);
        $rolesForSuperAdmin = collect($responseSuperAdmin->json('roles'))->pluck('key')->all();
        $this->assertContains('super_admin', $rolesForSuperAdmin);
        $this->assertContains('admin', $rolesForSuperAdmin);
        $this->assertContains('staff', $rolesForSuperAdmin);
        $this->assertContains('user', $rolesForSuperAdmin);

        // Modules dan actions harus ada 10 modul kanonikal
        $modules = collect($responseSuperAdmin->json('modules'))->pluck('key')->all();
        $this->assertCount(10, $modules);
        $this->assertContains('project', $modules);
        $this->assertContains('stock-movement', $modules);
    }
}
