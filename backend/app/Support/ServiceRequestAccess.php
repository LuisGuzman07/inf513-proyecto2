<?php

namespace App\Support;

use App\Models\CompanyUser;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * S2.2.1 y S2.5: dos vías de acceso a una solicitud de servicio, nunca una capacidad universal.
 * – Personal de plataforma: capacidad explícita y provisional `can_manage_services`.
 * – Responsable empresarial: vinculación `company_users` activa con la empresa de esa solicitud.
 *
 * La pertenencia se consulta en cada petición, no se guarda en la sesión: desactivar la
 * vinculación retira el acceso aunque la sesión siga abierta.
 */
final class ServiceRequestAccess
{
    public static function isStaff(User $user): bool
    {
        return (bool) $user->can_manage_services;
    }

    /** Empresas donde la cuenta es responsable activo; una empresa inactiva no da acceso. */
    public static function activeCompanyIds(User $user): array
    {
        return CompanyUser::query()
            ->active()
            ->where('user_id', $user->id)
            ->whereHas('company', fn (Builder $query) => $query->where('status', 'active'))
            ->orderBy('company_id')
            ->pluck('company_id')
            ->all();
    }

    /** Pertenencia propia y activa: la única fuente de la navegación del panel empresarial. */
    public static function memberships(User $user): array
    {
        return CompanyUser::query()
            ->with('company')
            ->active()
            ->where('user_id', $user->id)
            ->whereHas('company', fn (Builder $query) => $query->where('status', 'active'))
            ->orderBy('company_id')
            ->get()
            ->map(fn (CompanyUser $link) => [
                'id' => $link->company->id,
                'name' => $link->company->name,
                'role' => $link->role,
                'linked_at' => $link->linked_at?->toISOString(),
            ])
            ->all();
    }

    public static function belongs(User $user, ServiceRequest $serviceRequest): bool
    {
        return $serviceRequest->company_id !== null
            && in_array($serviceRequest->company_id, self::activeCompanyIds($user), true);
    }

    public static function canReach(User $user, ServiceRequest $serviceRequest): bool
    {
        return self::isStaff($user) || self::belongs($user, $serviceRequest);
    }

    /** Quién queda registrado en el historial: el responsable de la empresa o el personal. */
    public static function actorKind(User $user, ServiceRequest $serviceRequest): string
    {
        return self::belongs($user, $serviceRequest) ? 'company_user' : 'staff';
    }
}
