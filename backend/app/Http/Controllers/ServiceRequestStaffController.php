<?php

namespace App\Http\Controllers;

use App\Http\Requests\LinkServiceRequestCompanyRequest;
use App\Http\Requests\ServiceCandidateRequest;
use App\Http\Requests\StoreCompanyServiceRequestRequest;
use App\Http\Requests\UpdateJobDescriptionRequest;
use App\Http\Requests\UpdateServiceRequestRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Models\Company;
use App\Models\ServiceCandidate;
use App\Models\ServiceRequest;
use App\Support\ServiceRequestAccess;
use App\Support\ServiceRequestWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ServiceRequestStaffController extends Controller
{
    /**
     * S2.2.2: la empresa de una solicitud creada desde el panel nunca la elige un responsable:
     * se deriva de su vinculación activa. Con más de una empresa activa la ambigüedad se
     * resuelve pidiendo `company_id`, que debe pertenecer a la misma cuenta.
     */
    private function resolveCompanyId(Request $request, ?string $requested): ?string
    {
        $user = $request->user();
        $active = ServiceRequestAccess::activeCompanyIds($user);
        if (! ServiceRequestAccess::isStaff($user)) {
            abort_if($requested !== null && ! in_array($requested, $active, true), 403);
            if ($requested !== null) {
                return $requested;
            }
            if ($active === []) {
                abort(403);
            }
            if (count($active) > 1) {
                throw ValidationException::withMessages([
                    'company_id' => 'La cuenta tiene más de una empresa activa: indicá a cuál corresponde la solicitud.',
                ]);
            }

            return $active[0];
        }
        if ($requested !== null) {
            abort_if(Company::whereKey($requested)->where('status', 'active')->doesntExist(), 422);
        }

        return $requested;
    }

    /** S2.2.2: alta autenticada con los campos de S11-B/S11-C y la empresa resuelta en el servidor. */
    public function store(StoreCompanyServiceRequestRequest $request): JsonResponse
    {
        $input = $request->validated();
        $user = $request->user();
        $companyId = $this->resolveCompanyId($request, $input['company_id'] ?? null);
        $serviceRequest = DB::transaction(function () use ($input, $user, $companyId) {
            $serviceRequest = new ServiceRequest;
            $serviceRequest->fill(ServiceRequestWorkflow::requestAttributes($input));
            $serviceRequest->folio = ServiceRequestWorkflow::nextFolio();
            $serviceRequest->status = $companyId === null ? 'submitted' : 'linked';
            $serviceRequest->company_id = $companyId;
            $serviceRequest->created_by_user_id = $user->id;
            // El alta autenticada no necesita el código de consulta pública: no se devuelve.
            $serviceRequest->access_code_hash = Hash::make(ServiceRequestWorkflow::accessCode());
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
                'actor_user_id' => $user->id,
                'actor_kind' => ServiceRequestAccess::actorKind($user, $serviceRequest),
                'action' => 'submitted',
                'version' => 1,
                'changes' => $changes,
            ]);

            return $serviceRequest;
        });

        return (new ServiceRequestResource($serviceRequest))->response()->setStatusCode(201);
    }

    /**
     * S2.5: la bandeja atiende al personal con `can_manage_services` y a los responsables
     * empresariales con vinculación activa. Cada petición se autoriza contra la base.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', ServiceRequest::class);
        if (is_string($request->input('search'))) {
            $request->merge(['search' => trim($request->input('search'))]);
        }
        $input = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'search' => ['sometimes', 'nullable', 'string', 'max:200'],
            'status' => ['sometimes', 'string', 'in:'.implode(',', ServiceRequest::STATUSES)],
        ]);
        $query = ServiceRequest::query()->with('company')->withCount('candidates');
        if (! ServiceRequestAccess::isStaff($request->user())) {
            // Un responsable sólo lista las solicitudes de sus empresas activas.
            $query->whereIn('company_id', ServiceRequestAccess::activeCompanyIds($request->user()));
        }
        if (isset($input['status'])) {
            $query->where('status', $input['status']);
        }
        $search = $input['search'] ?? '';
        if ($search !== '') {
            $pattern = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(fn ($q) => $q->where('folio', 'ilike', $pattern)->orWhere('company_name', 'ilike', $pattern)->orWhere('position_title', 'ilike', $pattern));
        }
        $page = $query->orderByDesc('created_at')->orderBy('id')->paginate($input['per_page'] ?? 20);

        return response()->json([
            'data' => $page->getCollection()->map(fn (ServiceRequest $serviceRequest) => [
                'id' => $serviceRequest->id,
                'folio' => $serviceRequest->folio,
                'company_name' => $serviceRequest->company_name,
                'company' => $serviceRequest->company === null ? null : ['id' => $serviceRequest->company->id, 'name' => $serviceRequest->company->name],
                'position_title' => $serviceRequest->position_title,
                'vacancies' => $serviceRequest->vacancies,
                'modality' => $serviceRequest->modality,
                'status' => $serviceRequest->status,
                'deadline' => $serviceRequest->deadline?->format('Y-m-d'),
                'candidates_count' => $serviceRequest->candidates_count,
                'version' => $serviceRequest->version,
                'created_at' => $serviceRequest->created_at->toISOString(),
                'updated_at' => $serviceRequest->updated_at->toISOString(),
            ])->all(),
            'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function show(string $id): ServiceRequestResource
    {
        $serviceRequest = ServiceRequest::findOrFail($id);
        Gate::authorize('view', $serviceRequest);

        return new ServiceRequestResource($serviceRequest);
    }

    public function update(UpdateServiceRequestRequest $request, string $id): ServiceRequestResource
    {
        $serviceRequest = DB::transaction(function () use ($request, $id) {
            $serviceRequest = ServiceRequest::lockForUpdate()->findOrFail($id);
            Gate::authorize('update', $serviceRequest);
            $input = $request->validated();
            ServiceRequestWorkflow::version($serviceRequest, (int) $input['version']);
            $before = ServiceRequestWorkflow::snapshot($serviceRequest);
            $serviceRequest->fill(ServiceRequestWorkflow::requestAttributes($input));
            if (array_key_exists('status', $input)) {
                $serviceRequest->status = $input['status'];
            }
            $changes = ServiceRequestWorkflow::changes($before, ServiceRequestWorkflow::snapshot($serviceRequest));
            if ($changes !== []) {
                ServiceRequestWorkflow::event($serviceRequest, $request->user()->id, 'updated', $changes, ServiceRequestAccess::actorKind($request->user(), $serviceRequest));
            }

            return $serviceRequest;
        });

        return new ServiceRequestResource($serviceRequest);
    }

    public function updateDescription(UpdateJobDescriptionRequest $request, string $id): ServiceRequestResource
    {
        $serviceRequest = DB::transaction(function () use ($request, $id) {
            $serviceRequest = ServiceRequest::lockForUpdate()->findOrFail($id);
            Gate::authorize('update', $serviceRequest);
            $input = $request->validated();
            ServiceRequestWorkflow::version($serviceRequest, (int) $input['version']);
            $description = $serviceRequest->jobDescription()->firstOrFail();
            $before = ServiceRequestWorkflow::descriptionSnapshot($description);
            $description->fill(ServiceRequestWorkflow::descriptionAttributes($input, $serviceRequest->position_title));
            $changes = [];
            foreach (ServiceRequestWorkflow::changes($before, ServiceRequestWorkflow::descriptionSnapshot($description)) as $field => $change) {
                $changes['description.'.$field] = $change;
            }
            if ($changes !== []) {
                $description->save();
                ServiceRequestWorkflow::event($serviceRequest, $request->user()->id, 'description_updated', $changes, ServiceRequestAccess::actorKind($request->user(), $serviceRequest));
            }

            return $serviceRequest;
        });

        return new ServiceRequestResource($serviceRequest);
    }

    public function storeCandidate(ServiceCandidateRequest $request, string $id): JsonResponse
    {
        $serviceRequest = DB::transaction(function () use ($request, $id) {
            $serviceRequest = ServiceRequest::lockForUpdate()->findOrFail($id);
            Gate::authorize('manageCandidates', $serviceRequest);
            $input = $request->validated();
            $candidate = $serviceRequest->candidates()->create($input + ['version' => 1]);
            $changes = ['candidate_id' => ['before' => null, 'after' => $candidate->id]];
            foreach (ServiceCandidate::FIELDS as $field) {
                $changes[$field] = ['before' => null, 'after' => $candidate->{$field}];
            }
            ServiceRequestWorkflow::event($serviceRequest, $request->user()->id, 'candidate_added', $changes, ServiceRequestAccess::actorKind($request->user(), $serviceRequest));

            return $serviceRequest;
        });

        return (new ServiceRequestResource($serviceRequest))->response()->setStatusCode(201);
    }

    public function updateCandidate(ServiceCandidateRequest $request, string $id, string $candidate): ServiceRequestResource
    {
        $serviceRequest = DB::transaction(function () use ($request, $id, $candidate) {
            $serviceRequest = ServiceRequest::lockForUpdate()->findOrFail($id);
            Gate::authorize('manageCandidates', $serviceRequest);
            $record = $serviceRequest->candidates()->whereKey($candidate)->firstOrFail();
            $input = $request->validated();
            abort_if($record->version !== (int) $input['version'], 409);
            $before = [];
            foreach (ServiceCandidate::FIELDS as $field) {
                $before[$field] = $record->{$field};
            }
            foreach (ServiceCandidate::FIELDS as $field) {
                if (array_key_exists($field, $input)) {
                    $record->{$field} = $input[$field];
                }
            }
            $after = [];
            foreach (ServiceCandidate::FIELDS as $field) {
                $after[$field] = $record->{$field};
            }
            $changes = ServiceRequestWorkflow::changes($before, $after);
            if ($changes !== []) {
                $record->version++;
                $record->save();
                ServiceRequestWorkflow::event($serviceRequest, $request->user()->id, 'candidate_updated', ['candidate_id' => ['before' => $record->id, 'after' => $record->id]] + $changes, ServiceRequestAccess::actorKind($request->user(), $serviceRequest));
            }

            return $serviceRequest;
        });

        return new ServiceRequestResource($serviceRequest);
    }

    /**
     * S2.5: la vinculación de una solicitud pública a una empresa la realiza el personal, no el
     * responsable, y deja historial. El alta pública nunca se atribuye sola una empresa.
     */
    public function linkCompany(LinkServiceRequestCompanyRequest $request, string $id): ServiceRequestResource
    {
        $serviceRequest = DB::transaction(function () use ($request, $id) {
            $serviceRequest = ServiceRequest::lockForUpdate()->findOrFail($id);
            Gate::authorize('linkCompany', ServiceRequest::class);
            abort_if($serviceRequest->company_id !== null, 409);
            $input = $request->validated();
            ServiceRequestWorkflow::version($serviceRequest, (int) $input['version']);
            $company = Company::whereKey($input['company_id'])->where('status', 'active')->firstOrFail();
            $before = $serviceRequest->status;
            $serviceRequest->company_id = $company->id;
            $serviceRequest->status = 'linked';
            ServiceRequestWorkflow::event($serviceRequest, $request->user()->id, 'company_linked', [
                'company_id' => ['before' => null, 'after' => $company->id],
                'status' => ['before' => $before, 'after' => 'linked'],
            ], 'staff');

            return $serviceRequest;
        });

        return new ServiceRequestResource($serviceRequest);
    }
}
