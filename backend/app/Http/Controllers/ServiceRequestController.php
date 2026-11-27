<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequestRequest;
use App\Models\ServiceRequest;
use App\Support\ServiceRequestWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ServiceRequestController extends Controller
{
    private function consultData(ServiceRequest $serviceRequest): array
    {
        return [
            'folio' => $serviceRequest->folio,
            'status' => $serviceRequest->status,
            'company_name' => $serviceRequest->company_name,
            'position_title' => $serviceRequest->position_title,
            'vacancies' => $serviceRequest->vacancies,
            'modality' => $serviceRequest->modality,
            'workday' => $serviceRequest->workday,
            'location' => $serviceRequest->location,
            'deadline' => $serviceRequest->deadline?->format('Y-m-d'),
            'created_at' => $serviceRequest->created_at->toISOString(),
            'updated_at' => $serviceRequest->updated_at->toISOString(),
        ];
    }

    public function store(StoreServiceRequestRequest $request): JsonResponse
    {
        $input = $request->validated();
        $accessCode = ServiceRequestWorkflow::accessCode();
        // El alta pública nunca atribuye una empresa: nace pendiente de vinculación verificada.
        $actor = $request->hasSession() ? Auth::guard('web')->user() : null;
        $serviceRequest = DB::transaction(function () use ($input, $accessCode, $actor) {
            $serviceRequest = new ServiceRequest;
            $serviceRequest->fill(ServiceRequestWorkflow::requestAttributes($input));
            $serviceRequest->folio = ServiceRequestWorkflow::nextFolio();
            $serviceRequest->status = 'submitted';
            $serviceRequest->company_id = null;
            $serviceRequest->created_by_user_id = $actor?->id;
            $serviceRequest->access_code_hash = Hash::make($accessCode);
            $serviceRequest->version = 1;
            $serviceRequest->save();
            $description = $serviceRequest->jobDescription()->create(
                ServiceRequestWorkflow::descriptionAttributes($input['description'], $serviceRequest->position_title)
            );
            $changes = [];
            foreach (ServiceRequestWorkflow::snapshot($serviceRequest) as $field => $value) {
                $changes[$field] = ['before' => null, 'after' => $value];
            }
            $changes['description'] = ['before' => null, 'after' => ServiceRequestWorkflow::descriptionSnapshot($description)];
            $serviceRequest->events()->create([
                'actor_user_id' => $actor?->id,
                'actor_kind' => 'public',
                'action' => 'submitted',
                'version' => 1,
                'changes' => $changes,
            ]);

            return $serviceRequest;
        });

        return response()->json(['data' => ['folio' => $serviceRequest->folio, 'access_code' => $accessCode]], 201);
    }

    public function consult(Request $request): JsonResponse
    {
        if (is_string($request->input('folio'))) {
            $request->merge(['folio' => Str::upper(trim($request->input('folio')))]);
        }
        if (is_string($request->input('access_code'))) {
            $request->merge(['access_code' => trim($request->input('access_code'))]);
        }
        $input = $request->validate([
            'folio' => ['required', 'string', 'max:20'],
            'access_code' => ['required', 'string', 'max:64'],
        ]);
        $serviceRequest = ServiceRequest::where('folio', $input['folio'])->first();
        // Folio inexistente y código inválido comparten exactamente la misma respuesta:
        // nunca se confirma la existencia de un folio a quien no tiene el código.
        abort_if($serviceRequest === null, 404);
        abort_unless(Hash::check($input['access_code'], $serviceRequest->access_code_hash), 404);

        return response()->json(['data' => $this->consultData($serviceRequest)]);
    }
}
