<?php

namespace App\Http\Controllers;

use App\Models\InstrumentVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InstrumentBankController extends Controller
{
    private function capability(Request $request): void
    {
        abort_unless($request->user()?->talent_pilot_enabled && $request->user()?->can_review_talent, 403);
    }

    public function index(Request $request): JsonResponse
    {
        $this->capability($request);

        return response()->json(['data' => InstrumentVersion::with('conformity')->withCount('exercises')->orderByDesc('package_date')->orderBy('id')->get()->map(fn ($version) => $this->summary($version))]);
    }

    public function show(Request $request, string $version): JsonResponse
    {
        $this->capability($request);
        abort_unless(Str::isUuid($version), 404);
        $instrument = InstrumentVersion::with(['conformity', 'exercises'])->withCount('exercises')->findOrFail($version);
        $base = '/api/personal/instrumentos/'.$instrument->id.'/imagenes/';
        $labels = $instrument->optionLabels();

        return response()->json(['data' => array_merge($this->summary($instrument), [
            'instructions' => $instrument->instructions,
            'example_text' => $instrument->example_text,
            'example_image_url' => $instrument->example_image_path === null ? null : $base.'example/example',
            'option_labels' => $labels,
            'scoring_enabled' => $instrument->scoring_enabled,
            'application_ready' => $instrument->application_ready,
            'application_blocked_reason' => $instrument->application_blocked_reason,
            'exercises' => $instrument->exercises->map(fn ($e) => [
                'id' => $e->source_id, 'number' => $e->number,
                'response_type' => $e->response_type,
                'text' => $e->texto,
                'options' => $e->isTwoHalves() ? null : $labels,
                'option_texts' => $e->isTwoHalves() ? null : $this->optionTexts($e->opciones, $labels),
                'reconstructed_url' => $e->image_path === null ? null : $base.'reconstructed/'.$e->source_id,
                'original_url' => $e->original_path === null ? null : $base.'original/'.$e->source_id,
                // Staff-only: the source key lives here and never in the candidate DTO.
                'source_answer' => $e->sourceKey(), 'answer_markdown' => $e->answer_markdown,
                'source_review_state' => $e->source_review_state, 'review_note' => $e->review_note,
            ]),
        ])]);
    }

    /** @return array<string, string>|null */
    private function optionTexts(mixed $opciones, array $labels): ?array
    {
        if (! is_array($opciones) || $opciones === []) {
            return null;
        }
        $texts = [];
        foreach (array_values($labels) as $index => $label) {
            $key = chr(97 + $index);
            if (! isset($opciones[$key]) || ! is_string($opciones[$key])) {
                return null;
            }
            $texts[$label] = $opciones[$key];
        }

        return $texts;
    }

    public function image(Request $request, string $version, string $kind, string $sourceId): StreamedResponse
    {
        $this->capability($request);
        abort_unless(Str::isUuid($version), 404);
        abort_unless(in_array($kind, ['original', 'reconstructed', 'example'], true), 404);
        $instrument = InstrumentVersion::findOrFail($version);
        if ($kind === 'example') {
            abort_unless($sourceId === 'example', 404);
            $path = $instrument->example_image_path;
        } else {
            abort_unless(preg_match('/\A[A-Za-z0-9-]{3,40}\z/D', $sourceId) === 1, 404);
            $exercise = $instrument->exercises()->where('source_id', $sourceId)->firstOrFail();
            $path = match (true) {
                $kind === 'original' => $exercise->original_path,
                $exercise->reconstruction_path !== null => $exercise->reconstruction_path,
                default => $exercise->image_path,
            };
        }
        abort_if($path === null, 404);
        $disk = Storage::disk('instrument_private');
        abort_unless(str_starts_with($path, $instrument->storage_prefix.'/') && ! str_contains($path, '..') && $disk->exists($path), 404);
        $mime = $disk->mimeType($path);
        abort_unless(in_array($mime, ['image/png', 'image/jpeg'], true), 404);

        return $disk->response($path, null, [
            'Content-Type' => $mime,
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function summary(InstrumentVersion $version): array
    {
        $conformity = $version->conformity;

        $area = \App\Support\EvaluationData::classifyArea($version);
        $areaLabel = \App\Support\EvaluationData::classifiedAreaLabel($area);

        return [
            'id' => $version->id, 'name' => $version->name, 'version_label' => $version->version_label,
            'package_date' => $version->package_date->format('Y-m-d'),
            'answer_type' => $version->answer_type,
            'option_labels' => $version->optionLabels(),
            'scoring_enabled' => $version->scoring_enabled,
            'classified_area' => $area,
            'classified_area_label' => $areaLabel,
            'application_ready' => $version->application_ready,
            'application_blocked_reason' => $version->application_blocked_reason,
            'source_review_state' => $version->source_review_state, 'exercise_count' => $version->exercises_count,
            'conformity' => $conformity ? [
                'reviewer_name' => $conformity->reviewer_name, 'statement' => $conformity->statement,
                'recorded_at' => $conformity->recorded_at->toISOString(), 'institutional_approval' => $conformity->institutional_approval,
            ] : null,
        ];
    }
}
