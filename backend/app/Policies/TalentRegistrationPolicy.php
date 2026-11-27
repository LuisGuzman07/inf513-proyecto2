<?php

namespace App\Policies;

use App\Models\TalentRegistration;
use App\Models\User;

class TalentRegistrationPolicy
{
    public function create(User $user): bool
    {
        return $user->talent_pilot_enabled && $user->is_graduate;
    }

    public function view(User $user, TalentRegistration $registration): bool
    {
        return $user->talent_pilot_enabled && ($registration->holder_user_id === $user->id || ($registration->holder_user_id === null && $registration->status === 'legacy_internal' && $registration->created_by === $user->id) || $this->review($user, $registration));
    }

    public function update(User $user, TalentRegistration $registration): bool
    {
        return $this->create($user) && $registration->holder_user_id === $user->id;
    }

    public function review(User $user, TalentRegistration $registration): bool
    {
        return $user->talent_pilot_enabled && $user->can_review_talent && $registration->holder_user_id !== $user->id && $registration->holder_user_id !== null && (($registration->status === 'submitted' && $registration->reviewer_user_id === null) || ($registration->reviewer_user_id === $user->id && in_array($registration->status, ['submitted', 'in_review', 'correction_requested', 'review_concluded'], true)));
    }
}
