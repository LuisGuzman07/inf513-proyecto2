<?php

namespace App\Console\Commands;

use App\Models\CatalogCareerOption;
use App\Models\CatalogFaculty;
use App\Models\TalentRegistration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CatalogImport extends Command
{
    protected $signature = 'catalog:import {--path= : Ruta del JSON del catálogo}';

    protected $description = 'Importar el catálogo UAGRM de forma idempotente, sin borrar filas referenciadas';

    public function handle(): int
    {
        $path = $this->option('path') ?: base_path('../docs/data/catalogo-uagrm.json');
        if (! is_file($path)) {
            $this->error('Archivo de catálogo no encontrado.');

            return self::FAILURE;
        }
        $raw = @file_get_contents($path);
        $data = is_string($raw) ? json_decode($raw, true) : null;
        $errors = self::validate($data);
        if ($errors !== []) {
            foreach ($errors as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $result = DB::transaction(fn () => self::apply($data));

        $this->info(self::report($result));

        return self::SUCCESS;
    }

    /**
     * @return string[]
     */
    public static function validate(mixed $data): array
    {
        $errors = [];
        if (! is_array($data)) {
            return ['El archivo no contiene un objeto JSON válido.'];
        }
        if (! is_string($data['catalog_version'] ?? null) || trim($data['catalog_version']) === '') {
            $errors[] = 'Falta catalog_version (texto no vacío).';
        }
        foreach (['facultades', 'opciones_carrera_por_facultad'] as $key) {
            if (! isset($data[$key]) || ! is_array($data[$key])) {
                $errors[] = "Falta {$key} (arreglo).";
            }
        }
        if ($errors !== []) {
            return $errors;
        }
        $facultyIds = [];
        foreach ($data['facultades'] as $index => $faculty) {
            $where = "facultades[{$index}]";
            if (! is_array($faculty)) {
                $errors[] = "{$where} no es un objeto.";

                continue;
            }
            $id = $faculty['id'] ?? null;
            $name = $faculty['nombre'] ?? null;
            if (! is_string($id) || trim($id) === '') {
                $errors[] = "{$where} no tiene id.";
            } elseif (mb_strlen($id) > 128) {
                $errors[] = "{$where} tiene id mayor a 128 caracteres.";
            } elseif (in_array($id, $facultyIds, true)) {
                $errors[] = "id de facultad duplicado: {$id}.";
            } else {
                $facultyIds[] = $id;
            }
            if (! is_string($name) || trim($name) === '') {
                $errors[] = "{$where} no tiene nombre.";
            } elseif (mb_strlen($name) > 200) {
                $errors[] = "{$where} tiene nombre mayor a 200 caracteres.";
            }
            if (isset($faculty['grupo']) && ! is_string($faculty['grupo'])) {
                $errors[] = "{$where} tiene grupo inválido.";
            }
        }
        $optionIds = [];
        foreach ($data['opciones_carrera_por_facultad'] as $index => $option) {
            $where = "opciones_carrera_por_facultad[{$index}]";
            if (! is_array($option)) {
                $errors[] = "{$where} no es un objeto.";

                continue;
            }
            $id = $option['id'] ?? null;
            $facultyId = $option['facultad_id'] ?? null;
            $name = $option['nombre'] ?? null;
            if (! is_string($id) || trim($id) === '') {
                $errors[] = "{$where} no tiene id.";
            } elseif (mb_strlen($id) > 128) {
                $errors[] = "{$where} tiene id mayor a 128 caracteres.";
            } elseif (in_array($id, $optionIds, true)) {
                $errors[] = "id de opción duplicado: {$id}.";
            } else {
                $optionIds[] = $id;
            }
            if (! is_string($facultyId) || trim($facultyId) === '') {
                $errors[] = "{$where} no tiene facultad_id.";
            } elseif (! in_array($facultyId, $facultyIds, true)) {
                $errors[] = "{$where} referencia una facultad ausente del archivo: {$facultyId}.";
            }
            if (! is_string($name) || trim($name) === '') {
                $errors[] = "{$where} no tiene nombre.";
            } elseif (mb_strlen($name) > 200) {
                $errors[] = "{$where} tiene nombre mayor a 200 caracteres.";
            }
        }

        return $errors;
    }

    private static function facultyAttributes(array $faculty): array
    {
        return [
            'name' => (string) $faculty['nombre'],
            'group' => (string) ($faculty['grupo'] ?? 'facultad_ciudad'),
            'official_url' => isset($faculty['url_oficial']) ? (string) $faculty['url_oficial'] : null,
            'consulted_at' => $faculty['fecha_consulta'] ?? null,
            'state' => (string) ($faculty['estado'] ?? 'catalogo_de_trabajo_no_aprobado_por_administracion'),
            'active' => true,
        ];
    }

    private static function optionAttributes(array $option, string $version): array
    {
        return [
            'faculty_catalog_id' => (string) $option['facultad_id'],
            'name' => (string) $option['nombre'],
            'source_names' => array_values(is_array($option['nombres_en_fuentes'] ?? null) ? array_map(strval(...), $option['nombres_en_fuentes']) : []),
            'admission_refs' => array_values(is_array($option['referencias_admisiones'] ?? null) ? array_map(strval(...), $option['referencias_admisiones']) : []),
            'evidence' => isset($option['evidencia']) ? (string) $option['evidencia'] : null,
            'needs_review' => (bool) ($option['requiere_revision_catalogo'] ?? false),
            'notes' => array_values(is_array($option['notas'] ?? null) ? array_map(strval(...), $option['notas']) : []),
            'catalog_version' => $version,
            'active' => true,
        ];
    }

    private static function sameRecord(?array $current, array $next): bool
    {
        if ($current === null) {
            return false;
        }
        foreach ($next as $key => $value) {
            $stored = $current[$key] ?? null;
            if ($key === 'consulted_at') {
                $stored = $stored instanceof \DateTimeInterface ? $stored->format('Y-m-d') : ($stored !== null ? substr((string) $stored, 0, 10) : null);
                $value = $value !== null ? substr((string) $value, 0, 10) : null;
            }
            if ($stored != $value) {
                return false;
            }
        }

        return true;
    }

    private static function apply(array $data): array
    {
        $version = (string) $data['catalog_version'];
        $counts = ['faculties' => ['seen' => 0, 'created' => 0, 'updated' => 0, 'deactivated' => 0, 'kept' => 0], 'options' => ['seen' => 0, 'created' => 0, 'updated' => 0, 'deactivated' => 0, 'kept' => 0]];
        $seenFaculties = [];
        foreach ($data['facultades'] as $faculty) {
            $id = (string) $faculty['id'];
            $seenFaculties[] = $id;
            $counts['faculties']['seen']++;
            $stored = CatalogFaculty::find($id);
            $next = self::facultyAttributes($faculty);
            if (! $stored) {
                CatalogFaculty::create(['catalog_id' => $id] + $next);
                $counts['faculties']['created']++;
            } elseif (! self::sameRecord($stored->only(array_keys($next)), $next)) {
                $stored->fill($next)->save();
                $counts['faculties']['updated']++;
            }
        }
        $seenOptions = [];
        foreach ($data['opciones_carrera_por_facultad'] as $option) {
            $id = (string) $option['id'];
            $seenOptions[] = $id;
            $counts['options']['seen']++;
            $stored = CatalogCareerOption::find($id);
            $next = self::optionAttributes($option, $version);
            if (! $stored) {
                CatalogCareerOption::create(['catalog_id' => $id] + $next);
                $counts['options']['created']++;
            } elseif (! self::sameRecord($stored->only(array_keys($next)), $next)) {
                $stored->fill($next)->save();
                $counts['options']['updated']++;
            }
        }
        $referencedFaculties = TalentRegistration::whereNotNull('faculty_catalog_id')->distinct()->pluck('faculty_catalog_id')->all();
        $referencedOptions = TalentRegistration::whereNotNull('career_catalog_id')->distinct()->pluck('career_catalog_id')->all();
        foreach (CatalogFaculty::whereNotIn('catalog_id', $seenFaculties)->where('active', true)->get(['catalog_id']) as $missing) {
            if (in_array($missing->catalog_id, $referencedFaculties, true)) {
                $counts['faculties']['kept']++;
            } else {
                $missing->update(['active' => false]);
                $counts['faculties']['deactivated']++;
            }
        }
        foreach (CatalogCareerOption::whereNotIn('catalog_id', $seenOptions)->where('active', true)->get(['catalog_id']) as $missing) {
            if (in_array($missing->catalog_id, $referencedOptions, true)) {
                $counts['options']['kept']++;
            } else {
                $missing->update(['active' => false]);
                $counts['options']['deactivated']++;
            }
        }

        return ['version' => $version] + $counts;
    }

    private static function report(array $result): string
    {
        $faculty = $result['faculties'];
        $careers = $result['options'];
        $faculties = "facultades {$faculty['seen']} procesadas ({$faculty['created']} nuevas, {$faculty['updated']} actualizadas, {$faculty['deactivated']} desactivadas, {$faculty['kept']} referenciadas conservadas)";
        $options = "opciones {$careers['seen']} procesadas ({$careers['created']} nuevas, {$careers['updated']} actualizadas, {$careers['deactivated']} desactivadas, {$careers['kept']} referenciadas conservadas)";

        return "Catálogo {$result['version']}: {$faculties}; {$options}.";
    }
}
