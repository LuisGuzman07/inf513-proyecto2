<?php

namespace App\Support;

use App\Models\EvaluationAssignment;

class EvaluationData
{
    public static function assignment(EvaluationAssignment $assignment, bool $staff = false): array
    {
        $instrument = $assignment->instrumentVersion;
        $conformity = $instrument->conformity;
        $answers = $assignment->answers;
        // A pair counts as saved when either half has a value; zero is a value, null is not.
        $answered = count(array_filter($answers, fn ($answer) => EvaluationAnswers::isAnswered($answer)));
        $partial = count(array_filter($answers, fn ($answer) => EvaluationAnswers::isPartial($answer)));
        $base = '/api/talento/evaluaciones/'.$assignment->id.'/imagenes/';
        $options = $instrument->optionLabels();
        $exerciseImage = fn ($exercise) => $staff
            ? '/api/personal/instrumentos/'.$instrument->id.'/imagenes/reconstructed/'.$exercise->source_id
            : $base.$exercise->source_id;
        $area = self::classifyArea($instrument);
        $areaLabel = self::classifiedAreaLabel($area);

        $data = [
            'id' => $assignment->id,
            'registration_id' => $assignment->registration_id,
            'version' => $assignment->version,
            'status' => $assignment->status,
            'assigned_at' => $assignment->created_at->toISOString(),
            'submitted_at' => $assignment->submitted_at?->toISOString(),
            'answered_count' => $answered,
            'unanswered_count' => $instrument->exercises->count() - $answered,
            'partial_count' => $partial,
            'answer_type' => $instrument->answer_type,
            'scoring_enabled' => $instrument->scoring_enabled,
            'classified_area' => $area,
            'classified_area_label' => $areaLabel,
            'instrument' => [
                'id' => $instrument->id,
                'name' => $instrument->name,
                'version_label' => $instrument->version_label,
                'exercise_count' => $instrument->exercises->count(),
                'answer_type' => $instrument->answer_type,
                'scoring_enabled' => $instrument->scoring_enabled,
                'source_review_state' => $instrument->source_review_state,
                'classified_area' => $area,
                'classified_area_label' => $areaLabel,
                'conformity' => $conformity ? [
                    'reviewer_name' => $conformity->reviewer_name,
                    'statement' => $conformity->statement,
                    'recorded_at' => $conformity->recorded_at->toISOString(),
                    'institutional_approval' => $conformity->institutional_approval,
                ] : null,
            ],
            'instructions' => $instrument->instructions,
            'example_text' => $instrument->example_text,
            'example_image_url' => $instrument->example_image_path === null
                ? null
                : ($staff ? '/api/personal/instrumentos/'.$instrument->id.'/imagenes/example/example' : $base.'example'),
            'exercises' => $instrument->exercises->map(fn ($exercise) => array_merge([
                'id' => $exercise->source_id,
                'number' => $exercise->number,
                'response_type' => $exercise->response_type,
                // Text-only instruments have no figure; the field is explicit rather than a fake asset.
                'image_url' => $exercise->image_path === null ? null : $exerciseImage($exercise),
                'text' => $exercise->texto,
            ], $staff ? [
                // Staff-only: the source key travels with the reviewer view, never with the candidate one.
                'source_answer' => $exercise->sourceKey(),
            ] : [], $exercise->isTwoHalves() ? [
                // Range, not an invented letter list: the UI renders two selects 0–6.
                'halves' => ['min' => 0, 'max' => 6],
            ] : [
                'options' => $options,
                // Letter instruments carry the alternative text next to each label.
                'option_texts' => self::optionTexts($exercise->opciones, $options),
            ]))->all(),
            'answers' => (object) $answers,
        ];
        if ($staff) {
            $data['registration_version'] = $assignment->registration->version;
        }

        if ($assignment->status === 'submitted') {
            if ($assignment->raw_result !== null) {
                $data['raw_result'] = $assignment->raw_result;
            } elseif (self::isMcClelland($instrument)) {
                $data['raw_result'] = self::calculateMcClellandScore($instrument, $assignment->answers);
            } elseif (self::isDominos($instrument)) {
                $data['raw_result'] = self::calculateDominosScore($instrument, $assignment->answers);
            } elseif (self::is16Fp($instrument)) {
                $data['raw_result'] = self::calculate16FpScore($instrument, $assignment->answers);
            } elseif (self::isSoftSkills($instrument)) {
                $data['raw_result'] = self::calculateSoftSkillsScore($instrument, $assignment->answers);
            }
        }

        return $data;
    }

