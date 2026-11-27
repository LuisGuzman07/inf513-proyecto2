<?php

namespace App\Http\Controllers;

use App\Http\Resources\RegistrationResource;
use App\Models\Person;
use App\Models\RegistrationDocument;
use App\Models\TalentRegistration;
use App\Support\TalentWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TalentSubmissionController extends Controller
{
    public function store(Request $request, string $id): RegistrationResource
    {
        $input = TalentWorkflow::input($request, ['version' => ['required', 'integer', 'min:1']]);
        $registration = DB::transaction(function () use ($request, $id, $input) {
            $registration = TalentRegistration::where('holder_user_id', $request->user()->id)->lockForUpdate()->findOrFail($id);
            Gate::authorize('update', $registration);
            TalentWorkflow::editable($registration);
            TalentWorkflow::version($registration, (int) $input['version']);
            $errors = [];
            foreach (Person::FIELDS as $field) {
                if ($registration->person->$field === null || (is_string($registration->person->$field) && trim($registration->person->$field) === '')) {
                    $errors[$field] = ['Campo requerido para enviar.'];
                }
            }
            foreach (['career', 'declared_ppa', 'interest_area'] as $field) {
                if (trim($registration->$field ?? '') === '') {
                    $errors[$field] = ['Campo requerido para enviar.'];
                }
            }
            foreach (TalentRegistration::MOBILITY as $field) {
                if ($registration->{'mobility_'.$field} === null) {
                    $errors['mobility.'.$field] = ['Respuesta sí/no requerida para enviar.'];
                }
            }
            foreach (RegistrationDocument::REQUIRED as $type) {
                $document = $registration->documents()->where('type', $type)->orderByDesc('version')->first();
                if (! $document || ! Storage::disk('talent_private')->exists($document->path)) {
                    $errors['documents.'.$type] = ['Documento requerido para enviar.'];
                }
            }

            // Validación estricta del Formulario de Currículum Vitae
            $cv = $registration->curriculum;
            if (! $cv) {
                $errors['curriculum'] = ['Debe completar y guardar el Formulario de Currículum Vitae antes de enviar.'];
            } else {
                if (trim($cv->target_position ?? '') === '') {
                    $errors['curriculum.target_position'] = ['El puesto al que postula es requerido.'];
                }
                if (trim($cv->expected_salary ?? '') === '') {
                    $errors['curriculum.expected_salary'] = ['La pretensión salarial es requerida.'];
                }
                if (trim($cv->identity_card ?? '') === '') {
                    $errors['curriculum.identity_card'] = ['La cédula de identidad es requerida.'];
                }
                if (trim($cv->application_date ?? '') === '') {
                    $errors['curriculum.application_date'] = ['La fecha de solicitud es requerida.'];
                }
                if (trim($cv->contact_phone ?? '') === '') {
                    $errors['curriculum.contact_phone'] = ['El teléfono de contacto es requerido.'];
                }
                if (trim($cv->contact_email ?? '') === '') {
                    $errors['curriculum.contact_email'] = ['El correo electrónico es requerido.'];
                }
                if (trim($cv->address ?? '') === '') {
                    $errors['curriculum.address'] = ['La dirección de domicilio es requerida.'];
                }
                if (trim($cv->incorporation_availability ?? '') === '') {
                    $errors['curriculum.incorporation_availability'] = ['La disponibilidad de incorporación es requerida.'];
                }
                $eduLevels = is_array($cv->education_levels) ? $cv->education_levels : [];
                $hasEdu = false;
                foreach ($eduLevels as $edu) {
                    if (trim($edu['career'] ?? '') !== '' && trim($edu['institution'] ?? '') !== '' && trim($edu['status'] ?? '') !== '') {
                        $hasEdu = true;
                        break;
                    }
                }
                if (! $hasEdu) {
                    $errors['curriculum.education_levels'] = ['Debe registrar al menos un nivel académico (carrera, institución y estado).'];
                }
                if (trim($cv->technical_knowledge ?? '') === '') {
                    $errors['curriculum.technical_knowledge'] = ['Los conocimientos técnicos son requeridos.'];
                }
                if (trim($cv->languages ?? '') === '') {
                    $errors['curriculum.languages'] = ['Los idiomas y nivel son requeridos.'];
                }
                $jobs = is_array($cv->work_experiences) ? $cv->work_experiences : [];
                if (empty($jobs)) {
                    $errors['curriculum.work_experiences'] = ['Debe registrar al menos un empleo en el historial laboral.'];
                } else {
                    foreach ($jobs as $idx => $job) {
                        $jobNum = $idx + 1;
                        foreach ([
                            'company' => 'empresa',
                            'position' => 'cargo ocupado',
                            'period' => 'periodo',
                            'supervisor' => 'jefe directo',
                            'reference_phone' => 'teléfono de referencia',
                            'leaving_reason' => 'motivo de salida',
                            'achievements' => 'funciones y logros',
                        ] as $k => $lbl) {
                            if (trim($job[$k] ?? '') === '') {
                                $errors["curriculum.empleo_{$jobNum}_{$k}"] = ["En Empleo {$jobNum}, el campo {$lbl} es requerido."];
                            }
                        }
                    }
                }
                if (trim($cv->work_modality ?? '') === '') {
                    $errors['curriculum.work_modality'] = ['La modalidad de trabajo preferida es requerida.'];
                }
                if (trim($cv->schedule_availability ?? '') === '') {
                    $errors['curriculum.schedule_availability'] = ['La disponibilidad de horario es requerida.'];
                }
                if (trim($cv->travel_availability ?? '') === '') {
                    $errors['curriculum.travel_availability'] = ['La disponibilidad para viajar es requerida.'];
                }
                if (trim($cv->driver_license ?? '') === '') {
                    $errors['curriculum.driver_license'] = ['El dato de licencia de conducir es requerido.'];
                }
                if (trim($cv->relatives_in_company ?? '') === '') {
                    $errors['curriculum.relatives_in_company'] = ['El campo de familiares en la empresa es requerido.'];
                }
                if (! $cv->declaration_accepted) {
                    $errors['curriculum.declaration_accepted'] = ['Debe aceptar la declaración jurada de veracidad para enviar.'];
                }
            }
            if ($errors !== []) {
                throw ValidationException::withMessages($errors);
            }
            $before = $registration->status;
            $registration->status = 'submitted';
            $registration->submitted_at = now();
            TalentWorkflow::event($registration, $request->user()->id, 'submitted', ['status' => ['before' => $before, 'after' => 'submitted']]);

            return $registration;
        });

        return new RegistrationResource($registration);
    }
}
