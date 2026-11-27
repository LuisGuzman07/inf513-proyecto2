# Verificación técnica — Windows nativo, 05/10/2026

## Interfaz institucional del proceso A — evidencia vigente, 08/10/2026

Mejora visual sobre el recorrido rectificado, sin cambios de contratos ni permisos. Detalle y criterios en [interfaz-institucional-proceso-a.md](compose/spec/interfaz-institucional-proceso-a.md).

| Verificación | Resultado realmente obtenido |
| --- | --- |
| Backend búsqueda/filtros + suite completa | PASS 64 tests/797 assertions (incluye `TalentReviewSearchTest` 20 tests/248 assertions; fallo esperado 17/20 confirmado antes del fix) |
| Frontend `src/pilot` | PASS 63 tests (ui 20, review-design 13, portal-design 6, pilot 17, workflow 7); HTTP controlado, no sustituye integración |
| TypeScript | `tsc --noEmit` PASS (exit 0) |
| ESLint focal | PASS (exit 0, max-warnings 0) sobre `src/pilot`, `functional.tsx`, `side-nav.tsx`, `page-header` y `advanced-table` |
| Build | PASS (10507 módulos, 3m22s; avisos heredados Helmet/Sass/chunk grande) |
| Navegador real sobre `tecnoweb18b_test` aislado | PASS 12 grupos (registro→borrador→documentos→envío→revisión→corrección→reenvío, aislamiento, logout, health 200); 2 titulados, 5 cargas, 2 envíos, 2 observaciones |
| Capturas emparejadas | 18 before + 18 after del flujo (1440×960/390×844) en `verification-captures/interfaz-proceso-a/`; 6 adicionales de inicio/ingreso/registro (solo lectura, sin escrituras) |
| Desarrollo | Fingerprint idéntico antes/después en las tres ejecuciones de cierre; sin fresh/reset/limpieza ni cambios de APP_KEY |
| Revisión independiente | Conforme en spec/correctness/consistencia, sin críticos; brechas no críticas documentadas en el spec |

Deuda preexistente no resuelta: test locale de `utilities.test.ts` y lint global de demos de la plantilla. Brechas: concurrencia real y sincronización entre pestañas siguen sin evidencia. Sin commit/push/publicación.

## Rectificación A — evidencia vigente, 07/10/2026

El recorrido central ahora es autoservicio del titulado: registro e ingreso Sanctum SPA, cuenta distinta de persona, borrador, documentos privados, envío, revisión por personal habilitado, observaciones y corrección con historial. Layout Ant Design existente con topbar y sidebar del personal; sin DEMO ni explicaciones técnicas en recorridos reales. Los resultados del corte interno del 05/10 se conservan abajo como antecedentes, no como requisitos actuales.

### Resultados comprobados

| Verificación | Resultado realmente obtenido |
| --- | --- |
| Migración de rectificación | Una migración incremental aplicada después de inspeccionar esquema y datos; expediente original conservado como legado sin titular; ningún revisor concedido automáticamente |
| PHPUnit después del ajuste de historial | 44 PASS, 549 aserciones, 94.84 s; registro, borrador, documentos/versiones/rollback, envío/revisión/corrección, vínculo explícito, sesión/CSRF, guardas PostgreSQL y health; historial autorizado del personal y exclusión de borradores/asignaciones ajenas |
| Vitest focal del recorrido | 34 PASS, tres archivos pilot/workflow/ui, 59.88 s; HTTP controlado, no sustituye integración |
| Regresiones frontend posteriores a revisión | 37/37 PASS, pilot.test.ts y ui.test.tsx, pool=threads, un worker y testTimeout=15000; 138.78 s; 403/revalidación/races y navegación legacy de perfiles mixtos |
| TypeScript/lint focal posteriores | tsc --noEmit y ESLint session/layout/pilot.test/ui.test, max-warnings=0: PASS; formateo inicial ejecutado, comprobación extra Prettier interrumpida y no contada como PASS |
| Build final | corepack pnpm build: TypeScript + Vite completados, Vite 3m33s; bundle principal 3404.37 kB/1048.39 kB gzip; avisos heredados Helmet/Sass/chunk grande |
| Navegador real, ejecución privada final | PASS 12 grupos; dos titulados registrados por UI, cinco cargas, dos envíos y dos observaciones; persistencia al recargar, 422 sin escrituras parciales, 409, MIME/tamaño/pertenencia, descarga exacta, aislamiento, revisión/corrección/reenvío y logout |
| Escritorio/móvil | 18 capturas ficticias en verification-captures; 1280 y 390 px; se comprueba ausencia de desborde sin ocultarlo por overflow-x:hidden |
| Health en E2E | HTTP 200; API y PostgreSQL disponibles |

E2E final: backend/tests/browser/pilot-flow.cjs; resultado verificado 2026-10-07T13:18:53.882Z. Archivos adjuntos son PNG sintéticos, no documentos personales. Las versiones anteriores se conservan descargables con autorización. Provisión nacional y CV opcionales; equivalencia entre títulos pendiente. PPA declarado, sin cálculo ni rangos. La matriz de envío y los controles de revisión son decisiones operativas/técnicas, no aprobación institucional.

