<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\CompanyUser;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * S2.2.1: alta de empresas y vinculación de responsables es una operación administrativa local
 * explícita. No crea cuentas, no cambia permisos y nunca imprime contraseñas.
 */
class PilotCompany extends Command
{
    protected $signature = 'pilot:company
        {action : create|link|unlink|list}
        {--company= : Nombre exacto o ID de la empresa}
        {--legal-name= : Razón social declarada, opcional}
        {--contact-email= : Correo corporativo declarado de la empresa}
        {--email= : Correo exacto de la cuenta EXISTENTE a vincular}
        {--role=hr_manager : Rol de la vinculación}
        {--status=active : Estado de la vinculación}
        {--actor= : Correo exacto de la cuenta administrativa que registra la operación}';

    protected $description = 'Crear empresas, vincular o desactivar responsables existentes y listar vínculos';

    public function handle(): int
    {
        return match (strtolower(trim((string) $this->argument('action')))) {
            'create' => $this->createCompany(),
            'link' => $this->linkUser(),
            'unlink' => $this->unlinkUser(),
            'list' => $this->listCompanies(),
            default => $this->failed('Acción inválida: use create, link, unlink o list.'),
        };
    }

    private function failed(string $message): int
    {
        $this->error($message);

        return self::FAILURE;
    }

    /** Sin interacción (--no-interaction), una opción ausente queda vacía y la validación falla. */
    private function answer(string $option, string $question): string
    {
        $value = $this->option($option);

        return trim((string) (is_string($value) && $value !== '' ? $value : $this->ask($question)));
    }

    private function company(): ?Company
    {
        $reference = $this->answer('company', 'Nombre exacto o ID de la empresa');
        if ($reference === '') {
            $this->error('Empresa no indicada.');

            return null;
        }
        $companies = (Str::isUuid($reference) ? Company::whereKey($reference) : Company::where('name', $reference))->get();
        if ($companies->isEmpty()) {
            $this->error('No existe una empresa con ese nombre o ID.');

            return null;
        }
        if ($companies->count() > 1) {
            $this->error('Hay más de una empresa con ese nombre; indique el ID exacto.');

            return null;
        }

        return $companies->first();
    }

    private function actor(): User|false|null
    {
        $email = trim((string) $this->option('actor'));
        if ($email === '') {
            return null;
        }
        $actor = User::where('email', $email)->first();
        if ($actor === null) {
            $this->error('La cuenta administrativa indicada no existe. No se modificó nada.');

            return false;
        }

        return $actor;
    }

    private function createCompany(): int
    {
        $name = $this->answer('company', 'Nombre exacto de la empresa');
        $legalName = trim((string) $this->option('legal-name'));
        $email = $this->answer('contact-email', 'Correo corporativo declarado de la empresa');
        $validator = Validator::make(['name' => $name, 'legal_name' => $legalName, 'contact_email' => $email], [
            'name' => ['required', 'string', 'max:200'],
            'legal_name' => ['nullable', 'string', 'max:200'],
            'contact_email' => ['required', 'string', 'email:rfc', 'max:254'],
        ]);
        if ($validator->fails()) {
            return $this->failed('Datos de empresa inválidos. No se creó ninguna empresa.');
        }
        if (Company::where('name', $name)->exists()) {
            return $this->failed('Ya existe una empresa con ese nombre exacto. No se creó nada.');
        }
        $company = Company::create([
            'name' => $name,
            'legal_name' => $legalName === '' ? null : $legalName,
            'contact_email' => $email,
            'status' => 'active',
            'version' => 1,
        ]);
        $this->info('Empresa creada (ID: '.$company->id.').');

        return self::SUCCESS;
    }

