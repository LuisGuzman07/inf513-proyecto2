<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatalogCareerOption extends Model
{
    protected $primaryKey = 'catalog_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['source_names' => 'array', 'admission_refs' => 'array', 'notes' => 'array', 'needs_review' => 'boolean', 'active' => 'boolean'];
    }

    public function faculty()
    {
        return $this->belongsTo(CatalogFaculty::class, 'faculty_catalog_id', 'catalog_id');
    }
}
