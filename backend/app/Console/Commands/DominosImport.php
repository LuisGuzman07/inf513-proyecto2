<?php

namespace App\Console\Commands;

use App\Support\DominosPackageImporter;
use Illuminate\Console\Command;
use InvalidArgumentException;
use Throwable;

class DominosImport extends Command
{
    protected $signature = 'dominos:import {path?} {--reviewed}';

    protected $description = 'Importar el paquete privado de reconstrucciones de Dominós sin alterar sus fuentes ni habilitarlo para aplicación.';

    public function handle(DominosPackageImporter $importer): int
    {
        $path = $this->argument('path') ?? base_path('../../resources/dominos-reconstrucciones-48-v0.3.0');
        try {
            $version = $importer->import($path, (bool) $this->option('reviewed'));
            $this->info('Paquete privado registrado: '.$version->version_label.' ('.$version->id.').');
            $this->line('Estado: no habilitado para aplicación a titulares.');
            $this->line('Conformidad visual registrada: '.($version->conformity ? 'sí' : 'no').'.');

            return self::SUCCESS;
        } catch (Throwable $error) {
            $this->error($error instanceof InvalidArgumentException
                ? 'No se importó el paquete: '.$error->getMessage()
                : 'No se importó el paquete: falló la persistencia privada.');

            return self::FAILURE;
        }
    }
}