### Incidente de aislamiento y medidas

Un intento anterior de navegador alcanzó otro servidor del proyecto en el puerto 8001, no el runtime E2E previsto. Añadió accidentalmente **cuatro cuentas y cuatro expedientes ficticios a tecnoweb18b**. No se ejecutó fresh/reset ni limpieza general de desarrollo. La comprobación posterior contra el fingerprint previo confirmó intactos la cuenta, persona, expediente y evento originales. Inicialmente se conservaron los añadidos sin borrar, hasta obtener autorización expresa y selección exacta. La remediación autorizada y verificada se registra abajo; no afirmar que desarrollo quedó sin cambios durante todos los intentos.

Se añadió un preflight antes de altas de usuarios: autenticar y verificar el revisor aleatorio creado exclusivamente por pilot:e2e-fixture bajo entorno testing y guard de conexión. El puerto, el proxy o una respuesta health por sí solos no acreditan aislamiento. La ejecución final pasó ese preflight antes de las escrituras del recorrido. PHPUnit exige PostgreSQL tecnoweb18b_test y verifica configuración/destino efectivo inmediatamente antes de cada limpieza, incluso con PDO cacheado.

### Remediación autorizada — 07/10/2026

Marcelo confirmó expresamente retirar exclusivamente las cuatro cuentas y los cuatro expedientes ficticios del incidente, con asociados, después de comprobar IDs y ausencia de datos compartidos. Remediación puntual ejecutada, no limpieza general: 4 users, 4 people, 4 talent_registrations, 9 registration_events y 4 registration_documents retirados; 0 observations, sessions o password_reset_tokens asociados. Los cuatro archivos se movieron individualmente a cuarentena privada recuperable, sin mover carpetas completas ni borrar archivos desconocidos.

Preparación y aplicación revalidaron base real tecnoweb18b, IDs exactos, identidades ficticias, relaciones, versiones, FKs entrantes y ausencia de referencias desde datos no seleccionados. El original se bloqueó y revalidó dentro de la transacción; cualquier guard fallido impide el borrado o revierte la transacción. Complementos incluyen NULL para no omitir sesiones anónimas. Un respaldo de filas y copias de los cuatro archivos se comprobó antes de borrar; revisión independiente de las guardas y correcciones realizada antes de aplicar.

Verificación final: hashes de original y datos no seleccionados sin cambios; targets ausentes; integridad de filas exportadas, copias y archivos cuarentenados comprobada. Quedan 1 cuenta, 1 persona, 1 expediente y 1 evento originales; 0 documentos y 0 observaciones. HTTP real /api/health en 8001: 200, status/api/database=ok. ACL de los 18 elementos del respaldo validado: ningún permiso Allow a identidades distintas del usuario actual.

Respaldo fuera de Git: C:/Users/marcelo/AppData/Local/Temp/grupo18b-incident-recovery-00c7f3af8dc24fe3b034dabb038060e1/validated. Contiene rows.json, manifest.json, applied.json, files/ y quarantine/. No publicar: contiene hashes de autenticación y datos ficticios. Conservar o trasladar privadamente antes de limpiar temporales. Se verificó integridad, no se ensayó restauración sobre desarrollo. Script de una sola remediación fuera del repositorio, sin comando de limpieza general incorporado al backend.

El incidente se conserva como antecedente: remediarlo no significa que todos los intentos anteriores cumplieron aislamiento. El bloqueo por autorización pendiente está resuelto. No fresh/reset, cambios de esquema, APP_KEY, secretos expuestos, commits, push ni publicación. No se repitieron build/suites funcionales porque no cambió código de aplicación; resultados anteriores se conservan y health se volvió a comprobar.

### Revisión independiente y límites

La revisión estática independiente detectó historial del personal restringido por creador/titular, invalidación de sesión local para todo 403 y enlace legacy oculto a cuentas mixtas. Los tres puntos se corrigieron: historial aplica la política privada existente, un 403 de negocio revalida sesión/capacidades sin cerrar una sesión válida, y la navegación permite consultar legados propios también en cuentas mixtas. Segunda revisión estática focal sin nuevos hallazgos. Regresiones backend y frontend pasan. E2E completo y capturas corresponden a la ejecución previa a estos ajustes; no se presenta como una repetición posterior.

No hay evidencia de solicitudes claim/PATCH realmente simultáneas ni coordinación de logout entre pestañas inactivas. Locks/controles de versión presentes no sustituyen esas pruebas. La limpieza al salir/cambiar de cuenta fue comprobada dentro de la instancia del recorrido. Consentimiento/conservación, verificación de identidad/email y facultades institucionales definitivas siguen pendientes. Evaluación, admisión, publicación, OCR, IA y correo no implementados.

