<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class PilotAccount extends Command
{
    protected $signature = 'pilot:account {--reviewer : Crear una cuenta nueva con capacidad de revisión privada, no de titular}
        {--services-manager : Crear una cuenta nueva con capacidad provisional de gestión empresarial, sin revisión de talento}';

    protected $description = 'Crear una cuenta interna con habilitación explícita del piloto';

    public function handle(): int
    {
        $services = (bool) $this->option('services-manager');
        if ($services && $this->option('reviewer')) {
            $this->error('Seleccione una sola capacidad para la cuenta nueva. No se creó ninguna cuenta.');

            return self::FAILURE;
        }
        $name = trim((string) $this->ask('Nombre de la cuenta'));
        $email = trim((string) $this->ask('Email de la cuenta'));
        $validator = Validator::make(compact('name', 'email'), ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email:rfc', 'max:254', 'unique:users,email']]);
        if ($validator->fails()) {
            $this->error('Nombre/email inválido o cuenta existente. No se modificó ninguna cuenta.');

            return self::FAILURE;
        }
        $password = $this->secret('Contraseña (mínimo 12 caracteres)');
        $confirmation = $this->secret('Repita la contraseña');
        if (! is_string($password) || mb_strlen($password) < 12 || $password !== $confirmation) {
            $this->error('Contraseña inválida o confirmación diferente.');

            return self::FAILURE;
        }
        $reviewer = (bool) $this->option('reviewer');
        $question = $services
            ? '¿Habilitar esta cuenta nueva con capacidad provisional de gestión de servicios empresariales?'
            : ($reviewer
                ? '¿Habilitar esta cuenta nueva con capacidad de revisión privada del piloto?'
                : '¿Habilitar explícitamente esta cuenta para el piloto interno?');
        $enabled = $this->confirm($question, false);
        if ($services && ! $enabled) {
            $this->error('No se creó la cuenta de servicios porque no se confirmó la capacidad solicitada.');

            return self::FAILURE;
        }
        if ($reviewer && ! $enabled) {
            $this->error('No se creó la cuenta revisora porque no se confirmó la capacidad solicitada.');

            return self::FAILURE;
        }
        $user = new User(['name' => $name, 'email' => $email, 'password' => $password]);
        $user->talent_pilot_enabled = $enabled;
        $user->can_review_talent = $reviewer && $enabled;
        $user->can_manage_services = $services && $enabled;
        $user->is_graduate = false;
        $user->save();
        if ($services) {
            $this->info('Cuenta de personal de servicios creada (ID: '.$user->id.'); sin revisión de talento ni capacidad de titular.');
        } elseif ($reviewer) {
            $this->info('Cuenta de personal revisor creada (ID: '.$user->id.'); sin capacidad de titular.');
        } else {
            $this->info($enabled ? 'Cuenta creada y habilitada.' : 'Cuenta creada sin acceso al piloto.');
        }

        return self::SUCCESS;
    }
}