    public static function classifyArea(mixed $instrument): string
    {
        $name = mb_strtolower(is_string($instrument) ? $instrument : ($instrument->name ?? ''));

        if (str_contains($name, '16 fp') || str_contains($name, '16fp')) {
            return 'personalidad';
        }

        if (str_contains($name, 'habilidades blandas') || str_contains($name, 'blandas') || str_contains($name, 'mcclelland') || str_contains($name, 'logro y liderazgo')) {
            return 'habilidades_blandas';
        }

        if (str_contains($name, 'dominó') || str_contains($name, 'dominos') || str_contains($name, 'raven') || str_contains($name, 'matrices progresivas') || str_contains($name, 'muy hábil') || str_contains($name, 'muy habil')) {
            return 'inteligencia';
        }

        return 'habilidades_profesionales';
    }

    public static function classifiedAreaLabel(string $area): string
    {
        return match ($area) {
            'inteligencia' => 'Inteligencia',
            'habilidades_blandas' => 'Habilidades Blandas',
            'personalidad' => 'Personalidad',
            'habilidades_profesionales' => 'Habilidades Profesionales',
            default => 'General',
        };
    }

    public static function isDominos(mixed $instrument): bool
    {
        $name = mb_strtolower($instrument->name ?? '');

        return str_contains($name, 'dominó') || str_contains($name, 'dominos') || (method_exists($instrument, 'isTwoHalves') && $instrument->isTwoHalves());
    }

    public static function is16Fp(mixed $instrument): bool
    {
        $name = mb_strtolower($instrument->name ?? '');

        return str_contains($name, '16 fp') || str_contains($name, '16fp');
    }

    public static function calculateDominosScore(mixed $instrument, mixed $answers): array
    {
        $answers = is_array($answers) ? $answers : (array) $answers;
        $total = $instrument->exercises->count();
        $correct = 0;
        $incorrect = 0;
        $absent = 0;
        $detail = [];

        foreach ($instrument->exercises as $exercise) {
            $ans = $answers[$exercise->source_id] ?? null;
            if ($ans === null || (is_array($ans) && ($ans['first'] === null && $ans['second'] === null))) {
                $absent++;
                $detail[$exercise->source_id] = [
                    'number' => $exercise->number,
                    'status' => 'absent',
                    'given' => null,
                    'correct' => "{$exercise->correct_first}/{$exercise->correct_second}",
                ];
                continue;
            }

            $first = (is_array($ans) && array_key_exists('first', $ans) && $ans['first'] !== null) ? (int) $ans['first'] : null;
            $second = (is_array($ans) && array_key_exists('second', $ans) && $ans['second'] !== null) ? (int) $ans['second'] : null;
            $c1 = $exercise->correct_first !== null ? (int) $exercise->correct_first : null;
            $c2 = $exercise->correct_second !== null ? (int) $exercise->correct_second : null;

            // In dominoes, a tile (A/B) is matching if (first==A && second==B) OR (first==B && second==A)
            $isMatch = ($first !== null && $second !== null && $c1 !== null && $c2 !== null)
                && (($first === $c1 && $second === $c2) || ($first === $c2 && $second === $c1));

            if ($isMatch) {
                $correct++;
                $detail[$exercise->source_id] = [
                    'number' => $exercise->number,
                    'status' => 'correct',
                    'given' => "{$first}/{$second}",
                    'correct' => "{$c1}/{$c2}",
                ];
            } else {
                $incorrect++;
                $detail[$exercise->source_id] = [
                    'number' => $exercise->number,
                    'status' => 'incorrect',
                    'given' => ($first !== null && $second !== null) ? "{$first}/{$second}" : 'parcial',
                    'correct' => "{$c1}/{$c2}",
                ];
            }
        }

        $percentage = $total > 0 ? round(($correct / $total) * 100, 1) : 0;

        return [
            'model' => 'dominos',
            'score' => $correct,
            'max_score' => $total,
            'percentage' => $percentage,
            'correct' => $correct,
            'incorrect' => $incorrect,
            'absent' => $absent,
            'scoring_rule' => 'dominos_porcentaje_aciertos_v1',
            'detail' => $detail,
        ];
    }

