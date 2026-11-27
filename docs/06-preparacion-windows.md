# Preparación local Windows

Usar PowerShell nativo en la raíz existente, no WSL. No regenerar backend/, inicializar otro Git ni reutilizar credenciales ajenas.

## Herd y diagnóstico

Herd está en C:/Program Files/Herd; sus herramientas están en C:/Users/marcelo/.config/herd/bin. Al inicio no estaban en PATH; tras su preparación la terminal resuelve php.bat y composer.bat. PHP efectivo: bin/php84/php.exe 8.4.26 NTS x64; Composer 2.10.2. INI cargado: bin/php84/php.ini. PDO, pdo_pgsql, pgsql, mbstring, openssl, tokenizer, xml, ctype, curl, fileinfo y dom están cargadas.

Si otra terminal no los encuentra: terminar el onboarding de Herd y abrir una terminal nueva. Si no estuviera instalado, usar https://herd.laravel.com/windows. No instalar otro PHP a ciegas.

~~~powershell
Get-Command node,pnpm,corepack,git,php,composer -All
node --version
corepack --version
git --version
php --version
php --ini
php -m
composer --version
# Alternativa temporal, sin cambiar PATH global:
$env:Path = 'C:/Users/marcelo/.config/herd/bin;' + $env:Path
~~~

## Base y rol configurados: conexión autenticada verificada

El usuario creó tecnoweb18b y tecnoweb18b_app y corrigió privadamente DB_PASSWORD en backend/.env. Después de config:clear, SELECT 1 desde Laravel devolvió 1; current_database/current_user confirmaron esa base y ese rol en la misma conexión autenticada. API directa en 8001 y proxy Vite en 5173 devolvieron HTTP 200 con status=ok, api=ok, database=ok. El navegador real mostró Conexión verificada con Laravel y PostgreSQL y Consulta SELECT 1 exitosa. APP_KEY y .env no se modificaron durante la prueba. Esto no es una auditoría de todos los privilegios del rol; no se alteraron recursos.

### Diagnóstico opcional si reaparece un error (no pendiente actual)

El primer intento falló por contraseña incorrecta (SQLSTATE 08006, código PDO 7); quedó resuelto tras la corrección del usuario. Las comprobaciones siguientes se conservan como guía, no como pasos que deban ejecutarse ahora.

Comprobar privadamente contra la misma instancia:

~~~powershell
psql -h 127.0.0.1 -p 5432 -U tecnoweb18b_app -d tecnoweb18b -W -c 'SELECT current_user, current_database();'
~~~

Introducir la contraseña en el prompt, no en argumentos ni en el chat. Si psql también la rechaza, revisar con tu administrador el rol y su contraseña en esa instancia. Si psql funciona, revisar que DB_PASSWORD en .env represente exactamente ese valor; entrecomillar conforme a dotenv si contiene espacios o caracteres especiales como #. No enviar .env ni contraseña. No recrear la base/rol ni cambiar APP_KEY para resolver este error.

Con tu administrador local, ejecutar privadamente:

~~~powershell
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -W
~~~

En psql administrativo, comprobar exclusivamente los nombres actuales:

~~~sql
SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'tecnoweb18b_app';
SELECT datname, pg_get_userbyid(datdba) AS owner
FROM pg_database WHERE datname = 'tecnoweb18b';
~~~

Los recursos ya fueron creados según el usuario: no repetir CREATE ROLE/DATABASE. Solo si el administrador determina que debe restablecerse la contraseña del rol propio, puede hacerlo privadamente mediante el prompt:

~~~sql
\password tecnoweb18b_app
\quit
~~~

Este agente no ejecutó esas operaciones administrativas. Corregir privadamente backend/.env solo si corresponde: DB_DATABASE=tecnoweb18b, DB_USERNAME=tecnoweb18b_app y DB_PASSWORD correspondiente. No usar el administrador ni credenciales de otra aplicación en Laravel.

La prueba psql no sustituye SELECT 1 desde Laravel ni el navegador. Después de corregir la autenticación, repetir config:clear y reiniciar el servidor --no-reload. No repetir key:generate si la clave ya existe.

## Backend existente

Desde la raíz:

~~~powershell
Set-Location backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
composer install
composer check-platform-reqs
# Solo si APP_KEY aún está vacía; no rotar claves existentes:
if (Select-String -Path .env -Pattern '^APP_KEY=\s*$' -Quiet) { php artisan key:generate }
php artisan config:clear
php artisan --version
php artisan route:list --path=api
php artisan test --filter=HealthTest
php artisan serve --no-reload --host=127.0.0.1 --port=8001
~~~

8000 estaba ocupado por com.docker.backend.exe: no se detuvo ni se inspeccionó esa aplicación. 8001 es alternativa para nuestra prueba. No ejecutar migraciones para salud: no exige tablas.

El arranque sin --no-reload falló al escuchar en este entorno; con ese flag arrancó. Reiniciar Laravel después de editar .env. La configuración frontend/.npmrc acorta a 60 caracteres los nombres del store virtual pnpm para evitar errores de rutas largas en postinstall Windows, sin modificar versiones ni lockfile.

## Piloto A: migraciones y cuentas internas

