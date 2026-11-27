<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestEvent extends Model
{
    use HasUuids;

    /** S2.2: quién produjo el evento, aunque el actor no tenga cuenta. */
    public const ACTOR_KINDS = ['company_user', 'staff', 'public'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['changes' => 'array', 'version' => 'integer'];
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
