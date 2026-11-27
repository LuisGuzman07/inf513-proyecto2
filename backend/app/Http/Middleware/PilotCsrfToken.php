<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

class PilotCsrfToken extends ValidateCsrfToken
{
    protected function runningUnitTests(): bool
    {
        // Exercise real CSRF in feature tests too; do not fake protection.
        return false;
    }
}
