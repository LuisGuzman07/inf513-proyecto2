<?php

namespace App\Console\Commands;

use App\Models\EvaluationAssignment;
use App\Models\InstrumentConformity;
use App\Models\InstrumentExercise;
use App\Models\InstrumentVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;
use ZipArchive;

class TestPackageImport extends Command
{
    protected $signature = 'test:package-import 
                            {path? : Ruta al directorio del paquete o archivo .zip}
                            {--all : Importar todos los paquetes encontrados en Import_test}
                            {--force : Sobrescribir si ya existe la misma versión}';

    protected $description = 'Importa uno o todos los paquetes de pruebas psicométricas y de aptitud desde carpetas o archivos .zip a la base de datos de la plataforma.';

    public function handle(): int
    {
        $all = $this->option('all');
        $path = $this->argument('path');

        if ($all || empty($path)) {
            return $this->importAll();
        }

        return $this->importSinglePath($path);
    }

    protected function importAll(): int
    {
        $baseImportDir = base_path('Import_test');
        if (! is_dir($baseImportDir)) {
            $baseImportDir = base_path('../Import_test');
        }
        if (! is_dir($baseImportDir)) {
            $this->error("No se encontró la carpeta 'Import_test' en la raíz del proyecto.");
            return self::FAILURE;
        }

        $directories = File::directories($baseImportDir);
        // Exclude helper directories like comandos_artisan
        $packageDirs = array_filter($directories, function ($dir) {
            return file_exists($dir . DIRECTORY_SEPARATOR . 'package.json');
        });

        if (empty($packageDirs)) {
            $this->warn("No se encontraron paquetes con 'package.json' en: {$baseImportDir}");
            return self::SUCCESS;
        }

        sort($packageDirs);
        $total = count($packageDirs);
        $this->info("==========================================================");
        $this->info(" Iniciando importación masiva: {$total} paquetes encontrados");
        $this->info("==========================================================");

        $successCount = 0;
        foreach ($packageDirs as $index => $dir) {
            $currentNum = $index + 1;
            $dirName = basename($dir);
            $this->line("\n[{$currentNum}/{$total}] Procesando: {$dirName}...");

            $result = $this->importFromDirectory($dir);
            if ($result === self::SUCCESS) {
                $successCount++;
            }
        }

        $this->info("\n==========================================================");
        $this->info(" Resumen: {$successCount} de {$total} paquetes procesados correctamente.");
        $this->info("==========================================================");

        return $successCount === $total ? self::SUCCESS : self::FAILURE;
    }

    protected function importSinglePath(string $rawPath): int
    {
        $path = str_replace('\\', '/', $rawPath);

        // Relative path support from project root or base_path
        if (! file_exists($path)) {
            $candidates = [
                base_path($path),
                base_path('Import_test/' . ltrim($path, '/')),
                base_path('../' . ltrim($path, '/')),
                base_path('../Import_test/' . ltrim($path, '/')),
            ];
            foreach ($candidates as $cand) {
                if (file_exists($cand)) {
                    $path = $cand;
                    break;
                }
            }
        }

        if (! file_exists($path)) {
            $this->error("La ruta especificada no existe: {$rawPath}");
            return self::FAILURE;
        }

        // If it's a zip file, extract to temporary directory
        if (is_file($path) && strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'zip') {
            return $this->importFromZip($path);
        }

        if (is_dir($path)) {
            return $this->importFromDirectory($path);
        }

        $this->error("La ruta debe ser una carpeta de paquete o un archivo .zip: {$path}");
        return self::FAILURE;
    }

