<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * S2.2.1: vinculación explícita entre una cuenta existente y una empresa, con rol y estado.
 * El estado se evalúa en cada petición: desactivar la vinculación retira el acceso de inmediato.
 */
class CompanyUser extends Model
{
    use HasUuids;

    public const ROLES = ['hr_manager'];

    public const STATUSES = ['active', 'inactive'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['linked_at' => 'datetime', 'disabled_at' => 'datetime'];
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function linkedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'linked_by_user_id');
    }
}
