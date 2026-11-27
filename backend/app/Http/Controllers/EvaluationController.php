<?php

namespace App\Http\Controllers;

use App\Models\EvaluationAssignment;
use App\Models\InstrumentVersion;
use App\Models\TalentRegistration;
use App\Support\EvaluationAnswers;
use App\Support\EvaluationData;
use App\Support\FacultyTestAssignment;
use App\Support\TalentWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EvaluationController extends Controller
{
    private function staffCapability(Request $request): void
    {
        abort_unless($request->user()->talent_pilot_enabled && $request->user()->can_review_talent, 403);
    }

    private function candidateCapability(Request $request): void
    {
        abort_unless($request->user()->talent_pilot_enabled && $request->user()->is_graduate, 403);
    }

    private function staffRegistration(Request $request, TalentRegistration $registration): void
    {
        abort_unless($registration->holder_user_id !== null
            && $registration->holder_user_id !== $request->user()->id
            && $registration->status !== 'legacy_internal'
            && $registration->reviewer_user_id === $request->user()->id, 404);
    }

    private function candidateAssignment(Request $request, string $id, bool $lock = false): EvaluationAssignment
    {
        abort_unless(Str::isUuid($id), 404);
        $query = EvaluationAssignment::whereHas('registration', fn ($query) => $query
            ->where('holder_user_id', $request->user()->id)->where('status', '!=', 'legacy_internal'));

        return ($lock ? $query->lockForUpdate() : $query)->findOrFail($id);
    }

    public function staffIndex(Request $request, string $registration): JsonResponse
    {
        $this->staffCapability($request);
        abort_unless(Str::isUuid($registration), 404);
        $record = TalentRegistration::findOrFail($registration);
        $this->staffRegistration($request, $record);

        return response()->json(['data' => EvaluationAssignment::where('registration_id', $record->id)
            ->orderBy('created_at')->get()->map(fn ($item) => EvaluationData::assignment($item, true))->all()]);
    }

    public function assign(Request $request, string $registration): JsonResponse
    {
        $this->staffCapability($request);
        abort_unless(Str::isUuid($registration), 404);
        $input = TalentWorkflow::input($request, [
            'version' => ['required', 'integer', 'min:1'],
            'instrument_version_id' => ['required', 'uuid'],
        ]);
        [$assignment, $created] = DB::transaction(function () use ($request, $registration, $input) {
            $record = TalentRegistration::lockForUpdate()->findOrFail($registration);
            $this->staffRegistration($request, $record);
            $existing = EvaluationAssignment::where('registration_id', $record->id)
                ->where('instrument_version_id', $input['instrument_version_id'])->first();
            if ($existing) {
                return [$existing, false];
            }
            TalentWorkflow::version($record, (int) $input['version']);
            $instrument = InstrumentVersion::findOrFail($input['instrument_version_id']);
            abort_unless($instrument->conformity()->exists(), 409, 'La versión requiere conformidad registrada.');
            // A version may be previewed in the bank but not applied to a candidate. The
            // reason travels in the response so the UI never has to guess why.
            if (! $instrument->application_ready) {
                throw ValidationException::withMessages([
                    'instrument_version_id' => [$instrument->application_blocked_reason ?: 'La versión no está habilitada para aplicación.'],
                ]);
            }
            $assignment = EvaluationAssignment::create([
                'registration_id' => $record->id,
                'instrument_version_id' => $instrument->id,
                'assigned_by' => $request->user()->id,
                'version' => 1,
                'status' => 'assigned',
                // Two-halves instruments start with an empty pair, not a scalar null.
                'answers' => $instrument->exercises->mapWithKeys(fn ($exercise) => [
                    $exercise->source_id => $exercise->isTwoHalves()
                        ? ['first' => null, 'second' => null]
                        : null,
                ])->all(),
            ]);
            TalentWorkflow::event($record, $request->user()->id, 'instrument_assigned', [
                'assignment_id' => ['before' => null, 'after' => $assignment->id],
                'instrument_version_id' => ['before' => null, 'after' => $instrument->id],
            ]);

            return [$assignment, true];
        });

        return response()->json(['data' => EvaluationData::assignment($assignment, true)], $created ? 201 : 200);
    }

    public function staffShow(Request $request, string $assignment): JsonResponse
    {
        $this->staffCapability($request);
        abort_unless(Str::isUuid($assignment), 404);
        $item = EvaluationAssignment::findOrFail($assignment);
        $this->staffRegistration($request, $item->registration);

        return response()->json(['data' => EvaluationData::assignment($item, true)]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->candidateCapability($request);
        $user = $request->user();

        // Si el postulante tiene un expediente registrado, asignamos automáticamente las 5 pruebas de su facultad
        $record = TalentRegistration::where('holder_user_id', $user->id)
            ->where('status', '!=', 'legacy_internal')
            ->first();

        if ($record) {
            FacultyTestAssignment::assignDefaultTestsForRegistration($record);
        }

        $items = EvaluationAssignment::whereHas('registration', fn ($query) => $query
            ->where('holder_user_id', $user->id)->where('status', '!=', 'legacy_internal'))
            ->orderBy('created_at')->get();

        return response()->json(['data' => $items->map(fn ($item) => EvaluationData::assignment($item))->all()]);
    }

    public function autoAssignMcClelland(Request $request): JsonResponse
    {
        $this->candidateCapability($request);

        $user = $request->user();
        $record = TalentRegistration::where('holder_user_id', $user->id)
            ->where('status', '!=', 'legacy_internal')
            ->first();

        if (! $record) {
            abort(404, 'No se encontró un registro de inscripción para el postulante.');
        }

        $instrument = InstrumentVersion::all()->first(fn ($inst) => EvaluationData::isMcClelland($inst));
        if (! $instrument) {
            abort(404, 'El Test de Logro y Liderazgo (Motivación de McClelland) no se encuentra registrado en el banco de instrumentos.');
        }

        // Enforce strictly ONCE per candidate: if already assigned, return existing assignment
        $existing = EvaluationAssignment::where('registration_id', $record->id)
            ->where('instrument_version_id', $instrument->id)
            ->first();

        if ($existing) {
            return response()->json([
                'data' => EvaluationData::assignment($existing),
                'already_assigned' => true,
                'can_retake' => false,
            ]);
        }

        $assignment = DB::transaction(function () use ($user, $record, $instrument) {
            $assignment = EvaluationAssignment::create([
                'registration_id' => $record->id,
                'instrument_version_id' => $instrument->id,
                'assigned_by' => $user->id,
                'version' => 1,
                'status' => 'assigned',
                'answers' => $instrument->exercises->mapWithKeys(fn ($exercise) => [
                    $exercise->source_id => null,
                ])->all(),
            ]);

            TalentWorkflow::event($record, $user->id, 'instrument_self_assigned', [
                'assignment_id' => ['before' => null, 'after' => $assignment->id],
                'instrument_version_id' => ['before' => null, 'after' => $instrument->id],
            ]);

            return $assignment;
        });

        return response()->json([
            'data' => EvaluationData::assignment($assignment),
            'already_assigned' => false,
            'can_retake' => false,
        ], 201);
    }

    public function show(Request $request, string $assignment): JsonResponse
    {
        $this->candidateCapability($request);

        return response()->json(['data' => EvaluationData::assignment($this->candidateAssignment($request, $assignment))]);
    }

    public function saveAnswers(Request $request, string $assignment): JsonResponse
    {
        $this->candidateCapability($request);
        $input = TalentWorkflow::input($request, [
            'version' => ['required', 'integer', 'min:1'],
            'answers' => ['present', 'array'],
        ]);
        $item = DB::transaction(function () use ($request, $assignment, $input) {
            $item = $this->candidateAssignment($request, $assignment, true);
            abort_if($item->status === 'submitted' || $item->version !== (int) $input['version'], 409);
            $answers = $item->answers;
            $exercises = $item->instrumentVersion->exercises->keyBy('source_id');
            // Read the raw body: TrimStrings/ConvertEmptyStringsToNull must not reshape
            // a pair into a valid answer, nor turn a zero into an absence.
            $original = $request->isJson() ? json_decode($request->getContent(), true)['answers'] : $input['answers'];
            foreach ($original as $id => $answer) {
                $exercise = $exercises->get($id);
                if (! $exercise) {
                    throw ValidationException::withMessages(['answers' => ['Usá únicamente IDs asignados a esta prueba.']]);
                }
                $answers[$id] = EvaluationAnswers::normalize($exercise, $answer, $item->instrumentVersion->optionLabels());
            }
            if ($answers !== $item->answers) {
                $item->answers = $answers;
                $item->status = 'in_progress';
                $item->version++;
                $item->save();
            }

            return $item;
        });

        return response()->json(['data' => EvaluationData::assignment($item)]);
    }

    public function submit(Request $request, string $assignment): JsonResponse
    {
        $this->candidateCapability($request);
        $input = TalentWorkflow::input($request, [
            'version' => ['required', 'integer', 'min:1'],
            'confirm_unanswered' => ['sometimes', 'boolean'],
        ]);
        $original = $request->isJson() ? json_decode($request->getContent(), true) : $request->all();
        if (array_key_exists('confirm_unanswered', $original) && ! is_bool($original['confirm_unanswered'])) {
            throw ValidationException::withMessages(['confirm_unanswered' => ['Usá un booleano explícito.']]);
        }
        $item = DB::transaction(function () use ($request, $assignment, $input) {
            $item = $this->candidateAssignment($request, $assignment, true);
            if ($item->status === 'submitted') {
                return $item;
            }
            abort_if($item->version !== (int) $input['version'], 409);
            $instrument = $item->instrumentVersion;
            $absent = 0;
            foreach ($instrument->exercises as $exercise) {
                if (! EvaluationAnswers::isAnswered($item->answers[$exercise->source_id])) {
                    $absent++;
                }
            }
            if ($absent > 0 && ! $request->boolean('confirm_unanswered')) {
                throw ValidationException::withMessages(['confirm_unanswered' => ['Confirmá explícitamente el envío con respuestas ausentes.']]);
            }
            // Scoring exists only where confirmed: McClelland generates tri-dimensional motivation scores;
            // Dominós calculates percentage of correct answers; 16 FP computes 16 psychometric factors & validity;
            // Hábil keeps its one-point-per-correct rule.
            if (EvaluationData::isMcClelland($instrument)) {
                $item->raw_result = EvaluationData::calculateMcClellandScore($instrument, $item->answers);
            } elseif (EvaluationData::isDominos($instrument)) {
                $item->raw_result = EvaluationData::calculateDominosScore($instrument, $item->answers);
            } elseif (EvaluationData::is16Fp($instrument)) {
                $item->raw_result = EvaluationData::calculate16FpScore($instrument, $item->answers);
            } elseif (EvaluationData::isSoftSkills($instrument)) {
                $item->raw_result = EvaluationData::calculateSoftSkillsScore($instrument, $item->answers);
            } elseif (! $instrument->scoring_enabled || $instrument->answer_type !== InstrumentVersion::SINGLE_CHOICE) {
                $item->raw_result = null;
            } else {
                $item->raw_result = EvaluationData::calculatePercentageScore($instrument, $item->answers);
            }
            $item->status = 'submitted';
            $item->submitted_at = now();
            $item->version++;
            $item->save();

            return $item;
        });

        return response()->json(['data' => EvaluationData::assignment($item)]);
    }

    public function image(Request $request, string $assignment, string $sourceId): StreamedResponse
    {
        $this->candidateCapability($request);
        $item = $this->candidateAssignment($request, $assignment);
        $instrument = $item->instrumentVersion;
        if ($sourceId === 'example') {
            $path = $instrument->example_image_path;
        } else {
            abort_unless(preg_match('/\A[A-Za-z0-9-]{3,40}\z/D', $sourceId) === 1, 404);
            $exercise = $instrument->exercises()->where('source_id', $sourceId)->firstOrFail();
            abort_unless($exercise->instrument_version_id === $instrument->id, 404);
            $path = $exercise->isTwoHalves() && $exercise->reconstruction_path !== null
                ? $exercise->reconstruction_path
                : $exercise->image_path;
        }
        abort_if($path === null, 404);
        $disk = Storage::disk('instrument_private');
        abort_unless(str_starts_with($path, $instrument->storage_prefix.'/') && ! str_contains($path, '..') && $disk->exists($path), 404);
        $mime = $disk->mimeType($path);
        abort_unless(in_array($mime, ['image/png', 'image/jpeg'], true), 404);

        return $disk->response($path, null, [
            'Content-Type' => $mime, 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
