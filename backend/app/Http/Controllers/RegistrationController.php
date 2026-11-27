<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegistrationRequest;
use App\Http\Resources\RegistrationResource;
use App\Models\CatalogCareerOption;
use App\Models\CatalogFaculty;
use App\Models\Person;
use App\Models\TalentRegistration;
use App\Models\User;
use App\Support\FacultyTestAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class RegistrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $input = $request->validate(['page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:50']]);
        $page = TalentRegistration::with('person')->where(fn ($query) => $query->where('holder_user_id', $request->user()->id)->orWhere(fn ($legacy) => $legacy->whereNull('holder_user_id')->where('status', 'legacy_internal')->where('created_by', $request->user()->id)))->orderByDesc('updated_at')->orderBy('id')->paginate($input['per_page'] ?? 20);

        return response()->json(['data' => $page->getCollection()->map(fn ($r) => ['id' => $r->id, 'candidate_code' => $r->candidate_code, 'full_name' => $r->person->full_name, 'status' => $r->status, 'holder_user_id' => $r->holder_user_id, 'version' => $r->version, 'updated_at' => $r->updated_at->toISOString()]), 'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total()]]);
    }

    private function owned(Request $request, string $id): TalentRegistration
    {
        $registration = TalentRegistration::with('person')->where(fn ($query) => $query->where('holder_user_id', $request->user()->id)->orWhere(fn ($legacy) => $legacy->whereNull('holder_user_id')->where('status', 'legacy_internal')->where('created_by', $request->user()->id)))->findOrFail($id);
        Gate::authorize('view', $registration);

        return $registration;
    }

    public function show(Request $request, string $id): RegistrationResource
    {
        return new RegistrationResource($this->owned($request, $id));
    }

    private function snapshot(TalentRegistration $registration): array
    {
        $snapshot = [];
        foreach (Person::FIELDS as $field) {
            $snapshot[$field] = $field === 'birth_date' ? $registration->person->birth_date?->format('Y-m-d') : $registration->person->$field;
        }
        foreach (TalentRegistration::ACADEMIC as $field) {
            $snapshot[$field] = $registration->$field;
        }
        foreach (array_merge(TalentRegistration::CATALOG, ['catalog_version']) as $field) {
            $snapshot[$field] = $registration->$field;
        }
        foreach (TalentRegistration::MOBILITY as $field) {
            $snapshot['mobility.'.$field] = $registration->{'mobility_'.$field};
        }

        return $snapshot;
    }

    private function assign(TalentRegistration $registration, array $input): void
    {
        foreach (Person::FIELDS as $field) {
            if (array_key_exists($field, $input)) {
                $registration->person->$field = $input[$field];
            }
        }
        foreach (TalentRegistration::ACADEMIC as $field) {
            if (array_key_exists($field, $input)) {
                $registration->$field = $input[$field];
            }
        }
        foreach ($input['mobility'] ?? [] as $field => $value) {
            $registration->{'mobility_'.$field} = $value === null ? null : (bool) $value;
        }
        $manual = array_key_exists('career_manual', $input) ? (bool) $input['career_manual'] : (bool) $registration->career_manual;
        $registration->career_manual = $manual;
        if (array_key_exists('faculty_catalog_id', $input)) {
            $registration->faculty_catalog_id = $input['faculty_catalog_id'];
            if ($input['faculty_catalog_id'] !== null && ($faculty = CatalogFaculty::find($input['faculty_catalog_id']))) {
                $registration->faculty = $faculty->name;
            }
        }
        if ($manual) {
            $registration->career_catalog_id = null;
            $registration->catalog_label = null;
            $registration->catalog_version = null;
        } elseif (array_key_exists('career_catalog_id', $input)) {
            $registration->career_catalog_id = $input['career_catalog_id'];
            if ($input['career_catalog_id'] !== null && ($option = CatalogCareerOption::find($input['career_catalog_id']))) {
                $facultyName = $registration->faculty;
                if ($registration->faculty_catalog_id !== null && ($faculty = CatalogFaculty::find($registration->faculty_catalog_id))) {
                    $facultyName = $faculty->name;
                }
                $registration->career = $option->name;
                $registration->catalog_label = $facultyName !== null && $facultyName !== '' ? $option->name.' — '.$facultyName : $option->name;
                $registration->catalog_version = $option->catalog_version;
            } elseif ($input['career_catalog_id'] === null) {
                $registration->catalog_label = null;
                $registration->catalog_version = null;
            }
        }
    }

    public function store(RegistrationRequest $request): JsonResponse
    {
        $registration = DB::transaction(function () use ($request) {
            $user = User::lockForUpdate()->findOrFail($request->user()->id);
            abort_if(TalentRegistration::where('holder_user_id', $user->id)->exists() || $user->person_id !== null, 409);
            $person = new Person;
            $registration = new TalentRegistration;
            $registration->created_by = $user->id;
            $registration->holder_user_id = $user->id;
            $registration->status = 'draft';
            $registration->updated_by = $user->id;
            $registration->version = 1;
            $registration->setRelation('person', $person);
            $this->assign($registration, $request->validated());
            $person->save();
            $user->person_id = $person->id;
            $user->save();
            $registration->person_id = $person->id;
            $registration->save();
            $changes = [];
            foreach ($this->snapshot($registration) as $field => $value) {
                $changes[$field] = ['before' => null, 'after' => $value];
            }
            $registration->events()->create(['actor_id' => $request->user()->id, 'action' => 'created', 'version' => 1, 'changes' => $changes]);

            return $registration;
        });

        // Asignación automática inicial según facultad
        FacultyTestAssignment::assignDefaultTestsForRegistration($registration);

        return (new RegistrationResource($registration))->response()->setStatusCode(201);
    }

    public function update(RegistrationRequest $request, string $id): RegistrationResource
    {
        $registration = DB::transaction(function () use ($request, $id) {
            $registration = TalentRegistration::where('holder_user_id', $request->user()->id)->lockForUpdate()->findOrFail($id);
            Gate::authorize('update', $registration);
            abort_unless(in_array($registration->status, ['draft', 'correction_requested'], true), 409);
            $input = $request->validated();
            abort_if($registration->version !== (int) $input['version'], 409, 'La inscripción fue modificada. Recargue antes de guardar.');
            $before = $this->snapshot($registration);
            $this->assign($registration, $input);
            $changes = [];
            foreach ($this->snapshot($registration) as $field => $value) {
                if ($before[$field] !== $value) {
                    $changes[$field] = ['before' => $before[$field], 'after' => $value];
                }
            }
            if ($changes !== []) {
                $registration->person->save();
                $registration->version++;
                $registration->updated_by = $request->user()->id;
                $registration->save();
                $registration->events()->create(['actor_id' => $request->user()->id, 'action' => 'updated', 'version' => $registration->version, 'changes' => $changes]);
            }

            return $registration;
        });

        // Asegurar que las 5 pruebas de su facultad queden asignadas tras actualizar
        FacultyTestAssignment::assignDefaultTestsForRegistration($registration);

        return new RegistrationResource($registration);
    }

    public function history(Request $request, string $id): JsonResponse
    {
        $registration = TalentRegistration::findOrFail($id);
        abort_unless(Gate::allows('view', $registration), 404);

        return response()->json(['data' => $registration->events()->with('actor')->orderBy('version')->get()->map(fn ($event) => ['id' => $event->id, 'action' => $event->action, 'version' => $event->version, 'changes' => $event->changes, 'actor' => ['id' => $event->actor->id, 'name' => $event->actor->name], 'created_at' => $event->created_at->toISOString()])]);
    }
}
