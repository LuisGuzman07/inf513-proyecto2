<?php

namespace App\Support;

use App\Models\InstrumentExercise;
use App\Models\InstrumentVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Throwable;

/**
 * Imports the private Dominós reconstruction package (48 exercises, ordered pair of halves).
 *
 * The package is a source: it is read, validated whole and copied byte-for-byte into the
 * private disk. No source file is edited, no answer is deduced by solving a pattern, and no
 * visual orientation is assumed. Validation is all-or-nothing; a partial package imports nothing.
 */
class DominosPackageImporter
{
    public const VISUAL_CONFORMITY = 'Marcelo aprobó visualmente las 48 reconstrucciones del paquete dominos-reconstrucciones-48-v0.3.0. Conformidad de trabajo visual del piloto; no constituye aprobación institucional, no valida la orientación física de las claves, la puntuación, los tiempos ni los baremos.';

    public const BLOCKED_FROM_APPLICATION = 'Instrumento no habilitado para aplicación: la orientación física de la clave (qué mitad de la ficha corresponde a la primera cifra y cuál a la segunda) sigue pendiente.';

    public const ORIENTATION_PENDING = 'La correspondencia entre el orden "primera/segunda" del Word y la posición física de las mitades en la ficha no está confirmada. No se invierten ni se normalizan las cifras y no se asume equivalencia al invertirlas.';

    private const EXPECTED = 48;

    public function import(string $path, bool $marceloReviewed = false): InstrumentVersion
    {
        $package = $this->validate($path);
        $disk = Storage::disk('instrument_private');
        $token = (string) Str::uuid();
        $staging = '.staging/'.$token;
        $prefix = 'packages/'.$token;
        $owned = false;
        try {
            return DB::transaction(function () use ($package, $disk, $staging, $prefix, $marceloReviewed, &$owned) {
                DB::select('SELECT pg_advisory_xact_lock(?)', [1827102702]);
                $version = InstrumentVersion::where('manifest_sha256', $package['digest'])->first();
                if (! $version) {
                    $this->check(! $disk->exists($staging) && ! $disk->exists($prefix), 'El destino privado ya existe.');
                    $owned = true;
                    foreach ($package['files'] as $relative => $contents) {
                        $this->check($disk->put($staging.'/'.$relative, $contents, ['visibility' => 'private']), 'No se pudo guardar el paquete privado.');
                    }
                    // Promote file by file: a directory rename is unreliable on Windows.
                    foreach (array_keys($package['files']) as $relative) {
                        $this->check($disk->move($staging.'/'.$relative, $prefix.'/'.$relative), 'No se pudo conservar el paquete privado.');
                    }
                    $this->check($disk->deleteDirectory($staging), 'No se pudo retirar el staging privado.');

                    $m = $package['manifest'];
                    $version = InstrumentVersion::create([
                        'name' => $m['instrumento'],
                        'version_label' => $m['version_label'],
                        'package_date' => $m['fecha'],
                        'manifest_sha256' => $package['digest'],
                        'answer_type' => InstrumentVersion::TWO_HALVES,
                        'source_review_state' => 'pendiente_cotejo',
                        'application_ready' => false,
                        'application_blocked_reason' => self::BLOCKED_FROM_APPLICATION,
                        'instructions' => $package['instructions'],
                        'instructions_source_markdown' => $package['files'][$m['fuentes']['instrucciones']],
                        'example_text' => $package['example'],
                        'example_image_path' => $prefix.'/'.$m['fuentes']['ejemplo'],
                        'storage_prefix' => $prefix,
                        'manifest' => $m,
                        'source_file_hashes' => $package['hashes'],
                    ]);
                    foreach ($package['exercises'] as $entry) {
                        $version->exercises()->create([
                            'source_id' => $entry['id'],
                            'number' => $entry['numero'],
                            'response_type' => InstrumentExercise::TWO_HALVES,
                            'correct_option' => null,
                            'correct_first' => $entry['respuesta']['primera'],
                            'correct_second' => $entry['respuesta']['segunda'],
                            'points' => null,
                            'image_path' => $prefix.'/'.$entry['reconstruccion'],
                            'reconstruction_path' => $prefix.'/'.$entry['reconstruccion'],
                            'reconstruction_sha256' => $package['hashes'][$entry['reconstruccion']],
                            'original_path' => $prefix.'/'.$entry['original'],
                            'answer_markdown' => $package['files'][$entry['ficha']],
                            'image_sha256' => $package['hashes'][$entry['reconstruccion']],
                            'original_sha256' => $package['hashes'][$entry['original']],
                            'source_review_state' => $entry['estado_visual'],
                            'review_note' => $entry['nota'],
                        ]);
                    }
                }
                if ($marceloReviewed) {
                    $version->conformity()->firstOrCreate([], [
                        'reviewer_name' => 'Marcelo',
                        'statement' => self::VISUAL_CONFORMITY,
                        'recorded_at' => now(),
                        'institutional_approval' => false,
                    ]);
                }

                return $version->load(['exercises', 'conformity']);
            });
        } catch (Throwable $error) {
            if ($owned) {
                $disk->deleteDirectory($staging);
                $disk->deleteDirectory($prefix);
            }
            throw $error;
        }
    }

