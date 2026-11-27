[CmdletBinding()]
param(
    [ValidateSet('Start', 'Status')]
    [string] $Action = 'Start'
)

$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'
$apiUrl = 'http://127.0.0.1:8001'
$spaUrl = 'http://localhost:5173'

function Get-ApiHealth {
    try {
        $health = Invoke-RestMethod -Uri ($apiUrl + '/api/health') -TimeoutSec 2
        if ($health.status -eq 'ok' -and $health.api -eq 'ok' -and $health.database -eq 'ok') {
            return $health
        }
    } catch { }
    return $null
}

function Get-SpaHealth {
    try {
        $page = Invoke-WebRequest -Uri ($spaUrl + '/') -UseBasicParsing -TimeoutSec 2
        $proxy = Invoke-RestMethod -Uri ($spaUrl + '/api/health') -TimeoutSec 2
        if ($page.StatusCode -eq 200 -and $proxy.status -eq 'ok' -and $proxy.api -eq 'ok' -and $proxy.database -eq 'ok') {
            return $true
        }
    } catch { }
    return $false
}

if ($Action -eq 'Status') {
    [pscustomobject]@{
        Laravel = [bool](Get-ApiHealth)
        React = [bool](Get-SpaHealth)
        ApiUrl = $apiUrl
        ReactUrl = $spaUrl
    } | Format-List
    return
}

if (-not (Test-Path -LiteralPath (Join-Path $backendPath 'artisan')) -or
    -not (Test-Path -LiteralPath (Join-Path $frontendPath 'node_modules/vite/bin/vite.js'))) {
    throw 'Faltan los archivos del backend o las dependencias instaladas del frontend.'
}

$phpExe = Join-Path $env:USERPROFILE '.config/herd/bin/php84/php.exe'
if (-not (Test-Path -LiteralPath $phpExe)) {
    $phpCommand = Get-Command php.exe -ErrorAction SilentlyContinue
    if (-not $phpCommand) { throw 'No se encontró PHP 8.4. Instala/configura Herd o coloca php.exe en PATH.' }
    $phpExe = $phpCommand.Source
}
$nodeCommand = Get-Command node.exe -ErrorAction Stop

# Check the actual Laravel connection before starting anything. Never launch against tests.
$developmentPreflight = @'
require getcwd().'/vendor/autoload.php';
$app = require getcwd().'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$expected = App\Support\TestDatabaseGuard::developmentDatabase(getcwd());
$options = config('database.connections.pgsql');
$db = Illuminate\Support\Facades\DB::connection('pgsql');
$actual = $db->selectOne('select current_database() as name')->name;
if ($app->environment() !== 'local' || $expected !== 'tecnoweb18b' || $actual !== $expected
    || $actual === App\Support\TestDatabaseGuard::DATABASE
    || ($options['driver'] ?? null) !== 'pgsql' || ! in_array($options['url'] ?? null, [null, ''], true)) {
    fwrite(STDERR, 'Preflight bloqueado: se requiere la base local tecnoweb18b.');
    exit(1);
}
echo 'Preflight local verificado: tecnoweb18b.';
'@
Push-Location $backendPath
try {
    $preflightOutput = & $phpExe -r $developmentPreflight 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Preflight de base de desarrollo fallido. No se iniciaron servicios.' }
    Write-Output ($preflightOutput -join ' ')
} finally {
    Pop-Location
}

$apiListener = @(Get-NetTCPConnection -State Listen -LocalPort 8001 -ErrorAction SilentlyContinue)
$spaListener = @(Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue)
$apiReady = $false
$spaReady = $false
if ($apiListener.Count -gt 0) {
    if (-not (Get-ApiHealth)) { throw 'El puerto 8001 ya está ocupado por un servicio que no verificó la salud de Laravel. No se modificó ni detuvo.' }
    $apiReady = $true
}
if ($spaListener.Count -gt 0) {
    if (-not (Get-SpaHealth)) { throw 'El puerto 5173 ya está ocupado por un servicio que no verificó React y su proxy. No se modificó ni detuvo.' }
    $spaReady = $true
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logsPath = Join-Path $env:TEMP ('grupo18b-dev-' + $timestamp)
New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
$started = @()
if (-not $apiReady) {
    $process = Start-Process -FilePath $phpExe -ArgumentList @('artisan', 'serve', '--no-reload', '--host=127.0.0.1', '--port=8001') -WorkingDirectory $backendPath -PassThru -RedirectStandardOutput (Join-Path $logsPath 'laravel.log') -RedirectStandardError (Join-Path $logsPath 'laravel.err')
    $started += 'Laravel PID ' + $process.Id
}
if (-not $spaReady) {
    $previousProxy = [Environment]::GetEnvironmentVariable('API_PROXY_TARGET', 'Process')
    [Environment]::SetEnvironmentVariable('API_PROXY_TARGET', $apiUrl, 'Process')
    try {
        $process = Start-Process -FilePath $nodeCommand.Source -ArgumentList @('node_modules/vite/bin/vite.js', '--host', 'localhost', '--port', '5173', '--strictPort') -WorkingDirectory $frontendPath -PassThru -RedirectStandardOutput (Join-Path $logsPath 'vite.log') -RedirectStandardError (Join-Path $logsPath 'vite.err')
        $started += 'React/Vite PID ' + $process.Id
    } finally {
        [Environment]::SetEnvironmentVariable('API_PROXY_TARGET', $previousProxy, 'Process')
    }
}

for ($attempt = 0; $attempt -lt 25; $attempt++) {
    $apiReady = [bool](Get-ApiHealth)
    $spaReady = [bool](Get-SpaHealth)
    if ($apiReady -and $spaReady) { break }
    Start-Sleep -Seconds 1
}
if (-not $apiReady -or -not $spaReady) {
    throw ('Servicios aún no listos. Logs locales: ' + $logsPath)
}

[pscustomobject]@{
    Status = 'ready'
    Laravel = $apiUrl
    React = $spaUrl
    Health = $apiUrl + '/api/health'
    ProxyHealth = $spaUrl + '/api/health'
    StartedByThisRun = if ($started.Count) { $started -join '; ' } else { 'Servicios ya activos y comprobados; no se modificaron procesos existentes.' }
    Logs = if ($started.Count) { $logsPath } else { 'Sin nuevos logs: se reutilizaron servicios ya activos.' }
    Database = 'tecnoweb18b'
    MigrationsOrImport = 'No se ejecutan automáticamente.'
} | Format-List