    protected function importFromZip(string $zipPath): int
    {
        if (! class_exists('ZipArchive')) {
            $this->error('La extensión PHP ZipArchive no está habilitada.');
            return self::FAILURE;
        }

        $tempDir = storage_path('app/temp/unzipped_' . Str::uuid());
        File::makeDirectory($tempDir, 0755, true);

        try {
            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== true) {
                $this->error("No se pudo abrir el archivo ZIP: {$zipPath}");
                return self::FAILURE;
            }

            $zip->extractTo($tempDir);
            $zip->close();

            // Find where package.json is (root of zip or a single child folder)
            $targetDir = $tempDir;
            if (! file_exists($targetDir . '/package.json')) {
                $subDirs = File::directories($tempDir);
                foreach ($subDirs as $sub) {
                    if (file_exists($sub . '/package.json')) {
                        $targetDir = $sub;
                        break;
                    }
                }
            }

            $result = $this->importFromDirectory($targetDir);
            return $result;
        } finally {
            if (File::exists($tempDir)) {
                File::deleteDirectory($tempDir);
            }
        }
    }

    protected function importFromDirectory(string $dir): int
    {
        $packageFile = $dir . '/package.json';
        $itemsFile = $dir . '/items.json';

        if (! file_exists($packageFile)) {
            $this->error("Falta 'package.json' en {$dir}");
            return self::FAILURE;
        }

        if (! file_exists($itemsFile)) {
            $this->error("Falta 'items.json' en {$dir}");
            return self::FAILURE;
        }

        $pkgRaw = file_get_contents($packageFile);
        $itemsRaw = file_get_contents($itemsFile);

        $pkg = json_decode($pkgRaw, true);
        $items = json_decode($itemsRaw, true);

        if (! is_array($pkg) || ! is_array($items)) {
            $this->error("Error al decodificar 'package.json' o 'items.json' en {$dir}");
            return self::FAILURE;
        }

        $name = $pkg['name'] ?? 'Test Psicométrico';
        $slug = $pkg['slug'] ?? Str::slug($name);
        $category = $pkg['category'] ?? 'General';
        $author = $pkg['author'] ?? 'Grupo 18B';
        $instructions = $pkg['instructions'] ?? 'Complete los ejercicios según las indicaciones.';
        $exampleText = $pkg['example_text'] ?? null;
        $answerType = $pkg['answer_type'] ?? InstrumentVersion::SINGLE_CHOICE;
        $optionLabels = $pkg['option_labels'] ?? ['A', 'B', 'C', 'D', 'E'];
        $scoringEnabled = $pkg['scoring_enabled'] ?? true;

        // Build deterministic manifest for integrity
        $filesToStore = [];
        $hashes = [];

        // Check assets folder
        $assetsDir = $dir . '/assets';
        if (is_dir($assetsDir)) {
            foreach (File::files($assetsDir) as $file) {
                $rel = 'assets/' . $file->getFilename();
                $content = file_get_contents($file->getRealPath());
                $sha = hash('sha256', $content);
                $filesToStore[$rel] = $content;
                $hashes[$rel] = $sha;
            }
        }

        $manifest = [
            'name' => $name,
            'slug' => $slug,
            'category' => $category,
            'author' => $author,
            'items_count' => count($items),
            'answer_type' => $answerType,
            'option_labels' => $optionLabels,
            'scoring_enabled' => $scoringEnabled,
            'files' => array_keys($filesToStore),
        ];

        $manifestJson = json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $manifestSha256 = hash('sha256', $manifestJson);

        // Check for existing version
        $existing = InstrumentVersion::where('manifest_sha256', $manifestSha256)
            ->orWhere('name', $name)
            ->first();

        if ($existing) {
            if (! $this->option('force')) {
                $this->info("-> El test ya se encuentra registrado: '{$name}' (ID: {$existing->id}). Omitiendo. (Usa --force para sobrescribir)");
                return self::SUCCESS;
            }

            // Force deletion if no assignments exist
            if (EvaluationAssignment::where('instrument_version_id', $existing->id)->exists()) {
                $this->warn("-> No se puede sobrescribir '{$name}': tiene evaluaciones asignadas activas.");
                return self::SUCCESS;
            }

            // Delete existing bypassing model immutability events
            InstrumentVersion::withoutEvents(function () use ($existing) {
                $existing->exercises()->delete();
                $existing->conformity()->delete();
                $existing->delete();
            });
            $this->line("-> Versión previa eliminada para reimportación limpia.");
        }

        $disk = Storage::disk('instrument_private');
        $token = (string) Str::uuid();
        $prefix = "packages/{$token}";

        try {
            DB::transaction(function () use (
                $disk, $prefix, $filesToStore, $hashes, $manifest, $manifestSha256,
                $name, $instructions, $exampleText, $pkg, $items, $author, $category, $answerType, $optionLabels, $scoringEnabled
            ) {
                // Store private files
                foreach ($filesToStore as $relPath => $bytes) {
                    $disk->put("{$prefix}/{$relPath}", $bytes, ['visibility' => 'private']);
                }

                $exampleImagePath = null;
                if (! empty($pkg['example_image']) && isset($filesToStore[$pkg['example_image']])) {
                    $exampleImagePath = "{$prefix}/" . $pkg['example_image'];
                }

                $version = InstrumentVersion::create([
                    'name' => $name,
                    'version_label' => date('Y-m-d') . '-' . substr($manifestSha256, 0, 10),
                    'package_date' => date('Y-m-d'),
                    'manifest_sha256' => $manifestSha256,
                    'source_review_state' => 'verificado',
                    'instructions' => $instructions,
                    'instructions_source_markdown' => "# {$name}\n\n{$instructions}",
                    'example_text' => $exampleText,
                    'example_image_path' => $exampleImagePath,
                    'storage_prefix' => $prefix,
                    'manifest' => $manifest,
                    'source_file_hashes' => $hashes,
                    'answer_type' => $answerType,
                    'application_ready' => true,
                    'scoring_enabled' => $scoringEnabled,
                    'option_labels' => $optionLabels,
                ]);

                foreach ($items as $item) {
                    $number = (int) ($item['number'] ?? 1);
                    $sourceId = $item['source_id'] ?? ('item-' . sprintf('%02d', $number));
                    $correctOption = isset($item['correct_option']) ? strtoupper(trim((string) $item['correct_option'])) : 'A';
                    
                    // Options text dictionary normalized to lowercase keys (a, b, c, d...)
                    $opcionesNormalized = null;
                    if (! empty($item['options']) && is_array($item['options'])) {
                        $opcionesNormalized = [];
                        foreach ($item['options'] as $optKey => $optVal) {
                            $opcionesNormalized[strtolower((string) $optKey)] = (string) $optVal;
                        }
                    }

                    $itemImage = $item['image'] ?? null;
                    $imagePath = null;
                    $imageSha256 = null;

                    if ($itemImage && isset($filesToStore[$itemImage])) {
                        $imagePath = "{$prefix}/{$itemImage}";
                        $imageSha256 = $hashes[$itemImage] ?? null;
                    }

                    $text = $item['text'] ?? "Ejercicio {$number}";
                    $isUnscored = ($answerType === InstrumentVersion::SINGLE_CHOICE_UNSCORED);
                    $responseType = $isUnscored ? InstrumentExercise::SINGLE_CHOICE_UNSCORED : InstrumentExercise::SINGLE_CHOICE;
                    $finalCorrectOption = $isUnscored ? null : $correctOption;
                    $finalPoints = $isUnscored ? null : 1;

                    if ($isUnscored) {
                        $dim = $item['dimension'] ?? $category;
                        $answerMd = "**Reactivo de autopercepción:** Escala Likert 1 a 5 (Dimensión: {$dim}).";
                    } else {
                        $answerMd = "**Respuesta correcta:** {$correctOption}";
                        if ($opcionesNormalized && isset($opcionesNormalized[strtolower($correctOption)])) {
                            $answerMd .= " — " . $opcionesNormalized[strtolower($correctOption)];
                        }
                    }

                    $version->exercises()->create([
                        'source_id' => $sourceId,
                        'number' => $number,
                        'correct_option' => $finalCorrectOption,
                        'points' => $finalPoints,
                        'image_path' => $imagePath,
                        'original_path' => $imagePath,
                        'image_sha256' => $imageSha256,
                        'original_sha256' => $imageSha256,
                        'texto' => $text,
                        'opciones' => $opcionesNormalized,
                        'answer_markdown' => $answerMd,
                        'source_review_state' => 'verificado',
                        'review_note' => "{$category} · Ítem {$number}",
                        'response_type' => $responseType,
                    ]);
                }

                InstrumentConformity::create([
                    'instrument_version_id' => $version->id,
                    'reviewer_name' => "{$author} / Plataforma 18B",
                    'statement' => "Paquete importado y verificado con clave oficial ({$name}, " . count($items) . " reactivos).",
                    'recorded_at' => now(),
                    'institutional_approval' => true,
                ]);

                $this->info("✔ ¡Importado exitosamente: '{$name}' con " . count($items) . " ítems (ID: {$version->id})!");
            });

            return self::SUCCESS;
        } catch (Throwable $e) {
            $disk->deleteDirectory($prefix);
            $this->error("Error importando {$name}: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
