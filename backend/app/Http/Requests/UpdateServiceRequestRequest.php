<?php

namespace App\Http\Requests;

use App\Models\ServiceRequest;
use App\Support\ServiceRequestRules;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class UpdateServiceRequestRequest extends ServiceRequestFormRequest
{
    private ?ServiceRequest $serviceRequest = null;

    public function authorize(): bool
    {
        // Se autoriza contra la solicitud concreta: la empresa se evalúa en cada petición.
        $serviceRequest = ServiceRequest::find($this->route('id'));

        return $serviceRequest === null || Gate::allows('update', $serviceRequest);
    }

    /** Estado guardado con el que se juzga el rango salarial de un PATCH parcial. */
    private function persisted(): ServiceRequest
    {
        return $this->serviceRequest ??= ServiceRequest::findOrFail($this->route('id'));
    }

    public function rules(): array
    {
        return ServiceRequestRules::update();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->rejectUnknownFields($validator, $this->rules());
            $effective = [];
            foreach (ServiceRequest::SALARY as $field) {
                $effective[$field] = $this->exists($field) ? $this->input($field) : $this->persisted()->{$field};
            }
            ServiceRequestRules::salary($validator, $effective);
        });
    }
}
