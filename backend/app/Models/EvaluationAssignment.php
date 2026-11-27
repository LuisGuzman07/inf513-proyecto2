<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class EvaluationAssignment extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['raw_result'];

    // Preserve the offset when writing PostgreSQL timestamp-with-time-zone columns.
    protected $dateFormat = 'Y-m-d H:i:sP';

    protected static function booted(): void
    {
        static::updating(function (self $assignment) {
            if ($assignment->getOriginal('status') === 'submitted'
                || $assignment->isDirty(['registration_id', 'instrument_version_id', 'assigned_by'])) {
                throw new LogicException('La versión aplicada y el envío final son inmutables.');
            }
        });
        static::deleting(fn () => throw new LogicException('Las asignaciones aplicadas no se eliminan.'));
    }

    protected function casts(): array
    {
        return ['version' => 'integer', 'answers' => 'array', 'raw_result' => 'array', 'submitted_at' => 'datetime'];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(TalentRegistration::class, 'registration_id');
    }

    public function instrumentVersion(): BelongsTo
    {
        return $this->belongsTo(InstrumentVersion::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
