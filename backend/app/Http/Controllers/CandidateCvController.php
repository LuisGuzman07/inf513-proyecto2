<?php

namespace App\Http\Controllers;

use App\Models\CandidateCurriculum;
use App\Models\TalentRegistration;
use App\Support\TalentWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CandidateCvController extends Controller
{
    private function owned(Request $request, string $id): TalentRegistration
    {
        $registration = TalentRegistration::with(['person', 'curriculum'])
            ->where(function ($query) use ($request) {
                $query->where('holder_user_id', $request->user()->id)
                    ->orWhere(function ($legacy) use ($request) {
                        $legacy->whereNull('holder_user_id')
                            ->where('status', 'legacy_internal')
                            ->where('created_by', $request->user()->id);
                    });
            })->findOrFail($id);

        Gate::authorize('view', $registration);

        return $registration;
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $registration = $this->owned($request, $id);
        $curriculum = $registration->curriculum;

        if (! $curriculum) {
            // Provide default prefilled structure from Person data
            $person = $registration->person;
            $curriculum = [
                'target_position' => $registration->interest_area ?? '',
                'application_date' => now()->format('Y-m-d'),
                'identity_card' => '',
                'birth_date_and_age' => $person->birth_date ? $person->birth_date->format('Y-m-d') : '',
                'contact_phone' => $person->contact_phone ?? '',
                'contact_email' => $person->contact_email ?? $request->user()->email,
                'address' => '',
                'expected_salary' => '',
                'incorporation_availability' => 'Inmediata',
                'education_levels' => [
                    [
                        'level' => 'Licenciatura / Ingeniería',
                        'career' => $registration->career ?? '',
                        'institution' => $registration->faculty ?? 'UAGRM',
                        'status' => 'En curso',
                        'year' => (string) date('Y'),
                    ],
                ],
                'technical_knowledge' => '',
                'languages' => '',
                'courses' => [],
                'work_experiences' => [
                    [
                        'company' => '',
                        'position' => '',
                        'period' => '',
                        'supervisor' => '',
                        'reference_phone' => '',
                        'leaving_reason' => '',
                        'achievements' => '',
                    ],
                ],
                'work_modality' => 'Presencial',
                'schedule_availability' => 'Tiempo completo',
                'travel_availability' => 'No',
                'driver_license' => 'No',
                'relatives_in_company' => 'No',
                'declaration_accepted' => false,
            ];
        }

        return response()->json(['data' => $curriculum]);
    }

    public function save(Request $request, string $id): JsonResponse
    {
        $registration = $this->owned($request, $id);
        Gate::authorize('update', $registration);
        abort_unless(in_array($registration->status, ['draft', 'correction_requested'], true), 409, 'El expediente ya fue enviado.');

        $input = $request->validate([
            'target_position' => ['nullable', 'string', 'max:200'],
            'application_date' => ['nullable', 'date'],
            'identity_card' => ['nullable', 'string', 'max:64'],
            'birth_date_and_age' => ['nullable', 'string', 'max:128'],
            'contact_phone' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'string', 'email:rfc', 'max:254'],
            'address' => ['nullable', 'string', 'max:1000'],
            'expected_salary' => ['nullable', 'string', 'max:100'],
            'incorporation_availability' => ['nullable', 'string', 'max:100'],
            'education_levels' => ['nullable', 'array'],
            'technical_knowledge' => ['nullable', 'string', 'max:4000'],
            'languages' => ['nullable', 'string', 'max:2000'],
            'courses' => ['nullable', 'array'],
            'work_experiences' => ['nullable', 'array'],
            'work_modality' => ['nullable', 'string', 'max:64'],
            'schedule_availability' => ['nullable', 'string', 'max:64'],
            'travel_availability' => ['nullable', 'string', 'max:64'],
            'driver_license' => ['nullable', 'string', 'max:128'],
            'relatives_in_company' => ['nullable', 'string', 'max:500'],
            'declaration_accepted' => ['nullable', 'boolean'],
        ]);

        $curriculum = DB::transaction(function () use ($registration, $request, $input) {
            $curriculum = CandidateCurriculum::updateOrCreate(
                ['registration_id' => $registration->id],
                array_merge($input, [
                    'user_id' => $request->user()->id,
                ])
            );

            TalentWorkflow::event($registration, $request->user()->id, 'cv_form_updated', [
                'cv_id' => ['before' => null, 'after' => $curriculum->id],
            ]);

            return $curriculum;
        });

        return response()->json([
            'data' => $curriculum,
            'message' => 'Currículum Vitae / Solicitud de empleo guardado exitosamente.',
        ]);
    }

    public function staffShow(Request $request, string $id): JsonResponse
    {
        abort_unless($request->user()->can_review_talent, 403, 'Requiere permisos de evaluador.');
        $registration = TalentRegistration::with(['person', 'curriculum'])->findOrFail($id);

        return response()->json([
            'data' => $registration->curriculum,
            'person' => $registration->person,
            'academic' => [
                'faculty' => $registration->faculty,
                'career' => $registration->career,
                'declared_ppa' => $registration->declared_ppa,
            ],
        ]);
    }
}
