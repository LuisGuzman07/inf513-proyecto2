<?php

namespace App\Support;

use App\Models\TalentRegistration;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TalentWorkflow
{
    public static function input(Request $request, array $rules): array
    {
        $errors = [];
        foreach (array_diff(array_keys($request->all()), array_keys($rules)) as $field) {
            $errors[$field] = ['Campo no permitido.'];
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $request->validate($rules);
    }

    public static function version(TalentRegistration $registration, int $version): void
    {
        abort_if($registration->version !== $version, 409);
    }

    public static function editable(TalentRegistration $registration): void
    {
        abort_unless(in_array($registration->status, ['draft', 'correction_requested'], true), 409);
    }

    public static function event(TalentRegistration $registration, int $actor, string $action, array $changes): void
    {
        $registration->version++;
        $registration->updated_by = $actor;
        $registration->save();
        $registration->events()->create(['actor_id' => $actor, 'action' => $action, 'version' => $registration->version, 'changes' => $changes]);
    }
}
