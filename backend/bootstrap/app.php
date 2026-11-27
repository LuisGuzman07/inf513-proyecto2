<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias([
            'permission' => \App\Http\Middleware\RequirePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->is('sanctum/*'));
        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($exception instanceof ValidationException) {
                return response()->json([
                    'message' => 'Revisá los campos indicados.',
                    'errors' => $exception->errors(),
                ], 422)->header('Cache-Control', 'private, no-store');
            }

            $status = $exception instanceof AuthenticationException ? 401
                : ($exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500);
            $messages = [
                401 => 'Iniciá sesión con una cuenta habilitada.',
                403 => 'Esta cuenta no está habilitada para el piloto interno.',
                404 => 'Recurso no encontrado.',
                409 => 'El expediente cambió. Recargalo antes de guardar tus cambios.',
                419 => 'La sesión o su protección venció. Recargá e iniciá sesión nuevamente.',
                429 => 'Demasiados intentos. Esperá un momento antes de volver a intentar.',
            ];

            $customMessage = $exception instanceof HttpExceptionInterface ? trim($exception->getMessage()) : '';

            return response()->json([
                'message' => ($status === 403 && $customMessage !== '')
                    ? $customMessage
                    : ($messages[$status] ?? 'No se pudo completar la solicitud.'),
            ], $status)->header('Cache-Control', 'private, no-store');
        });
    })->create();
