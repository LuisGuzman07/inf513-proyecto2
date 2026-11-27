<?php

namespace App\Support;

use App\Models\InstrumentVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Throwable;

class HabilPackageImporter
{
    public const CONFORMITY = 'Marcelo declara haber revisado las 15 reconstrucciones, sus patrones y la correspondencia de respuestas. Conformidad de trabajo visual del piloto; no constituye aprobación institucional ni equivalencia psicométrica.';

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
                DB::select('SELECT pg_advisory_xact_lock(?)', [1827102701]);
                $version = InstrumentVersion::where('manifest_sha256', $package['digest'])->first();
                if (! $version) {
                    $this->check(! $disk->exists($staging) && ! $disk->exists($prefix), 'El destino privado ya existe.');
                    $owned = true;
                    foreach ($package['files'] as $relative => $contents) {
                        $this->check($disk->put($staging.'/'.$relative, $contents, ['visibility' => 'private']), 'No se pudo guardar el paquete privado.');
                    }
                    // Promote private files individually: directory rename is unreliable on Windows.
                    // No HTTP route can resolve this prefix until the database transaction commits.
                    foreach (array_keys($package['files']) as $relative) {
                        $this->check($disk->move($staging.'/'.$relative, $prefix.'/'.$relative), 'No se pudo conservar el paquete privado.');
                    }
                    $this->check($disk->deleteDirectory($staging), 'No se pudo retirar el staging privado.');
                    $m = $package['manifest'];
                    $version = InstrumentVersion::create([
                        'name' => $m['instrumento'],
                        'version_label' => $m['fecha'].'-'.substr($package['digest'], 0, 12),
                        'package_date' => $m['fecha'],
                        'manifest_sha256' => $package['digest'],
                        'source_review_state' => $m['estado_graficos'],
                        'instructions' => $package['instructions'],
                        'instructions_source_markdown' => $package['files']['fuentes/instrucciones.md'],
                        'example_text' => $package['example'],
                        'example_image_path' => $prefix.'/ejemplo/ejemplo_original.png',
                        'storage_prefix' => $prefix,
                        'manifest' => $m,
                        'source_file_hashes' => $package['hashes'],
                    ]);
                    foreach ($m['ejercicios'] as $e) {
                        $version->exercises()->create([
                            'source_id' => $e['id'], 'number' => $e['numero'],
                            'correct_option' => $e['respuesta_correcta_fuente'], 'points' => 1,
                            'image_path' => $prefix.'/'.$e['imagen'], 'original_path' => $prefix.'/'.$e['original'],
                            'answer_markdown' => $package['files'][$e['respuesta_md']],
                            'image_sha256' => $e['imagen_sha256'], 'original_sha256' => $e['original_sha256'],
                            'source_review_state' => $e['estado_grafico'], 'review_note' => $e['nota_cotejo'],
                        ]);
                    }
                }
                if ($marceloReviewed) {
                    $version->conformity()->firstOrCreate([], [
                        'reviewer_name' => 'Marcelo', 'statement' => self::CONFORMITY,
                        'recorded_at' => now(), 'institutional_approval' => false,
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
        $this->check($root !== false && is_dir($root), 'No existe el paquete.');
        $raw = $this->read($root, 'manifest.json');
        try {
            $m = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            throw new InvalidArgumentException('Manifest JSON inválido.');
        }
        $this->check(is_array($m) && ($m['cantidad_ejercicios'] ?? null) === 15 && ($m['cantidad_md_individuales'] ?? null) === 15, 'Se requieren 15 ejercicios y 15 Markdown.');
        $this->check(is_string($m['instrumento'] ?? null) && mb_strlen($m['instrumento']) <= 255 && $m['instrumento'] !== '', 'Nombre inválido.');
        $date = $m['fecha'] ?? '';
        $this->check(is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date) === 1 && date('Y-m-d', strtotime($date)) === $date, 'Fecha de paquete inválida.');
        $this->check(($m['estado_graficos'] ?? null) === 'pendiente_cotejo' && ($m['ejemplo_respuesta_fuente'] ?? null) === 'D', 'Estado fuente o ejemplo inválido.');
        $this->check(is_array($m['archivos'] ?? null) && is_array($m['ejercicios'] ?? null) && count($m['ejercicios']) === 15, 'Estructura de manifest inválida.');
        $files = ['manifest.json' => $raw];
        $hashes = [];
        foreach ($m['archivos'] as $file) {
            $this->check(is_array($file) && is_string($file['ruta'] ?? null), 'Entrada de archivo inválida.');
            $relative = $file['ruta'];
            $this->check(! array_key_exists($relative, $files), 'Archivo repetido.');
            $contents = $this->read($root, $relative);
            $digest = hash('sha256', $contents);
            $this->check(is_int($file['bytes'] ?? null) && strlen($contents) === $file['bytes'] && ($file['sha256'] ?? null) === $digest, 'Hash o tamaño incorrecto: '.$relative);
            $files[$relative] = $contents;
            $hashes[$relative] = $digest;
        }
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
        foreach ($iterator as $file) {
            $this->check(! $file->isLink(), 'No se permiten enlaces simbólicos en el paquete.');
            if ($file->isDir()) {
                continue;
            }
            $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
            $this->check(array_key_exists($relative, $files), 'Archivo sin inventario: '.$relative);
        }
        foreach (['README.md', 'fuentes/instrucciones.md', 'fuentes/transcripcion_original.docx', 'fuentes/clave_original.jpg', 'respuestas/CLAVE_GENERAL.md', 'ejemplo/ejemplo.md', 'ejemplo/ejemplo_original.png', 'index.html'] as $required) {
            $this->check(isset($files[$required]) && $files[$required] !== '', 'Falta fuente: '.$required);
        }
        $this->check(($m['clave_fuentes'] ?? null) === ['fuentes/transcripcion_original.docx', 'fuentes/clave_original.jpg'], 'Fuentes de clave inválidas.');
        $seen = [];
        preg_match_all('/^\|\s*(\d{2})\s*\|\s*([A-H])\s*\|([^\n]*)$/m', $files['respuestas/CLAVE_GENERAL.md'], $rows, PREG_SET_ORDER);
        $this->check(count($rows) === 15, 'Clave general incompleta.');
        $general = [];
        foreach ($rows as $row) {
            $this->check(! isset($general[(int) $row[1]]), 'Clave general repetida.');
            $this->check(str_contains($row[3], '[ej'.$row[1].'.md](ej'.$row[1].'.md)'), 'Referencia de fila de clave general incoherente.');
            $general[(int) $row[1]] = $row[2];
        }
        foreach ($m['ejercicios'] as $e) {
            $this->check(is_array($e) && is_int($e['numero'] ?? null) && $e['numero'] >= 1 && $e['numero'] <= 15, 'Número inválido.');
            $n = $e['numero'];
            $nn = sprintf('%02d', $n);
            $this->check(($e['id'] ?? null) === 'habil-'.$nn && ! isset($seen[$n]), 'ID o número repetido/incoherente.');
            $seen[$n] = true;
            $answer = $e['respuesta_correcta_fuente'] ?? '';
            $this->check(is_string($answer) && preg_match('/^[A-H]$/D', $answer) === 1 && ($general[$n] ?? null) === $answer && ($e['puntos_por_acierto_fuente'] ?? null) === 1, 'Clave o puntuación incoherente.');
            $this->check(($e['imagen'] ?? null) === 'imagenes/ej'.$nn.'.png' && ($e['respuesta_md'] ?? null) === 'respuestas/ej'.$nn.'.md', 'Referencias de ejercicio incoherentes.');
            $this->check(is_string($e['original'] ?? null) && preg_match('~^originales/ej'.$n.'\.(png|jpg|jpeg)$~D', $e['original']) === 1, 'Referencia original inválida.');
            foreach (['imagen', 'original', 'respuesta_md'] as $key) {
                $this->check(isset($files[$e[$key]]), 'Fuente no inventariada.');
            }
            $this->check(($e['imagen_sha256'] ?? null) === $hashes[$e['imagen']] && ($e['original_sha256'] ?? null) === $hashes[$e['original']], 'Hash del ejercicio incoherente.');
            $dimensions = $this->image($files[$e['imagen']], ['image/png']);
            $this->check(($e['dimensiones'] ?? null) === [$dimensions[0], $dimensions[1]], 'Dimensiones incoherentes.');
            $this->image($files[$e['original']], ['image/png', 'image/jpeg']);
            $this->check(($e['estado_grafico'] ?? null) === 'pendiente_cotejo' && is_string($e['nota_cotejo'] ?? null), 'Estado gráfico inválido.');
            $md = str_replace("\r\n", "\n", $files[$e['respuesta_md']]);
            $this->check(preg_match('/\A---\n(.*?)\n---\n/s', $md, $front) === 1, 'Falta frontmatter.');
            $fields = [];
            foreach (explode("\n", $front[1]) as $line) {
                $this->check(preg_match('/^([a-z_]+):\s*(.+)$/D', $line, $field) === 1 && ! isset($fields[$field[1]]), 'Frontmatter inválido.');
                $fields[$field[1]] = trim($field[2], "\"'");
            }
            foreach (['id' => $e['id'], 'instrumento' => $m['instrumento'], 'numero' => (string) $n, 'tipo' => 'seleccion_unica', 'imagen' => '../'.$e['imagen'], 'respuesta_correcta_fuente' => $answer, 'puntos_por_acierto_fuente' => '1', 'estado_grafico' => $e['estado_grafico'], 'clave_cotejada_con_word_y_fotografia' => 'true'] as $key => $value) {
                $this->check(($fields[$key] ?? null) === $value, 'Frontmatter incoherente: '.$key);
            }
            $this->check(str_contains($md, 'Respuesta según la clave original: '.$answer.'.'), 'Respuesta textual incoherente.');
            $refs = $this->references($e['respuesta_md'], $md, $files);
            foreach ([$e['imagen'], $e['original'], ...$m['clave_fuentes']] as $reference) {
                $this->check(in_array($reference, $refs, true), 'Falta referencia de procedencia.');
            }
            $this->check(str_contains($files['respuestas/CLAVE_GENERAL.md'], '[ej'.$nn.'.md](ej'.$nn.'.md)'), 'Referencia de clave general incoherente.');
        }
        foreach ($files as $relative => $contents) {
            if (str_ends_with($relative, '.md')) {
                $this->references($relative, $contents, $files);
            }
        }
        $this->image($files['ejemplo/ejemplo_original.png'], ['image/png']);
        $example = $files['ejemplo/ejemplo.md'];
        $this->check(str_contains($example, 'Respuesta indicada por las instrucciones originales: D.') && in_array('ejemplo/ejemplo_original.png', $this->references('ejemplo/ejemplo.md', $example, $files), true), 'Ejemplo incoherente.');
        $instructions = $files['fuentes/instrucciones.md'];
        $this->check(str_contains($instructions, '15') && str_contains($instructions, 'un punto por acierto') && str_contains($instructions, 'ENDE'), 'Instrucciones incompletas.');
        $candidateInstructions = 'Esta evaluación contiene 15 ejercicios. En cada uno podés elegir una opción de A a H o dejarlo sin respuesta. Guardá tus respuestas antes de continuar; podés revisarlas antes del envío. El envío final congela las respuestas y requiere confirmación explícita si quedan ejercicios sin responder. No hay un temporizador digital implementado.';
        $candidateExample = array_filter(preg_split('/\R\s*\R/', $example), fn ($p) => ! preg_match('/^#|fotograf|Word|\]\(|^Procedencia:/iu', $p));

        return ['manifest' => $m, 'digest' => hash('sha256', $raw), 'files' => $files, 'hashes' => $hashes, 'instructions' => $candidateInstructions, 'example' => trim(str_replace('**', '', implode("\n\n", $candidateExample)))];
    }

    private function read(string $root, string $relative): string
    {
        $this->check(preg_match('~^[a-zA-Z0-9_-]+(?:[.][a-zA-Z0-9_-]+)*(?:/[a-zA-Z0-9_-]+(?:[.][a-zA-Z0-9_-]+)*)*$~D', $relative) === 1, 'Ruta insegura.');
        $resolved = realpath($root.DIRECTORY_SEPARATOR.$relative);
        $this->check($resolved !== false && str_starts_with($resolved, $root.DIRECTORY_SEPARATOR) && is_file($resolved), 'Archivo fuera de raíz o ausente.');
        $contents = file_get_contents($resolved);
        $this->check($contents !== false, 'No se pudo leer el archivo.');

        return $contents;
    }

    private function references(string $relative, string $markdown, array $files): array
    {
        preg_match_all('/!?\[[^\]]*\]\(([^)]+)\)/', $markdown, $matches);
        $refs = [];
        foreach ($matches[1] as $target) {
            $this->check(preg_match('~^[a-zA-Z0-9_./-]+$~D', $target) === 1 && ! str_starts_with($target, '/'), 'Referencia Markdown insegura.');
            $parts = explode('/', dirname($relative).'/'.$target);
            $normalized = [];
            foreach ($parts as $part) {
                if ($part === '..') {
                    $this->check(count($normalized) > 0, 'Referencia fuera de raíz.');
                    array_pop($normalized);
                } elseif ($part !== '.' && $part !== '') {
                    $normalized[] = $part;
                }
            }
            $ref = implode('/', $normalized);
            $this->check(isset($files[$ref]), 'Referencia no inventariada.');
            $refs[] = $ref;
        }

        return $refs;
    }

    private function image(string $bytes, array $allowed): array
    {
        $image = @getimagesizefromstring($bytes);
        $this->check($image !== false && in_array($image['mime'], $allowed, true) && $image[0] > 0 && $image[1] > 0 && in_array((new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes), $allowed, true), 'Imagen o MIME inválido.');

        return $image;
    }

    private function check(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new InvalidArgumentException($message);
        }
    }
}
