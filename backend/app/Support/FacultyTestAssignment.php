<?php

namespace App\Support;

use App\Models\EvaluationAssignment;
use App\Models\InstrumentVersion;
use App\Models\TalentRegistration;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class FacultyTestAssignment
{
    // Instrument exact name constants
    public const DOMINOS = 'Test de Dominós (D-48)';
    public const RAVEN = 'Test de Matrices Progresivas (Raven - 1995)';
    public const HABIL = '¿Es usted muy hábil?';

    public const SOFT_SKILLS = 'Formulario de Evaluación de Habilidades Blandas';
    public const MCCLELLAND = 'Test de Logro y Liderazgo (Motivación de McClelland)';

    public const FP16_A = 'Cuestionario 16 FP — Forma A';
    public const FP16_B = 'Cuestionario 16 FP — Forma B';

    public const OBS_MEMORIA_1 = 'Test de Observación y Memoria - Escena I';
    public const OBS_MEMORIA_2 = 'Test de Observación y Memoria - Escena II';
    public const SIMBOLOS = 'Test de Razonamiento con Símbolos';
    public const SERIES = 'Test de Aptitud Numérica - Series de Números';
    public const ARITMETICO = 'Test de Aptitud Numérica - Razonamiento Aritmético';
    public const OPERACIONES = 'Test de Aptitud Numérica - Operaciones Rápidas';
    public const ESPACIAL = 'Test de Capacidad Perceptiva - Relaciones Espaciales';

    /**
     * Devuelve las bolsas (pools) de pruebas según la facultad.
     *
     * @return array{intelligence: string[], personality: string[], soft_skills: string[], professional: string[]}
     */
    public static function getPoolsForFaculty(?string $facultyId, ?string $facultyName = null): array
    {
        $id = mb_strtolower($facultyId ?? '');
        $name = mb_strtolower($facultyName ?? '');

        // 1. FICCT: Computación, Informática, Telecomunicaciones
        if (str_contains($id, 'ficct') || str_contains($name, 'comput') || str_contains($name, 'telecomunic')) {
            return [
                'intelligence' => [self::RAVEN, self::DOMINOS],
                'personality' => [self::FP16_A, self::FP16_B],
                'soft_skills' => [self::SOFT_SKILLS],
                'professional' => [self::SIMBOLOS, self::SERIES, self::ARITMETICO, self::OPERACIONES],
            ];
        }

        // 2. FCET & Politécnica: Ciencias Exactas, Tecnología e Ingenierías tradicionales
        if (str_contains($id, 'fcet') || str_contains($id, 'fp') || str_contains($name, 'exactas') || str_contains($name, 'politécnica') || str_contains($name, 'politecnica')) {
            return [
                'intelligence' => [self::DOMINOS, self::RAVEN],
                'personality' => [self::FP16_A, self::FP16_B],
                'soft_skills' => [self::SOFT_SKILLS],
                'professional' => [self::ESPACIAL, self::ARITMETICO, self::SERIES, self::SIMBOLOS],
            ];
        }

        // 3. FCEE & FCCASCG: Económicas, Empresariales, Contaduría, Auditoría, Finanzas
        if (str_contains($id, 'fcee') || str_contains($id, 'fccascgf') || str_contains($name, 'económ') || str_contains($name, 'econom') || str_contains($name, 'contab') || str_contains($name, 'auditor')) {
            return [
                'intelligence' => [self::DOMINOS, self::HABIL],
                'personality' => [self::FP16_A, self::FP16_B],
                'soft_skills' => [self::SOFT_SKILLS],
                'professional' => [self::ARITMETICO, self::OPERACIONES, self::SERIES, self::OBS_MEMORIA_1],
            ];
        }

        // 4. FCHDA: Hábitat, Diseño, Arquitectura, Arte
        if (str_contains($id, 'fchda') || str_contains($name, 'hábitat') || str_contains($name, 'habitat') || str_contains($name, 'arquitect') || str_contains($name, 'diseño')) {
            return [
                'intelligence' => [self::RAVEN, self::HABIL],
                'personality' => [self::FP16_A, self::FP16_B],
                'soft_skills' => [self::SOFT_SKILLS],
                'professional' => [self::ESPACIAL, self::OBS_MEMORIA_1, self::OBS_MEMORIA_2, self::SIMBOLOS],
            ];
        }

        // 5. FCJPSRII & Humanidades: Derecho, Relaciones Internacionales, Humanidades, Psicología, Comunicación
        if (str_contains($id, 'fcjpsrrii') || str_contains($id, 'fh') || str_contains($name, 'juríd') || str_contains($name, 'jurid') || str_contains($name, 'derecho') || str_contains($name, 'humanid')) {
            return [
                'intelligence' => [self::HABIL, self::RAVEN],
                'personality' => [self::FP16_A, self::FP16_B],
                'soft_skills' => [self::SOFT_SKILLS],
                'professional' => [self::OBS_MEMORIA_1, self::OBS_MEMORIA_2, self::SIMBOLOS, self::ARITMETICO],
            ];
        }

        // 6. Salud, Farmacia, Veterinaria, Agrícolas
        if (str_contains($id, 'fcsh') || str_contains($id, 'fcfb') || str_contains($id, 'fcv') || str_contains($id, 'fca')
            || str_contains($name, 'salud') || str_contains($name, 'farmac') || str_contains($name, 'veterin') || str_contains($name, 'agrícol') || str_contains($name, 'agricol')) {
            return [
                'intelligence' => [self::DOMINOS, self::RAVEN],
                'personality' => [self::FP16_A, self::FP16_B],
                'soft_skills' => [self::SOFT_SKILLS],
                'professional' => [self::OBS_MEMORIA_1, self::OBS_MEMORIA_2, self::ARITMETICO, self::OPERACIONES],
            ];
        }

        // 7. General / Facultades Integrales Provinciales
        return [
            'intelligence' => [self::DOMINOS, self::HABIL, self::RAVEN],
            'personality' => [self::FP16_A, self::FP16_B],
            'soft_skills' => [self::SOFT_SKILLS],
            'professional' => [self::ARITMETICO, self::OBS_MEMORIA_1, self::SERIES, self::SIMBOLOS],
        ];
    }

    /**
     * Asigna automáticamente las 5 pruebas de inicio al postulante según su facultad.
     *
     * @return EvaluationAssignment[] Lista de asignaciones nuevas creadas
     */
    public static function assignDefaultTestsForRegistration(TalentRegistration $registration): array
    {
        $existing = EvaluationAssignment::with('instrumentVersion')
            ->where('registration_id', $registration->id)
            ->get();

        $existingNames = $existing->pluck('instrumentVersion.name')->filter()->all();

        // Chequear áreas ya cubiertas
        $hasIntelligence = false;
        $hasSoftSkills = false;
        $hasPersonality = false;
        $professionalAssignedCount = 0;

        foreach ($existing as $asg) {
            $inst = $asg->instrumentVersion;
            if (! $inst) {
                continue;
            }
            $area = EvaluationData::classifyArea($inst);
            if ($area === 'inteligencia') {
                $hasIntelligence = true;
            } elseif ($area === 'habilidades_blandas') {
                $hasSoftSkills = true;
            } elseif ($area === 'personalidad') {
                $hasPersonality = true;
            } elseif ($area === 'habilidades_profesionales') {
                $professionalAssignedCount++;
            }
        }

        // Si ya tiene las 4 áreas cubiertas con al menos 2 profesionales (total >= 5), no hay nada que agregar
        if ($hasIntelligence && $hasSoftSkills && $hasPersonality && $professionalAssignedCount >= 2) {
            return [];
        }

        $pools = self::getPoolsForFaculty($registration->faculty_catalog_id, $registration->faculty);
        $testsToAssign = [];

        // 1. Inteligencia (1 al azar de la bolsa de inteligencia)
        if (! $hasIntelligence) {
            $available = array_diff($pools['intelligence'], $existingNames);
            if (! empty($available)) {
                $testsToAssign[] = Arr::random($available);
            }
        }

        // 2. Habilidades Blandas (Formulario universal)
        if (! $hasSoftSkills) {
            $available = array_diff($pools['soft_skills'], $existingNames);
            if (! empty($available)) {
                $testsToAssign[] = Arr::random($available);
            }
        }

        // 3. Personalidad (1 al azar entre Forma A y Forma B)
        if (! $hasPersonality) {
            $available = array_diff($pools['personality'], $existingNames);
            if (! empty($available)) {
                $testsToAssign[] = Arr::random($available);
            }
        }

        // 4. Habilidades Profesionales (completar hasta 2 pruebas sin repetición)
        $neededProf = max(0, 2 - $professionalAssignedCount);
        if ($neededProf > 0) {
            $available = array_values(array_diff($pools['professional'], $existingNames, $testsToAssign));
            shuffle($available);
            $selected = array_slice($available, 0, $neededProf);
            foreach ($selected as $name) {
                $testsToAssign[] = $name;
            }
        }

        if (empty($testsToAssign)) {
            return [];
        }

        // Obtener versiones de instrumentos de la base de datos
        $allVersions = InstrumentVersion::all()->keyBy('name');
        $createdAssignments = [];
        $actorId = $registration->holder_user_id ?? $registration->created_by ?? User::first()?->id ?? 1;

        DB::transaction(function () use ($registration, $testsToAssign, $allVersions, $actorId, &$createdAssignments) {
            foreach ($testsToAssign as $testName) {
                // Búsqueda flexible por nombre
                $instrument = $allVersions->get($testName)
                    ?? $allVersions->first(fn ($iv) => mb_strtolower($iv->name) === mb_strtolower($testName));

                if (! $instrument) {
                    continue;
                }

                // Evitar colisión si por alguna condición de carrera ya existiera
                if (EvaluationAssignment::where('registration_id', $registration->id)->where('instrument_version_id', $instrument->id)->exists()) {
                    continue;
                }

                $answers = $instrument->exercises->mapWithKeys(fn ($exercise) => [
                    $exercise->source_id => $exercise->isTwoHalves() ? ['first' => null, 'second' => null] : null,
                ])->all();

                $assignment = EvaluationAssignment::create([
                    'registration_id' => $registration->id,
                    'instrument_version_id' => $instrument->id,
                    'assigned_by' => $actorId,
                    'version' => 1,
                    'status' => 'assigned',
                    'answers' => $answers,
                ]);

                TalentWorkflow::event($registration, $actorId, 'instrument_auto_assigned', [
                    'assignment_id' => ['before' => null, 'after' => $assignment->id],
                    'instrument_name' => ['before' => null, 'after' => $instrument->name],
                    'classified_area' => ['before' => null, 'after' => EvaluationData::classifyArea($instrument)],
                ]);

                $createdAssignments[] = $assignment;
            }
        });

        return $createdAssignments;
    }
}
