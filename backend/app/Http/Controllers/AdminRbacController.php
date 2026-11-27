<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRbacController extends Controller
{
    public function users(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');

        $query = User::query()
            ->with(['roles:id,slug,name,is_active', 'companyUsers.company:id,name,status'])
            ->orderBy('name');

        if ($search !== '') {
            $term = mb_strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$term}%"]);
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true)->where('talent_pilot_enabled', true);
        } elseif ($status === 'inactive') {
            $query->where(function ($q) {
                $q->where('is_active', false)->orWhere('talent_pilot_enabled', false);
            });
        }

        $users = $query->paginate(25);

        return response()->json([
            'data' => collect($users->items())->map(fn (User $u) => $this->serializeUser($u))->values(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function showUser(User $user): JsonResponse
    {
        $user->load([
            'roles:id,slug,name,is_active',
            'directPermissions:id,slug,name,module',
            'companyUsers.company:id,name,status',
        ]);

        return response()->json([
            'data' => $this->serializeUser($user, true),
        ]);
    }

    public function updateUserStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        if (! $validated['is_active'] && $request->user()->id === $user->id) {
            return response()->json(['message' => 'No puedes desactivar tu propia cuenta.'], 422);
        }

        $user->is_active = $validated['is_active'];
        $user->talent_pilot_enabled = $validated['is_active'];
        $user->save();

        AuditLogger::log(
            $request,
            'admin.user_status_updated',
            'success',
            'user',
            $user->id,
            ['is_active' => $validated['is_active'], 'target_email' => $user->email]
        );

        return response()->json([
            'message' => $validated['is_active'] ? 'Cuenta activada.' : 'Cuenta desactivada.',
            'data' => $this->serializeUser($user->fresh(['roles', 'companyUsers.company'])),
        ]);
    }

    public function syncUserRoles(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role_ids' => ['required', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
            'direct_permissions' => ['sometimes', 'array'],
            'direct_permissions.*.permission_id' => ['required_with:direct_permissions', 'integer', 'exists:permissions,id'],
            'direct_permissions.*.allowed' => ['required_with:direct_permissions', 'boolean'],
        ]);

        $user->roles()->sync($validated['role_ids']);
        $user->syncLegacyFlagsFromRoles();

        if (array_key_exists('direct_permissions', $validated)) {
            $syncData = [];
            foreach ($validated['direct_permissions'] as $item) {
                $syncData[(int) $item['permission_id']] = ['allowed' => (bool) $item['allowed']];
            }
            $user->directPermissions()->sync($syncData);
        }

        $user->load(['roles:id,slug,name,is_active', 'directPermissions:id,slug,name,module', 'companyUsers.company:id,name,status']);

        AuditLogger::log(
            $request,
            'admin.user_roles_updated',
            'success',
            'user',
            $user->id,
            ['role_ids' => $validated['role_ids'], 'target_email' => $user->email]
        );

        return response()->json([
            'message' => 'Roles y permisos actualizados.',
            'data' => $this->serializeUser($user, true),
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::query()
            ->with(['permissions:id,slug,name,module,is_active'])
            ->withCount('users')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $roles->map(fn (Role $r) => $this->serializeRole($r))->values(),
        ]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9_]+$/', 'unique:roles,slug'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = Role::query()->create([
            'slug' => $validated['slug'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'is_system' => false,
        ]);

        if (isset($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        $role->load('permissions:id,slug,name,module,is_active')->loadCount('users');

        AuditLogger::log(
            $request,
            'admin.role_created',
            'success',
            'role',
            $role->id,
            ['slug' => $role->slug, 'permission_ids' => $validated['permission_ids'] ?? []]
        );

        return response()->json([
            'message' => 'Rol creado correctamente.',
            'data' => $this->serializeRole($role),
        ], 201);
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        if ($role->slug === 'administrador' && array_key_exists('is_active', $validated) && ! $validated['is_active']) {
            return response()->json(['message' => 'El rol Administrador del sistema no puede desactivarse.'], 422);
        }

        $role->fill(collect($validated)->only(['name', 'description', 'is_active'])->all());
        $role->save();

        if (array_key_exists('permission_ids', $validated)) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        $role->load('permissions:id,slug,name,module,is_active')->loadCount('users');

        AuditLogger::log(
            $request,
            'admin.role_created',
            'success',
            'role',
            $role->id,
            ['slug' => $role->slug, 'permission_ids' => $validated['permission_ids'] ?? []]
        );

        return response()->json([
            'message' => 'Rol actualizado correctamente.',
            'data' => $this->serializeRole($role),
        ]);
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::query()->orderBy('module')->orderBy('name')->get();

        return response()->json([
            'data' => $permissions->map(fn (Permission $p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'module' => $p->module,
                'description' => $p->description,
                'is_active' => $p->is_active,
            ])->values(),
        ]);
    }

    public function storePermission(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9_.]+$/', 'unique:permissions,slug'],
            'name' => ['required', 'string', 'max:150'],
            'module' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $permission = Permission::query()->create([
            'slug' => $validated['slug'],
            'name' => $validated['name'],
            'module' => $validated['module'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Permiso creado correctamente.',
            'data' => $permission,
        ], 201);
    }

    public function updatePermission(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'module' => ['sometimes', 'required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $permission->fill($validated);
        $permission->save();

        return response()->json([
            'message' => 'Permiso actualizado correctamente.',
            'data' => $permission,
        ]);
    }

    private function serializeUser(User $user, bool $detailed = false): array
    {
        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->isAccountActive(),
            'roles' => $user->roles->map(fn (Role $r) => [
                'id' => $r->id,
                'slug' => $r->slug,
                'name' => $r->name,
                'is_active' => $r->is_active,
            ])->values()->all(),
            'companies' => $user->companyUsers
                ->filter(fn ($cu) => $cu->company !== null)
                ->map(fn ($cu) => [
                    'id' => $cu->company->id,
                    'name' => $cu->company->name,
                    'status' => $cu->company->status,
                ])->values()->all(),
            'created_at' => $user->created_at?->toIso8601String(),
        ];

        if ($detailed) {
            $payload['effective_permissions'] = $user->effectivePermissions();
            $payload['direct_permissions'] = $user->directPermissions->map(fn (Permission $p) => [
                'permission_id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'allowed' => (bool) $p->pivot->allowed,
            ])->values()->all();
        }

        return $payload;
    }

    private function serializeRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'slug' => $role->slug,
            'name' => $role->name,
            'description' => $role->description,
            'is_active' => $role->is_active,
            'is_system' => $role->is_system,
            'users_count' => $role->users_count ?? 0,
            'permissions' => $role->permissions->map(fn (Permission $p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'module' => $p->module,
                'is_active' => $p->is_active,
            ])->values()->all(),
        ];
    }
}
