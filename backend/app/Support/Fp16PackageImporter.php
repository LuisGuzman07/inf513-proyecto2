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
 * Imports the private 16 FP text package: two separate forms, 187 letter-capture items each.
 *
 * The package is read and validated whole; the Word sources are copied byte-for-byte into the
 * private disk. No key, weight, norm or correction rule is imported: this instrument is capture
 * only, and the pending key reconciliation is documented instead of guessed.
 */
class Fp16PackageImporter
{
    public const PACKAGE = 'fp16-formas-a-b';

    private const EXPECTED_ITEMS = 187;

    private const EXPECTED_EXAMPLES = 4;

    private const OPTIONS = ['A', 'B', 'C'];

    private const LOCK = 1827102703;

    public const TRANSCRIPTION_STATEMENT = 'Cotejo estructural automatizado de la transcripción: 187 reactivos por forma, numeración 1–187 y tres opciones a/b/c verificadas contra el Word digitalizado. No es conformidad humana, no valida claves, pesos, baremos ni interpretación, y no constituye aprobación institucional.';

    /**
     * Import both forms in one transaction. A digest already present is returned untouched,
     * so repeating the import neither duplicates items nor rewrites a version in use.
     *
     * @return array<string, InstrumentVersion>
     */
    public function import(string $path): array
    {
        $package = $this->validate($path);
        $disk = Storage::disk('instrument_private');
        $token = (string) Str::uuid();
        $staging = '.staging/'.$token;
        // Destinos creados por ESTA ejecución: son los únicos que se pueden borrar al fallar.
        $created = [];
        try {
            return DB::transaction(function () use ($package, $disk, $staging, $token, &$created) {
                DB::select('SELECT pg_advisory_xact_lock(?)', [self::LOCK]);
                $versions = [];
                foreach ($package['forms'] as $code => $form) {
                    $existing = InstrumentVersion::where('manifest_sha256', $form['digest'])->first();
                    if ($existing) {
                        $versions[$code] = $existing->load(['exercises', 'conformity']);

                        continue;
                    }
                    $prefix = 'packages/'.$token.'-'.strtolower($code);
                    $created[] = $prefix;
                    $this->store($disk, $staging, $prefix, $form['files']);
                    $versions[$code] = $this->create($form, $prefix, $package['manifest']);
                }

                return $versions;
            });
        } catch (Throwable $error) {
            // Compensa una promoción parcial: staging y prefijos de esta importación, nunca
            // los de una versión preexistente. Las filas ya revirtieron con la transacción.
            $disk->deleteDirectory($staging);
            foreach ($created as $prefix) {
                $disk->deleteDirectory($prefix);
            }
            throw $error;
        }
    }

