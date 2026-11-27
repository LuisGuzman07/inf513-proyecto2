<?php

namespace App\Console\Commands;

use App\Support\Fp16PackageImporter;
use Illuminate\Console\Command;
use InvalidArgumentException;
use Throwable;

class Fp16Import extends Command
{
    protected $signature = 'fp16:import {path?}';

    protected $description = 'Importar las formas A y B del 16 FP como banco textual de captura, sin calificación.';

    public function handle(Fp16PackageImporter $importer): int
    {
        $path = $this->argument('path') ?? base_path('../../resources/fp16-formas-a-b-v1.0.0');
        try {
            $versions = $importer->import($path);
            foreach ($versions as $code => $version) {
                $this->info('Forma '.$code.': '.$version->version_label.' ('.$version->id.').');
                $this->line('  '.$version->exercises->count().' reactivos · opciones '.implode('/', $version->optionLabels()).' · sin calificación.');
            }
            $this->line('Claves, pesos, baremos y tablas de estenes no se importan: el cotejo sigue pendiente.');

            return self::SUCCESS;
        } catch (Throwable $error) {
            $this->error($error instanceof InvalidArgumentException
                ? 'No se importó el paquete 16 FP: '.$error->getMessage()
                : 'No se importó el paquete 16 FP: falló la persistencia privada.');

            return self::FAILURE;
        }
    }
}
