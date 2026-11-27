<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['slug' => 'talento.inscripcion.gestionar', 'name' => 'Gestionar mi inscripción y expediente', 'module' => 'Talento universitario'],
            ['slug' => 'talento.evaluaciones.realizar', 'name' => 'Responder evaluaciones asignadas', 'module' => 'Evaluaciones'],
            ['slug' => 'talento.revision.gestionar', 'name' => 'Revisar expedientes y gestionar correcciones', 'module' => 'Talento universitario'],
            ['slug' => 'talento.instrumentos.gestionar', 'name' => 'Consultar y gestionar banco de instrumentos', 'module' => 'Evaluaciones'],
            ['slug' => 'servicios.gestionar', 'name' => 'Gestionar solicitudes y empresas (staff)', 'module' => 'Servicios empresariales'],
            ['slug' => 'empresa.servicios.consultar', 'name' => 'Consultar solicitudes y candidatos de mi empresa', 'module' => 'Servicios empresariales'],
            ['slug' => 'empresa.donativos.gestionar', 'name' => 'Gestionar donativos empresariales', 'module' => 'Servicios complementarios'],
            ['slug' => 'candidatos.banco.ver', 'name' => 'Consultar banco de candidatos', 'module' => 'Servicios empresariales'],
            ['slug' => 'admin.usuarios.gestionar', 'name' => 'Administrar usuarios y asignar roles', 'module' => 'Administración'],
            ['slug' => 'admin.roles.gestionar', 'name' => 'Administrar roles del sistema', 'module' => 'Administración'],
            ['slug' => 'admin.permisos.gestionar', 'name' => 'Administrar permisos del sistema', 'module' => 'Administración'],
            ['slug' => 'admin.auditoria.ver', 'name' => 'Consultar bitácora de auditoría', 'module' => 'Administración'],
            ['slug' => 'admin.dashboard.ver', 'name' => 'Consultar dashboard de estadísticas y visitas', 'module' => 'Administración'],
        ];

        $permissionIds = [];
        foreach ($permissions as $item) {
            $perm = Permission::query()->updateOrCreate(
                ['slug' => $item['slug']],
                [
                    'name' => $item['name'],
                    'module' => $item['module'],
                    'is_active' => true,
                ]
            );
            $permissionIds[$item['slug']] = $perm->id;
        }

        $roles = [
            'titular_talento' => [
                'name' => 'Titular de talento',
                'description' => 'Titulado o estudiante habilitado para gestionar su expediente, CV, documentos y evaluaciones.',
                'permissions' => ['talento.inscripcion.gestionar', 'talento.evaluaciones.realizar'],
            ],
            'revisor_talento' => [
                'name' => 'Revisor de talento',
                'description' => 'Personal encargado de revisar expedientes, observaciones, CV y asignar instrumentos.',
                'permissions' => ['talento.revision.gestionar', 'talento.instrumentos.gestionar', 'candidatos.banco.ver'],
            ],
            'gestor_servicios' => [
                'name' => 'Gestor de servicios',
                'description' => 'Personal que gestiona solicitudes empresariales, empresas, cargos y candidatos.',
                'permissions' => ['servicios.gestionar', 'candidatos.banco.ver'],
            ],
            'responsable_empresarial' => [
                'name' => 'Responsable empresarial',
                'description' => 'Representante vinculado a una empresa activa para consultar solicitudes, candidatos y donativos.',
                'permissions' => ['empresa.servicios.consultar', 'empresa.donativos.gestionar', 'candidatos.banco.ver'],
            ],
            'administrador' => [
                'name' => 'Administrador del sistema',
                'description' => 'Control de usuarios, roles, permisos, auditoría, estadísticas y supervisión operativa.',
                'permissions' => [
                    'admin.usuarios.gestionar',
                    'admin.roles.gestionar',
                    'admin.permisos.gestionar',
                    'admin.auditoria.ver',
                    'admin.dashboard.ver',
                    'talento.revision.gestionar',
                    'talento.instrumentos.gestionar',
                    'servicios.gestionar',
                    'candidatos.banco.ver',
                ],
            ],
        ];

        $roleModels = [];
        foreach ($roles as $slug => $config) {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $config['name'],
                    'description' => $config['description'],
                    'is_active' => true,
                    'is_system' => true,
                ]
            );
            $role->permissions()->sync(array_map(fn (string $p) => $permissionIds[$p], $config['permissions']));
            $roleModels[$slug] = $role;
        }

        // Sincronizar roles iniciales para usuarios existentes según sus banderas heredadas
        User::query()->with(['roles', 'companyUsers'])->chunkById(100, function ($users) use ($roleModels) {
            foreach ($users as $user) {
                if ($user->roles->isNotEmpty()) {
                    continue;
                }
                $assign = [];
                if ($user->is_graduate) {
                    $assign[] = $roleModels['titular_talento']->id;
                }
                if ($user->can_review_talent) {
                    $assign[] = $roleModels['revisor_talento']->id;
                }
                if ($user->can_manage_services) {
                    $assign[] = $roleModels['gestor_servicios']->id;
                }
                if ($user->companyUsers()->whereHas('company', fn ($q) => $q->where('status', 'active'))->exists()) {
                    $assign[] = $roleModels['responsable_empresarial']->id;
                }
                if ($assign !== []) {
                    $user->roles()->syncWithoutDetaching($assign);
                }
            }
        });
    }
}