Build final y regresiones posteriores a revisión completados. Los primeros intentos de frontend con forks/los procesos atados a la terminal no finalizaron y no se cuentan como PASS; threads completó. La suite completa de frontend y el lint global no se reejecutaron en este cierre: fallo heredado de locale y deuda de demos siguen documentados, no resueltos. Lock pnpm SHA256 41717738e97387b87b18665bed78fa28124f3e2c2e397382c874115f7224f192 conservado. Servidores E2E propios 8002/5174 cerrados, servidores de desarrollo 8001/5173 preservados. Sin commit, push, publicación, regeneración de APP_KEY ni actualizaciones masivas.


## Incremento funcional A — evidencia de implementación, 05/10/2026

Sesión/cookies Sanctum SPA con CSRF real; captura interna, persona distinta de cuenta, nombre obligatorio como mínimo técnico; expedientes propios, consulta, edición con lock/version e historial privado. Habilitación explícita por comando interactivo y default-deny. Aislamiento por creador es control técnico provisional, no permisos institucionales aprobados. Facultad/carrera/área son textos declarados sin catálogos ni correspondencias impuestas; PPA no se calcula. Documentos, evaluación, publicación, OCR, IA y correo no se entregan.

| Verificación nueva realmente ejecutada | Resultado |
| --- | --- |
| Inspección de desarrollo antes de migrar | tecnoweb18b/tecnoweb18b_app, esquema public vacío, sin migraciones aplicadas |
| Base de tests creada privadamente por el usuario | tecnoweb18b_test accesible, CREATE de esquema disponible |
| Guard con conexiones reales | rechaza desarrollo antes de operaciones; acepta solo destino test configurado/actual distinto de desarrollo |
| migrate:status / migrate --pretend / migrate --force | status sin tabla inicial; pretend preparó repositorio de migraciones y mostró SQL; force aplicó 3 originales + 2 incrementales. No fresh/reset en desarrollo |
| Tests de configuración mutable/conexión cacheada | 3 casos fallaron antes del fix sin limpiar tablas; después todos rechazan driver/DB/URL peligrosos, con revalidación en el punto de limpieza |
| PHPUnit completo después del fix | 34 pruebas, 255 aserciones, exit 0, 12.033s; cookies/sesión real, CSRF activo incluso bajo PHPUnit, aislamiento, rollback/version/historial/cuentas/guards/HealthTest |
| Comparación desarrollo antes/después de PHPUnit | tablas, migraciones y counts users/people/registrations/events idénticos; .env idéntico sin publicar hash |
| Vitest completo con 2 forks | 36 pasan / 1 fallo heredado, 7 archivos, 90.19s; piloto 19 pruebas pasan con respuestas controladas, no prueba de integración por sí solas |
| ESLint archivos cambiados (piloto/App/rutas/signup/Vite) | exit 0; sin warnings |
| ESLint global JSON final | exit1, 82 errores/4 warnings heredados; baseline84/4. Dos any de signup retirados al quitar logs de credenciales; no limpieza masiva ni errores nuevos |
| Build final tsc + Vite | completado, EXIT_CODE=0, Vite 5m 5s; bundle ~3.38 MB / 1.04 MB gzip con advertencias heredadas |
| Navegador real Playwright, ocho comprobaciones | PASS; demo/token no autentica, login inválido/válido, CSRF419, guardar/recargar/consultar, editar/historial1–2, conflicto409 con versión3 sin evento extra, cuenta B sin datos/caché de A, logout, health200 y viewport390 sin desborde |
| /api/health por proxy durante E2E | HTTP200 status=ok, api=ok, database=ok |
| Salud final de desarrollo mediante HTTP kernel Laravel | conexión comprobada tecnoweb18b, HTTP200 status=ok/api=ok/database=ok; no se presenta como nueva prueba TCP de navegador |
| Composer lock | solo Sanctum4.3.3 nuevo; cero paquetes actualizados/eliminados; plataforma PHP8.4.26 |
| pnpm lock | SHA256 41717738e97387b87b18665bed78fa28124f3e2c2e397382c874115f7224f192 conservado |

E2E real usó exclusivamente tecnoweb18b_test. El servidor E2E arrancó en testing con guard PostgreSQL, cookie propia y 8001 --no-reload; Vite con proxy 127.0.0.1:8001. Cuentas con passwords aleatorias en temporal privado, no argumentos/defaults. Script reproducible backend/tests/browser/pilot-flow.cjs; no mocks de auth/persistencia. Los tests UI sí controlan HTTP para probar races/cancelación y no se presentan como integración real. No se crearon cuentas de desarrollo automáticamente: usar pilot:account privadamente.

Se reprodujo y corrigió un desborde móvil del Container con ancho100% más padding (399 px sobre viewport390); fix scoped border-box/max-width y medición final375 px sin elementos fuera de pantalla. Las migraciones, directorios y cuentas del semestre anterior no se inspeccionaron ni reutilizaron. Se quitaron logs de formularios con password de la demo signup; no se conservaron credenciales reales en frontend, VITE_, Git ni localStorage.

PRE-EXISTING LOCALE-NUMBER-TEST: utilities.test.ts:7 sigue esperando comas con toLocaleString() sin locale, que Windows devuelve con puntos. No se arregló por ajeno al incremento. Los avisos Routerv7, anotaciones react-helmet-async, Sass legacy y chunk grande se mantienen identificados como heredados.

