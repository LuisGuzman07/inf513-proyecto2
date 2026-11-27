<?php

namespace App\Support;

use App\Models\InstrumentExercise;
use Illuminate\Validation\ValidationException;

/**
 * Response shape handling by exercise type.
 *
 * Hábil keeps its exact scalar contract (a letter A–H or null). Dominós adds an ordered
 * pair of halves, each an integer 0–6 or null. Zero is a real answer; null means "not
 * answered" and is never coerced to zero. Order is preserved: halves are not swapped,
 * normalized or treated as equivalent when inverted.
 */
class EvaluationAnswers
{
    /**
     * Normalize one incoming answer for an exercise.
     *
     * Returns the stored shape: `'A'…'H'|null` for single choice, or
     * `['first' => int|null, 'second' => int|null]` for two halves.
     *
     * @throws ValidationException
     */
    public static function normalize(InstrumentExercise $exercise, mixed $answer, array $options = []): string|array|null
    {
        if (! $exercise->isTwoHalves()) {
            $allowed = $options !== [] ? $options : range('A', 'H');
            if ($answer !== null && ! (is_string($answer) && in_array($answer, $allowed, true))) {
                throw ValidationException::withMessages(['answers' => ['Usá únicamente IDs asignados y una de las opciones habilitadas o null.']]);
            }

            return $answer;
        }

        if ($answer === null) {
            return ['first' => null, 'second' => null];
        }
        // Reject scalars, list-shaped arrays and unknown keys instead of guessing a half.
        if (! is_array($answer) || array_is_list($answer)) {
            throw ValidationException::withMessages(['answers' => ['Cada ejercicio de dos mitades requiere un objeto con «first» y «second».']]);
        }
        $keys = array_keys($answer);
        sort($keys);
        if ($keys !== ['first', 'second']) {
            throw ValidationException::withMessages(['answers' => ['Usá exactamente «first» y «second» como claves de la respuesta.']]);
        }
        $normalized = [];
        foreach (['first', 'second'] as $half) {
            $value = $answer[$half];
            if ($value !== null && ! (is_int($value) && $value >= 0 && $value <= 6)) {
                throw ValidationException::withMessages(['answers' => ['Cada mitad debe ser un entero entre 0 y 6, o null si quedó sin responder.']]);
            }
            $normalized[$half] = $value;
        }

        return $normalized;
    }

    /** Whether a stored answer counts as answered at all (any half present). */
    public static function isAnswered(mixed $answer): bool
    {
        if ($answer === null) {
            return false;
        }
        if (is_array($answer)) {
            return ($answer['first'] ?? null) !== null || ($answer['second'] ?? null) !== null;
        }

        return true;
    }

    /** Whether a stored answer has exactly one half answered. */
    public static function isPartial(mixed $answer): bool
    {
        return is_array($answer)
            && (($answer['first'] ?? null) === null) !== (($answer['second'] ?? null) === null);
    }

    /** Canonical comparison against the source key, order-sensitive by design. */
    public static function matchesSource(InstrumentExercise $exercise, mixed $answer): bool
    {
        if (! $exercise->isTwoHalves()) {
            return $answer === $exercise->correct_option;
        }

        return is_array($answer)
            && ($answer['first'] ?? null) === $exercise->correct_first
            && ($answer['second'] ?? null) === $exercise->correct_second;
    }
}
