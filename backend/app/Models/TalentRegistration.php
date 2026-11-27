<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TalentRegistration extends Model
{
    use HasUuids;

    public const ACADEMIC = ['faculty', 'career', 'interest_area', 'declared_ppa'];

    public const CATALOG = ['faculty_catalog_id', 'career_catalog_id', 'career_manual', 'catalog_label'];

    public const MOBILITY = ['province', 'department', 'country'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'submitted_at' => 'datetime', 'mobility_province' => 'boolean', 'mobility_department' => 'boolean', 'mobility_country' => 'boolean', 'career_manual' => 'boolean'];
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function holderUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'holder_user_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(RegistrationEvent::class, 'registration_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(RegistrationDocument::class, 'registration_id');
    }

    public function observations(): HasMany
    {
        return $this->hasMany(RegistrationObservation::class, 'registration_id');
    }

    public function academicReviews(): HasMany
    {
        return $this->hasMany(AcademicReview::class, 'registration_id');
    }

    public function cvReviews(): HasMany
    {
        return $this->hasMany(CvReview::class, 'registration_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_user_id');
    }

    public function curriculum(): HasOne
    {
        return $this->hasOne(CandidateCurriculum::class, 'registration_id');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(EvaluationAssignment::class, 'registration_id');
    }

    public static function generateNextCandidateCode(): string
    {
        $year = date('Y');
        $prefix = "POST-{$year}-";

        $last = static::where('candidate_code', 'like', "{$prefix}%")
            ->orderByDesc('candidate_code')
            ->value('candidate_code');

        if ($last) {
            $num = (int) substr($last, strlen($prefix));
            $next = $num + 1;
        } else {
            $next = static::count() + 1;
        }

        return sprintf('%s%04d', $prefix, $next);
    }

    protected static function booted(): void
    {
        static::creating(function (TalentRegistration $registration) {
            if (empty($registration->candidate_code)) {
                $registration->candidate_code = static::generateNextCandidateCode();
            }
        });
    }
}
