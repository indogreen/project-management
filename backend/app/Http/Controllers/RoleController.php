<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    protected ActivityLogService $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    public function users()
    {
        /** @var User|null $actor */
        $actor = Auth::user();

        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $actor->hasAnyRole(['super_admin', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = User::query()
            ->where('id', '!=', $actor->id)
            ->orderBy('name');

        if ($actor->hasRole('admin') && ! $actor->hasRole('super_admin')) {
            $query->whereDoesntHave('roles', function ($q) {
                $q->whereIn('name', ['admin', 'super_admin']);
            });
        }

        $users = $query->get();

        $data = $users->map(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ];
        })->values();

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Mengembalikan daftar 38 permission kanonikal aplikasi.
     *
     * @return array<int, string>
     */
    public static function getCanonicalPermissions(): array
    {
        $modules = config('permission.system_modules', [
            'project' => ['view', 'create', 'update', 'delete'],
            'activity' => ['view', 'create', 'update', 'delete'],
            'mitra' => ['view', 'create', 'update', 'delete'],
            'bc' => ['view', 'create', 'update', 'delete'],
            'certificate' => ['view', 'create', 'update', 'delete'],
            'finance' => ['view', 'update'],
            'category' => ['view', 'create', 'update', 'delete'],
            'warehouse' => ['view', 'create', 'update', 'delete'],
            'item' => ['view', 'create', 'update', 'delete'],
            'stock-movement' => ['view', 'create', 'update', 'delete'],
        ]);

        $permissions = [];
        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $permissions[] = "{$module}-{$action}";
            }
        }

        return array_values(array_unique($permissions));
    }

    /**
     * Mengembalikan daftar role yang diizinkan untuk di-assign oleh aktor.
     *
     * @return array<int, string>
     */
    public static function getAllowedRolesForActor(User $actor): array
    {
        if ($actor->hasRole('super_admin')) {
            return config('permission.system_roles', ['super_admin', 'admin', 'staff', 'user']);
        }

        if ($actor->hasRole('admin')) {
            return ['staff', 'user'];
        }

        return [];
    }

    public function update(Request $request)
    {
        /** @var User|null $actor */
        $actor = Auth::user();

        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! $actor->hasAnyRole(['super_admin', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $allowedRoles = self::getAllowedRolesForActor($actor);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role' => ['required', 'string', Rule::in($allowedRoles)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['boolean'],
        ]);

        /** @var User $targetUser */
        $targetUser = User::findOrFail($data['user_id']);

        // Proteksi agar user tidak bisa menurunkan atau mengubah role-nya sendiri secara tidak sengaja
        if ($actor->id === $targetUser->id) {
            return response()->json([
                'message' => 'Kamu tidak boleh mengubah role milik akun kamu sendiri.',
            ], 403);
        }

        // Aturan Hierarki: Admin dilarang keras memodifikasi user setingkat atau lebih tinggi
        if ($actor->hasRole('admin') && ! $actor->hasRole('super_admin')) {
            if ($targetUser->hasAnyRole(['admin', 'super_admin'])) {
                return response()->json([
                    'message' => 'Admin tidak boleh mengubah user dengan role admin atau super_admin.',
                ], 403);
            }
        }

        // Validasi allowlist permission keys: tolak jika ada nama permission di luar sistem
        $validPermissions = self::getCanonicalPermissions();
        if (! empty($data['permissions'])) {
            $unknownPermissions = array_diff(array_keys($data['permissions']), $validPermissions);
            if (! empty($unknownPermissions)) {
                return response()->json([
                    'message' => 'Izin tidak dikenal: ' . implode(', ', $unknownPermissions),
                ], 422);
            }
        }

        $guard = config('auth.defaults.guard', 'api');

        // Cari role yang sudah ada (tidak membuat role baru secara dinamis)
        $role = Role::where('name', $data['role'])
            ->where('guard_name', $guard)
            ->first();

        if (! $role) {
            return response()->json([
                'message' => "Role '{$data['role']}' belum terdaftar dalam sistem.",
            ], 422);
        }

        // Mengambil snapshot role & permission saat ini untuk kepentingan audit log (perbandingan data lama)
        $previousSnapshot = [
            'roles' => $targetUser->getRoleNames()->toArray(),
            'permissions' => $targetUser->getAllPermissions()->pluck('name')->toArray(),
        ];

        $targetUser->syncRoles([$role->name]);

        $permissionNames = [];
        if (! empty($data['permissions'])) {
            foreach ($data['permissions'] as $key => $value) {
                if ($value) {
                    $permissionNames[] = $key;
                }
            }
        }

        if (! empty($permissionNames)) {
            // Verifikasi bahwa permissions yang diminta memang sudah terdaftar di database untuk guard ini
            $existingPermissions = Permission::whereIn('name', $permissionNames)
                ->where('guard_name', $guard)
                ->pluck('name')
                ->toArray();

            $missingPermissions = array_diff($permissionNames, $existingPermissions);
            if (! empty($missingPermissions)) {
                return response()->json([
                    'message' => 'Permission belum terdaftar di sistem: ' . implode(', ', $missingPermissions),
                ], 422);
            }

            $targetUser->syncPermissions($permissionNames);
        } else {
            $targetUser->syncPermissions([]);
        }

        // Mengambil snapshot setelah perubahan untuk mencatat perbedaan yang terjadi di audit log
        $currentSnapshot = [
            'roles' => $targetUser->getRoleNames()->toArray(),
            'permissions' => $targetUser->getAllPermissions()->pluck('name')->toArray(),
        ];

        $this->activityLogService->log(
            'role_assignment',
            User::class,
            $targetUser->id,
            $targetUser->name,
            sprintf('Role & permission user diperbarui oleh %s', $actor->name),
            $previousSnapshot,
            $currentSnapshot
        );

        return response()->json([
            'message' => 'User role & permissions updated successfully',
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'roles' => $targetUser->getRoleNames(),
                'permissions' => $targetUser->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    public function config()
    {
        /** @var User $actor */
        $actor = Auth::user();

        $systemRoles = config('permission.system_roles', ['super_admin', 'admin', 'staff', 'user']);
        $existingRoles = Role::whereIn('name', $systemRoles)->pluck('name')->toArray();

        $filteredRoles = $existingRoles;
        if ($actor->hasRole('admin') && ! $actor->hasRole('super_admin')) {
            $filteredRoles = array_values(array_filter($existingRoles, function ($role) {
                return ! in_array($role, ['admin', 'super_admin']);
            }));
        }

        $rolesData = array_map(function ($role) {
            return [
                'key' => $role,
                'label' => ucwords(str_replace('_', ' ', $role)),
            ];
        }, $filteredRoles);

        $modules = [
            ['key' => 'project',     'label' => 'Project'],
            ['key' => 'activity',    'label' => 'Activity'],
            ['key' => 'mitra',       'label' => 'Mitra'],
            ['key' => 'bc',          'label' => 'Barang Sertifikat'],
            ['key' => 'certificate', 'label' => 'Sertifikat'],
            ['key' => 'finance',     'label' => 'Finance', 'actions' => [
                ['key' => 'view',   'label' => 'View'],
                ['key' => 'update', 'label' => 'Update'],
            ]],
            ['key' => 'category', 'label' => 'Kategori'],
            ['key' => 'warehouse', 'label' => 'Gudang'],
            ['key' => 'item', 'label' => 'Item'],
            ['key' => 'stock-movement', 'label' => 'Mutasi Stok'],
        ];

        $actions = [
            ['key' => 'view',   'label' => 'View'],
            ['key' => 'create', 'label' => 'Create'],
            ['key' => 'update', 'label' => 'Update'],
            ['key' => 'delete', 'label' => 'Delete'],
        ];

        return response()->json([
            'roles' => $rolesData,
            'modules' => $modules,
            'actions' => $actions,
        ]);
    }
}
