<?php

namespace App\Http\Requests;

use App\Models\CatalogCareerOption;
use App\Models\CatalogFaculty;
use App\Models\Person;
use App\Models\TalentRegistration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RegistrationRequest extends FormRequest
{
    private ?TalentRegistration $registration = null;

    public function authorize(): bool
    {
        if ($this->isMethod('post')) {
            return Gate::allows('create', TalentRegistration::class);
        }
        $registration = $this->persisted();
        abort_if($registration === null, 404);

        return Gate::allows('update', $registration);
    }

    /** Stored registration for a PATCH; null on creation. */
    private function persisted(): ?TalentRegistration
    {
        if ($this->isMethod('post')) {
            return null;
        }

        return $this->registration ??= TalentRegistration::where('holder_user_id', $this->user()->id)->find($this->route('id'));
    }

    /**
     * Value that will remain stored after this request: the payload when the key is present
     * (even as null, which clears it), otherwise the persisted value.
     */
    private function effective(string $field): mixed
    {
        return $this->exists($field) ? $this->input($field) : $this->persisted()?->{$field};
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('full_name'))) {
            $this->merge(['full_name' => trim($this->input('full_name'))]);
        }
    }

    public function rules(): array
    {
        $rules = [
            'full_name' => ['sometimes', 'nullable', 'string', 'max:200'],
            'birth_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'university_registration' => ['sometimes', 'nullable', 'string', 'max:64'],
            'sex' => ['sometimes', 'nullable', 'string', 'max:64'],
            'contact_email' => ['sometimes', 'nullable', 'string', 'email:rfc', 'max:254'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'declared_ppa' => ['sometimes', 'nullable', 'string', 'max:64'],
            'mobility' => ['sometimes', 'array:province,department,country'],
        ];
        foreach (['faculty', 'career', 'interest_area'] as $field) {
            $rules[$field] = ['sometimes', 'nullable', 'string', 'max:200'];
        }
        $rules['faculty_catalog_id'] = ['sometimes', 'nullable', 'string', 'max:128', Rule::exists('catalog_faculties', 'catalog_id')->where('active', true)];
        $rules['career_catalog_id'] = ['sometimes', 'nullable', 'string', 'max:128', Rule::exists('catalog_career_options', 'catalog_id')->where('active', true)];
        $rules['career_manual'] = ['sometimes', 'boolean'];
        foreach (TalentRegistration::MOBILITY as $field) {
            $rules['mobility.'.$field] = ['sometimes', 'nullable', function (string $attribute, mixed $value, \Closure $fail) {
                if (! is_bool($value)) {
                    $fail('La respuesta debe ser sí/no o no informada.');
                }
            }];
        }
        if ($this->isMethod('patch')) {
            $rules['version'] = ['required', 'integer', 'min:1'];
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $allowed = array_merge(Person::FIELDS, TalentRegistration::ACADEMIC, TalentRegistration::CATALOG, ['mobility']);
            if ($this->isMethod('patch')) {
                $allowed[] = 'version';
            }
            foreach (array_diff(array_keys($this->all()), $allowed) as $field) {
                $validator->errors()->add($field, 'Campo no permitido.');
            }
            // La combinación se juzga sobre el estado que quedará guardado: un PATCH parcial
            // puede dejar una carrera de otra facultad si sólo se envía uno de los dos campos.
            $manual = (bool) $this->effective('career_manual');
            $careerId = $this->effective('career_catalog_id');
            $facultyId = $this->effective('faculty_catalog_id');
            // El error se ancla al campo que el usuario cambió; con ambos enviados, a la carrera.
            $errorField = $this->exists('career_catalog_id')
                ? 'career_catalog_id'
                : ($this->exists('faculty_catalog_id') ? 'faculty_catalog_id' : 'career_catalog_id');
            if ($manual && $careerId !== null) {
                $validator->errors()->add($errorField, 'La declaración manual no usa una opción del catálogo.');
            }
            if (! $manual && $facultyId !== null && $careerId !== null) {
                $option = CatalogCareerOption::find($careerId);
                if ($option && $option->faculty_catalog_id !== $facultyId) {
                    $validator->errors()->add($errorField, 'La carrera no corresponde a la facultad seleccionada.');
                }
            }
            // Sólo se comprueba la existencia de una referencia enviada: una referencia ya
            // guardada puede quedar inactiva y no debe bloquear la edición de otros campos.
            if ($this->exists('faculty_catalog_id') && $facultyId !== null && ! CatalogFaculty::where('catalog_id', $facultyId)->exists()) {
                $validator->errors()->add('faculty_catalog_id', 'La facultad seleccionada no existe.');
            }
        });
    }
}
