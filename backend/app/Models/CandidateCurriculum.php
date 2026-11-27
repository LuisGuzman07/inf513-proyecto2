<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateCurriculum extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'education_levels' => 'array',
            'courses' => 'array',
            'work_experiences' => 'array',
            'declaration_accepted' => 'boolean',
            'application_date' => 'date',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(TalentRegistration::class, 'registration_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
