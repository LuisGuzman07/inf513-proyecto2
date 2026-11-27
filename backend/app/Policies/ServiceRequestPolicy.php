<?php

namespace App\Policies;

use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\ServiceRequestAccess;

class ServiceRequestPolicy
{
    /**
     * S2.5: la gestión de servicios desde el área del personal exige `can_manage_services`.
     * `can_review_talent` sigue siendo la capacidad del proceso A y no se reutiliza aquí.
     */
    public function manage(User $user): bool
    {
        return ServiceRequestAccess::isStaff($user);
    }

    /** Alta autenticada (S2.2.2): personal con la capacidad o responsable con vinculación activa. */
    public function create(User $user): bool
    {
        return ServiceRequestAccess::isStaff($user) || ServiceRequestAccess::activeCompanyIds($user) !== [];
    }

    /** Listado: el personal ve todas; un responsable ve sólo las de sus empresas activas. */
    public function viewAny(User $user): bool
    {
        return ServiceRequestAccess::isStaff($user) || ServiceRequestAccess::activeCompanyIds($user) !== [];
    }

    public function view(User $user, ServiceRequest $serviceRequest): bool
    {
        return ServiceRequestAccess::canReach($user, $serviceRequest);
    }

    public function update(User $user, ServiceRequest $serviceRequest): bool
    {
        return ServiceRequestAccess::canReach($user, $serviceRequest);
    }

    public function manageCandidates(User $user, ServiceRequest $serviceRequest): bool
    {
        return ServiceRequestAccess::canReach($user, $serviceRequest);
    }

    /** Vincular una solicitud pública a una empresa es operación del personal, no del responsable. */
    public function linkCompany(User $user): bool
    {
        return ServiceRequestAccess::isStaff($user);
    }
}