Verificación y revisión fueron secuenciales: procesos pesados de tests/build/E2E terminaron y servidores/navegador propios se cerraron antes de la revisión independiente. Un actor nuevo, del mismo modelo que los implementadores, confirmó cumplimiento/corrección/consistencia sin nuevos CRITICAL. No repitió tests pesados ni leyó .env/datos. Brechas no bloqueantes registradas: falta test focal de fallo de historial durante PATCH y dos PATCH simultáneos; transacción/lock y conflictos/rollback sí probados. El conteo final82/4 de ESLint se ejecutó después para cerrar su observación informativa, sin cambios de código ni necesidad de nueva revisión.

Rama feat/talento-piloto sin commits/SHA: comparación contra snapshot de archivos previo, no rango Git inventado. Sin commit/push/publicación, sin APP_KEY regenerada, sin recreación de base/rol. Contraseñas temporales de cuentas ficticias eliminadas; artefactos de navegador movidos fuera de Git, sin borrar fuentes del usuario. Nuestros puertos8001/5173 quedaron libres y 8000 ajeno sigue escuchando. Los quince bloques PowerShell de README/preparación se analizaron sin ejecutar: cero errores de sintaxis. El [documento del incremento](compose/spec/inscripcion-talento-expediente-privado.md) contiene contratos, tareas completas y reporte de entrega. Los resultados anteriores siguientes son históricos y no sustituyen este incremento.

## Cierre vigente: conexión autenticada verificada — 05/10/2026

El usuario corrigió privadamente DB_PASSWORD. Se ejecutó config:clear y se repitió la verificación en Windows nativo/PowerShell, usando la base tecnoweb18b y el rol tecnoweb18b_app. El bloqueo de autenticación del intento anterior quedó resuelto; no se recrearon recursos ni se regeneró APP_KEY.

| Comprobación de cierre | Resultado real |
| --- | --- |
| php artisan config:clear, dentro de backend/ | éxito |
| SELECT 1 desde Laravel/Tinker | result=1, conexión PostgreSQL autenticada |
| Identidad consultada desde la misma conexión Laravel | current_database=tecnoweb18b, current_user=tecnoweb18b_app |
| Laravel serve --no-reload --host=127.0.0.1 --port=8001 | arranque real; el proceso ajeno de 8000 no se detuvo |
| React con API_PROXY_TARGET=http://127.0.0.1:8001 | arranque real en localhost:5173 |
| GET http://127.0.0.1:8001/api/health | HTTP 200, status=ok, api=ok, database=ok |
| GET http://localhost:5173/api/health por Vite | HTTP 200, mismo contrato; proxy real comprobado |
| Navegador real headed en /estado-tecnico | Conexión verificada con Laravel y PostgreSQL. |
| Campos de la pantalla | API Laravel: Disponible; PostgreSQL: Consulta SELECT 1 exitosa |
| Secretos y APP_KEY | no impresos; .env sin editar, hash antes/después de consulta y config:clear idéntico, sin publicarlo |

HTTP directo/proxy comprobados a las 13:04:03 UTC-04; snapshot del navegador a las 17:04–17:05 UTC. Playwright se usó para navegación/snapshot real, sin interceptar ni simular respuestas. Evidencia temporal de navegador en la sesión grupo18b-success; no se añadieron dependencias al proyecto.

**Recorrido técnico real React → Laravel → PostgreSQL verificado.** La instalación/build y las pruebas técnicas documentadas en la preparación anterior, más los mensajes de API/base no disponibles ya comprobados, se conservan como evidencia. No se volvieron a instalar dependencias ni a ejecutar build/lint/tests en este cierre: no cambió el código. La deuda lint y el test heredado dependiente del locale siguen registrados; este cierre no los presenta como corregidos.

TuCafé continúa pendiente de permiso, sin eludirlo; no bloquea la base propia. SMTP/POP3, OCR, IA y funciones de negocio no se implementaron ni se verificaron en esta tarea. Sin cambios de base/rol, APP_KEY, dependencias o proyectos; sin commit, push ni publicación.

Al terminar se cerraron exclusivamente nuestros procesos Laravel/Vite y el navegador grupo18b-success. Puertos 8001/5173 sin listeners de la prueba; el proceso ajeno de 8000 sigue activo (mismo PID observado antes/después). .env sigue ignorado por Git y pnpm-lock.yaml conserva SHA-256 41717738e97387b87b18665bed78fa28124f3e2c2e397382c874115f7224f192.

## Intento anterior de cierre autenticado — 05/10/2026 (histórico, resuelto)

El usuario informó la creación de la base tecnoweb18b y el rol tecnoweb18b_app y configuró privadamente .env. Se trabajó exclusivamente en PowerShell/Windows nativo, sin reinstalar dependencias ni regenerar proyectos.

