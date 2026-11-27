<?php

namespace App\Providers;

use App\Support\TestDatabaseGuard;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('testing')) {
            if ($this->app['config']->get('database.default') !== 'pgsql') {
                throw new RuntimeException('Entorno testing requiere la conexión PostgreSQL exclusiva.');
            }
            TestDatabaseGuard::assertConnection(
                $this->app['db']->connection('pgsql'),
                TestDatabaseGuard::developmentDatabase($this->app->basePath()),
            );
        }
    }
}
