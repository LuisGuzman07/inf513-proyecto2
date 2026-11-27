<?php

namespace App\Support;

use App\Models\JobDescription;
use App\Models\ServiceRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ServiceRequestWorkflow
{
    private const FOLIO_LOCK = 18002026;

    public static function accessCode(): string
    {
        return Str::upper(Str::random(12));
    }

    /**
     * Folio legible B-AAAA-000N. El bloqueo asesor serializa la asignación dentro de la
     * transacción para que dos altas simultáneas no lean la misma última secuencia.
     */
    public static function nextFolio(?int $year = null): string
    {
        $year ??= (int) now()->year;
        DB::select('SELECT pg_advisory_xact_lock(CAST(? AS bigint))', [self::FOLIO_LOCK]);
        $last = ServiceRequest::where('folio', 'like', 'B-'.$year.'-%')->orderByDesc('folio')->value('folio');
        $sequence = $last === null ? 1 : ((int) substr($last, -4)) + 1;

        return sprintf('B-%d-%04d', $year, $sequence);
    }

    public static function requestAttributes(array $input): array
    {
        $attributes = [];
        foreach (ServiceRequest::FIELDS as $field) {
            if (array_key_exists($field, $input)) {
                $attributes[$field] = $input[$field];
            }
        }
        // Los valores iniciales pertenecen al modelo: un PATCH no debe vaciar idiomas omitidos.
        if (array_key_exists('benefits', $attributes)) {
            $attributes['benefits'] ??= '';
        }

        return $attributes;
    }

    /**
     * S11-C §1 Nombre del Puesto se precarga desde S11-B §2 cuando no se informa.
     */
    public static function descriptionAttributes(array $input, ?string $fallbackTitle = null): array
    {
        $attributes = [];
        foreach (JobDescription::FIELDS as $field) {
            if (array_key_exists($field, $input)) {
                $attributes[$field] = $input[$field];
            }
        }
        if ($fallbackTitle !== null && in_array($attributes['position_title'] ?? null, [null, ''], true)) {
            $attributes['position_title'] = $fallbackTitle;
        }

        return $attributes;
    }

    public static function snapshot(ServiceRequest $serviceRequest): array
    {
        $snapshot = ['status' => $serviceRequest->status];
        foreach (ServiceRequest::FIELDS as $field) {
            $snapshot[$field] = $field === 'deadline'
                ? $serviceRequest->deadline?->format('Y-m-d')
                : $serviceRequest->{$field};
        }
        // jsonb devuelve las claves ordenadas: se normaliza para comparar sólo los valores.
        $snapshot['languages'] = array_map(
            fn ($language) => ['language' => $language['language'] ?? null, 'level' => $language['level'] ?? null],
            is_array($snapshot['languages']) ? $snapshot['languages'] : []
        );

        return $snapshot;
    }

    public static function descriptionSnapshot(JobDescription $description): array
    {
        $snapshot = [];
        foreach (JobDescription::FIELDS as $field) {
            $snapshot[$field] = $description->{$field};
        }

        return $snapshot;
    }

    /** Sólo se registra historial cuando hay un cambio real. */
    public static function changes(array $before, array $after): array
    {
        $changes = [];
        foreach ($after as $field => $value) {
            if (($before[$field] ?? null) !== $value) {
                $changes[$field] = ['before' => $before[$field] ?? null, 'after' => $value];
            }
        }

        return $changes;
    }

    public static function version(ServiceRequest $serviceRequest, int $version): void
    {
        abort_if($serviceRequest->version !== $version, 409);
    }

    public static function event(ServiceRequest $serviceRequest, ?int $actor, string $action, array $changes, string $actorKind = 'staff'): void
    {
        $serviceRequest->version++;
        $serviceRequest->save();
        $serviceRequest->events()->create([
            'actor_user_id' => $actor,
            'actor_kind' => $actorKind,
            'action' => $action,
            'version' => $serviceRequest->version,
            'changes' => $changes,
        ]);
    }
}