    private function linkUser(): int
    {
        $company = $this->company();
        if ($company === null) {
            return self::FAILURE;
        }
        $email = $this->answer('email', 'Correo exacto de la cuenta EXISTENTE a vincular');
        $user = $email === '' ? null : User::where('email', $email)->first();
        if ($user === null) {
            return $this->failed('No existe una cuenta con ese correo exacto. El comando no crea cuentas ni cambia permisos.');
        }
        $role = (string) $this->option('role');
        $status = (string) $this->option('status');
        if (! in_array($role, CompanyUser::ROLES, true)) {
            return $this->failed('Rol inválido: use '.implode(', ', CompanyUser::ROLES).'.');
        }
        if (! in_array($status, CompanyUser::STATUSES, true)) {
            return $this->failed('Estado inválido: use '.implode(', ', CompanyUser::STATUSES).'.');
        }
        $actor = $this->actor();
        if ($actor === false) {
            return self::FAILURE;
        }
        $link = CompanyUser::where('company_id', $company->id)->where('user_id', $user->id)->first();
        if ($link !== null && $link->status === 'active' && $status === 'active') {
            return $this->failed('La cuenta ya está vinculada activamente a esa empresa. No se modificó nada.');
        }
        DB::transaction(function () use ($company, $user, $role, $status, $actor, $link) {
            $link ??= new CompanyUser(['company_id' => $company->id, 'user_id' => $user->id, 'linked_at' => now()]);
            $link->role = $role;
            $link->status = $status;
            $link->linked_by_user_id = $actor?->id;
            $link->disabled_at = $status === 'active' ? null : now();
            $link->save();
        });
        $this->info('Vinculación registrada: '.$user->email.' en '.$company->name.' (rol '.$role.', estado '.$status.'). Sin cambios de permisos.');

        return self::SUCCESS;
    }

    private function unlinkUser(): int
    {
        $company = $this->company();
        if ($company === null) {
            return self::FAILURE;
        }
        $email = $this->answer('email', 'Correo exacto de la cuenta EXISTENTE a desvincular');
        $user = $email === '' ? null : User::where('email', $email)->first();
        if ($user === null) {
            return $this->failed('No existe una cuenta con ese correo exacto. No se modificó nada.');
        }
        $link = CompanyUser::where('company_id', $company->id)->where('user_id', $user->id)->first();
        if ($link === null) {
            return $this->failed('No existe vinculación entre esa cuenta y esa empresa. No se modificó nada.');
        }
        if ($link->status !== 'active') {
            return $this->failed('La vinculación ya estaba desactivada. No se modificó nada.');
        }
        $actor = $this->actor();
        if ($actor === false) {
            return self::FAILURE;
        }
        $link->status = 'inactive';
        $link->disabled_at = now();
        $link->linked_by_user_id = $actor?->id ?? $link->linked_by_user_id;
        $link->save();
        $this->info('Vinculación desactivada: '.$user->email.' en '.$company->name.'. El acceso se retira en la siguiente petición.');

        return self::SUCCESS;
    }

    private function listCompanies(): int
    {
        $companies = Company::withCount(['companyUsers as active_managers_count' => fn (Builder $query) => $query->where('status', 'active')])
            ->orderBy('name')
            ->get();
        if ($companies->isEmpty()) {
            $this->info('Sin empresas registradas.');

            return self::SUCCESS;
        }
        // Se imprime línea por línea: una tabla ancha parte las direcciones y dificulta leerlas.
        $this->line('Empresas:');
        foreach ($companies as $company) {
            $this->line(sprintf(
                '  %s | %s | %s | razon social: %s | %s | version %d | responsables activos: %d',
                $company->id, $company->name, $company->status, $company->legal_name ?? '-', $company->contact_email,
                $company->version, $company->active_managers_count
            ));
        }
        $links = CompanyUser::with(['company', 'user', 'linkedBy'])->orderBy('company_id')->orderBy('user_id')->get();
        if ($links->isEmpty()) {
            $this->line('Sin vinculaciones de responsables.');

            return self::SUCCESS;
        }
        $this->line('Vinculaciones:');
        foreach ($links as $link) {
            $this->line(sprintf(
                '  %s | %s | %s | %s | vinculado %s | desactivado %s | registrado por %s',
                $link->company?->name, $link->user?->email, $link->role, $link->status,
                $link->linked_at?->toDateTimeString() ?? '-', $link->disabled_at?->toDateTimeString() ?? '-',
                $link->linkedBy?->email ?? '-'
            ));
        }

        return self::SUCCESS;
    }
}
