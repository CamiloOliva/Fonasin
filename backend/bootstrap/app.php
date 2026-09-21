<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use App\Http\Middleware\AddSecurityHeaders;
use App\Http\Middleware\EnsurePasswordIsChanged;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The React application is served from fonasin.com while Laravel is
        // served from api.fonasin.com. Register CORS explicitly so the
        // credentialed browser policy in config/cors.php is never omitted.
        $middleware->prepend(HandleCors::class);
        $middleware->append(AddSecurityHeaders::class);

        $middleware->alias([
            'password.changed' => EnsurePasswordIsChanged::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'affiliation-applications',
            'affiliation-applications/*',
            'fpqrs-submissions',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
