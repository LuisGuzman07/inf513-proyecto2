<?php

namespace App\Http\Resources;

use App\Models\ServiceRequest;
use App\Support\ServiceRequestAccess;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceRequest */
class ServiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $description = $this->jobDescription;
        $isStaff = ServiceRequestAccess::isStaff($request->user());
        $creator = $this->createdBy;
        $creatorData = null;
        if ($creator !== null) {
            if ($isStaff) {
                $creatorData = ['id' => $creator->id, 'name' => $creator->name];
            } elseif (ServiceRequestAccess::belongs($creator, $this->resource)) {
                $creatorData = ['name' => $creator->name];
            }
        }

        return [
            'solicitud' => [
                'id' => $this->id,
                'folio' => $this->folio,
                'status' => $this->status,
                'version' => $this->version,
                'company_id' => $this->company_id,
                'company' => $this->company === null ? null : ['id' => $this->company->id, 'name' => $this->company->name, 'status' => $this->company->status],
                'created_by' => $creatorData,
                'company_name' => $this->company_name,
                'contact_name' => $this->contact_name,
                'contact_position' => $this->contact_position,
                'contact_area' => $this->contact_area,
                'contact_email' => $this->contact_email,
                'contact_phone' => $this->contact_phone,
                'position_title' => $this->position_title,
                'vacancies' => $this->vacancies,
                'modality' => $this->modality,
                'workday' => $this->workday,
                'location' => $this->location,
                'salary_currency' => $this->salary_currency,
                'salary_min' => $this->salary_min,
                'salary_max' => $this->salary_max,
                'payment_scheme' => $this->payment_scheme,
                'benefits' => $this->benefits,
                'required_education' => $this->required_education,
                'required_knowledge' => $this->required_knowledge,
                'required_experience' => $this->required_experience,
                'languages' => $this->languages ?? [],
                'deadline' => $this->deadline?->format('Y-m-d'),
                'created_at' => $this->created_at->toISOString(),
                'updated_at' => $this->updated_at->toISOString(),
            ],
            'descripcion' => $description === null ? null : [
                'id' => $description->id,
                'position_title' => $description->position_title,
                'area' => $description->area,
                'reports_to' => $description->reports_to,
                'headcount' => $description->headcount,
                'objective' => $description->objective,
                'activities' => $description->activities ?? [],
                'required_education' => $description->required_education,
                'required_knowledge' => $description->required_knowledge,
                'required_experience' => $description->required_experience,
                'work_schedule' => $description->work_schedule,
                'travel' => $description->travel,
                'work_environment' => $description->work_environment,
                'updated_at' => $description->updated_at->toISOString(),
            ],
            'candidatos' => $this->candidates()->orderBy('created_at')->orderBy('id')->get()->map(fn ($candidate) => [
                'id' => $candidate->id,
                'full_name' => $candidate->full_name,
                'contact_email' => $candidate->contact_email,
                'contact_phone' => $candidate->contact_phone,
                'notes' => $candidate->notes,
                'version' => $candidate->version,
                'created_at' => $candidate->created_at->toISOString(),
                'updated_at' => $candidate->updated_at->toISOString(),
            ])->all(),
            'historial' => $this->events()->with('actor')->orderBy('version')->get()->map(fn ($event) => [
                'id' => $event->id,
                'action' => $event->action,
                'version' => $event->version,
                'actor_kind' => $event->actor_kind,
                'changes' => $isStaff ? $event->changes : (object) [],
                'actor' => $event->actor === null ? null : ($isStaff
                    ? ['id' => $event->actor->id, 'name' => $event->actor->name]
                    : ($event->actor_kind === 'company_user' ? ['name' => $event->actor->name] : null)),
                'created_at' => $event->created_at->toISOString(),
            ])->all(),
        ];
    }
}
