<?php

namespace App\Http\Controllers;

use App\Support\ServiceRequestAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * S2.2.1 y S2.2.2: la navegación necesita saber si la cuenta es responsable empresarial y si
 * tiene la capacidad explícita de gestionar servicios. Se informa el dato autorizado del
 * servidor: pertenencia propia y `can_manage_services`, nunca una inferencia del cliente.
 *
 * No se toca `/auth/me`: la capacidad provisional se expone sólo en este endpoint de lectura.
 */
class ServiceAccessController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => [
            'companies' => ServiceRequestAccess::memberships($user),
            'staff' => ServiceRequestAccess::isStaff($user),
        ]]);
    }
}
