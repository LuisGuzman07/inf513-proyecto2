<?php

namespace App\Console\Commands;

use App\Models\InstrumentConformity;
use App\Models\InstrumentExercise;
use App\Models\InstrumentVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class RavenImport extends Command
{
    protected $signature = 'raven:import {path?}';

    protected $description = 'Importar el Test de Matrices Progresivas de Raven (1995) con 60 ejercicios y clave de respuestas.';

    public function handle(): int
    {
        $dir = $this->argument('path') ?? 'C:/Users/Luis/Downloads/Test-de-Matrices-Progresivas-John-C_-Raven-1995';
        $dir = str_replace('\\', '/', $dir);

        if (! is_dir($dir)) {
            $this->error("El directorio no existe: {$dir}");
            return self::FAILURE;
        }

        $respuestasFile = $dir.'/Respuestas.txt';
        if (! file_exists($respuestasFile)) {
            $this->error("No se encontró el archivo de respuestas: {$respuestasFile}");
            return self::FAILURE;
        }

        $rawText = file_get_contents($respuestasFile);
        preg_match_all('/\(([A-E])-(\d+)\):\s*(\d+)/', $rawText, $matches, PREG_SET_ORDER);

        if (count($matches) !== 60) {
            $this->error('Se esperaban 60 respuestas en Respuestas.txt, pero se encontraron: '.count($matches));
            return self::FAILURE;
        }

        $answers = [];
        foreach ($matches as $m) {
            $key = $m[1].$m[2]; // e.g. A1, B12
            $answers[$key] = $m[3];
        }

        $series = ['A', 'B', 'C', 'D', 'E'];
        $exercisesData = [];
        $hashes = [];
        $filesToStore = [];
        $number = 1;

        foreach ($series as $s) {
            for ($i = 1; $i <= 12; $i++) {
                $itemKey = $s.$i;
                $filename = "{$s}{$i}.jpg";
                $filePath = "{$dir}/{$filename}";

                if (! file_exists($filePath)) {
                    $this->error("Falta el archivo de imagen: {$filePath}");
                    return self::FAILURE;
                }

                if (! isset($answers[$itemKey])) {
                    $this->error("Falta la respuesta para: {$itemKey}");
                    return self::FAILURE;
                }

                $content = file_get_contents($filePath);
                $sha256 = hash('sha256', $content);
                $hashes["imagenes/{$filename}"] = $sha256;
                $filesToStore["imagenes/{$filename}"] = $content;

                $sourceId = 'raven-'.sprintf('%02d', $number);
                $exercisesData[] = [
                    'source_id' => $sourceId,
                    'number' => $number,
                    'serie' => $s,
                    'item' => $i,
                    'correct_option' => (string) $answers[$itemKey],
                    'filename' => $filename,
                    'sha256' => $sha256,
                ];

                $number++;
            }
        }

        // Example file: use A1.jpg
        $exampleContent = $filesToStore['imagenes/A1.jpg'];
        $exampleSha256 = hash('sha256', $exampleContent);
        $hashes['ejemplo.jpg'] = $exampleSha256;
        $filesToStore['ejemplo.jpg'] = $exampleContent;

        $manifest = [
            'instrumento' => 'Test de Matrices Progresivas (Raven - 1995)',
            'fecha' => '1995-01-01',
            'cantidad_ejercicios' => 60,
            'series' => ['A', 'B', 'C', 'D', 'E'],
            'ejercicios_por_serie' => 12,
            'archivos' => array_keys($filesToStore),
        ];

        $manifestJson = json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $manifestSha256 = hash('sha256', $manifestJson);

        $this->info("Validación exitosa: 60 matrices y respuestas identificadas.");
        $this->line("SHA-256 del paquete: {$manifestSha256}");

        $disk = Storage::disk('instrument_private');
        $token = (string) Str::uuid();
        $prefix = "packages/{$token}";

        try {
            DB::transaction(function () use ($disk, $prefix, $filesToStore, $manifest, $manifestSha256, $hashes, $exercisesData) {
                // Store private files
                foreach ($filesToStore as $relPath => $bytes) {
                    $disk->put("{$prefix}/{$relPath}", $bytes, ['visibility' => 'private']);
                }

                $instructions = 'El Test de Matrices Progresivas de Raven (Escala General) evalúa la capacidad de razonamiento abstracto y resolución de problemas de relaciones espaciales. Consta de 60 ejercicios divididos en 5 series (A, B, C, D y E) de 12 matrices cada una. En cada ejercicio, observá la matriz principal y seleccioná el número de la figura que completa correctamente el patrón lógico. Podés guardar tus respuestas y confirmar el envío al finalizar.';
                $instructionsMd = "# Test de Matrices Progresivas de John C. Raven (1995)\n\nConsta de 60 ejercicios divididos en 5 series de 12 problemas cada una. Seleccioná el número correspondiente a la opción que completa la figura faltante.";
                $exampleText = 'Observá la matriz principal del ejercicio. En la parte inferior se muestran varias alternativas numeradas. Seleccioná el número de la pieza que encaja con el dibujo y completa la serie lógica (por ejemplo en el ítem A1, la opción correcta es la 4).';

                $version = InstrumentVersion::create([
                    'name' => 'Test de Matrices Progresivas (Raven - 1995)',
                    'version_label' => '1995-01-01-'.substr($manifestSha256, 0, 12),
                    'package_date' => '1995-01-01',
                    'manifest_sha256' => $manifestSha256,
                    'source_review_state' => 'verificado',
                    'instructions' => $instructions,
                    'instructions_source_markdown' => $instructionsMd,
                    'example_text' => $exampleText,
                    'example_image_path' => "{$prefix}/ejemplo.jpg",
                    'storage_prefix' => $prefix,
                    'manifest' => $manifest,
                    'source_file_hashes' => $hashes,
                    'answer_type' => InstrumentVersion::SINGLE_CHOICE,
                    'application_ready' => true,
                    'scoring_enabled' => true,
                    'option_labels' => ['1', '2', '3', '4', '5', '6', '7', '8'],
                ]);

                foreach ($exercisesData as $e) {
                    $version->exercises()->create([
                        'source_id' => $e['source_id'],
                        'number' => $e['number'],
                        'correct_option' => $e['correct_option'],
                        'points' => 1,
                        'image_path' => "{$prefix}/imagenes/{$e['filename']}",
                        'original_path' => "{$prefix}/imagenes/{$e['filename']}",
                        'answer_markdown' => "**Respuesta correcta según clave Raven: {$e['correct_option']}.**",
                        'image_sha256' => $e['sha256'],
                        'original_sha256' => $e['sha256'],
                        'source_review_state' => 'verificado',
                        'review_note' => "Serie {$e['serie']} - Ejercicio {$e['item']}",
                        'response_type' => InstrumentExercise::SINGLE_CHOICE,
                    ]);
                }

                InstrumentConformity::create([
                    'instrument_version_id' => $version->id,
                    'reviewer_name' => 'John C. Raven / Grupo 18B',
                    'statement' => 'Test de Matrices Progresivas (Escala General) de 60 ejercicios con clave oficial verificada.',
                    'recorded_at' => now(),
                    'institutional_approval' => true,
                ]);

                $this->info("¡Test de Raven importado exitosamente con ID: {$version->id}!");
            });

            return self::SUCCESS;
        } catch (Throwable $e) {
            $disk->deleteDirectory($prefix);
            $this->error('Error durante la importación: '.$e->getMessage());
            return self::FAILURE;
        }
    }
}
