<?php

namespace App\Http\Requests;

use App\Models\ServiceRequest;
use App\Support\ServiceRequestRules;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class UpdateJobDescriptionRequest extends ServiceRequestFormRequest
{
    public function authorize(): bool
    {
        // Se autoriza contra la solicitud concreta: la empresa se evalúa en cada petición.
        $serviceRequest = ServiceRequest::find($this->route('id'));

        return $serviceRequest === null || Gate::allows('update', $serviceRequest);
    }

    public function rules(): array
    {
        return ServiceRequestRules::descriptionUpdate();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(fn (Validator $validator) => $this->rejectUnknownFields($validator, $this->rules()));
    }
}
