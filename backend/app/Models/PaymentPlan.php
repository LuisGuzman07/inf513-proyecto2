<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentPlan extends Model
{
    use HasUuids;

    public const FREQUENCIES = ['unico', 'mensual', 'trimestral', 'anual'];

    public const STATUSES = ['active', 'paused', 'completed', 'cancelled'];

    protected $fillable = [
        'user_id',
        'company_id',
        'name',
        'amount',
        'currency',
        'frequency',
        'installments',
        'completed_installments',
        'status',
        'next_due_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'installments' => 'integer',
            'completed_installments' => 'integer',
            'next_due_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
