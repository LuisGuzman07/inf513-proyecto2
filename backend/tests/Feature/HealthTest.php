<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_reports_a_successful_query_without_internal_details(): void
    {
        $connection = Mockery::mock();
        $connection->shouldReceive('select')->once()->with('SELECT 1')->andReturn([(object) ['result' => 1]]);
        DB::shouldReceive('connection')->once()->with('pgsql')->andReturn($connection);

        $this->getJson('/api/health')->assertOk()->assertExactJson([
            'status' => 'ok', 'api' => 'ok', 'database' => 'ok',
        ])->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_database_failure_returns_a_safe_503_even_with_debug_enabled(): void
    {
        config(['app.debug' => true]);
        DB::shouldReceive('connection')->once()->with('pgsql')
            ->andThrow(new RuntimeException('password=secret internal-host SQLSTATE'));

        $this->getJson('/api/health')->assertStatus(503)->assertExactJson([
            'status' => 'degraded', 'api' => 'ok', 'database' => 'unavailable',
        ]);
    }

    public function test_api_errors_are_generic_json_even_with_debug_enabled(): void
    {
        config(['app.debug' => true]);
        $this->getJson('/api/not-found')->assertNotFound()
            ->assertExactJson(['message' => 'Recurso no encontrado.']);
    }

    public function test_local_cors_preflight_allows_only_the_configured_origin(): void
    {
        config(['cors.allowed_origins' => ['http://localhost:5173']]);
        $headers = ['Origin' => 'http://localhost:5173', 'Access-Control-Request-Method' => 'GET'];
        $this->options('/api/health', [], $headers)->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        $headers['Origin'] = 'https://not-allowed.example';
        // Fruitcake emits the fixed allowed origin even for another requester.
        // The browser rejects it because it does not match the requesting origin.
        $this->options('/api/health', [], $headers)->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
}
