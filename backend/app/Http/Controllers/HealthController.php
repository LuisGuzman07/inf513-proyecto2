<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            // Verifica PostgreSQL de verdad; no depende de tablas ni migra datos.
            DB::connection('pgsql')->select('SELECT 1');

            return response()->json([
                'status' => 'ok',
                'api' => 'ok',
                'database' => 'ok',
            ])->header('Cache-Control', 'no-store');
        } catch (Throwable) {
            // Nunca devolver mensajes SQL, credenciales, rutas o stack traces.
            return response()->json([
                'status' => 'degraded',
                'api' => 'ok',
                'database' => 'unavailable',
            ], 503)->header('Cache-Control', 'no-store');
        }
    }
}
