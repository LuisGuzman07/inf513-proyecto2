<?php

namespace App\Http\Controllers;

use App\Http\Resources\RegistrationResource;
use App\Models\TalentRegistration;
use App\Support\TalentWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TalentReviewController extends Controller
{
    private function capability(Request $request): void
    {
        abort_unless($request->user()->can_review_talent, 403);
    }

    public function index(Request $request): JsonResponse
    {
        $this->capability($request);
        if (is_string($request->input('search'))) {
            $request->merge(['search' => trim($request->input('search'))]);
        }
        $input = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'search' => ['sometimes', 'nullable', 'string', 'max:200'],
            'status' => ['sometimes', 'string', 'in:submitted,in_review,correction_requested,review_concluded'],
        ]);
        $query = TalentRegistration::with(['person', 'reviewer'])->whereNotNull('holder_user_id')->where('holder_user_id', '!=', $request->user()->id)->where(fn ($q) => $q->where(fn ($unassigned) => $unassigned->where('status', 'submitted')->whereNull('reviewer_user_id'))->orWhere(fn ($assigned) => $assigned->where('reviewer_user_id', $request->user()->id)->whereIn('status', ['submitted', 'in_review', 'correction_requested', 'review_concluded'])));
        if (isset($input['status'])) {
            $query->where('status', $input['status']);
        }
        $search = $input['search'] ?? '';
        if ($search !== '') {
            $pattern = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(fn ($q) => $q->whereHas('person', fn ($person) => $person->where('full_name', 'ilike', $pattern))->orWhere('career', 'ilike', $pattern)->orWhere('candidate_code', 'ilike', $pattern));
        }
        $page = $query->orderBy('submitted_at')->orderBy('id')->paginate($input['per_page'] ?? 20);

        return response()->json(['data' => $page->getCollection()->map(fn ($r) => ['id' => $r->id, 'candidate_code' => $r->candidate_code, 'full_name' => $r->person->full_name, 'status' => $r->status, 'version' => $r->version, 'submitted_at' => $r->submitted_at?->toISOString(), 'reviewer' => $r->reviewer ? ['id' => $r->reviewer->id, 'name' => $r->reviewer->name] : null, 'updated_at' => $r->updated_at->toISOString(), 'career' => $r->career]), 'meta' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(), 'total' => $page->total()]]);
    }

    public function show(Request $request, string $id): RegistrationResource
    {
        $this->capability($request);
        $registration = TalentRegistration::findOrFail($id);
        abort_unless(Gate::allows('review', $registration), 404);

        return new RegistrationResource($registration);
    }

    public function claim(Request $request, string $id): RegistrationResource
    {
        $this->capability($request);
        $input = TalentWorkflow::input($request, ['version' => ['required', 'integer', 'min:1']]);
        $registration = DB::transaction(function () use ($request, $id, $input) {
            $r = TalentRegistration::lockForUpdate()->findOrFail($id);
            abort_if($r->holder_user_id === $request->user()->id || $r->holder_user_id === null || $r->status === 'draft' || $r->status === 'legacy_internal', 404);
            TalentWorkflow::version($r, (int) $input['version']);
            abort_unless($r->status === 'submitted' && ($r->reviewer_user_id === null || $r->reviewer_user_id === $request->user()->id), 409);
            $before = $r->reviewer_user_id;
            $r->reviewer_user_id = $request->user()->id;
            $r->status = 'in_review';
            TalentWorkflow::event($r, $request->user()->id, 'review_claimed', ['reviewer_user_id' => ['before' => $before, 'after' => $r->reviewer_user_id], 'status' => ['before' => 'submitted', 'after' => 'in_review']]);

            return $r;
        });

        return new RegistrationResource($registration);
    }

    public function observations(Request $request, string $id): JsonResponse
    {
        $r = TalentRegistration::findOrFail($id);
        abort_unless(Gate::allows('view', $r), 404);

        return response()->json(['data' => $r->observations()->with('reviewer')->orderBy('created_at')->orderBy('id')->get()->map(fn ($o) => ['id' => $o->id, 'kind' => $o->kind, 'content' => $o->content, 'reviewer' => ['id' => $o->reviewer->id, 'name' => $o->reviewer->name], 'created_at' => $o->created_at->toISOString()])]);
    }

    public function note(Request $request, string $id): RegistrationResource
    {
        return $this->observe($request, $id, false);
    }

    public function correction(Request $request, string $id): RegistrationResource
    {
        return $this->observe($request, $id, true);
    }

    private function observe(Request $request, string $id, bool $correction): RegistrationResource
    {
        $this->capability($request);
        if (is_string($request->input('content'))) {
            $request->merge(['content' => trim($request->input('content'))]);
        }
        $input = TalentWorkflow::input($request, ['version' => ['required', 'integer', 'min:1'], 'content' => ['required', 'string', 'max:4000']]);
        $r = DB::transaction(function () use ($request, $id, $input, $correction) {
            $r = TalentRegistration::lockForUpdate()->findOrFail($id);
            abort_unless(Gate::allows('review', $r) && $r->reviewer_user_id === $request->user()->id, 404);
            TalentWorkflow::version($r, (int) $input['version']);
            abort_unless(in_array($r->status, ['in_review', 'review_concluded'], true), 409);
            $kind = $correction ? 'correction_requested' : 'note';
            $observation = $r->observations()->create(['reviewer_id' => $request->user()->id, 'kind' => $kind, 'content' => $input['content']]);
            $changes = ['observation_id' => ['before' => null, 'after' => $observation->id]];
            if ($correction) {
                $previousStatus = $r->status;
                $r->status = 'correction_requested';
                $changes['status'] = ['before' => $previousStatus, 'after' => $r->status];
            }
            TalentWorkflow::event($r, $request->user()->id, $correction ? $kind : 'observation_added', $changes);

            return $r;
        });

        return new RegistrationResource($r);
    }

    public function conclude(Request $request, string $id): RegistrationResource
    {
        $this->capability($request);
        if (is_string($request->input('content'))) {
            $request->merge(['content' => trim($request->input('content'))]);
        }
        $input = TalentWorkflow::input($request, [
            'version' => ['required', 'integer', 'min:1'],
            'content' => ['required', 'string', 'max:4000'],
            'documents' => ['required', 'array'],
            'documents.*.type' => ['required', 'string'],
            'documents.*.id' => ['required', 'uuid'],
            'documents.*.version' => ['required', 'integer', 'min:1'],
        ]);
        $registration = DB::transaction(function () use ($request, $id, $input) {
            $r = TalentRegistration::lockForUpdate()->findOrFail($id);
            abort_unless(Gate::allows('review', $r) && $r->reviewer_user_id === $request->user()->id, 404);
            TalentWorkflow::version($r, (int) $input['version']);
            abort_unless($r->status === 'in_review', 409, 'La revisión documental ya fue concluida o no está en revisión.');
            $current = $r->documents()->orderByDesc('version')->get()->unique('type')->mapWithKeys(fn ($document) => [$document->type => ['id' => $document->id, 'version' => $document->version]]);
            $shown = collect($input['documents'])->mapWithKeys(fn ($document) => [$document['type'] => ['id' => $document['id'], 'version' => (int) $document['version']]]);
            abort_unless($shown->sortKeys()->all() === $current->sortKeys()->all(), 409, 'Las versiones documentales cambiaron. Actualizá la vista.');
            $observation = $r->observations()->create(['reviewer_id' => $request->user()->id, 'kind' => 'review_concluded', 'content' => $input['content']]);
            $r->status = 'review_concluded';
            TalentWorkflow::event($r, $request->user()->id, 'review_concluded', ['observation_id' => ['before' => null, 'after' => $observation->id], 'status' => ['before' => 'in_review', 'after' => 'review_concluded'], 'documents' => $current->all()]);
            $observation->update(['event_version' => $r->version]);

            return $r;
        });

        return new RegistrationResource($registration);
    }

    public function academicReview(Request $request, string $id): RegistrationResource
    {
        $this->capability($request);
        if (is_string($request->input('observations'))) {
            $request->merge(['observations' => trim($request->input('observations'))]);
        }
        $input = TalentWorkflow::input($request, [
            'version' => ['required', 'integer', 'min:1'],
            'reviewed_ppa' => ['sometimes', 'nullable', 'string', 'max:64'],
            'historico_document_id' => ['required', 'uuid'],
            'observations' => ['required', 'string', 'max:4000'],
        ]);
        $registration = DB::transaction(function () use ($request, $id, $input) {
            $r = TalentRegistration::lockForUpdate()->findOrFail($id);
            abort_unless(Gate::allows('review', $r) && $r->reviewer_user_id === $request->user()->id, 404);
            TalentWorkflow::version($r, (int) $input['version']);
            abort_unless(in_array($r->status, ['in_review', 'review_concluded'], true), 409);
            $document = $r->documents()->where('id', $input['historico_document_id'])->first();
            abort_unless($document && $document->type === 'historico', 422, 'El histórico indicado no pertenece al expediente.');
            $previous = $r->academicReviews()->orderByDesc('sequence')->first()?->reviewed_ppa;
            $review = $r->academicReviews()->create([
                'reviewer_id' => $request->user()->id,
                'reviewed_ppa' => $input['reviewed_ppa'] ?? null,
                'declared_ppa_snapshot' => $r->declared_ppa,
                'historico_document_id' => $document->id,
                'historico_document_version' => $document->version,
                'sequence' => ($r->academicReviews()->max('sequence') ?? 0) + 1,
                'observations' => $input['observations'],
            ]);
            TalentWorkflow::event($r, $request->user()->id, 'academic_review_recorded', ['academic_review_id' => ['before' => null, 'after' => $review->id], 'reviewed_ppa' => ['before' => $previous, 'after' => $review->reviewed_ppa]]);

            return $r;
        });

        return new RegistrationResource($registration);
    }

    public function cvReview(Request $request, string $id): RegistrationResource
    {
        $this->capability($request);
        if (is_string($request->input('observations'))) {
            $request->merge(['observations' => trim($request->input('observations'))]);
        }
        $input = TalentWorkflow::input($request, [
            'version' => ['required', 'integer', 'min:1'],
            'cv_document_id' => ['sometimes', 'nullable', 'uuid'],
            'absent' => ['sometimes', 'boolean'],
            'observations' => ['required', 'string', 'max:4000'],
        ]);
        $registration = DB::transaction(function () use ($request, $id, $input) {
            $r = TalentRegistration::lockForUpdate()->findOrFail($id);
            abort_unless(Gate::allows('review', $r) && $r->reviewer_user_id === $request->user()->id, 404);
            TalentWorkflow::version($r, (int) $input['version']);
            abort_unless(in_array($r->status, ['in_review', 'review_concluded'], true), 409);
            $absent = (bool) ($input['absent'] ?? false);
            $documentId = $input['cv_document_id'] ?? null;
            $current = $r->documents()->where('type', 'cv')->orderByDesc('version')->first();
            if ($absent) {
                abort_if($documentId !== null || $current, 422, 'El expediente tiene CV vigente; registrá su revisión en lugar de la ausencia.');
            } else {
                $document = $documentId ? $r->documents()->where('id', $documentId)->first() : null;
                abort_unless($document && $document->type === 'cv', 422, 'El CV indicado no pertenece al expediente.');
            }
            $review = $r->cvReviews()->create([
                'reviewer_id' => $request->user()->id,
                'cv_document_id' => $absent ? null : $document->id,
                'cv_document_version' => $absent ? null : $document->version,
                'absent' => $absent,
                'sequence' => ($r->cvReviews()->max('sequence') ?? 0) + 1,
                'observations' => $input['observations'],
            ]);
            TalentWorkflow::event($r, $request->user()->id, $absent ? 'cv_absence_noted' : 'cv_review_recorded', ['cv_review_id' => ['before' => null, 'after' => $review->id]]);

            return $r;
        });

        return new RegistrationResource($registration);
    }
}
