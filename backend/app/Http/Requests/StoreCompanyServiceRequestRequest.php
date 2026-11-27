<?php

namespace App\Http\Requests;

use App\Models\ServiceRequest;
use App\Support\ServiceRequestRules;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

/**
 * S2.2.2: el panel empresarial crea solicitudes con S11-B/S11-C. La empresa no se elige en el
 * cliente: se deriva de la vinculación activa del actor, y el personal debe indicarla.
 * A diferencia del alta pública no hay confirmación explícita: enviar desde la cuenta ya es
 * un acto autenticado.
 */
class StoreCompanyServiceRequestRequest extends ServiceRequestFormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', ServiceRequest::class);
    }

    public function rules(): array
    {
        return ServiceRequestRules::authenticatedStore();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $rules = $this->rules();
            $this->rejectUnknownFields($validator, $rules);
            $this->rejectUnknownNestedFields($validator, $rules, 'description');
            ServiceRequestRules::salary($validator, $this->only(ServiceRequest::SALARY));
        });
    }
}
