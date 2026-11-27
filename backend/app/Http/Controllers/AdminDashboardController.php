<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\EvaluationAssignment;
use App\Models\PageVisit;
use App\Models\ServiceCandidate;
use App\Models\ServiceRequest;
use App\Models\TalentRegistration;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    public function show(): JsonResponse
    {
        $registrationsByStatus = TalentRegistration::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $pendingReviewStatuses = ['submitted', 'in_review', 'pending_review'];
        $pendingReview = 0;
        foreach ($pendingReviewStatuses as $st) {
            $pendingReview += (int) ($registrationsByStatus[$st] ?? 0);
        }

        $evaluationsAssigned = EvaluationAssignment::query()->count();
        $evaluationsCompleted = EvaluationAssignment::query()
            ->whereIn('status', ['submitted', 'completed', 'scored'])
            ->count();

        $serviceRequestsByStatus = ServiceRequest::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $donationsConfirmed = 0;
        $donationsAmount = 0.0;
        if (Schema::hasTable('donations')) {
            $donationsConfirmed = (int) DB::table('donations')->where('status', 'confirmed')->count();
            $donationsAmount = (float) DB::table('donations')->where('status', 'confirmed')->sum('amount');
        }

        $visitsTotal = Schema::hasTable('page_visits') ? PageVisit::query()->count() : 0;
        $visitsToday = Schema::hasTable('page_visits')
            ? PageVisit::query()->where('visited_at', '>=', now()->startOfDay())->count()
            : 0;
        $visitsLast7Days = Schema::hasTable('page_visits')
            ? PageVisit::query()->where('visited_at', '>=', now()->subDays(7))->count()
            : 0;

        $topPages = Schema::hasTable('page_visits')
            ? PageVisit::query()
                ->select('path', DB::raw('COUNT(*) as visits'))
                ->groupBy('path')
                ->orderByDesc('visits')
                ->limit(8)
                ->get()
                ->map(fn ($row) => ['path' => $row->path, 'visits' => (int) $row->visits])
                ->values()
                ->all()
            : [];

        $recentAccesses = Schema::hasTable('audit_logs')
            ? AuditLog::query()
                ->whereIn('event', ['auth.login_success', 'auth.login_failed', 'auth.logout'])
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'user_email' => $log->user_email,
                    'event' => $log->event,
                    'result' => $log->result,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at?->toIso8601String(),
                ])
                ->values()
                ->all()
            : [];

        return response()->json([
            'data' => [
                'total_titulares' => User::query()->where('is_graduate', true)->count(),
                'total_expedientes' => array_sum(array_map('intval', $registrationsByStatus)),
                'expedientes_pendientes_revision' => $pendingReview,
                'expedientes_por_estado' => $registrationsByStatus,
                'evaluaciones_asignadas' => $evaluationsAssigned,
                'evaluaciones_completadas' => $evaluationsCompleted,
                'solicitudes_por_estado' => $serviceRequestsByStatus,
                'empresas_registradas' => Company::query()->count(),
                'candidatos_registrados' => ServiceCandidate::query()->count(),
                'donativos_confirmados' => $donationsConfirmed,
                'donativos_monto_total' => $donationsAmount,
                'visitas_totales' => $visitsTotal,
                'visitas_hoy' => $visitsToday,
                'visitas_ultimos_7_dias' => $visitsLast7Days,
                'top_paginas' => $topPages,
                'accesos_recientes' => $recentAccesses,
            ],
        ]);
    }
}