    public static function calculate16FpScore(mixed $instrument, mixed $answers): array
    {
        $answers = is_array($answers) ? $answers : (array) $answers;
        $name = mb_strtolower($instrument->name ?? '');
        $isFormB = str_contains($name, 'forma b');

        // Scoring keys per factor
        $keys = [
            'A' => [3 => ['a' => 2, 'b' => 1], 26 => ['b' => 1, 'c' => 2], 27 => ['b' => 1, 'c' => 2], 51 => ['b' => 1, 'c' => 2], 52 => ['a' => 2, 'b' => 1], 76 => ['b' => 1, 'c' => 2], 101 => ['a' => 2, 'b' => 1], 126 => ['a' => 2, 'b' => 1], 151 => ['b' => 1, 'c' => 2], 176 => ['a' => 2, 'b' => 1]],
            'B' => [28 => ['b' => 1], 53 => ['b' => 1], 54 => ['b' => 1], 77 => ['c' => 1], 78 => ['b' => 1], 102 => ['c' => 1], 103 => ['b' => 1], 127 => ['c' => 1], 128 => ['b' => 1], 152 => ['a' => 1], 153 => ['c' => 1], 177 => ['a' => 1], 178 => ['a' => 1]],
            'C' => [4 => ['a' => 2, 'b' => 1], 5 => ['b' => 1, 'c' => 2], 29 => ['b' => 1, 'c' => 2], 30 => ['a' => 2, 'b' => 1], 55 => ['a' => 2, 'b' => 1], 79 => ['b' => 1, 'c' => 2], 80 => ['b' => 1, 'c' => 2], 104 => ['a' => 2, 'b' => 1], 105 => ['a' => 2, 'b' => 1], 129 => ['b' => 1, 'c' => 2], 130 => ['a' => 2, 'b' => 1], 154 => ['b' => 1, 'c' => 2], 179 => ['a' => 2, 'b' => 1]],
            'E' => $isFormB
                ? [6 => ['b' => 1, 'c' => 2], 7 => ['a' => 2, 'b' => 1], 31 => ['b' => 1, 'c' => 2], 32 => ['b' => 1, 'c' => 2], 56 => ['a' => 2, 'b' => 1], 57 => ['b' => 1, 'c' => 2], 81 => ['b' => 1, 'c' => 2], 105 => ['b' => 1, 'c' => 2], 131 => ['a' => 2, 'b' => 1], 155 => ['a' => 2, 'b' => 1], 156 => ['a' => 2, 'b' => 1], 180 => ['a' => 2, 'b' => 1], 181 => ['a' => 2, 'b' => 1]]
                : [6 => ['b' => 1, 'c' => 2], 7 => ['a' => 2, 'b' => 1], 31 => ['b' => 1, 'c' => 2], 32 => ['b' => 1, 'c' => 2], 56 => ['a' => 2, 'b' => 1], 57 => ['b' => 1, 'c' => 2], 81 => ['b' => 1, 'c' => 2], 106 => ['b' => 1, 'c' => 2], 131 => ['a' => 2, 'b' => 1], 155 => ['a' => 2, 'b' => 1], 156 => ['a' => 2, 'b' => 1], 180 => ['a' => 2, 'b' => 1], 181 => ['a' => 2, 'b' => 1]],
            'F' => [8 => ['b' => 1, 'c' => 2], 33 => ['a' => 2, 'b' => 1], 58 => ['a' => 2, 'b' => 1], 82 => ['b' => 1, 'c' => 2], 83 => ['a' => 2, 'b' => 1], 107 => ['b' => 1, 'c' => 2], 108 => ['b' => 1, 'c' => 2], 132 => ['a' => 2, 'b' => 1], 133 => ['a' => 2, 'b' => 1], 157 => ['b' => 1, 'c' => 2], 158 => ['b' => 1, 'c' => 2], 182 => ['a' => 2, 'b' => 1], 183 => ['a' => 2, 'b' => 1]],
            'G' => [9 => ['b' => 1, 'c' => 2], 34 => ['b' => 1, 'c' => 2], 59 => ['b' => 1, 'c' => 2], 84 => ['b' => 1, 'c' => 2], 109 => ['a' => 2, 'b' => 1], 134 => ['a' => 2, 'b' => 1], 159 => ['b' => 1, 'c' => 2], 160 => ['a' => 2, 'b' => 1], 184 => ['a' => 2, 'b' => 1], 185 => ['a' => 2, 'b' => 1]],
            'H' => $isFormB
                ? [9 => ['a' => 2, 'b' => 1], 35 => ['b' => 1, 'c' => 2], 36 => ['a' => 2, 'b' => 1], 60 => ['b' => 1, 'c' => 2], 61 => ['b' => 1, 'c' => 2], 85 => ['b' => 1, 'c' => 2], 86 => ['b' => 1, 'c' => 2], 110 => ['a' => 2, 'b' => 1], 111 => ['a' => 2, 'b' => 1], 135 => ['a' => 2, 'b' => 1], 136 => ['a' => 2, 'b' => 1], 161 => ['b' => 1, 'c' => 2], 186 => ['a' => 2, 'b' => 1]]
                : [10 => ['a' => 2, 'b' => 1], 35 => ['b' => 1, 'c' => 2], 36 => ['a' => 2, 'b' => 1], 60 => ['b' => 1, 'c' => 2], 61 => ['b' => 1, 'c' => 2], 85 => ['b' => 1, 'c' => 2], 86 => ['b' => 1, 'c' => 2], 110 => ['a' => 2, 'b' => 1], 111 => ['a' => 2, 'b' => 1], 135 => ['a' => 2, 'b' => 1], 136 => ['a' => 2, 'b' => 1], 161 => ['b' => 1, 'c' => 2], 186 => ['a' => 2, 'b' => 1]],
            'I' => [11 => ['b' => 1, 'c' => 2], 12 => ['a' => 2, 'b' => 1], 37 => ['a' => 2, 'b' => 1], 62 => ['b' => 1, 'c' => 2], 87 => ['b' => 1, 'c' => 2], 112 => ['a' => 2, 'b' => 1], 137 => ['b' => 1, 'c' => 2], 138 => ['a' => 2, 'b' => 1], 162 => ['b' => 1, 'c' => 2], 163 => ['a' => 2, 'b' => 1]],
            'L' => [13 => ['b' => 1, 'c' => 2], 38 => ['a' => 2, 'b' => 1], 63 => ['b' => 1, 'c' => 2], 64 => ['b' => 1, 'c' => 2], 88 => ['a' => 2, 'b' => 1], 89 => ['b' => 1, 'c' => 2], 113 => ['a' => 2, 'b' => 1], 114 => ['a' => 2, 'b' => 1], 139 => ['b' => 1, 'c' => 2], 164 => ['a' => 2, 'b' => 1]],
            'M' => $isFormB
                ? [14 => ['b' => 1, 'c' => 2], 15 => ['b' => 1, 'c' => 2], 39 => ['a' => 2, 'b' => 1], 40 => ['a' => 2, 'b' => 1], 65 => ['a' => 2, 'b' => 1], 93 => ['b' => 1, 'c' => 2], 91 => ['a' => 2, 'b' => 1], 115 => ['a' => 2, 'b' => 1], 116 => ['a' => 2, 'b' => 1], 140 => ['a' => 2, 'b' => 1], 141 => ['b' => 1, 'c' => 2], 165 => ['b' => 1, 'c' => 2], 166 => ['b' => 1, 'c' => 2]]
                : [14 => ['b' => 1, 'c' => 2], 15 => ['b' => 1, 'c' => 2], 39 => ['a' => 2, 'b' => 1], 40 => ['a' => 2, 'b' => 1], 65 => ['a' => 2, 'b' => 1], 90 => ['b' => 1, 'c' => 2], 91 => ['a' => 2, 'b' => 1], 115 => ['a' => 2, 'b' => 1], 116 => ['a' => 2, 'b' => 1], 140 => ['a' => 2, 'b' => 1], 141 => ['b' => 1, 'c' => 2], 165 => ['b' => 1, 'c' => 2], 166 => ['b' => 1, 'c' => 2]],
            'N' => [16 => ['b' => 1, 'c' => 2], 17 => ['a' => 2, 'b' => 1], 41 => ['b' => 1, 'c' => 2], 42 => ['a' => 2, 'b' => 1], 66 => ['b' => 1, 'c' => 2], 67 => ['b' => 1, 'c' => 2], 92 => ['b' => 1, 'c' => 2], 117 => ['a' => 2, 'b' => 1], 142 => ['a' => 2, 'b' => 1], 167 => ['a' => 2, 'b' => 1]],
            'O' => [18 => ['a' => 2, 'b' => 1], 19 => ['b' => 1, 'c' => 2], 43 => ['a' => 2, 'b' => 1], 44 => ['b' => 1, 'c' => 2], 68 => ['b' => 1, 'c' => 2], 69 => ['a' => 2, 'b' => 1], 93 => ['b' => 1, 'c' => 2], 94 => ['a' => 2, 'b' => 1], 118 => ['a' => 2, 'b' => 1], 119 => ['a' => 2, 'b' => 1], 143 => ['a' => 2, 'b' => 1], 144 => ['b' => 1, 'c' => 2], 168 => ['b' => 1, 'c' => 2]],
            'Q1' => [20 => ['a' => 2, 'b' => 1], 21 => ['b' => 1, 'c' => 2], 45 => ['b' => 1, 'c' => 2], 46 => ['a' => 2, 'b' => 1], 70 => ['a' => 2, 'b' => 1], 95 => ['b' => 1, 'c' => 2], 120 => ['b' => 1, 'c' => 2], 145 => ['a' => 2, 'b' => 1], 169 => ['a' => 2, 'b' => 1], 170 => ['b' => 1, 'c' => 2]],
            'Q2' => [22 => ['b' => 1, 'c' => 2], 47 => ['a' => 2, 'b' => 1], 71 => ['a' => 2, 'b' => 1], 72 => ['a' => 2, 'b' => 1], 96 => ['b' => 1, 'c' => 2], 97 => ['b' => 1, 'c' => 2], 121 => ['b' => 1, 'c' => 2], 122 => ['b' => 1, 'c' => 2], 146 => ['a' => 2, 'b' => 1], 171 => ['a' => 2, 'b' => 1]],
            'Q3' => [23 => ['b' => 1, 'c' => 2], 24 => ['b' => 1, 'c' => 2], 48 => ['a' => 2, 'b' => 1], 73 => ['a' => 2, 'b' => 1], 98 => ['a' => 2, 'b' => 1], 123 => ['b' => 1, 'c' => 2], 147 => ['b' => 1, 'c' => 2], 148 => ['a' => 2, 'b' => 1], 172 => ['b' => 1, 'c' => 2], 173 => ['a' => 2, 'b' => 1]],
            'Q4' => [25 => ['b' => 1, 'c' => 2], 49 => ['a' => 2, 'b' => 1], 50 => ['a' => 2, 'b' => 1], 74 => ['a' => 2, 'b' => 1], 75 => ['b' => 1, 'c' => 2], 99 => ['a' => 2, 'b' => 1], 100 => ['b' => 1, 'c' => 2], 124 => ['a' => 2, 'b' => 1], 125 => ['b' => 1, 'c' => 2], 149 => ['a' => 2, 'b' => 1], 150 => ['b' => 1, 'c' => 2], 174 => ['a' => 2, 'b' => 1], 175 => ['b' => 1, 'c' => 2]],
        ];

        // Cuadro 7.c Baremo conversion to Estenes (1 to 10)
        $stenTable = [
            'A'  => [1 => [0, 3], 2 => [4, 5], 3 => [6, 6], 4 => [7, 8], 5 => [9, 9], 6 => [10, 11], 7 => [12, 12], 8 => [13, 14], 9 => [15, 15], 10 => [16, 20]],
            'B'  => [1 => [0, 4], 2 => [5, 5], 3 => [6, 6], 4 => [null, null], 5 => [7, 7], 6 => [8, 8], 7 => [9, 9], 8 => [10, 10], 9 => [11, 11], 10 => [12, 13]],
            'C'  => [1 => [0, 8], 2 => [9, 10], 3 => [11, 12], 4 => [13, 14], 5 => [15, 16], 6 => [17, 18], 7 => [19, 20], 8 => [21, 22], 9 => [23, 24], 10 => [25, 26]],
            'E'  => [1 => [0, 3], 2 => [4, 6], 3 => [7, 8], 4 => [9, 10], 5 => [11, 13], 6 => [14, 15], 7 => [16, 17], 8 => [18, 20], 9 => [21, 22], 10 => [23, 26]],
            'F'  => [1 => [0, 3], 2 => [4, 5], 3 => [6, 7], 4 => [8, 9], 5 => [10, 12], 6 => [13, 14], 7 => [15, 16], 8 => [17, 18], 9 => [19, 21], 10 => [22, 26]],
            'G'  => [1 => [0, 5], 2 => [6, 6], 3 => [7, 8], 4 => [9, 10], 5 => [11, 12], 6 => [13, 13], 7 => [14, 15], 8 => [16, 17], 9 => [18, 19], 10 => [20, 20]],
            'H'  => [1 => [0, 1], 2 => [2, 4], 3 => [5, 7], 4 => [8, 9], 5 => [10, 12], 6 => [13, 15], 7 => [16, 17], 8 => [18, 20], 9 => [21, 22], 10 => [23, 26]],
            'I'  => [1 => [0, 2], 2 => [3, 4], 3 => [5, 6], 4 => [7, 8], 5 => [9, 10], 6 => [11, 12], 7 => [13, 14], 8 => [15, 15], 9 => [16, 17], 10 => [18, 20]],
            'L'  => [1 => [0, 5], 2 => [6, 7], 3 => [8, 8], 4 => [9, 10], 5 => [11, 11], 6 => [12, 13], 7 => [14, 14], 8 => [15, 16], 9 => [17, 17], 10 => [18, 20]],
            'M'  => [1 => [0, 6], 2 => [7, 8], 3 => [9, 9], 4 => [10, 11], 5 => [12, 13], 6 => [14, 15], 7 => [16, 17], 8 => [18, 18], 9 => [19, 20], 10 => [21, 26]],
            'N'  => [1 => [0, 5], 2 => [6, 7], 3 => [8, 8], 4 => [9, 9], 5 => [10, 11], 6 => [12, 12], 7 => [13, 14], 8 => [15, 15], 9 => [16, 16], 10 => [17, 20]],
            'O'  => [1 => [0, 3], 2 => [4, 5], 3 => [6, 7], 4 => [8, 9], 5 => [10, 11], 6 => [12, 13], 7 => [14, 15], 8 => [16, 17], 9 => [18, 18], 10 => [19, 26]],
            'Q1' => [1 => [0, 5], 2 => [6, 6], 3 => [7, 8], 4 => [9, 9], 5 => [10, 10], 6 => [11, 12], 7 => [13, 13], 8 => [14, 14], 9 => [15, 16], 10 => [17, 20]],
            'Q2' => [1 => [0, 5], 2 => [6, 7], 3 => [8, 9], 4 => [10, 10], 5 => [11, 12], 6 => [13, 13], 7 => [14, 15], 8 => [16, 16], 9 => [17, 18], 10 => [19, 20]],
            'Q3' => [1 => [0, 3], 2 => [4, 5], 3 => [6, 7], 4 => [8, 8], 5 => [9, 10], 6 => [11, 12], 7 => [13, 13], 8 => [14, 15], 9 => [16, 17], 10 => [18, 20]],
            'Q4' => [1 => [0, 1], 2 => [2, 4], 3 => [5, 6], 4 => [7, 9], 5 => [10, 11], 6 => [12, 14], 7 => [15, 16], 8 => [17, 19], 9 => [20, 21], 10 => [22, 26]],
        ];

        // Factor metadata
        $factorMeta = [
            'A' => ['name' => 'Afabilidad / Expresividad', 'low' => 'Reservado, formal, distante', 'high' => 'Afable, cálido, participativo', 'max' => 20],
            'B' => ['name' => 'Razonamiento', 'low' => 'Pensamiento concreto', 'high' => 'Pensamiento abstracto, analítico', 'max' => 13],
            'C' => ['name' => 'Estabilidad Emocional', 'low' => 'Reactivo, afectado por emociones', 'high' => 'Emocionalmente estable, maduro', 'max' => 26],
            'E' => ['name' => 'Dominancia', 'low' => 'Cooperativo, sumiso, condescendiente', 'high' => 'Asertivo, competitivo, dominante', 'max' => 26],
            'F' => ['name' => 'Animación / Impulsividad', 'low' => 'Serio, sobrio, prudente', 'high' => 'Entusiasta, espontáneo, animado', 'max' => 26],
            'G' => ['name' => 'Atención a Normas', 'low' => 'Inconforme, flexible con reglas', 'high' => 'Concienzudo, formal, cumplidor', 'max' => 20],
            'H' => ['name' => 'Atrevimiento', 'low' => 'Tímido, cauteloso, susceptible', 'high' => 'Audaz, emprendedor, desinhibido', 'max' => 26],
            'I' => ['name' => 'Sensibilidad', 'low' => 'Objetivo, práctico, insensible', 'high' => 'Sensible, empático, intuitivo', 'max' => 20],
            'L' => ['name' => 'Vigilancia / Suspicacia', 'low' => 'Confiado, adaptable, tolerante', 'high' => 'Suspicaz, escéptico, precavido', 'max' => 20],
            'M' => ['name' => 'Abstracción', 'low' => 'Práctico, orientado a la realidad', 'high' => 'Imaginativo, conceptual, creativo', 'max' => 26],
            'N' => ['name' => 'Privacidad / Astucia', 'low' => 'Abierto, ingenuo, espontáneo', 'high' => 'Discreto, reservado, diplomático', 'max' => 20],
            'O' => ['name' => 'Aprensión', 'low' => 'Seguro, tranquilo, complacido', 'high' => 'Preocupado, autocrítico, inseguro', 'max' => 26],
            'Q1' => ['name' => 'Apertura al Cambio', 'low' => 'Tradicional, apegado a lo familiar', 'high' => 'Innovador, experimental, crítico', 'max' => 20],
            'Q2' => ['name' => 'Autosuficiencia', 'low' => 'Afiliativo, dependiente del grupo', 'high' => 'Autónomo, autosuficiente, solitario', 'max' => 20],
            'Q3' => ['name' => 'Perfeccionismo', 'low' => 'Flexible, tolera el desorden', 'high' => 'Organizado, disciplinado, perfeccionista', 'max' => 20],
            'Q4' => ['name' => 'Tensión', 'low' => 'Relajado, paciente, pausado', 'high' => 'Tenso, enérgico, impaciente', 'max' => 26],
        ];

        // Map exercise by number
        $exByNumber = [];
        foreach ($instrument->exercises as $ex) {
            $exByNumber[$ex->number] = $ex->source_id;
        }

        // Calculate raw score for each factor
        $factorResults = [];
        $bCount = 0;
        $absentCount = 0;

        foreach ($keys as $factor => $itemKeys) {
            $rawScore = 0;
            foreach ($itemKeys as $num => $keyValues) {
                $sourceId = $exByNumber[$num] ?? sprintf('fp16-%03d', $num);
                $ans = $answers[$sourceId] ?? null;
                $opt = $ans ? strtolower(trim((string) $ans)) : null;

                if ($opt === 'b') {
                    $bCount++;
                }
                if ($opt === null) {
                    $absentCount++;
                }

                if ($opt && isset($keyValues[$opt])) {
                    $rawScore += $keyValues[$opt];
                }
            }

            // Convert to Sten
            $sten = 5; // default midpoint
            if (isset($stenTable[$factor])) {
                foreach ($stenTable[$factor] as $sVal => $range) {
                    [$min, $max] = $range;
                    if ($min !== null && $max !== null && $rawScore >= $min && $rawScore <= $max) {
                        $sten = $sVal;
                        break;
                    }
                }
                if ($sten === 5 && $rawScore > ($factorMeta[$factor]['max'] ?? 20)) {
                    $sten = 10;
                }
            }

            // Classification
            $classification = match (true) {
                $sten <= 3 => 'Bajo',
                $sten === 4 => 'Medio-Bajo',
                $sten >= 5 && $sten <= 6 => 'Promedio',
                $sten === 7 => 'Medio-Alto',
                default => 'Alto',
            };

            $meta = $factorMeta[$factor];
            $factorResults[$factor] = [
                'factor' => $factor,
                'name' => $meta['name'],
                'raw_score' => $rawScore,
                'max_score' => $meta['max'],
                'sten' => $sten,
                'classification' => $classification,
                'low_pole' => $meta['low'],
                'high_pole' => $meta['high'],
            ];
        }

        // Validity checks
        $c1 = $answers[$exByNumber[1] ?? 'fp16-001'] ?? null;
        $c2 = $answers[$exByNumber[2] ?? 'fp16-002'] ?? null;
        $c187 = $answers[$exByNumber[187] ?? 'fp16-187'] ?? null;
        $bPercentage = round(($bCount / 184) * 100, 1);

        return [
            'model' => '16fp',
            'form' => $isFormB ? 'Forma B' : 'Forma A',
            'factors' => $factorResults,
            'validity' => [
                'control_items' => [
                    1 => $c1,
                    2 => $c2,
                    187 => $c187,
                ],
                'indecision_count' => $bCount,
                'indecision_percentage' => $bPercentage,
                'omissions_count' => $absentCount,
                'indecision_alert' => $bPercentage > 25 ? 'Alto índice de respuestas intermedias/duda' : null,
            ],
            'scoring_rule' => '16fp_cuadro_7c_normas_adultos_v1',
        ];
    }