| Comprobación nueva | Resultado real |
| --- | --- |
| php artisan config:clear en backend/ | éxito |
| Configuración efectiva de Laravel, sin imprimir secretos | pgsql, 127.0.0.1:5432, tecnoweb18b, tecnoweb18b_app; contraseña no vacía, DB_URL ausente, APP_KEY existente |
| SELECT 1 autenticado desde Laravel/Tinker | falló: PostgreSQL rechaza autenticación por contraseña; SQLSTATE 08006, código PDO 7 |
| Diagnóstico sin mensaje SQL completo | excepción PDO reconoce autenticación/password y FATAL del servidor; no es una prueba exitosa ni solo un puerto abierto |
| Laravel --no-reload, 127.0.0.1:8001 | iniciado; proceso ajeno en 8000 no detenido |
| React con API_PROXY_TARGET=http://127.0.0.1:8001 | iniciado en localhost:5173 |
| GET http://127.0.0.1:8001/api/health | HTTP 503, {status: degraded, api: ok, database: unavailable} |
| GET http://localhost:5173/api/health por proxy real | mismo HTTP 503 y contrato |
| Navegador real /estado-tecnico, Playwright headed | Laravel disponible; PostgreSQL no disponible; API Disponible / PostgreSQL No disponible |
| APP_KEY y .env | no se ejecutó key:generate ni se editó .env; hash de .env antes/después de config:clear/consulta idéntico, sin mostrarlo |

**Cierre bloqueado por autenticación PostgreSQL.** No se obtuvo HTTP 200, SELECT 1 exitoso ni mensaje de conexión exitosa. No se afirma que falte el recurso ni que la contraseña esté vacía: el servidor rechaza la autenticación con la configuración actual. Revisar privadamente contraseña/instancia y representación dotenv según [06-preparacion-windows.md](06-preparacion-windows.md). No se cambiaron credenciales, APP_KEY, roles, bases, dependencias ni negocio; no hubo commit/push/publicación.

Los nombres grupo18b/grupo18b_app y los resultados sin contraseña en la sección anterior de preparación son históricos, no la configuración actual. La deuda de lint/locale de plantilla documentada sigue aparte; no se reejecutaron build/lint/tests porque esta continuación solo valida conexión y documentación.

Se cerraron exclusivamente los procesos propios de Laravel/Vite y la sesión de navegador grupo18b-cierre. No quedan listeners propios en 8001/5173; el proceso ajeno en 8000 sigue activo. .env sigue ignorado; lock pnpm conserva el hash registrado. Los doce bloques PowerShell de README y preparación se analizaron sintácticamente sin ejecutarlos: cero errores.

## Estado de la preparación anterior (evidencia conservada)

Frontend reinstalado y build completado en Windows. Backend existente instalado, Laravel 12.69.3 resuelto en composer.lock, APP_KEY generada y contrato probado. Recorrido real React → Laravel verificado en navegador para base no disponible y API detenida. **NO verificado el recorrido exitoso React → Laravel → PostgreSQL autenticado:** faltan rol/base propios confirmados y credenciales privadas. No considerar terminada la verificación completa.

TuCafé sigue pendiente por su permiso de lectura, sin reintentos ni elusión; no es bloqueo para nuestra base. No se implementaron funcionalidades de negocio, migraciones, SMTP/POP3, OCR ni IA. No hubo commit, push ni publicación.

## Entorno PowerShell observado

PowerShell 7.6.6; herramientas nativas, sin WSL en esta preparación.

| Herramienta | Resolución efectiva | Versión |
| --- | --- | --- |
| Node | C:/nvm4w/nodejs/node.exe; también existe C:/Program Files/nodejs/node.exe en PATH | 22.14.0 |
| Corepack | C:/nvm4w/nodejs/corepack.cmd | 0.31.0 |
| pnpm global | C:/nvm4w/nodejs/pnpm.ps1 | 11.1.2; NO usado para instalar |
| pnpm del proyecto | corepack pnpm dentro de frontend/ | 9.15.4 |
| Git | C:/Program Files/Git/cmd/git.exe | 2.49.0.windows.1 |
| PHP | Herd: C:/Users/marcelo/.config/herd/bin/php.bat → php84/php.exe | 8.4.26 NTS, Visual C++ 2022 x64 |
| Composer | Herd: bin/composer.bat → composer.phar usando ese PHP | 2.10.2 |
| psql | C:/Program Files/PostgreSQL/17/bin/psql.exe | cliente 17.6; servidor no autenticado/versionado |

Al comenzar PHP/Composer no estaban en PATH. Se encontró Herd instalado y abierto mientras se completaba su preparación; luego fueron utilizables por ruta explícita y por PATH. No se instaló otro PHP ni se alteró globalmente PATH. INI efectivo: C:/Users/marcelo/.config/herd/bin/php84/php.ini. php -m confirmó pdo_pgsql, pgsql y extensiones necesarias. rg no está disponible en esta terminal: se usaron Get-ChildItem/Get-Content/Select-String.

## Resultados realmente obtenidos

