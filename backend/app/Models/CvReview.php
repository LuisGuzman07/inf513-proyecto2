<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CvReview extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['absent' => 'boolean', 'sequence' => 'integer', 'cv_document_version' => 'integer'];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(TalentRegistration::class, 'registration_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
