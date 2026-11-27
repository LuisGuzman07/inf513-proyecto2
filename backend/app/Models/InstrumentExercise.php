<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class InstrumentExercise extends Model
{
    use HasUuids;

    public const SINGLE_CHOICE = 'single_choice';

    public const SINGLE_CHOICE_UNSCORED = 'single_choice_unscored';

    public const TWO_HALVES = 'two_halves';

    protected $guarded = ['id'];

    protected $hidden = [
        'correct_option', 'correct_first', 'correct_second',
        'image_path', 'original_path', 'reconstruction_path', 'answer_markdown',
    ];

    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'points' => 'integer',
            'correct_first' => 'integer',
            'correct_second' => 'integer',
            'opciones' => 'array',
        ];
    }

    public function isTwoHalves(): bool
    {
        return $this->response_type === self::TWO_HALVES;
    }

    public function isUnscoredChoice(): bool
    {
        return $this->response_type === self::SINGLE_CHOICE_UNSCORED;
    }

    /**
     * Source key in the shape the response type uses, for staff-only views and scoring.
     * Never expose this to the candidate DTO.
     */
    public function sourceKey(): string|array|null
    {
        return $this->isTwoHalves()
            ? ['first' => $this->correct_first, 'second' => $this->correct_second]
            : $this->correct_option;
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Los ejercicios importados son inmutables.'));
        static::deleting(fn () => throw new LogicException('Los ejercicios importados son inmutables.'));
    }

    public function instrumentVersion(): BelongsTo
    {
        return $this->belongsTo(InstrumentVersion::class);
    }
}