Se inspeccionó el esquema real de tecnoweb18b: vacío y sin migraciones aplicadas. Después se aplicaron las tres migraciones originales del esqueleto y dos incrementales del piloto (habilitación de usuarios y personas/inscripciones/historial). No se ejecutó limpieza/reset en desarrollo; no se crearon catálogos ni tablas de documentos. En otras instalaciones comprobar primero schema/migrate:status; no asumir que el estado sea el mismo ni sobrescribir tablas.

~~~powershell
# Dentro de backend/, solo aplica migraciones pendientes:
php artisan migrate
# Preguntas interactivas, contraseña oculta; no pasar secretos en argumentos:
php artisan pilot:account
~~~

La habilitación se confirma explícitamente y no equivale a un rol institucional. El comando no modifica cuentas existentes ni imprime la contraseña. No se incluyeron cuentas ni contraseñas predeterminadas en desarrollo. La cuenta autenticada solo ve sus propias inscripciones; la persona registrada no se vincula automáticamente a una cuenta.

El cliente real usa cookies/CSRF de Sanctum, no los tokens/admin demo. SANCTUM_STATEFUL_DOMAINS=localhost:5173 es el default; usar localhost consistentemente en el navegador y proxy /api más /sanctum hacia 127.0.0.1:8001. CORS limita el origen y permite métodos/headers de auth y edición con credentials. No usar wildcard ni guardar secretos en VITE_ o localStorage.

## Tests PostgreSQL exclusivos

El usuario creó privadamente tecnoweb18b_test con acceso del rol del proyecto. PHPUnit fuerza APP_ENV=testing, DB_CONNECTION=pgsql, DB_DATABASE=tecnoweb18b_test y DB_URL vacío. No duplicar secretos en .env.testing: el rol/contraseña se leen privadamente del entorno existente, pero la base se fuerza. APP_CONFIG_CACHE separado evita usar cache de desarrollo.

~~~powershell
# Dentro de backend/:
php vendor/phpunit/phpunit/phpunit --configuration phpunit.xml
~~~

TestDatabaseGuard rechaza cualquier destino distinto de tecnoweb18b_test y exige diferencia respecto de DB_DATABASE de .env; comprueba driver/configuración actual, conexión y current_database(). UsesPilotTestDatabase revalida antes de RefreshDatabase y en migrateDatabases, con conexión pgsql explícita. Los tests de cambios de configuración prueban que una conexión cacheada no enmascare un destino peligroso. La comparación real de tablas/migraciones/counts de desarrollo antes/después de la suite dio idéntica; .env tampoco cambió. Nunca ejecutar fresh/reset/limpieza manual sobre tecnoweb18b.

### Navegador real sin credenciales públicas

El smoke test reproducible está en backend/tests/browser/pilot-flow.cjs. Se prepara con pilot:e2e-fixture únicamente en entorno testing y conexión exclusiva verificada; el comando crea dos cuentas ficticias con passwords aleatorias y escribe un archivo temporal privado, imprimiendo solo su ruta. No habilita un endpoint de fixtures ni cuentas predeterminadas. Para correrlo se necesitan Playwright/Chrome locales; en la verificación se usó el módulo ya disponible en el cache de playwright-cli, sin modificar dependencias frontend.

El proceso Laravel de E2E debe arrancarse con APP_ENV=testing y DB_DATABASE=tecnoweb18b_test, DB_URL vacío, cache independiente, SESSION_COOKIE de tests y --no-reload en 8001; Vite usa el proxy a ese puerto. El script recibe PILOT_E2E_CREDENTIALS (ruta privada, no contenido), PILOT_PLAYWRIGHT_MODULES (directorio con playwright) y PILOT_E2E_URL=http://localhost:5173. No ejecutar el script contra desarrollo ni compartir el archivo de passwords. Cerrar procesos propios y eliminar el temporal privado después; conservar solo el resumen de resultados sin secretos.

## Frontend en otra terminal

Desde la raíz:

~~~powershell
Set-Location frontend
$env:HUSKY = '0'
corepack pnpm --version # debe ser 9.15.4, no el global 11.1.2
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm test:run
corepack pnpm lint
$env:API_PROXY_TARGET = 'http://127.0.0.1:8001'
corepack pnpm dev
~~~

Abrir http://localhost:5173/estado-tecnico. Reiniciar Vite si cambia API_PROXY_TARGET. No guardar secretos en variables VITE_ ni instalar hooks upstream.

~~~powershell
$r = Invoke-WebRequest -Uri http://127.0.0.1:8001/api/health -Headers @{Accept='application/json'} -SkipHttpErrorCheck
$r.StatusCode
$r.Content
~~~

SkipHttpErrorCheck requiere PowerShell 7. 200 con database=ok debe proceder de consulta real autenticada de Laravel; 503 con api=ok/database=unavailable verifica API pero no base. Detener solo nuestro Laravel y pulsar Volver a comprobar debe mostrar error de API, no éxito anterior. No detener PostgreSQL compartido para probar fallos.

Resultado vigente del cierre 05/10/2026: SELECT 1 autenticado, Laravel en 8001, React en 5173, HTTP 200 directo y por proxy, y mensaje de conexión exitosa en navegador real. El anterior HTTP 503 por contraseña incorrecta permanece registrado como antecedente en 04-verificacion.md, no como bloqueo actual. No repetir key:generate ni recrear base/rol.
