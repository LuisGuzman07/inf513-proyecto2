<?php

namespace Tests;

use App\Support\TestDatabaseGuard;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        if (! $app->environment('testing') || $app->configurationIsCached()
            || $app['config']->get('database.default') !== 'pgsql') {
            throw new RuntimeException('Tests bloqueados: entorno testing PostgreSQL sin configuración cacheada requerido.');
        }

        TestDatabaseGuard::assertConnection(
            $app['db']->connection('pgsql'),
            TestDatabaseGuard::developmentDatabase($app->basePath()),
        );

        return $app;
    }

    public function assertExclusiveTestDatabase(): void
    {
        if (! $this->app->environment('testing') || config('database.default') !== 'pgsql') {
            throw new RuntimeException('Limpieza de tests bloqueada: entorno/conexión inesperados.');
        }

        $development = TestDatabaseGuard::developmentDatabase(base_path());
        $names = method_exists($this, 'connectionsToTransact') ? $this->connectionsToTransact() : [null];
        foreach (array_unique(array_merge(['pgsql'], $names)) as $name) {
            $connectionName = $name ?? 'pgsql';
            $options = config('database.connections.'.$connectionName);
            if (! is_array($options) || ($options['driver'] ?? null) !== 'pgsql'
                || ! in_array($options['url'] ?? null, [null, ''], true)) {
                throw new RuntimeException('Limpieza bloqueada: configuración actual de conexión no permitida.');
            }
            // A cached PDO can still point at tests while config now points at dev.
            TestDatabaseGuard::assertNames((string) ($options['database'] ?? ''), (string) ($options['database'] ?? ''), $development);
            TestDatabaseGuard::assertConnection($this->app['db']->connection($name), $development);
        }
    }
}
