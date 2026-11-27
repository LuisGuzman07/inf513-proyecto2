<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatalogFaculty extends Model
{
    protected $primaryKey = 'catalog_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['active' => 'boolean', 'consulted_at' => 'date'];
    }

    public function options()
    {
        return $this->hasMany(CatalogCareerOption::class, 'faculty_catalog_id', 'catalog_id');
    }
}
