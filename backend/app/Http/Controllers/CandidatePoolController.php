<?php

namespace App\Http\Controllers;

use App\Models\TalentRegistration;
use App\Support\EvaluationData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidatePoolController extends Controller
{
    /**
     * Listado anónimo del Banco de Candidatos / Postulantes.
     * Muestra toda la información profesional y académica con el Código de Postulante,
     * protegiendo la identidad (sin nombre completo, sin teléfono, sin correo, sin CI ni dirección).
     */
    public function index(Request $request): JsonResponse
    {
        $input = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'search' => ['sometimes', 'nullable', 'string', 'max:200'],
            'career' => ['sometimes', 'nullable', 'string', 'max:200'],
            'faculty' => ['sometimes', 'nullable', 'string', 'max:200'],
            'modality' => ['sometimes', 'nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $query = TalentRegistration::with(['curriculum', 'evaluations.instrumentVersion'])
            ->whereNotNull('candidate_code')
            ->whereNotIn('status', ['draft', 'legacy_internal']); // Solo postulaciones enviadas o en proceso

        // Búsqueda libre
        $search = trim($input['search'] ?? '');
        if ($search !== '') {
            $pattern = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search) . '%';
            $query->where(function ($q) use ($pattern) {
                $q->where('candidate_code', 'ilike', $pattern)
                    ->orWhere('career', 'ilike', $pattern)
                    ->orWhere('faculty', 'ilike', $pattern)
                    ->orWhere('interest_area', 'ilike', $pattern)
                    ->orWhereHas('curriculum', function ($cv) use ($pattern) {
                        $cv->where('target_position', 'ilike', $pattern)
                            ->orWhere('technical_knowledge', 'ilike', $pattern)
                            ->orWhere('languages', 'ilike', $pattern);
                    });
            });
        }

        // Filtro por carrera
        if (! empty($input['career'])) {
            $query->where('career', 'ilike', '%' . $input['career'] . '%');
        }

        // Filtro por facultad
        if (! empty($input['faculty'])) {
            $query->where('faculty', 'ilike', '%' . $input['faculty'] . '%');
        }

        // Filtro por modalidad
        if (! empty($input['modality'])) {
            $query->whereHas('curriculum', function ($cv) use ($input) {
                $cv->where('work_modality', 'ilike', '%' . $input['modality'] . '%');
            });
        }

        // Filtro por estado
        if (! empty($input['status'])) {
            $query->where('status', $input['status']);
        }

        $perPage = (int) ($input['per_page'] ?? 20);
        $page = $query->orderByDesc('submitted_at')->orderBy('id')->paginate($perPage);

        $user = $request->user();
        $isStaff = ($user !== null && (bool) ($user->can_review_talent ?? false))
            || str_contains($request->path(), 'personal/');

        $collection = $page->getCollection()->map(function (TalentRegistration $r) use ($isStaff) {
            $cv = $r->curriculum;
            $evaluationsCompleted = $r->evaluations->filter(fn ($e) => $e->status === 'submitted')->count();

            return [
                'candidate_code' => $r->candidate_code,
                // Name only for staff; omitted for public
                'full_name' => $isStaff ? ($r->holderUser?->name ?? 'Titular') : null,
                'target_position' => $cv?->target_position ?? $r->interest_area ?? 'No especificado',
                'career' => $r->career ?? 'No declarada',
                'faculty' => $r->faculty ?? 'No declarada',
                // PPA strictly omitted for external/public users
                'declared_ppa' => $isStaff ? $r->declared_ppa : null,
                'expected_salary' => $cv?->expected_salary ?? 'A convenir',
                'incorporation_availability' => $cv?->incorporation_availability ?? 'Inmediata',
                'work_modality' => $cv?->work_modality ?? 'No especificada',
                'schedule_availability' => $cv?->schedule_availability ?? 'No especificada',
                'travel_availability' => $cv?->travel_availability ?? 'No especificada',
                'driver_license' => $cv?->driver_license ?? 'No especificada',
                'technical_knowledge' => $cv?->technical_knowledge,
                'languages' => $cv?->languages,
                'has_curriculum' => $cv !== null,
                'work_experiences_count' => is_array($cv?->work_experiences) ? count($cv->work_experiences) : 0,
                'evaluations_completed_count' => $evaluationsCompleted,
                'status' => $r->status,
                'submitted_at' => $r->submitted_at?->toISOString(),
                'updated_at' => $r->updated_at->toISOString(),
            ];
        });

        return response()->json([
            'data' => $collection,
            'meta' => [
                'current_page' => $page->currentPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'last_page' => $page->lastPage(),
            ],
        ]);
    }

    /**
     * Ficha técnica del Candidato / Postulante.
     * Soporta perspectiva dual:
     * - Administrador / Staff: ve nombre completo, contacto, PPA y resultados completos.
     * - Usuario Externo / Público: ve solo el código de postulación, omite datos privados y PPA, pero muestra todos los resultados y gráficas de las pruebas.
     */
    public function show(Request $request, string $candidateCode): JsonResponse
    {
        $user = $request->user();
        $isStaff = ($user !== null && (bool) ($user->can_review_talent ?? false))
            || str_contains($request->path(), 'personal/');

        $registration = TalentRegistration::with([
            'holderUser',
            'person',
            'curriculum',
            'academicReviews',
            'evaluations.instrumentVersion.exercises',
        ])
            ->where('candidate_code', $candidateCode)
            ->firstOrFail();

        $cv = $registration->curriculum;
        $person = $registration->person;

        // Work experiences: supervisor and contact phone omitted for external view
        $workExperiences = [];
        if (is_array($cv?->work_experiences)) {
            foreach ($cv->work_experiences as $job) {
                $item = [
                    'company' => $job['company'] ?? '',
                    'position' => $job['position'] ?? '',
                    'period' => $job['period'] ?? '',
                    'leaving_reason' => $job['leaving_reason'] ?? '',
                    'achievements' => $job['achievements'] ?? '',
                ];
                if ($isStaff) {
                    $item['supervisor'] = $job['supervisor'] ?? '';
                    $item['phone'] = $job['phone'] ?? '';
                }
                $workExperiences[] = $item;
            }
        }

        // Evaluations with calculated raw_result for all psychometric and aptitude instruments
        $evaluations = $registration->evaluations->map(function ($ev) {
            $instrument = $ev->instrumentVersion;
            $rawResult = $ev->raw_result;

            if ($ev->status === 'submitted' && $rawResult === null && $instrument) {
                if (EvaluationData::isMcClelland($instrument)) {
                    $rawResult = EvaluationData::calculateMcClellandScore($instrument, $ev->answers);
                } elseif (EvaluationData::isDominos($instrument)) {
                    $rawResult = EvaluationData::calculateDominosScore($instrument, $ev->answers);
                } elseif (EvaluationData::is16Fp($instrument)) {
                    $rawResult = EvaluationData::calculate16FpScore($instrument, $ev->answers);
                } elseif (EvaluationData::isSoftSkills($instrument)) {
                    $rawResult = EvaluationData::calculateSoftSkillsScore($instrument, $ev->answers);
                }
            }

            $area = EvaluationData::classifyArea($instrument);
            $areaLabel = EvaluationData::classifiedAreaLabel($area);

            return [
                'id' => $ev->id,
                'instrument_id' => $instrument?->id,
                'instrument_name' => $instrument?->name ?? 'Prueba psicotécnica',
                'version_label' => $instrument?->version_label ?? '1.0.0',
                'answer_type' => $instrument?->answer_type,
                'classified_area' => $area,
                'classified_area_label' => $areaLabel,
                'status' => $ev->status,
                'submitted_at' => $ev->submitted_at?->toISOString(),
                'raw_result' => $rawResult,
            ];
        });

        $academicReview = $registration->academicReviews->firstWhere('vigente', true);

        return response()->json([
            'data' => [
                'candidate_code' => $registration->candidate_code,
                'is_staff_view' => $isStaff,
                // Private personal data ONLY for staff:
                'full_name' => $isStaff ? ($person?->full_name ?? $registration->holderUser?->name) : null,
                'email' => $isStaff ? ($person?->contact_email ?? $registration->holderUser?->email) : null,
                'phone' => $isStaff ? $person?->contact_phone : null,
                'university_registration' => $isStaff ? $person?->university_registration : null,
                'birth_date' => $isStaff ? $person?->birth_date?->format('Y-m-d') : null,
                'sex' => $isStaff ? $person?->sex : null,
                // PPA strictly omitted for external/public view:
                'declared_ppa' => $isStaff ? $registration->declared_ppa : null,
                'reviewed_ppa' => $isStaff ? $academicReview?->reviewed_ppa : null,
                // Professional and academic profile (visible to all):
                'target_position' => $cv?->target_position ?? $registration->interest_area ?? 'No especificado',
                'career' => $registration->career ?? 'No declarada',
                'faculty' => $registration->faculty ?? 'No declarada',
                'expected_salary' => $cv?->expected_salary ?? 'A convenir',
                'incorporation_availability' => $cv?->incorporation_availability ?? 'Inmediata',
                'work_modality' => $cv?->work_modality ?? 'No especificada',
                'schedule_availability' => $cv?->schedule_availability ?? 'No especificada',
                'travel_availability' => $cv?->travel_availability ?? 'No especificada',
                'driver_license' => $cv?->driver_license ?? 'No especificada',
                'relatives_in_company' => $cv?->relatives_in_company ?? 'No',
                'technical_knowledge' => $cv?->technical_knowledge,
                'languages' => $cv?->languages,
                'education_levels' => $cv?->education_levels ?? [],
                'courses' => $cv?->courses ?? [],
                'work_experiences' => $workExperiences,
                'mobility' => [
                    'province' => $registration->mobility_province,
                    'department' => $registration->mobility_department,
                    'country' => $registration->mobility_country,
                ],
                'evaluations' => $evaluations,
                'status' => $registration->status,
                'submitted_at' => $registration->submitted_at?->toISOString(),
                'updated_at' => $registration->updated_at->toISOString(),
            ],
        ]);
    }
}
