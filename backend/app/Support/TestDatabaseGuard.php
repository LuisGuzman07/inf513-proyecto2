<?php

namespace App\Support;

use Dotenv\Dotenv;
use Illuminate\Database\Connection;
use RuntimeException;
use Throwable;

final class TestDatabaseGuard
{
    public const DATABASE = 'tecnoweb18b_test';

    public static function developmentDatabase(string $root): string
    {
        $path = $root.'/.env';
        if (! is_file($path)) {
            throw new RuntimeException('No se puede comprobar la base de desarrollo: falta .env.');
        }

        // Parse privately; never return or log credentials or APP_KEY.
        $values = Dotenv::parse(file_get_contents($path));
        $database = $values['DB_DATABASE'] ?? '';
        if (! is_string($database) || $database === '') {
            throw new RuntimeException('No se puede identificar la base de desarrollo.');
        }

        return $database;
    }

    public static function assertNames(string $configured, string $actual, string $development): void
    {
        if ($development === '' || $development === self::DATABASE
            || $configured !== self::DATABASE || $actual !== self::DATABASE
            || $actual === $development) {
            throw new RuntimeException('Operación de tests bloqueada: solo se permite tecnoweb18b_test, distinta de desarrollo.');
        }
    }

    public static function assertConnection(Connection $connection, string $development): void
    {
        if ($connection->getDriverName() !== 'pgsql' || ! in_array($connection->getConfig('url'), [null, ''], true)) {
            throw new RuntimeException('Tests requieren PostgreSQL sin DB_URL que sustituya el destino.');
        }

        $configured = (string) $connection->getConfig('database');
        // Reject an unsafe configuration before even opening its connection.
        self::assertNames($configured, $configured, $development);
        try {
            $actual = (string) $connection->selectOne('SELECT current_database() AS database')->database;
        } catch (Throwable) {
            throw new RuntimeException('No se pudo verificar la conexión a la base exclusiva de tests.');
        }
        self::assertNames($configured, $actual, $development);
    }
}
