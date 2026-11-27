<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $user->is_graduate = true;
        $user->can_review_talent = false;
        $user->save();
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return $this->me($request)->setStatusCode(201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::guard('web')->attempt($request->validated())) {
            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }
        $request->session()->regenerate();
        if (! Auth::guard('web')->user()->talent_pilot_enabled) {
            $this->logout($request);
            abort(403, 'Cuenta no habilitada para el piloto.');
        }

        return $this->me($request);
    }

    public function me(Request $request): JsonResponse
    {
        $user = Auth::guard('web')->user();

        return response()->json(['data' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'pilot_enabled' => $user->talent_pilot_enabled, 'is_graduate' => $user->is_graduate, 'can_review_talent' => $user->can_review_talent, 'person_id' => $user->person_id]]]);
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
