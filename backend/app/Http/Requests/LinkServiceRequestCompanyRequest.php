<?php

namespace App\Http\Requests;

use App\Models\ServiceRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** S2.5: vincular una solicitud pública a una empresa es una operación del personal. */
class LinkServiceRequestCompanyRequest extends ServiceRequestFormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('linkCompany', ServiceRequest::class);
    }

    public function rules(): array
    {
        return [
            'company_id' => ['required', 'uuid', Rule::exists('companies', 'id')->where('status', 'active')],
            'version' => ['required', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(fn (Validator $validator) => $this->rejectUnknownFields($validator, $this->rules()));
    }
}