| Comprobación | Resultado Windows |
| --- | --- |
| Lectura inicial README y docs/01–04 | realizada antes de preparar dependencias |
| MCP Notion, proyecto y subpáginas 01–09 | leídas; registro y límites en 05-fuentes-notion.md |
| Inspección de node_modules heredado | binarios linux-x64 y store /mnt/c/.pnpm-store/v3 confirmados |
| Reinstalación corepack pnpm install --frozen-lockfile con HUSKY=0 | terminada; última repetición Already up to date, Done in 6s |
| Store nativo | C:/Users/marcelo/AppData/Local/pnpm/store/v3; binarios Windows SWC/esbuild/Parcel/Rollup |
| Lock pnpm SHA-256 | 41717738e97387b87b18665bed78fa28124f3e2c2e397382c874115f7224f192, idéntico antes/después |
| corepack pnpm build | completado en la raíz frontend nativa; tsc + Vite, 10460 módulos, Vite 1m 13s |
| corepack pnpm test:run | 17 pasan / 1 falla heredada por locale, 5 archivos, 18.61s |
| Vitest restringido a healthService y technical-status | 9/9 pasan, 2 archivos, 10.17s |
| corepack pnpm lint / ESLint JSON | 84 errores y 4 warnings: mismos totales documentados en plantilla original |
| ESLint siete archivos integración, --max-warnings 0 | código de salida 0 |
| composer install --no-interaction --prefer-dist | completado; autoload optimizado, package:discover ejecutado; repetición desde lock sin cambios de paquetes |
| composer validate --no-check-publish | válido |
| composer check-platform-reqs | todos los requisitos declarados pasan; pdo_pgsql comprobado además por php -m |
| php artisan key:generate / config:clear | éxito, sin imprimir clave; .env sigue ignorado |
| php artisan --version | Laravel Framework 12.69.3 |
| php artisan route:list --path=api | GET/HEAD api/health → HealthController |
| php -l sobre PHP local de app/bootstrap/config/routes/tests | sin errores de sintaxis |
| php artisan test --filter=HealthTest | 4 pruebas pasan, 19 aserciones, 0.53s; DB mock solo prueba contrato |
| psql -h 127.0.0.1 -p 5432 -U grupo18b_app -d grupo18b -w | fe_sendauth: no password supplied; NO acredita existencia del rol/base |
| SELECT 1 desde Laravel por Tinker, error ocultado | conexión no disponible; NO verificado éxito autenticado |
| Laravel serve en 8001 con --no-reload | arranque nativo comprobado; 8000 ajeno ocupado por Docker |
| HTTP real /api/health | 503, status=degraded, api=ok, database=unavailable; sin secretos |
| React Vite localhost:5173, proxy a 8001 | arranque real comprobado |
| Navegador /estado-tecnico con API activa | Laravel disponible; PostgreSQL no disponible; API Disponible / PostgreSQL No disponible |
| Detención exclusiva de nuestro Laravel y reintento del navegador | No se pudo verificar la conexión con la API; ambos estados Sin verificar |

Build conserva advertencias heredadas: anotaciones react-helmet-async, API Sass y chunk >500 kB (~3.36 MB / 1.03 MB gzip). No hubo optimización masiva. React Router emite avisos v7 en tests; no se migró.

## Correcciones limitadas y errores heredados

La instalación con nombres largos del store virtual falló en postinstall con -4058. Se añadió frontend/.npmrc con virtual-store-dir-max-length=60; mismos paquetes/lock. La reinstalación terminó con postinstall Windows correctos, metadatos nativos y hooks omitidos. Las dependencias antiguas se movieron, no se borraron: respaldo recuperable en C:/Users/marcelo/AppData/Local/Temp/grupo18b-wsl-deps-10116f4ccb0d482d83fa59fd6ae1d5f0 (node_modules WSL y node_modules.windows-longpaths). El respaldo no contiene un nuevo proyecto ni debe versionarse.

Los límites de ejecución interrumpieron varios intentos de instalación/build. Los resultados exitosos de arriba corresponden a ejecuciones posteriores terminadas, no a las interrumpidas. Para los comandos largos y servidores se usaron procesos Windows con consola separada y registros temporales; no shell Linux. Build quedó en C:/Users/marcelo/AppData/Local/Temp/grupo18b-build.log y cierre de instalación en grupo18b-pnpm-final.log. No contienen credenciales.

La primera HealthTest falló porque exigía ausencia del header CORS para un origen distinto. La versión resuelta de Fruitcake usa el único origen permitido como header fijo; un navegador de otro origen lo rechaza por discordancia. Se corrigió SOLO esa expectativa en tests/Feature/HealthTest.php para comprobar el origen fijo permitido; no se amplió CORS ni se modificó vendor. Reejecución 4/4 exitosa.

El nuevo fallo de la suite completa es src/utils/__tests__/utilities.test.ts:7: toLocaleString() sin locale explícito devuelve puntos en este Windows, mientras el test espera comas. Se confirmó SHA-256 idéntico de ese archivo contra la fuente original de plantilla, sin modificarla. Es deuda de portabilidad heredada, no fallo de los nueve tests de nuestra integración. No se ocultó configurando un locale artificial.

