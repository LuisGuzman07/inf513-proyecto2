<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $allowed = ['name', 'email', 'password', 'password_confirmation'];
        $errors = [];
        foreach (array_diff(array_keys($request->all()), $allowed) as $field) {
            $errors[$field] = ['Campo no permitido.'];
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
        $input = $request->validate(['name' => ['required', 'string', 'max:200'], 'email' => ['required', 'string', 'email:rfc', 'max:254', 'unique:users,email'], 'password' => ['required', 'string', 'min:12', 'max:128', 'confirmed']]);
        $user = new User($input);
        $user->talent_pilot_enabled = true;
        $user->is_active = true;
        $user->is_graduate = true;
        $user->can_review_talent = false;
        $user->save();

        if (Schema::hasTable('roles')) {
            $role = Role::query()->where('slug', 'titular_talento')->where('is_active', true)->first();
            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        AuditLogger::log($request, 'auth.register', 'success', 'user', $user->id, ['email' => $user->email], $user->id, $user->email);

        return $this->me($request)->setStatusCode(201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        if (! Auth::guard('web')->attempt($credentials)) {
            AuditLogger::log($request, 'auth.login_failed', 'failed', 'auth', null, ['email' => $credentials['email'] ?? null], null, $credentials['email'] ?? null);

            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }
        $request->session()->regenerate();
        $user = Auth::guard('web')->user();
        if (! $user->isAccountActive()) {
            AuditLogger::log($request, 'auth.login_failed', 'denied', 'user', $user->id, ['reason' => 'inactive'], $user->id, $user->email);
            $this->logout($request);
            abort(403, 'Cuenta desactivada o no habilitada.');
        }

        AuditLogger::log($request, 'auth.login_success', 'success', 'user', $user->id, [], $user->id, $user->email);

        return $this->me($request);
    }

    public function me(Request $request): JsonResponse
    {
        $user = Auth::guard('web')->user();
        $roles = Schema::hasTable('roles')
            ? $user->roles()
                ->where('roles.is_active', true)
                ->orderBy('roles.name')
                ->get(['roles.id', 'roles.slug', 'roles.name'])
                ->map(fn (Role $r) => ['id' => $r->id, 'slug' => $r->slug, 'name' => $r->name])
                ->values()
                ->all()
            : [];

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'pilot_enabled' => $user->talent_pilot_enabled,
                    'is_active' => $user->isAccountActive(),
                    'is_graduate' => $user->is_graduate,
                    'can_review_talent' => $user->can_review_talent,
                    'can_manage_services' => (bool) $user->can_manage_services,
                    'person_id' => $user->person_id,
                    'ui_preferences' => $user->ui_preferences,
                    'roles' => $roles,
                    'permissions' => $user->effectivePermissions(),
                ],
            ],
        ]);
    }

    public function logout(Request $request): Response
    {
        $user = Auth::guard('web')->user();
        if ($user) {
            AuditLogger::log($request, 'auth.logout', 'success', 'user', $user->id, [], $user->id, $user->email);
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
