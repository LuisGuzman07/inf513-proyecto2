<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyUser;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCompanyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        $query = Company::query()
            ->with(['companyUsers.user:id,name,email'])
            ->withCount('serviceRequests')
            ->orderBy('name');

        if ($search !== '') {
            $pattern = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($pattern) {
                $q->where('name', 'ilike', $pattern)
                    ->orWhere('legal_name', 'ilike', $pattern)
                    ->orWhere('contact_email', 'ilike', $pattern);
            });
        }

        $companies = $query->get()->map(fn (Company $c) => $this->serializeCompany($c))->values();

        return response()->json(['data' => $companies]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'legal_name' => ['nullable', 'string', 'max:200'],
            'contact_email' => ['required', 'email:rfc', 'max:254'],
            'status' => ['sometimes', Rule::in(Company::STATUSES)],
        ]);

        $company = Company::query()->create([
            'name' => $validated['name'],
            'legal_name' => $validated['legal_name'] ?? $validated['name'],
            'contact_email' => $validated['contact_email'],
            'status' => $validated['status'] ?? 'active',
            'version' => 1,
        ]);

        AuditLogger::log($request, 'company.created', 'success', 'company', $company->id, ['name' => $company->name]);

        $company->load('companyUsers.user:id,name,email')->loadCount('serviceRequests');

        return response()->json([
            'message' => 'Empresa registrada correctamente.',
            'data' => $this->serializeCompany($company),
        ], 201);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'legal_name' => ['nullable', 'string', 'max:200'],
            'contact_email' => ['sometimes', 'required', 'email:rfc', 'max:254'],
            'status' => ['sometimes', Rule::in(Company::STATUSES)],
        ]);

        $company->fill($validated);
        $company->version = ($company->version ?? 1) + 1;
        $company->save();

        AuditLogger::log($request, 'company.updated', 'success', 'company', $company->id, ['status' => $company->status]);

        $company->load('companyUsers.user:id,name,email')->loadCount('serviceRequests');

        return response()->json([
            'message' => 'Empresa actualizada correctamente.',
            'data' => $this->serializeCompany($company),
        ]);
    }

    public function linkUser(Request $request, Company $company): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'exists:users,email'],
        ]);

        $targetUser = User::query()->where('email', $validated['email'])->firstOrFail();

        CompanyUser::query()->updateOrCreate(
            ['company_id' => $company->id, 'user_id' => $targetUser->id],
            [
                'role' => 'hr_manager',
                'status' => 'active',
                'linked_by_user_id' => $request->user()->id,
                'linked_at' => now(),
                'disabled_at' => null,
            ]
        );

        $role = Role::query()->where('slug', 'responsable_empresarial')->first();
        if ($role) {
            $targetUser->roles()->syncWithoutDetaching([$role->id]);
        }

        AuditLogger::log($request, 'company.user_linked', 'success', 'company', $company->id, ['target_email' => $targetUser->email]);

        $company->load('companyUsers.user:id,name,email')->loadCount('serviceRequests');

        return response()->json([
            'message' => "Usuario {$targetUser->email} vinculado a {$company->name}.",
            'data' => $this->serializeCompany($company),
        ]);
    }

    public function toggleUserLink(Request $request, Company $company, CompanyUser $companyUser): JsonResponse
    {
        if ($companyUser->company_id !== $company->id) {
            abort(404);
        }

        $next = $companyUser->status === 'active' ? 'inactive' : 'active';
        $companyUser->status = $next;
        $companyUser->disabled_at = $next === 'inactive' ? now() : null;
        $companyUser->save();

        AuditLogger::log($request, 'company.user_toggled', 'success', 'company', $company->id, ['company_user_id' => $companyUser->id, 'status' => $next]);

        $company->load('companyUsers.user:id,name,email')->loadCount('serviceRequests');

        return response()->json([
            'message' => $next === 'active' ? 'Vinculación activada.' : 'Vinculación desactivada.',
            'data' => $this->serializeCompany($company),
        ]);
    }

    private function serializeCompany(Company $company): array
    {
        return [
            'id' => $company->id,
            'name' => $company->name,
            'legal_name' => $company->legal_name,
            'contact_email' => $company->contact_email,
            'status' => $company->status,
            'service_requests_count' => $company->service_requests_count ?? 0,
            'members' => $company->companyUsers->map(fn (CompanyUser $cu) => [
                'id' => $cu->id,
                'user_id' => $cu->user_id,
                'name' => $cu->user?->name,
                'email' => $cu->user?->email,
                'role' => $cu->role,
                'status' => $cu->status,
                'linked_at' => $cu->linked_at?->toIso8601String(),
            ])->values()->all(),
            'created_at' => $company->created_at?->toIso8601String(),
        ];
    }
}
