<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AuditLogger
{
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'token',
        'secret',
        'card',
        'cvv',
        'cvc',
        'authorization',
        'cookie',
    ];

    public static function log(
        Request $request,
        string $event,
        string $result = 'success',
        ?string $resourceType = null,
        string|int|null $resourceId = null,
        array $metadata = [],
        ?int $userId = null,
        ?string $userEmail = null,
    ): void {
        try {
            if (! Schema::hasTable('audit_logs')) {
                return;
            }

            $authUser = $request->user();

            AuditLog::query()->create([
                'user_id' => $userId ?? $authUser?->id,
                'user_email' => $userEmail ?? $authUser?->email,
                'event' => $event,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId !== null ? (string) $resourceId : null,
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500) ?: null,
                'result' => $result,
                'metadata' => $metadata !== [] ? self::sanitize($metadata) : null,
                'created_at' => now(),
            ]);
        } catch (Throwable) {
            // La bitácora no debe interrumpir una operación si falla el registro auxiliar
        }
    }

    private static function sanitize(array $data): array
    {
        $clean = [];
        foreach ($data as $key => $value) {
            $lower = strtolower((string) $key);
            $isSensitive = false;
            foreach (self::SENSITIVE_KEYS as $needle) {
                if (str_contains($lower, $needle)) {
                    $isSensitive = true;
                    break;
                }
            }

            if ($isSensitive) {
                $clean[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $clean[$key] = self::sanitize($value);
            } else {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }
}
