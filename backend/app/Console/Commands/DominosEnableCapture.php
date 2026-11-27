<?php

namespace App\Console\Commands;

use App\Models\InstrumentVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DominosEnableCapture extends Command
{
    protected $signature = 'dominos:enable-capture {version : ID explícito de la versión fuente o del perfil de captura}';

    protected $description = 'Crea una versión inmutable para captura vertical y envío, sin calificación automática.';

    public function handle(): int
    {
        try {
            $version = DB::transaction(function () {
                // Serialize with the package importer as well as other capture requests.
                DB::select('SELECT pg_advisory_xact_lock(?)', [1827102702]);
                $source = InstrumentVersion::find($this->argument('version'));
                if (! $source || ! $source->isTwoHalves()) {
                    throw new InvalidArgumentException('Se requiere el ID de una versión de dos mitades existente.');
                }
                if (($source->manifest['capture_contract']['version'] ?? null) === 'vertical_word_pair_v1'
                    && isset($source->manifest['source_version_id'])) {
                    return $source;
                }

                $source->load(['exercises', 'conformity']);
                if (! $source->conformity || $source->conformity->institutional_approval) {
                    throw new InvalidArgumentException('Se requiere conformidad visual no institucional registrada.');
                }
                if ($source->exercises->pluck('number')->all() !== range(1, 48)
                    || $source->exercises->contains(fn ($exercise) => ! $exercise->isTwoHalves()
                        || ! is_int($exercise->correct_first) || $exercise->correct_first < 0 || $exercise->correct_first > 6
                        || ! is_int($exercise->correct_second) || $exercise->correct_second < 0 || $exercise->correct_second > 6)) {
                    throw new InvalidArgumentException('Se requieren 48 ejercicios de dos mitades con pares completos de 0 a 6.');
                }

                $manifest = [
                    'source_version_id' => $source->id,
                    'source_manifest_sha256' => $source->manifest_sha256,
                    'source_manifest' => $source->manifest,
                    'capture_contract' => [
                        'version' => 'vertical_word_pair_v1',
                        'mapping' => ['upper' => 'first', 'lower' => 'second'],
                        'word_pair_order' => ['first' => 'primera_cifra_Word', 'second' => 'segunda_cifra_Word'],
                        'physical_orientation_confirmed' => false,
                        'missing_value' => null,
                        'allowed_values' => range(0, 6),
                        'scoring' => null,
                        'timing' => null,
                        'norms' => null,
                    ],
                    'technical_decision' => [
                        'provenance' => ['user' => 'Marcelo'],
                        'scope' => 'Interfaz vertical de captura y envío; no confirma orientación física ni aprobación institucional.',
                    ],
                    'storage_policy' => 'Reutiliza storage_prefix y rutas privadas inmutables de la fuente, sin copiar ni modificar bytes.',
                ];
                $digest = hash('sha256', json_encode($this->canonicalManifest($manifest), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
                $existing = InstrumentVersion::where('manifest_sha256', $digest)->first();
                if ($existing) {
                    return $existing;
                }

                // Shared paths remain immutable; only database identities are new.
                $profile = $source->replicate()->unsetRelations();
                $profile->fill([
                    'version_label' => $source->version_label.'-capture-v1',
                    'manifest' => $manifest,
                    'manifest_sha256' => $digest,
                    'application_ready' => true,
                    'application_blocked_reason' => null,
                ]);
                $profile->save();
                foreach ($source->exercises as $exercise) {
                    $profile->exercises()->save($exercise->replicate()->unsetRelations());
                }
                $profile->conformity()->save($source->conformity->replicate()->unsetRelations());

                return $profile;
            });
        } catch (InvalidArgumentException $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }

        $this->info('Versión de captura y envío: '.$version->version_label.' ('.$version->id.').');
        $this->line('Sin calificación, tiempos ni baremos. La orientación física de la clave no queda confirmada.');

        return self::SUCCESS;
    }

    private function canonicalManifest(array $value): array
    {
        // JSONB may reorder object keys; list order is source-authoritative.
        if (! array_is_list($value)) {
            ksort($value, SORT_STRING);
        }
        foreach ($value as $key => $entry) {
            if (is_array($entry)) {
                $value[$key] = $this->canonicalManifest($entry);
            }
        }

        return $value;
    }
}
