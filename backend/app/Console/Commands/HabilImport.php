<?php

namespace App\Console\Commands;

use App\Support\HabilPackageImporter;
use Illuminate\Console\Command;
use InvalidArgumentException;
use Throwable;

class HabilImport extends Command
{
    protected $signature = 'habil:import {path?} {--marcelo-reviewed}';

    protected $description = 'Importar el paquete privado ¿Es usted muy hábil? sin alterar su estado fuente.';

    public function handle(HabilPackageImporter $importer): int
    {
        $path = $this->argument('path') ?? base_path('../../sources/grupo18b-es-usted-muy-habil-imagenes-respuestas/es-usted-muy-habil');
        try {
            $version = $importer->import($path, (bool) $this->option('marcelo-reviewed'));
            $this->info('Paquete privado registrado: '.$version->version_label.' ('.$version->id.').');

            return self::SUCCESS;
        } catch (Throwable $error) {
            $this->error($error instanceof InvalidArgumentException
                ? 'No se importó el paquete: '.$error->getMessage()
                : 'No se importó el paquete: falló la persistencia privada.');

            return self::FAILURE;
        }
    }
}
