<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\TestDatabaseGuard;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class PilotE2eFixture extends Command
{
    protected $signature = 'pilot:e2e-fixture';

    protected $description = 'Preparar credenciales públicas A/B sin alta y un revisor ficticio solo en tests';

    public function handle(): int
    {
        if (! app()->environment('testing')) {
            $this->error('Solo permitido en entorno testing, nunca en desarrollo.');

            return self::FAILURE;
        }
        TestDatabaseGuard::assertConnection(DB::connection('pgsql'), TestDatabaseGuard::developmentDatabase(base_path()));
        $run = Str::uuid()->toString();
        $path = tempnam(sys_get_temp_dir(), 'grupo18b-e2e-');
        if ($path === false) {
            throw new RuntimeException('No se pudo preparar el archivo privado temporal de pruebas.');
        }
        chmod($path, 0600);

        DB::transaction(function () use ($run, $path) {
            $credentials = [];
            foreach (['a', 'b', 'staff'] as $label) {
                $password = bin2hex(random_bytes(24));
                $email = 'pilot-'.$label.'-'.$run.'@example.test';
                $name = 'Prueba navegador '.strtoupper($label);
                if ($label === 'staff') {
                    $user = new User(['name' => $name, 'email' => $email, 'password' => $password]);
                    $user->talent_pilot_enabled = true;
                    $user->can_review_talent = true;
                    $user->is_graduate = false;
                    $user->save();
                }
                $credentials[$label] = ['name' => $name, 'email' => $email, 'password' => $password];
            }
            if (file_put_contents($path, json_encode($credentials, JSON_THROW_ON_ERROR)) === false) {
                throw new RuntimeException('No se pudieron guardar las credenciales temporales privadas.');
            }
        });

        // Only the path is printed. Never print passwords or use default credentials.
        $this->line($path);

        return self::SUCCESS;
    }
}
