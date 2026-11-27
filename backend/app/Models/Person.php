<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Person extends Model
{
    use HasUuids;

    public const FIELDS = ['full_name', 'birth_date', 'university_registration', 'sex', 'contact_email', 'contact_phone'];

    protected $fillable = self::FIELDS;

    protected function casts(): array
    {
        return ['birth_date' => 'date'];
    }
}
