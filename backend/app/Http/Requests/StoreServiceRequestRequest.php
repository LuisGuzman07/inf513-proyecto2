<?php

namespace App\Http\Requests;

use App\Models\ServiceRequest;
use App\Support\ServiceRequestRules;
use Illuminate\Validation\Validator;

class StoreServiceRequestRequest extends ServiceRequestFormRequest
{
    /** El alta pública no requiere cuenta: la protege el throttling por IP. */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ServiceRequestRules::store();
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