    public function validate(string $path): array
    {
        $root = realpath($path);
        $this->check($root !== false && is_dir($root), 'No existe el paquete de Dominós.');
        $raw = $this->read($root, 'manifest.json');
        try {
            $m = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            throw new InvalidArgumentException('manifest.json inválido.');
        }

        $this->check(is_array($m), 'Manifest inválido.');
        $this->check(($m['package'] ?? null) === 'dominos-reconstrucciones-48', 'Paquete inesperado.');
        $this->check(is_string($m['version'] ?? null) && preg_match('/^\d+\.\d+\.\d+$/D', $m['version']) === 1, 'Versión inválida.');
        $this->check(($m['originales'] ?? null) === self::EXPECTED && ($m['respuestas_cotejadas_Word'] ?? null) === self::EXPECTED, 'Se requieren 48 originales y 48 respuestas.');
        $this->check(($m['reconstrucciones_disponibles'] ?? null) === self::EXPECTED, 'Se requieren 48 reconstrucciones.');
        $this->check(is_array($m['ejercicios'] ?? null) && count($m['ejercicios']) === self::EXPECTED, 'Se requieren exactamente 48 ejercicios.');
        // Absence is the normal case; a package that declares itself applicable is refused.
        $this->check(($m['aplicacion_habilitada'] ?? false) !== true, 'El paquete no debe declararse habilitado para aplicación.');

        // Every file in the package is inventoried, hashed and path-checked.
        $files = ['manifest.json' => $raw];
        $hashes = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($iterator as $file) {
            $this->check(! $file->isLink(), 'No se permiten enlaces simbólicos en el paquete.');
            if ($file->isDir()) {
                continue;
            }
            $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
            if ($relative === 'manifest.json') {
                continue;
            }
            $contents = $this->read($root, $relative);
            $files[$relative] = $contents;
            $hashes[$relative] = hash('sha256', $contents);
        }

        $exercises = [];
        foreach (array_values($m['ejercicios']) as $index => $entry) {
            $this->check(is_array($entry), 'Entrada de ejercicio inválida.');
            $number = $index + 1;
            $id = sprintf('DOM-EX-%03d', $number);
            $this->check(($entry['id'] ?? null) === $id, 'Identificador o orden inválido en el ejercicio '.$number.'.');
            // The printed number is authoritative; never inferred from filename or page position.
            $this->check(($entry['numero_impreso'] ?? null) === $number, 'Número impreso incoherente en '.$id.'.');

            foreach (['imagen_original', 'imagen_reconstruida'] as $key) {
                $relative = $entry[$key] ?? null;
                $this->check(is_string($relative) && isset($files[$relative]), 'Recurso ausente en '.$id.' ('.$key.').');
                $this->image($files[$relative]);
            }
            $this->check(($entry['sha256_reconstruccion'] ?? null) === $hashes[$entry['imagen_reconstruida']], 'Hash de reconstrucción incoherente en '.$id.'.');
            $this->check(($entry['fuente_grafica']['sha256_original'] ?? null) === $hashes[$entry['imagen_original']], 'Hash de original incoherente en '.$id.'.');

            $answer = $entry['respuesta_fuente'] ?? null;
            $this->check(is_array($answer) && is_string($answer['literal'] ?? null), 'Respuesta ausente en '.$id.'.');
            $this->check(preg_match('/\A([0-6])\/([0-6])\z/D', $answer['literal'], $pair) === 1, 'Par de respuesta fuera de rango en '.$id.'.');
            $this->check(($answer['primera_cifra_literal'] ?? null) === (int) $pair[1] && ($answer['segunda_cifra_literal'] ?? null) === (int) $pair[2], 'Cifras incoherentes en '.$id.'.');
            // Orientation is unresolved; the package must say so rather than assert an order.
            $this->check(($answer['orientacion_fisica_confirmada'] ?? null) === false, 'El paquete no debe declarar orientación confirmada.');
            // A key must never be pre-enabled for application.
            $this->check(($entry['lista_para_aplicacion'] ?? null) === false, 'Un ejercicio no debe declararse listo para aplicación.');

            $ficha = 'ejercicios-md/'.sprintf('%02d', $number).'.md';
            $this->check(isset($files[$ficha]), 'Ficha ausente en '.$id.'.');
            $this->check(str_contains($files[$ficha], $answer['literal']), 'La ficha no contiene el par de fuente de '.$id.'.');
            $this->check(str_contains($files[$ficha], $id), 'La ficha no declara el identificador de '.$id.'.');

            $exercises[] = [
                'id' => $id,
                'numero' => $number,
                'reconstruccion' => $entry['imagen_reconstruida'],
                'original' => $entry['imagen_original'],
                'ficha' => $ficha,
                'estado_visual' => is_string($entry['estado_visual'] ?? null) ? $entry['estado_visual'] : 'no informado',
                'nota' => is_string($entry['notas_originales'] ?? null) ? $entry['notas_originales'] : 'Sin nota de cotejo.',
                'respuesta' => [
                    'literal' => $answer['literal'],
                    'primera' => (int) $pair[1],
                    'segunda' => (int) $pair[2],
                ],
            ];
        }

        $instructionsPath = 'revision/alcance-y-precisiones.md';
        $this->check(isset($files[$instructionsPath]), 'Falta el alcance de la fuente.');
        $examplePath = 'fuentes/ejemplos-originales-A-D.png';
        $this->check(isset($files[$examplePath]), 'Falta el compuesto de ejemplos A–D.');
        $this->image($files[$examplePath]);
        $this->check(isset($files['correspondencias-48.csv']), 'Falta la correspondencia de las 48.');
        $this->check(isset($files['SHA256SUMS.txt']), 'Falta la lista de hashes de la fuente.');

        $manifest = [
            'instrumento' => 'Test de Dominós (reconstrucciones privadas v'.$m['version'].')',
            'version_label' => 'dominos-'.$m['version'],
            'fecha' => '2026-10-30',
            'fuentes' => ['instrucciones' => $instructionsPath, 'ejemplo' => $examplePath],
            'orientacion_pendiente' => self::ORIENTATION_PENDING,
            'ejercicios' => $exercises,
        ];

        $candidateInstructions = 'Esta evaluación contiene 48 ejercicios. En cada uno la ficha con contorno discontinuo debe completarse: ingresá un valor de 0 a 6 en cada una de sus dos mitades. Cero es una respuesta válida; dejar una mitad vacía significa que esa mitad quedó sin responder. Guardá tus respuestas antes de continuar; podés revisarlas antes del envío. El envío final congela las respuestas y requiere confirmación explícita si quedan ejercicios sin responder. No hay un temporizador digital implementado.';
        $candidateExample = 'Cada grupo de fichas sigue un patrón; la ficha con contorno discontinuo es la que debe completarse. El ejemplo completo de la fuente se muestra como referencia y no se puntúa.';

        return [
            'manifest' => $manifest,
            'raw' => $m,
            'digest' => hash('sha256', $raw),
            'files' => $files,
            'hashes' => $hashes,
            'exercises' => $exercises,
            'instructions' => $candidateInstructions,
            'example' => $candidateExample,
        ];
    }

