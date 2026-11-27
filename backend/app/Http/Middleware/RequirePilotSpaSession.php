<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpFoundation\Response;

class RequirePilotSpaSession
{
    public function handle(Request $request, Closure $next): Response
    {
        // Cookie-only pilot: a dummy/stored bearer must never authenticate it.
        abort_if($request->hasHeader('Authorization'), 401);
        if (! EnsureFrontendRequestsAreStateful::fromFrontend($request) || ! $request->hasSession()) {
            abort($request->isMethodSafe() ? 401 : 419);
        }

        $response = $next($request);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }
}