La deuda lint global sigue en demos; los siete archivos de integración no tienen errores/warnings. En esta continuación no se editaron TS/TSX ni se limpió la plantilla. El único cambio de código es la expectativa del test PHP, además de la configuración pnpm de rutas Windows.

Laravel serve sin --no-reload falló al escuchar en 8001 (reason: ?); el mismo puerto arrancó con --no-reload. No se atribuye a PostgreSQL ni se afirma una causa de sistema no probada. Reiniciar Laravel tras cambios de .env; comandos PowerShell en 06-preparacion-windows.md.

## Bloqueo anterior de preparación (histórico; actualizado arriba)

Preparar privadamente base grupo18b y rol grupo18b_app propios con tu administrador, comprobando existencia/propiedad antes de crear, y completar DB_USERNAME/DB_PASSWORD en backend/.env. Procedimiento exacto en [06-preparacion-windows.md](06-preparacion-windows.md). No se intentaron credenciales TuCafé, no se alteraron otras bases y no se solicitaron secretos por chat.

Después: config:clear, iniciar Laravel con --no-reload en 8001 y Vite con API_PROXY_TARGET correspondiente; exigir HTTP 200 y database=ok más mensaje de éxito en navegador. Un puerto abierto, DB mock o SELECT 1 de psql no sustituye esa evidencia.

Al cerrar se detuvieron exclusivamente los procesos propios Laravel/Vite y la sesión de navegador grupo18b. No quedan listeners de la prueba en 5173/8001; Docker, Herd y PostgreSQL se conservaron. .env/vendor/node_modules/dist siguen ignorados; no hay .git internos. El árbol ya era completamente no versionado al iniciar y no se añadieron archivos al índice.

---

# Informe anterior conservado — preparación WSL, 05/10/2026

El contenido siguiente es histórico. Sus versiones, bloqueos y resultados no reemplazan el estado Windows vigente de arriba.

## Estado de entrega

Frontend instalado y código verificado. Backend preparado como esqueleto oficial/API, pero NO instalado ni ejecutado. La integración real React → Laravel → PostgreSQL y el análisis detallado de TuCafé están bloqueados. No considerar terminada la verificación completa de la base.

## Entorno observado

WSL2 Linux sobre disco C: montado en /mnt/c. Node v24.18.0, npm 11.16.0; pnpm efectivo 9.15.4 dentro de frontend/ usando Corepack. El pnpm encontrado en PATH apuntaba a Windows: no se utilizó para instalar el proyecto. Corepack fuera de frontend/ seleccionó 12.9.1 en una consulta inicial; dentro del proyecto respeta packageManager=pnpm@9.15.4. No se cambió esa declaración.

php --version y composer --version: command not found. Get-Command en Windows no encontró PHP/Composer en PATH. Las búsquedas realizadas no localizaron un runtime utilizable; no se garantiza que no exista en otra carpeta. Docker no está integrado en esta distribución WSL. No se instalaron paquetes del sistema ni se eludieron requisitos de plataforma.

Cliente PostgreSQL Windows: 17.6. pg_isready sobre 127.0.0.1:5432 en Windows informó «aceptando conexiones». Esto no confirma versión del servidor, credenciales, existencia de grupo18b ni acceso desde PHP/WSL.

## Comandos ejecutados y resultados

| Comando / comprobación | Lugar | Resultado |
| --- | --- | --- |
| pwd, listado, rg --files, git status --short | raíz | Git existente, carpetas vacías; sin modificaciones previas |
| Lectura de AGENTS.md, CLAUDE.md, package.json, lock, rutas, servicios y proveedores | fuente React | realizada sin modificar fuente |
| rsync con exclusiones | fuente → frontend/ | copia realizada; sin Git interno ni dependencias de fuente |
| HUSKY=0 corepack pnpm install --frozen-lockfile | frontend/ | terminó: Done in 9m 15.8s; hooks desactivados |
| HUSKY=0 corepack pnpm install --frozen-lockfile | copia original temporal en Linux | pasó antes de modificar el frontend; sin regenerar lock |
| corepack pnpm build (tsc && vite build) | copia original sin cambios | pasó, 10458 módulos, Vite 38.05s |
| corepack pnpm build | copia final temporal sincronizada desde frontend/ | pasó, código de salida 0, 10460 módulos, Vite 51.10s |
| corepack pnpm build | frontend/ en /mnt/c | TypeScript terminó y Vite inició; se interrumpió por lentitud tras más de 13 minutos. NO se reporta como build local completado |
| corepack pnpm test:run | frontend/ | 5 archivos, 18 pruebas pasaron; 365.03s |
| corepack pnpm test:run | copia final temporal Linux | 5 archivos, 18 pruebas pasaron; 15.41s |
| corepack pnpm lint | frontend/ | falló: 84 errores y 4 warnings |
| corepack pnpm lint | copia original sin cambios | falló con exactamente 84 errores y 4 warnings, confirmando deuda heredada |
| ESLint restringido a los siete archivos TS/TSX nuevos/modificados | copia final | pasó con --max-warnings 0 |
| Prettier --write sobre archivos TS/TSX nuevos/modificados | frontend/ | ejecutado; sin formateo masivo |
| curl del tarball oficial laravel/laravel v12.0.0 y tar --strip-components=1 | backend/ | esqueleto oficial obtenido sin otro nivel de proyecto ni Git interno |
| php --version; composer --version | WSL | ambos ausentes; no se pudo instalar/ejecutar Laravel |
| psql.exe --version | Windows desde WSL | psql (PostgreSQL) 17.6 |
| pg_isready.exe -h 127.0.0.1 -p 5432 | Windows desde WSL | servidor acepta conexiones; no acredita autenticación |
| cmp package.json, pnpm-lock.yaml, LICENSE, README.md contra fuente | frontend/ | idénticos; no se actualizaron dependencias ni atribuciones |
| git check-ignore | raíz | .env, .env.local, node_modules y dist ignorados; .env.example versionables |
| Comprobación de .git internos | frontend/, backend/, docs/ | no existen |