    private function read(string $root, string $relative): string
    {
        // The source folder uses real file names, including spaces and parentheses
        // ("WhatsApp Image … (2).jpeg"). Traversal is blocked per segment instead of
        // restricting the character set to a slug.
        $this->check($relative !== '' && strlen($relative) < 255, 'Ruta inválida.');
        $this->check(! str_contains($relative, "\0"), 'Ruta insegura: '.$relative);
        foreach (explode('/', str_replace('\\', '/', $relative)) as $segment) {
            $this->check($segment !== '' && $segment !== '.' && $segment !== '..', 'Ruta insegura: '.$relative);
            $this->check(preg_match('/\A[^<>:"|?*\x00-\x1F]+\z/u', $segment) === 1, 'Ruta insegura: '.$relative);
        }
        $resolved = realpath($root.DIRECTORY_SEPARATOR.$relative);
        $this->check($resolved !== false && str_starts_with($resolved, $root.DIRECTORY_SEPARATOR) && is_file($resolved), 'Archivo fuera de raíz o ausente: '.$relative);
        $contents = file_get_contents($resolved);
        $this->check($contents !== false, 'No se pudo leer '.$relative.'.');

        return $contents;
    }

    private function image(string $bytes): void
    {
        $info = @getimagesizefromstring($bytes);
        $this->check(
            $info !== false
            && in_array($info['mime'], ['image/png', 'image/jpeg'], true)
            && $info[0] > 0 && $info[1] > 0
            && in_array((new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes), ['image/png', 'image/jpeg'], true),
            'Imagen o MIME inválido en el paquete.'
        );
    }

    private function check(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new InvalidArgumentException($message);
        }
    }
}
