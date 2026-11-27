<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use LogicException;

class InstrumentVersion extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    public const SINGLE_CHOICE = 'single_choice';

    public const SINGLE_CHOICE_UNSCORED = 'single_choice_unscored';

    public const TWO_HALVES = 'two_halves';

    protected $hidden = ['instructions_source_markdown', 'example_image_path', 'storage_prefix', 'manifest', 'source_file_hashes'];

    protected function casts(): array
    {
        return [
            'package_date' => 'date:Y-m-d',
            'manifest' => 'array',
            'source_file_hashes' => 'array',
            'application_ready' => 'boolean',
            'scoring_enabled' => 'boolean',
            'option_labels' => 'array',
        ];
    }

    public function isTwoHalves(): bool
    {
        return $this->answer_type === self::TWO_HALVES;
    }

    public function isUnscoredChoice(): bool
    {
        return $this->answer_type === self::SINGLE_CHOICE_UNSCORED;
    }

    /** Options the candidate may choose from; A–H is the historical single-choice set. */
    public function optionLabels(): array
    {
        $labels = $this->option_labels;

        return is_array($labels) && $labels !== [] ? array_values($labels) : range('A', 'H');
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Las versiones importadas son inmutables.'));
        static::deleting(fn () => throw new LogicException('Las versiones importadas son inmutables.'));
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(InstrumentExercise::class)->orderBy('number');
    }

    public function conformity(): HasOne
    {
        return $this->hasOne(InstrumentConformity::class);
    }
}
