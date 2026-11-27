<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()
            ->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($search = trim((string) $request->query('q', ''))) {
            $term = mb_strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(COALESCE(user_email, \'\')) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(event) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(COALESCE(resource_type, \'\')) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(COALESCE(ip_address, \'\')) LIKE ?', ["%{$term}%"]);
            });
        }

        if ($event = trim((string) $request->query('event', ''))) {
            $query->where('event', $event);
        }

        if ($result = trim((string) $request->query('result', ''))) {
            $query->where('result', $result);
        }

        if ($resourceType = trim((string) $request->query('resource_type', ''))) {
            $query->where('resource_type', $resourceType);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', (int) $userId);
        }

        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to.' 23:59:59');
        }

        $logs = $query->paginate(25);

        return response()->json([
            'data' => collect($logs->items())->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user_name' => $log->user?->name,
                'user_email' => $log->user_email ?? $log->user?->email,
                'event' => $log->event,
                'resource_type' => $log->resource_type,
                'resource_id' => $log->resource_id,
                'ip_address' => $log->ip_address,
                'result' => $log->result,
                'metadata' => $log->metadata,
                'created_at' => $log->created_at?->toIso8601String(),
            ])->values(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
