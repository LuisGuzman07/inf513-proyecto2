<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

abstract class ServiceRequestFormRequest extends FormRequest
{
    /** Rechaza cualquier campo que no exista en la correspondencia S11-B/S11-C. */
    protected function rejectUnknownFields(Validator $validator, array $rules): void
    {
        foreach (array_diff(array_keys($this->all()), $this->topLevelKeys($rules)) as $field) {
            $validator->errors()->add($field, 'Campo no permitido.');
        }
    }

    /** Rechaza claves anidadas desconocidas, por ejemplo honorarios dentro de la descripción. */
    protected function rejectUnknownNestedFields(Validator $validator, array $rules, string $parent): void
    {
        $value = $this->input($parent);
        if (! is_array($value)) {
            return;
        }
        $allowed = [];
        foreach (array_keys($rules) as $key) {
            if (str_starts_with($key, $parent.'.')) {
                $allowed[] = explode('.', substr($key, strlen($parent) + 1))[0];
            }
        }
        foreach (array_diff(array_keys($value), array_unique($allowed)) as $field) {
            $validator->errors()->add($parent.'.'.$field, 'Campo no permitido.');
        }
    }

    protected function topLevelKeys(array $rules): array
    {
        return array_values(array_unique(array_map(fn (string $key) => explode('.', $key)[0], array_keys($rules))));
    }
}