    public static function isMcClelland(mixed $instrument): bool
    {
        $name = mb_strtolower($instrument->name ?? '');

        return str_contains($name, 'mcclelland') || str_contains($name, 'logro y liderazgo');
    }

    public static function calculateMcClellandScore(mixed $instrument, mixed $answers): array
    {
        $answers = is_array($answers) ? $answers : (array) $answers;
        $logroItems = [1, 4, 7, 10, 13];
        $poderItems = [2, 5, 8, 11, 14];
        $afiliacionItems = [3, 6, 9, 12, 15];

        $logroScore = 0;
        $poderScore = 0;
        $afiliacionScore = 0;

        foreach ($instrument->exercises as $exercise) {
            $ans = $answers[$exercise->source_id] ?? null;
            $val = is_numeric($ans) ? (int) $ans : 0;
            if (in_array($exercise->number, $logroItems, true)) {
                $logroScore += $val;
            } elseif (in_array($exercise->number, $poderItems, true)) {
                $poderScore += $val;
            } elseif (in_array($exercise->number, $afiliacionItems, true)) {
                $afiliacionScore += $val;
            }
        }

        $scores = [
            'Logro' => $logroScore,
            'Afiliación' => $afiliacionScore,
            'Poder' => $poderScore,
        ];
        $maxScore = max($scores);
        $dominants = [];
        foreach ($scores as $dim => $score) {
            if ($score === $maxScore && $score > 0) {
                $dominants[] = $dim;
            }
        }

        return [
            'model' => 'mcclelland',
            'dimensions' => [
                'logro' => [
                    'key' => 'logro',
                    'name' => 'Motivación de Logro',
                    'score' => $logroScore,
                    'min' => 5,
                    'max' => 25,
                    'description' => 'Búsqueda de excelencia personal, superación de retos difíciles y orientación a metas exigentes con retroalimentación continua.',
                ],
                'afiliacion' => [
                    'key' => 'afiliacion',
                    'name' => 'Motivación de Afiliación',
                    'score' => $afiliacionScore,
                    'min' => 5,
                    'max' => 25,
                    'description' => 'Preferencia por relaciones interpersonales cercanas, cooperación armónica, empatía y sentido de pertenencia a equipos.',
                ],
                'poder' => [
                    'key' => 'poder',
                    'name' => 'Motivación de Poder',
                    'score' => $poderScore,
                    'min' => 5,
                    'max' => 25,
                    'description' => 'Liderazgo, competencia, deseo de influir sobre personas y orientar la toma de decisiones organizacionales.',
                ],
            ],
            'dominant' => count($dominants) > 0 ? implode(' y ', $dominants) : 'Equilibrado',
            'dominant_dimensions' => $dominants,
            'highest_score' => $maxScore,
        ];
    }

