<?php

namespace App\Http\Controllers;

use App\Models\PageVisit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageVisitController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:255'],
        ]);

        $path = '/'.ltrim(parse_url($validated['path'], PHP_URL_PATH) ?: '/', '/');

        // Excluir rutas de API y recursos estáticos
        if (
            str_starts_with($path, '/api/') ||
            str_starts_with($path, '/sanctum/') ||
            preg_match('/\.(js|css|png|jpe?g|gif|svg|ico|woff2?|ttf|map|json)$/i', $path)
        ) {
            return response()->json($this->summaryData($path));
        }

        $sessionId = $request->hasSession() ? $request->session()->getId() : '';
        $visitorKey = hash('sha256', ($sessionId !== '' ? $sessionId : ($request->ip() ?? 'anon')).'|'.substr((string) $request->userAgent(), 0, 200));

        // Regla anti-duplicado: no incrementar si el mismo visitante ya visitó esta ruta en los últimos 30 minutos
        $alreadyCounted = PageVisit::query()
            ->where('path', $path)
            ->where('visitor_key', $visitorKey)
            ->where('visited_at', '>=', now()->subMinutes(30))
            ->exists();

        if (! $alreadyCounted) {
            PageVisit::query()->create([
                'path' => $path,
                'visitor_key' => $visitorKey,
                'user_id' => $request->user()?->id,
                'ip_address' => $request->ip(),
                'visited_at' => now(),
            ]);
        }

        return response()->json($this->summaryData($path));
    }

    public function summary(): JsonResponse
    {
        return response()->json($this->summaryData());
    }

    private function summaryData(?string $path = null): array
    {
        $total = PageVisit::query()->count();
        $today = PageVisit::query()->where('visited_at', '>=', now()->startOfDay())->count();

        return [
            'data' => [
                'total_visits' => $total,
                'today_visits' => $today,
                'path_visits' => $path ? PageVisit::query()->where('path', $path)->count() : null,
            ],
        ];
    }
}
