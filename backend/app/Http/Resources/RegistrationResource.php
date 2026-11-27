<?php

namespace App\Http\Resources;

use App\Models\CatalogCareerOption;
use App\Models\CatalogFaculty;
use App\Models\Person;
use App\Models\TalentRegistration;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $person = ['id' => $this->person->id];
        foreach (Person::FIELDS as $field) {
            $person[$field] = $field === 'birth_date' ? $this->person->birth_date?->format('Y-m-d') : $this->person->$field;
        }
        $academic = [];
        $mobility = [];
        foreach (TalentRegistration::ACADEMIC as $field) {
            $academic[$field] = $this->$field;
        }
        foreach (TalentRegistration::MOBILITY as $field) {
            $mobility[$field] = $this->{'mobility_'.$field};
        }
        $faculty = $this->faculty_catalog_id !== null ? CatalogFaculty::find($this->faculty_catalog_id) : null;
        $option = $this->career_catalog_id !== null ? CatalogCareerOption::find($this->career_catalog_id) : null;
        $catalog = [
            'faculty_catalog_id' => $this->faculty_catalog_id,
            'faculty_name' => $faculty?->name,
            'career_catalog_id' => $this->career_catalog_id,
            'career_name' => $option?->name,
            'career_manual' => (bool) $this->career_manual,
            'needs_review' => $option ? (bool) $option->needs_review : (bool) $this->career_manual,
            'label' => $this->catalog_label,
            'version' => $this->catalog_version,
        ];

        $conclusions = $this->observations()->where('kind', 'review_concluded')->orderBy('event_version')->with('reviewer')->get();
        $eventsByObservation = $this->events()->get()->keyBy(function ($event) {
            $reference = $event->changes['observation_id'] ?? null;

            return is_array($reference) ? ($reference['after'] ?? null) : $reference;
        });
        $documentConclusions = $conclusions->map(fn ($observation) => [
            'id' => $observation->id,
            'reviewer' => ['id' => $observation->reviewer->id, 'name' => $observation->reviewer->name],
            'summary' => $observation->content,
            'created_at' => $observation->created_at->toISOString(),
            'versions' => $eventsByObservation->get($observation->id)?->changes['documents'] ?? [],
        ])->values()->all();
        $academicReviews = $this->academicReviews()->with('reviewer')->orderBy('sequence')->get();
        $currentHistorico = $this->documents()->where('type', 'historico')->orderByDesc('version')->first();
        $academicVigente = null;
        foreach ($academicReviews->reverse() as $review) {
            if ($currentHistorico && $review->historico_document_id === $currentHistorico->id && $review->historico_document_version === $currentHistorico->version && $review->declared_ppa_snapshot === $this->declared_ppa) {
                $academicVigente = $review->id;

                break;
            }
        }
        $academicBlock = [
            'reviews' => $academicReviews->map(fn ($review) => [
                'id' => $review->id,
                'reviewer' => ['id' => $review->reviewer->id, 'name' => $review->reviewer->name],
                'reviewed_ppa' => $review->reviewed_ppa,
                'declared_ppa_snapshot' => $review->declared_ppa_snapshot,
                'declared_ppa_changed' => $review->declared_ppa_snapshot !== $this->declared_ppa,
                'historico_document_id' => $review->historico_document_id,
                'historico_document_version' => $review->historico_document_version,
                'sequence' => $review->sequence,
                'observations' => $review->observations,
                'vigente' => $review->id === $academicVigente,
                'created_at' => $review->created_at->toISOString(),
            ])->values()->all(),
            'pendiente' => $academicVigente === null,
        ];
        $cvReviews = $this->cvReviews()->with('reviewer')->orderBy('sequence')->get();
        $currentCv = $this->documents()->where('type', 'cv')->orderByDesc('version')->first();
        $cvVigente = null;
        foreach ($cvReviews->reverse() as $review) {
            if ($review->absent) {
                if (! $currentCv) {
                    $cvVigente = $review->id;

                    break;
                }
            } elseif ($currentCv && $review->cv_document_id === $currentCv->id && $review->cv_document_version === $currentCv->version) {
                $cvVigente = $review->id;

                break;
            }
        }
        $cvBlock = [
            'reviews' => $cvReviews->map(fn ($review) => [
                'id' => $review->id,
                'reviewer' => ['id' => $review->reviewer->id, 'name' => $review->reviewer->name],
                'absent' => (bool) $review->absent,
                'cv_document_id' => $review->cv_document_id,
                'cv_document_version' => $review->cv_document_version,
                'sequence' => $review->sequence,
                'observations' => $review->observations,
                'vigente' => $review->id === $cvVigente,
                'created_at' => $review->created_at->toISOString(),
            ])->values()->all(),
            'pendiente' => $cvVigente === null && $currentCv !== null,
        ];

        return ['id' => $this->id, 'candidate_code' => $this->candidate_code, 'version' => $this->version, 'status' => $this->status, 'submitted_at' => $this->submitted_at?->toISOString(), 'holder_user_id' => $this->holder_user_id, 'reviewer' => $this->reviewer ? ['id' => $this->reviewer->id, 'name' => $this->reviewer->name] : null, 'person' => $person, 'academic' => $academic, 'catalog' => $catalog, 'document_conclusions' => $documentConclusions, 'concluded' => $this->status === 'review_concluded', 'academic_reviews' => $academicBlock, 'cv_reviews' => $cvBlock, 'mobility' => $mobility, 'documents' => $this->documents->map(fn ($document) => $document->metadata())->all(), 'curriculum' => $this->curriculum ? $this->curriculum->toArray() : null, 'created_at' => $this->created_at->toISOString(), 'updated_at' => $this->updated_at->toISOString()];
    }
}
