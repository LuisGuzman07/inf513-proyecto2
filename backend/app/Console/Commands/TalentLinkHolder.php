<?php

namespace App\Console\Commands;

use App\Models\TalentRegistration;
use App\Models\User;
use App\Support\TalentWorkflow;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TalentLinkHolder extends Command
{
    protected $signature = 'talent:link-holder {registration} {holder} {actor}';

    protected $description = 'Vincular individualmente un legado tras comprobar identidad fuera del sistema';

    public function handle(): int
    {
        if (! Str::isUuid($this->argument('registration')) || ! ctype_digit((string) $this->argument('holder')) || ! ctype_digit((string) $this->argument('actor'))) {
            $this->error('UUID o IDs inválidos.');

            return self::FAILURE;
        }
        if (! $this->confirm('¿Confirma identidad del titular comprobada fuera del sistema para este expediente exacto?', false)) {
            return self::FAILURE;
        }

        return DB::transaction(function () {
            $ids = [(int) $this->argument('holder'), (int) $this->argument('actor')];
            $users = User::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $holder = $users->get($ids[0]);
            $actor = $users->get($ids[1]);
            $r = TalentRegistration::lockForUpdate()->find($this->argument('registration'));
            if (! $holder || ! $actor || ! $actor->talent_pilot_enabled || ! $holder->talent_pilot_enabled || ! $r || $r->holder_user_id !== null || $r->status !== 'legacy_internal' || $r->reviewer_user_id !== null || ($holder->person_id !== null && $holder->person_id !== $r->person_id) || TalentRegistration::where('holder_user_id', $holder->id)->exists() || User::where('person_id', $r->person_id)->where('id', '!=', $holder->id)->exists() || TalentRegistration::where('person_id', $r->person_id)->where('id', '!=', $r->id)->exists()) {
                $this->error('Vínculo incompatible o expediente/cuenta inexistente. No se modificó nada.');

                return self::FAILURE;
            }
            if (! $holder->is_graduate) {
                if (! $this->confirm('¿Activar explícitamente como titulado esta cuenta antigua solo para este caso?', false)) {
                    return self::FAILURE;
                }
                $holder->is_graduate = true;
            }
            $holder->person_id = $r->person_id;
            $holder->save();
            $r->holder_user_id = $holder->id;
            $r->status = 'draft';
            TalentWorkflow::event($r, $actor->id, 'holder_linked', ['holder_user_id' => ['before' => null, 'after' => $holder->id], 'status' => ['before' => 'legacy_internal', 'after' => 'draft']]);
            $this->info('Vínculo individual registrado; creador e historial conservados.');

            return self::SUCCESS;
        });
    }
}
