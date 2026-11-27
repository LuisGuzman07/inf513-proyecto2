<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceRequest extends Model
{
    use HasUuids;

    /** `linked` sólo lo asigna la vinculación administrativa a una empresa. */
    public const STATUSES = ['submitted', 'in_review', 'linked'];

    /** Estados que un actor puede fijar editando la solicitud. */
    public const UPDATABLE_STATUSES = ['submitted', 'in_review'];

    public const MODALITIES = ['presencial', 'hibrido', 'remoto'];

    public const WORKDAYS = ['completo', 'medio', 'proyecto'];

    public const PAYMENT_SCHEMES = ['fijo', 'fijo_comisiones'];

    public const LANGUAGE_LEVELS = ['basico', 'intermedio', 'avanzado'];

    /** Campos de S11-B §1–§4 persistidos en la solicitud. */
    public const FIELDS = [
        'company_name', 'contact_name', 'contact_position', 'contact_area', 'contact_email', 'contact_phone',
        'position_title', 'vacancies', 'modality', 'workday', 'location', 'salary_currency', 'salary_min',
        'salary_max', 'payment_scheme', 'benefits', 'required_education', 'required_knowledge',
        'required_experience', 'languages', 'deadline',
    ];

    /** El rango salarial es opcional, pero se informa completo o no se informa. */
    public const SALARY = ['salary_currency', 'salary_min', 'salary_max'];

    protected $guarded = ['id'];

    protected $hidden = ['access_code_hash'];

    protected $attributes = ['benefits' => '', 'languages' => '[]'];

    protected function casts(): array
    {
        return [
            'vacancies' => 'integer',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
            'languages' => 'array',
            'deadline' => 'date:Y-m-d',
            'version' => 'integer',
        ];
    }

    public function jobDescription(): HasOne
    {
        return $this->hasOne(JobDescription::class);
    }

    /** Nullable: una solicitud pública nace sin empresa y no se atribuye sola. */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(ServiceCandidate::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ServiceRequestEvent::class);
    }
}
