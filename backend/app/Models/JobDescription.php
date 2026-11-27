<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobDescription extends Model
{
    use HasUuids;

    public const TRAVEL = ['no', 'ocasional', 'constante'];

    /** Campos de S11-C, sin repetir los que ya viven en la solicitud. */
    public const FIELDS = [
        'position_title', 'area', 'reports_to', 'headcount', 'objective', 'activities',
        'required_education', 'required_knowledge', 'required_experience', 'work_schedule',
        'travel', 'work_environment',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['activities' => 'array'];
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
