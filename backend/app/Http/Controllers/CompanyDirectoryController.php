<?php

namespace App\Http\Controllers;

use App\Support\ServiceRequestAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * S2.2.1 y S2.2.2: sólo la pertenencia propia y activa, sin capacidades ni empresas ajenas.
 * El panel empresarial decide su navegación con `/api/servicios/acceso`; este endpoint existe
 * como lectura separada de la vinculación.
 */
class CompanyDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => ServiceRequestAccess::memberships($request->user())]);
    }
}
