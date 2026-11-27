<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RegistrationDocument extends Model
{
    use HasUuids;

    public const TYPES = ['historico', 'ci', 'fotografia', 'titulo_academico', 'provision_nacional', 'cv'];

    public const REQUIRED = ['historico', 'ci', 'fotografia', 'titulo_academico'];

    protected $guarded = ['id'];

    protected $hidden = ['path'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'size' => 'integer'];
    }

    public function metadata(): array
    {
        return ['id' => $this->id, 'type' => $this->type, 'version' => $this->version, 'original_name' => $this->original_name, 'mime' => $this->mime, 'size' => $this->size, 'created_at' => $this->created_at->toISOString()];
    }
}
