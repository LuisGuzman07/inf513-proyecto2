<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceCandidate extends Model
{
    use HasUuids;

    /** No exige título UAGRM, no crea cuenta y no publica nada en el proceso A. */
    public const FIELDS = ['full_name', 'contact_email', 'contact_phone', 'notes'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['version' => 'integer'];
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
