<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class InstrumentConformity extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $dateFormat = 'Y-m-d H:i:sP';

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('La conformidad registrada es inmutable.'));
        static::deleting(fn () => throw new LogicException('La conformidad registrada es inmutable.'));
    }

    protected function casts(): array
    {
        return ['recorded_at' => 'datetime', 'institutional_approval' => 'boolean'];
    }

    public function instrumentVersion(): BelongsTo
    {
        return $this->belongsTo(InstrumentVersion::class);
    }
}