Comando de lint restringido, dentro de una copia idéntica del frontend:

~~~sh
corepack pnpm exec eslint src/pages/technical-status.tsx src/pages/__tests__/technical-status.test.tsx src/services/api/healthService.ts src/services/api/__tests__/healthService.test.ts src/App.tsx src/routes/routes.tsx vite.config.ts --max-warnings 0
~~~

El build inicial sobre /mnt/c y un traslado de dependencias generadas se interrumpieron por límites/lentitud. La instalación se reanudó y terminó; no se trasladó el proyecto ni se dejó un enlace a dependencias temporales. Para aislar el costo del sistema de archivos se verificaron también copias descartables en /tmp, primero el frontend original y después el código final, con su mismo gestor y lock. Estas copias no son otro proyecto dentro del repositorio. Los procesos de verificación propios se cerraron; no se inició ningún servidor persistente ni se hizo push.

Hash SHA-256 del lock conservado: 41717738e97387b87b18665bed78fa28124f3e2c2e397382c874115f7224f192.

## Advertencias y correcciones

Build original y final advierten bundle mayor de 500 kB (final ~3.36 MB sin comprimir / ~1.03 MB gzip), anotaciones de react-helmet-async y API Sass heredada. No se hizo una optimización/refactor masivo. Las pruebas de interfaz emiten avisos de futuras opciones de React Router v7: no se migró el router.

El manifest dice versión 2.0.2; conserva metadata upstream _id con 1.1.0, que aparece en los encabezados de pnpm. No se confundió esa etiqueta con las versiones reales de dependencias.

La prueba inicial de reintento manual falló por el nombre accesible transitorio del icono de carga de Ant Design. Se agregó una etiqueta accesible estable al botón y se volvieron a ejecutar las 18 pruebas: todas pasaron.

El lint global contiene any, variables sin uso y una directiva eslint-disable sobrante en demos originales. Se verificó la misma deuda en la copia original; los archivos cambiados pasan el lint restringido. No se utilizó --no-verify ni se hizo commit.

## Verificaciones NO ejecutadas

- composer install/check-platform-reqs; generación de APP_KEY y composer.lock; versión resuelta del framework.
- Lint/sintaxis PHP con runtime, pruebas Laravel HealthTest y route:list.
- SELECT 1 desde Laravel con credenciales locales; migraciones (no necesarias para salud).
- Inicio de ambos servidores y verificación real React → Laravel → PostgreSQL en navegador.
- SMTP, POP3, OCR, IA y cualquier función de negocio.
- Inspección detallada de TuCafé: herramienta de lectura del agente rechazada por permisos.

Las seis pruebas del servicio HTTP y tres de la pantalla usan respuestas controladas SOLO para testear contrato e interfaz. Las pruebas Laravel preparadas usan un mock de DB: tampoco acreditan una conexión real. No hay un endpoint mock de salud ni una integración ficticia presentada como real.

## Bloqueos y qué hace falta

1. Ruta/utilización de PHP >=8.2 y Composer 2 en el entorno elegido, con las extensiones de Laravel y pdo_pgsql. Si no están instalados, acordar su instalación o habilitar un entorno existente. La elección Laravel 12 permanece provisional hasta comprobar esa plataforma.
2. Base PostgreSQL dedicada y rol del proyecto; configurar host, puerto, nombre, usuario y contraseña PRIVADAMENTE en backend/.env. No enviar secretos por chat. APP_KEY local generada por Artisan.
3. Habilitar lectura de la fuente TuCafé para completar el análisis de instrucciones, arquitectura, integración y condiciones académicas. No se eludió el rechazo de la herramienta.

Después (recomendación histórica): composer install, check-platform-reqs, key:generate únicamente con APP_KEY vacía, HealthTest, route:list, arranque API/SPA y GET /api/health con SELECT 1 real. Comandos exactos en el README raíz. Los criterios PPA, fórmulas y permisos institucionales siguen pendientes para el trabajo funcional; no bloquean esta comprobación técnica.
