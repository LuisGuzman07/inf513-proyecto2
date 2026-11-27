<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class TalentReviewer extends Command
{
    protected $signature = 'talent:reviewer {user}';

    protected $description = 'Habilitar explícitamente una cuenta para revisión privada, sin asignar admisión';

    public function handle(): int
    {
        if (! ctype_digit((string) $this->argument('user')) || ! ($user = User::find($this->argument('user')))) {
            $this->error('ID de cuenta inválido.');

            return self::FAILURE;
        }
        if (! $this->confirm('¿Habilitar explícitamente esta cuenta para revisión privada de talento?', false)) {
            return self::FAILURE;
        }
        $user->can_review_talent = true;
        $user->talent_pilot_enabled = true;
        $user->save();
        $this->info('Cuenta habilitada para revisión privada.');

        return self::SUCCESS;
    }
}
