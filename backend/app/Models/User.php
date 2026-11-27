<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'talent_pilot_enabled' => 'boolean',
            'is_active' => 'boolean',
            'is_graduate' => 'boolean',
            'can_review_talent' => 'boolean',
            'can_manage_services' => 'boolean',
            'ui_preferences' => 'array',
        ];
    }

    public function companyUsers(): HasMany
    {
        return $this->hasMany(CompanyUser::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')->withTimestamps();
    }

    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
            ->withPivot('allowed')
            ->withTimestamps();
    }

    public function isAccountActive(): bool
    {
        return ($this->is_active ?? true) && (bool) $this->talent_pilot_enabled;
    }

    /**
     * Calcula los slugs de permisos efectivos considerando roles activos,
     * excepciones individuales y compatibilidad con banderas heredadas.
     *
     * @return list<string>
     */
    public function effectivePermissions(): array
    {
        $permissions = [];

        if (\Illuminate\Support\Facades\Schema::hasTable('roles') && \Illuminate\Support\Facades\Schema::hasTable('permissions')) {
            $rolePermissions = $this->roles()
                ->where('roles.is_active', true)
                ->with(['permissions' => fn ($q) => $q->where('permissions.is_active', true)])
                ->get()
                ->flatMap(fn (Role $role) => $role->permissions->pluck('slug'))
                ->all();

            foreach ($rolePermissions as $slug) {
                $permissions[$slug] = true;
            }

            if (\Illuminate\Support\Facades\Schema::hasTable('user_permissions')) {
                foreach ($this->directPermissions()->where('permissions.is_active', true)->get() as $perm) {
                    if ((bool) $perm->pivot->allowed) {
                        $permissions[$perm->slug] = true;
                    } else {
                        unset($permissions[$perm->slug]);
                    }
                }
            }
        }

        // Respaldo con banderas heredadas para cuentas previas a RBAC
        if ($this->is_graduate) {
            $permissions['talento.inscripcion.gestionar'] = true;
            $permissions['talento.evaluaciones.realizar'] = true;
        }
        if ($this->can_review_talent) {
            $permissions['talento.revision.gestionar'] = true;
            $permissions['talento.instrumentos.gestionar'] = true;
            $permissions['candidatos.banco.ver'] = true;
        }
        if ($this->can_manage_services) {
            $permissions['servicios.gestionar'] = true;
            $permissions['candidatos.banco.ver'] = true;
        }
        if ($this->companyUsers()->whereHas('company', fn ($q) => $q->where('status', 'active'))->exists()) {
            $permissions['empresa.servicios.consultar'] = true;
            $permissions['empresa.donativos.gestionar'] = true;
            $permissions['candidatos.banco.ver'] = true;
        }

        $result = array_keys($permissions);
        sort($result);

        return $result;
    }

    public function hasPermission(string $slug): bool
    {
        return in_array($slug, $this->effectivePermissions(), true);
    }

    public function hasRole(string $slug): bool
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('roles')) {
            return false;
        }

        return $this->roles()->where('roles.slug', $slug)->where('roles.is_active', true)->exists();
    }

    public function syncLegacyFlagsFromRoles(): void
    {
        $roleSlugs = $this->roles()->where('roles.is_active', true)->pluck('slug')->all();
        $isAdmin = in_array('administrador', $roleSlugs, true);

        $this->is_graduate = in_array('titular_talento', $roleSlugs, true);
        $this->can_review_talent = $isAdmin || in_array('revisor_talento', $roleSlugs, true);
        $this->can_manage_services = $isAdmin || in_array('gestor_servicios', $roleSlugs, true);
        $this->save();
    }
}
