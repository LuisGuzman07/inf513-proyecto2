<?php

namespace App\Support;

use App\Models\JobDescription;
use App\Models\ServiceRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Reglas de la correspondencia S11-B/S11-C. Los nombres de campo son los de la tabla
 * fuente→campo del contrato: no se agrega ningún campo fuera de ella.
 */
final class ServiceRequestRules
{
    public static function store(): array
    {
        return self::request() + self::description('description.') + [
            'description' => ['required', 'array'],
            'confirmed' => ['required', 'accepted'],
        ];
    }

    /**
     * Alta autenticada (S2.2.2): mismos campos que el alta pública, sin la confirmación
     * explícita —que pertenece al formulario sin cuenta— y con la empresa derivada del actor.
     */
    public static function authenticatedStore(): array
    {
        return self::request() + self::description('description.') + [
            'description' => ['required', 'array'],
            'company_id' => ['sometimes', 'uuid', Rule::exists('companies', 'id')->where('status', 'active')],
        ];
    }

    public static function update(): array
    {
        return self::request('sometimes') + [
            'version' => ['required', 'integer', 'min:1'],
            // `linked` sólo lo asigna la vinculación administrativa a una empresa.
            'status' => ['sometimes', 'string', Rule::in(ServiceRequest::UPDATABLE_STATUSES)],
        ];
    }

    public static function descriptionUpdate(): array
    {
        return self::description('', 'sometimes') + ['version' => ['required', 'integer', 'min:1']];
    }

    public static function candidate(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:200'],
            'contact_email' => ['sometimes', 'nullable', 'string', 'email:rfc', 'max:254'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }

    public static function candidateUpdate(): array
    {
        return [
            'full_name' => ['sometimes', 'string', 'max:200'],
            'contact_email' => ['sometimes', 'nullable', 'string', 'email:rfc', 'max:254'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'version' => ['required', 'integer', 'min:1'],
        ];
    }

    /** Campos de S11-B §1–§4. */
    public static function request(string $mode = 'required'): array
    {
        return [
            'company_name' => [$mode, 'string', 'max:200'],
            'contact_name' => [$mode, 'string', 'max:200'],
            'contact_position' => [$mode, 'string', 'max:200'],
            'contact_area' => [$mode, 'string', 'max:200'],
            'contact_email' => [$mode, 'string', 'email:rfc', 'max:254'],
            'contact_phone' => [$mode, 'string', 'max:50'],
            'position_title' => [$mode, 'string', 'max:200'],
            'vacancies' => [$mode, 'integer', 'min:1'],
            'modality' => [$mode, Rule::in(ServiceRequest::MODALITIES)],
            'workday' => [$mode, Rule::in(ServiceRequest::WORKDAYS)],
            'location' => [$mode, 'string', 'max:200'],
            'salary_currency' => ['sometimes', 'nullable', 'string', 'size:3'],
            'salary_min' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'salary_max' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'payment_scheme' => [$mode, Rule::in(ServiceRequest::PAYMENT_SCHEMES)],
            'benefits' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'required_education' => [$mode, 'string', 'max:200'],
            'required_knowledge' => [$mode, 'string', 'max:2000'],
            'required_experience' => [$mode, 'string', 'max:200'],
            'languages' => ['sometimes', 'array', 'max:6'],
            'languages.*.language' => ['required', 'string', 'max:100'],
            'languages.*.level' => ['required', Rule::in(ServiceRequest::LANGUAGE_LEVELS)],
            'deadline' => [$mode, 'date_format:Y-m-d', 'after_or_equal:today'],
        ];
    }

    /** Campos de S11-C; con $prefix se anidan bajo «description». */
    public static function description(string $prefix = '', string $mode = 'required'): array
    {
        return [
            $prefix.'position_title' => ['sometimes', 'nullable', 'string', 'max:200'],
            $prefix.'area' => [$mode, 'string', 'max:200'],
            $prefix.'reports_to' => [$mode, 'string', 'max:200'],
            $prefix.'headcount' => [$mode, 'string', 'max:100'],
            $prefix.'objective' => [$mode, 'string', 'max:4000'],
            // Una entrada evita descripciones vacías; no representa un mínimo institucional.
            $prefix.'activities' => [$mode, 'array', 'min:1'],
            $prefix.'activities.*' => ['required', 'string', 'max:500'],
            $prefix.'required_education' => [$mode, 'string', 'max:200'],
            $prefix.'required_knowledge' => [$mode, 'string', 'max:2000'],
            $prefix.'required_experience' => [$mode, 'string', 'max:200'],
            $prefix.'work_schedule' => [$mode, 'string', 'max:200'],
            $prefix.'travel' => [$mode, Rule::in(JobDescription::TRAVEL)],
            $prefix.'work_environment' => [$mode, 'string', 'max:2000'],
        ];
    }

    /**
     * El rango salarial se juzga sobre el estado que quedará guardado: se informa completo
     * y con el mínimo por debajo del máximo, o no se informa.
     */
    public static function salary(Validator $validator, array $values): void
    {
        $informed = array_values(array_filter(
            ServiceRequest::SALARY,
            fn (string $field) => ($values[$field] ?? null) !== null && $values[$field] !== ''
        ));
        if ($informed === []) {
            return;
        }
        if (count($informed) < count(ServiceRequest::SALARY)) {
            foreach (array_diff(ServiceRequest::SALARY, $informed) as $field) {
                $validator->errors()->add($field, 'El rango salarial requiere moneda, monto mínimo y monto máximo, o ninguno de los tres.');
            }

            return;
        }
        if ((float) $values['salary_min'] > (float) $values['salary_max']) {
            $validator->errors()->add('salary_max', 'El monto máximo debe ser mayor o igual al mínimo.');
        }
    }
}