    /**
     * Validate the whole package before writing anything. Any deviation rejects the package.
     *
     * @return array{manifest: array, forms: array<string, array>}
     */
    public function validate(string $path): array
    {
        $root = realpath($path);
        $this->check($root !== false && is_dir($root), 'No existe el paquete 16 FP.');
        $rawManifest = $this->read($root, 'manifest.json');
        try {
            $manifest = json_decode($rawManifest, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            throw new InvalidArgumentException('manifest.json inválido.');
        }
        $this->check(is_array($manifest), 'Manifest inválido.');
        $this->check(($manifest['package'] ?? null) === self::PACKAGE, 'Paquete inesperado.');
        $this->check(is_string($manifest['version'] ?? null) && preg_match('/^\d+\.\d+\.\d+$/D', $manifest['version']) === 1, 'Versión inválida.');
        $this->check(is_array($manifest['formas'] ?? null) && count($manifest['formas']) === 2, 'Se requieren las dos formas.');

        $forms = [];
        foreach ($manifest['formas'] as $entry) {
            $this->check(is_array($entry), 'Entrada de forma inválida.');
            $code = $entry['codigo'] ?? null;
            $this->check(in_array($code, ['A', 'B'], true) && ! isset($forms[$code]), 'Código de forma inválido o repetido.');
            $this->check(($entry['reactivos'] ?? null) === self::EXPECTED_ITEMS, 'Cada forma requiere 187 reactivos.');
            $this->check(($entry['opciones_por_reactivo'] ?? null) === ['a', 'b', 'c'], 'Se requieren tres opciones a/b/c por reactivo.');
            $this->check(is_string($entry['archivo_reactivos'] ?? null), 'Falta el archivo de reactivos.');
            $this->check(is_string($entry['version_label'] ?? null) && $entry['version_label'] !== '', 'Falta la etiqueta de versión.');

            $itemFile = $entry['archivo_reactivos'];
            $itemRaw = $this->read($root, $itemFile);
            try {
                $payload = json_decode($itemRaw, true, 512, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                throw new InvalidArgumentException('Reactivos ilesibles en la forma '.$code.'.');
            }
            $this->check(($payload['codigo'] ?? null) === $code, 'La forma '.$code.' no coincide con su archivo.');
            $this->check(is_array($payload['instructivo'] ?? null) && $payload['instructivo'] !== [], 'Falta el instructivo de la forma '.$code.'.');
            $this->check(is_array($payload['ejemplos'] ?? null) && count($payload['ejemplos']) === self::EXPECTED_EXAMPLES, 'Se requieren 4 ejemplos en la forma '.$code.'.');
            $this->check(is_array($payload['items'] ?? null) && count($payload['items']) === self::EXPECTED_ITEMS, 'La forma '.$code.' requiere 187 reactivos.');

            $items = [];
            $numbers = [];
            foreach ($payload['items'] as $index => $item) {
                $this->check(is_array($item), 'Reactivo inválido en '.$code.'.');
                $number = $item['numero'] ?? null;
                $this->check($number === $index + 1, 'Numeración no consecutiva en '.$code.' (posición '.($index + 1).').');
                $numbers[] = $number;
                $this->check(is_string($item['texto'] ?? null) && trim($item['texto']) !== '', 'Reactivo sin texto en '.$code.' n.º '.$number.'.');
                $options = $item['opciones'] ?? null;
                $this->check(is_array($options), 'Reactivo sin opciones en '.$code.' n.º '.$number.'.');
                $keys = array_keys($options);
                sort($keys);
                $this->check($keys === ['a', 'b', 'c'], 'Opciones inválidas en '.$code.' n.º '.$number.'.');
                foreach ($keys as $key) {
                    $this->check(is_string($options[$key]) && trim($options[$key]) !== '', 'Opción '.$key.' vacía en '.$code.' n.º '.$number.'.');
                }
                foreach (['correct', 'correcta', 'clave', 'peso', 'puntos', 'factor'] as $forbidden) {
                    $this->check(! array_key_exists($forbidden, $item), 'El paquete no debe incluir claves ni pesos ('.$forbidden.').');
                }
                $items[] = [
                    'numero' => $number,
                    'texto' => $item['texto'],
                    'opciones' => ['a' => $options['a'], 'b' => $options['b'], 'c' => $options['c']],
                    'parrafo' => is_int($item['parrafo_indice_base_0'] ?? null) ? $item['parrafo_indice_base_0'] : null,
                    'paraId' => is_string($item['paraId'] ?? null) ? $item['paraId'] : null,
                ];
            }
            $this->check($numbers === range(1, self::EXPECTED_ITEMS), 'La numeración de '.$code.' no es 1–187.');

            $source = $entry['fuente_docx'] ?? null;
            $this->check(is_array($source) && is_string($source['ruta'] ?? null), 'Falta la fuente Word de '.$code.'.');
            $docxBytes = $this->read($root, $source['ruta']);
            $docxSha = hash('sha256', $docxBytes);
            $this->check(($source['sha256'] ?? null) === $docxSha, 'Hash del Word incoherente en '.$code.'.');
            $this->check(($source['bytes'] ?? null) === strlen($docxBytes), 'Tamaño del Word incoherente en '.$code.'.');

            $clave = $entry['clave_grafica'] ?? null;
            $this->check(is_array($clave) && is_string($clave['ruta'] ?? null), 'Falta la clave gráfica de '.$code.'.');
            $claveBytes = $this->read($root, $clave['ruta']);
            $this->check(($clave['sha256'] ?? null) === hash('sha256', $claveBytes), 'Hash de la clave gráfica incoherente en '.$code.'.');

            // The digest binds the canonical payload and the Word hash: a changed item, option or
            // source yields a different version instead of mutating the previous one.
            $digest = hash('sha256', json_encode($this->canonical($payload), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR).'|'.$docxSha);
            $this->check(($entry['forma_sha256'] ?? null) === $digest, 'Hash de forma incoherente en '.$code.'.');

            $files = [
                'forma-'.$code.'.json' => $itemRaw,
                'fuente-'.$code.'.docx' => $docxBytes,
                'clave-'.$code.'.jpeg' => $claveBytes,
            ];
            $forms[$code] = [
                'codigo' => $code,
                'nombre' => is_string($entry['nombre'] ?? null) ? $entry['nombre'] : 'Cuestionario 16 FP — Forma '.$code,
                'version_label' => $entry['version_label'],
                'instructivo' => array_values(array_filter($payload['instructivo'], fn ($line) => is_string($line) && trim($line) !== '')),
                'ejemplos' => $payload['ejemplos'],
                'items' => $items,
                'docx_sha256' => $docxSha,
                'clave_sha256' => hash('sha256', $claveBytes),
                'digest' => $digest,
                'files' => $files,
            ];
        }
        $this->check(isset($forms['A'], $forms['B']), 'El paquete debe contener las formas A y B.');

        return ['manifest' => $manifest, 'forms' => $forms];
    }

    private function create(array $form, string $prefix, array $manifest): InstrumentVersion
    {
        $version = InstrumentVersion::create([
            'name' => $form['nombre'],
            'version_label' => $form['version_label'],
            'package_date' => '2026-11-12',
            'manifest_sha256' => $form['digest'],
            'answer_type' => InstrumentVersion::SINGLE_CHOICE_UNSCORED,
            'source_review_state' => 'pendiente_cotejo',
            'application_ready' => true,
            'application_blocked_reason' => null,
            'option_labels' => self::OPTIONS,
            'scoring_enabled' => false,
            'instructions' => implode("\n\n", $form['instructivo']),
            'instructions_source_markdown' => implode("\n\n", $form['instructivo']),
            'example_text' => $this->exampleText($form['ejemplos']),
            'example_image_path' => null,
            'storage_prefix' => $prefix,
            'manifest' => [
                'source_package' => self::PACKAGE,
                'source_package_version' => $manifest['version'] ?? null,
                'form' => $form['codigo'],
                'reactivos' => count($form['items']),
                'docx_sha256' => $form['docx_sha256'],
                'clave_grafica_sha256' => $form['clave_sha256'],
                'transcription_check' => 'numeración 1–187 y opciones a/b/c verificadas',
                'scoring' => null,
                'norms' => null,
                'timing' => null,
                'claves' => 'No importadas; cotejo pendiente (forma A: 184 asignaciones; forma B con duplicados/omisiones).',
            ],
            'source_file_hashes' => array_map(fn ($bytes) => hash('sha256', $bytes), $form['files']),
        ]);

        $prefixId = $form['codigo'] === 'A' ? 'FP16A' : 'FP16B';
        foreach ($form['items'] as $item) {
            $sourceId = sprintf('%s-%03d', $prefixId, $item['numero']);
            $locator = 'reactivo '.$item['numero']
                .($item['parrafo'] !== null ? ' · párrafo '.$item['parrafo'].' base 0' : '')
                .($item['paraId'] !== null ? ' · paraId '.$item['paraId'] : '');
            $version->exercises()->create([
                'source_id' => $sourceId,
                'number' => $item['numero'],
                'texto' => $item['texto'],
                'opciones' => $item['opciones'],
                'response_type' => InstrumentExercise::SINGLE_CHOICE_UNSCORED,
                'correct_option' => null,
                'correct_first' => null,
                'correct_second' => null,
                'points' => null,
                'image_path' => null,
                'original_path' => null,
                'reconstruction_path' => null,
                'reconstruction_sha256' => null,
                'image_sha256' => null,
                'original_sha256' => null,
                'answer_markdown' => 'Sin clave importada en este corte. Fuente: Word '.$form['codigo'].' · '.$locator.'. Cotejo de corrección pendiente.',
                'source_review_state' => 'pendiente_cotejo',
                'review_note' => 'Reactivo textual; sin figura. '.$locator.'.',
            ]);
        }

        $version->conformity()->create([
            'reviewer_name' => 'Cotejo estructural automatizado',
            'statement' => self::TRANSCRIPTION_STATEMENT,
            'recorded_at' => now(),
            'institutional_approval' => false,
        ]);

        return $version->load(['exercises', 'conformity']);
    }

    private function exampleText(array $examples): string
    {
        $lines = [];
        foreach ($examples as $example) {
            $options = $example['opciones'] ?? [];
            $lines[] = 'Ejemplo '.($example['numero'] ?? '?').': '.($example['texto'] ?? '')
                .' a) '.($options['a'] ?? '').' b) '.($options['b'] ?? '').' c) '.($options['c'] ?? '');
        }
        $lines[] = 'El último ejemplo tiene una respuesta correcta. En este cuestionario hay preguntas de ese tipo; la corrección no está habilitada en esta versión.';

        return implode("\n", $lines);
    }

    private function store($disk, string $staging, string $prefix, array $files): void
    {
        $this->check(! $disk->exists($staging) && ! $disk->exists($prefix), 'El destino privado ya existe.');
        foreach ($files as $relative => $bytes) {
            $this->check($disk->put($staging.'/'.$relative, $bytes, ['visibility' => 'private']), 'No se pudo guardar el paquete privado.');
        }
        // Promote file by file: a directory rename is unreliable on Windows.
        foreach (array_keys($files) as $relative) {
            $this->check($disk->move($staging.'/'.$relative, $prefix.'/'.$relative), 'No se pudo conservar el paquete privado.');
        }
        $this->check($disk->deleteDirectory($staging), 'No se pudo retirar el staging privado.');
    }

    private function canonical(array $value, bool $assoc = true): array
    {
        if (! array_is_list($value)) {
            ksort($value, SORT_STRING);
        }
        foreach ($value as $key => $entry) {
            if (is_array($entry)) {
                $value[$key] = $this->canonical($entry);
            }
        }

        return $value;
    }

    private function read(string $root, string $relative): string
    {
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

    private function check(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new InvalidArgumentException($message);
        }
    }
}