    public static function isSoftSkills(mixed $instrument): bool
    {
        $name = mb_strtolower($instrument->name ?? '');

        return str_contains($name, 'habilidades blandas') || str_contains($name, 'blandas');
    }

    public static function calculateSoftSkillsScore(mixed $instrument, mixed $answers): array
    {
        $answers = is_array($answers) ? $answers : (array) $answers;

        $dimensions = [
            'comunicacion' => [
                'name' => 'Habilidades Comunicativas',
                'items' => [1, 2, 3, 4, 5, 6],
            ],
            'trabajo_equipo' => [
                'name' => 'Capacidad para el Trabajo en Equipo',
                'items' => [7, 8, 9, 10],
            ],
            'manejo_estres' => [
                'name' => 'Manejo del Estrés y Conflictos',
                'items' => [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            ],
            'responsabilidad' => [
                'name' => 'Evaluación de la Responsabilidad',
                'items' => [21, 22, 23, 24],
            ],
            'aprendizaje' => [
                'name' => 'Búsqueda de Información y Aprendizaje',
                'items' => [25, 26, 27, 28],
            ],
        ];

        $exMap = [];
        foreach ($instrument->exercises as $ex) {
            $exMap[$ex->number] = $ex;
        }

        $normalizeVal = function ($ans) {
            if ($ans === null) return null;
            if (is_numeric($ans)) {
                $num = (int) $ans;
                return ($num >= 1 && $num <= 5) ? $num : null;
            }
            if (is_string($ans)) {
                $letterMap = ['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5];
                $low = strtolower(trim($ans));
                return $letterMap[$low] ?? null;
            }
            return null;
        };

        $itemResults = [];
        $totalSum = 0;
        $answeredCount = 0;

        foreach ($instrument->exercises as $ex) {
            $ans = $answers[$ex->source_id] ?? null;
            $val = $normalizeVal($ans);

            $dimName = 'General';
            foreach ($dimensions as $dMeta) {
                if (in_array($ex->number, $dMeta['items'], true)) {
                    $dimName = $dMeta['name'];
                    break;
                }
            }

            if ($val !== null) {
                $totalSum += $val;
                $answeredCount++;
            }

            $itemResults[] = [
                'number' => $ex->number,
                'source_id' => $ex->source_id,
                'text' => $ex->texto,
                'dimension' => $dimName,
                'score' => $val,
            ];
        }

        usort($itemResults, fn ($a, $b) => $a['number'] <=> $b['number']);

        $dimSummaries = [];
        foreach ($dimensions as $key => $meta) {
            $sum = 0;
            $cnt = 0;
            foreach ($meta['items'] as $num) {
                $ex = $exMap[$num] ?? null;
                if (! $ex) continue;
                $val = $normalizeVal($answers[$ex->source_id] ?? null);
                if ($val !== null) {
                    $sum += $val;
                    $cnt++;
                }
            }
            $maxScore = count($meta['items']) * 5;
            $avg = $cnt > 0 ? round($sum / $cnt, 2) : 0;
            $pct = $maxScore > 0 ? round(($sum / $maxScore) * 100, 1) : 0;

            $dimSummaries[$key] = [
                'key' => $key,
                'name' => $meta['name'],
                'items_count' => count($meta['items']),
                'answered_count' => $cnt,
                'score_sum' => $sum,
                'max_score' => $maxScore,
                'average' => $avg,
                'percentage' => $pct,
            ];
        }

        $totalExercises = $instrument->exercises->count() ?: 28;
        $globalAverage = $answeredCount > 0 ? round($totalSum / $answeredCount, 2) : 0;
        $globalPercentage = round(($totalSum / ($totalExercises * 5)) * 100, 1);

        return [
            'model' => 'habilidades_blandas',
            'global_average' => $globalAverage,
            'global_percentage' => $globalPercentage,
            'total_score' => $totalSum,
            'max_total_score' => $totalExercises * 5,
            'answered_count' => $answeredCount,
            'total_items' => $totalExercises,
            'dimensions' => $dimSummaries,
            'items' => $itemResults,
            'scoring_rule' => 'habilidades_blandas_likert_5_v1',
        ];
    }

    /**
     * Map option labels (A, B, C…) to the source alternative text (a, b, c…), if the item has it.
     *
     * @return array<string, string>|null
     */
    private static function optionTexts(mixed $opciones, array $labels): ?array
    {
        if (! is_array($opciones) || $opciones === []) {
            return null;
        }
        $texts = [];
        foreach (array_values($labels) as $index => $label) {
            $key = chr(97 + $index); // a, b, c…
            if (! isset($opciones[$key]) || ! is_string($opciones[$key])) {
                return null;
            }
            $texts[$label] = $opciones[$key];
        }

        return $texts;
    }
}
