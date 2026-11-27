<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'donation_id',
        'provider',
        'provider_reference',
        'status',
        'amount',
        'currency',
        'payload_summary',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payload_summary' => 'array',
        ];
    }

    public function donation(): BelongsTo
    {
        return $this->belongsTo(Donation::class);
    }
}
