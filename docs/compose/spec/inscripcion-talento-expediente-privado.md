---
feature: inscripcion-talento-expediente-privado
status: completed
updated: 2026-10-07
branch: feat/talento-piloto
commits:
---

# Proceso A — inscripción del titulado y revisión privada

## Report

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


## [S1] Rectificación, fuentes y trazabilidad

El flujo central corresponde al propio titulado: registro de cuenta, ingreso, datos/documentos, borrador y envío; personal realiza revisión, observaciones y pide corrección. Captura interna/own-creator/nombre único mínimo/documentos diferidos del 05/10 fueron decisiones técnicas de un corte provisional, no requisitos institucionales. Se conserva abajo su reporte sin presentarlo como recorrido definitivo.

Fuentes releídas antes de editar: [Notion07](https://app.notion.com/p/3ef2585d73c181a08dcac0975d4c7fe6), última edición 07/10/2026 03:44:13.750 UTC; [Notion09](https://app.notion.com/p/3ef2585d73c1816ca221dbbeb3b0b4ee), 07/10/2026 03:44:12.664 UTC. Aclaración 06/10 y fuentes S10/S11/transcripción reaportada consolidadas allí; fecha de reunión pendiente. Respuestas completas con cierre, sin indicadores informados de truncamiento; no se afirmaron binarios releídos ni acta aprobada. No escribir Notion ni renumerar/aprobar RF v2.

- Expresado por Administración: titulado se inscribe/aporta archivos; datos personales/académicos, contacto necesario, PPA respaldado por histórico; histórico/CI/foto/título académico; CV si existe y provisión nacional opcional oralmente; revisión humana. No estado civil obligatorio, sin experiencia, antigüedad máxima ni baremos inventados.
- Instrucción actual de Marcelo: implementar autoservicio/documentos/envío/revisión/corrección con layout existente, retirar DEMO/técnicos del recorrido, conservar datos/APP_KEY y tests exclusivos. Registro no concede funciones administrativas.
- Decisión operativa confirmada mediante pregunta: al enviar exigir nombre, nacimiento, registro universitario, sexo, carrera, correo, teléfono, PPA declarado, área de preferencia y respuesta sí/no a movilidad provincia/departamento/país. Facultad opcional declarada. Esto es decisión de trabajo del usuario basada en datos solicitados; obligatoriedad institucional formal sigue pendiente.
- Propuestas técnicas: campos/estados/capabilities, un expediente A activo por cuenta para este corte, versión transaccional, formatos/tamaño, toma de revisión y vínculo individual CLI auditado. No permisos institucionales ni admisión/publicación.

Se mantiene raíz existente por AGENTS.md, rama sin HEAD/commits; snapshot previo filesystem para review. Sin worktree nuevo ni commit/push/publicación. Cambia alcance A01/A02/A03/C01/C02/C11; C13 oficial y demás RF no se aprueban por esta tarea.

## [S2] Matriz de datos y documentos

Guardar borrador valida tipo/formato/límites de lo presente, no completitud. Enviar valida completitud con matriz operativa confirmada. Persona.full_name puede faltar en borrador; no presentar mínimo anterior como regla institucional. Los datos y archivos continúan privados.

| Campo | Fuente | Borrador | Enviar |
| --- | --- | --- | --- |
| full_name | 07/09 datos inscripción | opcional/null, texto200 | requerido, trim no vacío |
| birth_date | datos solicitados | opcional, ISO YYYY-MM-DD no futura | requerido, sin edad mínima |
| university_registration | datos solicitados | texto64/null, preservar ceros | requerido, sin unicidad institucional supuesta |
| sex | datos solicitados | texto64/null, sin enum inventado | requerido por decisión operativa, no filtro |
| career | datos solicitados | texto200/null | requerido, declaración no verificada; puede elegirse del catálogo UAGRM o declararse manualmente como excepción |
| faculty | catálogo de trabajo UAGRM (18 facultades, sin aprobación institucional) | texto200/null | opcional, no imponer vínculo con carrera; puede elegirse del catálogo |
| contact_email/contact_phone | contacto necesario | emailRFC254/texto50/null | requeridos, sin dominio ni país obligatorio |
| declared_ppa | debe declararse y respaldarse | texto64/null | requerido, sin escala/rangos/cálculo |
| interest_area | preferencia solicitada | texto200/null | requerido, no limitación de profesión |
| mobility.province/department/country | traslado solicitado | boolean/null por clave | cada respuesta true/false requerida; no informado!=no |

| Tipo documento API | Procedencia | Enviar | Técnica de carga |
| --- | --- | --- | --- |
| historico | histórico/PPA | requerido | PDF/JPEG/PNG |
| ci | respaldo identidad | requerido | PDF/JPEG/PNG |
| fotografia | respaldo formulario | requerida | JPEG/PNG |
| titulo_academico | respaldo titulación | requerido | PDF/JPEG/PNG |
| provision_nacional | oralmente opcional | opcional; no sustituye título automáticamente | PDF/JPEG/PNG |
| cv | si tiene | opcional | PDF/JPEG/PNG |

Máximo10 MiB por archivo, detección MIME y extensión coherentes, nombre seguro generado, seis tipos/versiones: decisiones técnicas de almacenamiento, no exigencias institucionales. No certifica autenticidad ni psicometría. Equivalencia título académico/provisión nacional pendiente. No agregar documentos nuevos por intuición. Consentimiento/conservación y uso real requieren definición; fixtures ficticios para pruebas.

## [S3] Creador, titular, revisor y migración no destructiva

Inspección real previa: tecnoweb18b con5 migraciones aplicadas, una cuenta/persona/inscripción/evento. No leer/imprimir PII ni borrar datos. Añadir incrementalmente users.is_graduate=false, users.can_review_talent=false y person_id nullable FKpeople; esas flags no son mass-assignable. Registro público asigna graduate=true/review=false/pilot_enabled=true en servidor, no por entrada. No auto-habilitar revisores antiguos.

Añadir registration.holder_user_id/reviewer_user_id nullable FKusers, status, submitted_at; originales conservan creator/updated_by/person/version y quedan legacy_internal, sin titular inferido. Nuevos borradores selfservice: creador y titular explícitos=request.user, persona distinta enlazada por FKusers.person_id; ninguna búsqueda por nombre/email. Un expediente A por titular en este corte evita editar persona compartida entre casos sin historial consistente; re-inscripción/múltiples carreras posterior pendiente, no regla institucional.

Vincular legado con comando privado individual por UUID expediente, ID titular e ID cuenta técnica responsable; verificar que no haya otro titular/persona/expediente incompatible y exigir confirmación explícita de identidad comprobada fuera del sistema. Si la cuenta antigua no es graduate, habilitarlo solo por confirmación explícita de ese caso. Registrar holder_linked y actor, mantener creador e historial; no SQLupdate masivo ni identidad por coincidencia. No ejecutar esa vinculación sobre el expediente real sin dirección del usuario.

Nuevas tablas registration_documents (UUID/FKreg/type/version/path MIME size/originalname/actor) y registration_observations (UUID/FKreg/reviewer/kind/content/timestamps). Historial registra cambios de datos, documentos y estados con versión. Guardar/transiciones/revisión con transaction+lock; conflictos409 no escriben parcialmente. Archivos DB/disk con compensación de huérfanos ante fallo.

Guard existente de PostgreSQL tests conserva whitelist exacta tecnoweb18b_test, configuración actual+PDO/current_database(), diferencia con desarrollo y chequeo inmediatamente antes de wipe. PHPUnit/testing separados; no fresh/reset/limpieza en desarrollo ni APP_KEY rotada.

## [S4] Contratos de acceso y ciclo

DTO de sesión: data.user={id,name,email,pilot_enabled,is_graduate,can_review_talent,person_id}. Person!=cuenta; los flags/IDs son sistema. Cookie/CSRF y cliente real se reutilizan, sin bearer/mock/localStorage de privados. Registro no verifica identidad/titulación/email institucional; email_verified_at no se simula. Sin envío de correo en este incremento.

| Endpoint | Contrato |
| --- | --- |
| POST /api/auth/register | name/email/password/password_confirmation;201 sesión real, graduate sí, review no; campos sistema422; email único; password protegida, sin logs/defaults |
| login/me/logout + GET /sanctum/csrf-cookie | conservar reales, logout/cache aislados,401/403/419/429 |
| POST /api/talento/inscripciones | graduate crea borrador propio;201; optional fields; uno existente409, no nueva captura interna |
| GET /api/catalogo/facultades | sesión real; 18 facultades activas del catálogo de trabajo (id, nombre, grupo); sin listas duplicadas en el frontend |
| GET /api/catalogo/carreras | sesión real; 121 asociaciones activas; `faculty_id` filtra por facultad; `search` normalizado sin tildes/mayúsculas contra nombre y nombres fuente; informa `needs_review`, nunca rechaza |
| GET list/detalle/historial | titular explícito, o legado propio read-only; no recuperar titular por creador/correo |
| PATCH /api/talento/inscripciones/{id} | holder solo draft/correction_requested; parcial+version;200 cambios/historial, submitted bloqueado409 |
| POST /api/talento/inscripciones/{id}/enviar | {version};validarS2/docs en transaction;submitted;422 matriz incompleta,409 obsoleta |
| POST /api/talento/inscripciones/{id}/documentos | multipart{type,file,version};holder editable;201 metadata + registration_version siguiente, retener anteriores |
| GET /api/talento/inscripciones/{id}/documentos/{documentId}/descargar | cookie+policy+pertenencia;attachment, no-store/nosniff;sin URL pública |
| GET /api/talento/inscripciones/{id}/observaciones | observaciones privadas visibles al titular/personal autorizado |
| GET /api/personal/inscripciones | reviewer explícito: enviados sin asignación y propios asignados; summaries mínimos/paginación, no drafts ajenos |
| GET /api/personal/inscripciones/{id} | submitted no asignado, o assigned a la cuenta; no revisión propia |
| POST /api/personal/inscripciones/{id}/tomar | {version};claim transaccional;reviewer=request.user,statusin_review;409 si otro tomó |
| POST /api/personal/inscripciones/{id}/observaciones | {version,content};assigned reviewer, registrar nota/actor/version |
| POST /api/personal/inscripciones/{id}/solicitar-correccion | {version,content};assigned reviewer, motivo requerido;correction_requested |

Detalle conserva id/version/person/academic/mobility/created_at/updated_at, añade status, submitted_at, holder_user_id, reviewer y documents metadata sin path ni hash. Documento.metadata={id,type,version,original_name,mime,size,created_at}; upload añade registration_version. Observaciones.data=[{id,kind,content,reviewer:{id,name},created_at}]. Historial preserva acciones anteriores y amplía nuevos eventos. Body no acepta holder/creator/reviewer/capabilities/status; cambios sistema solo servidor/comando autorizado.

Estados técnicos: draft→submitted→in_review→correction_requested→submitted (reenvío conservando revisor). legacy_internal no entra bandeja antes de vínculo explícito. Titular lee siempre su expediente, edita/adjunta solo borrador o corrección; personal toma/revisa y pide corrección, no admite/califica/publica. No reviewer global por registro; habilitación explícita por comando privado y defaultdeny. Un revisor no revisa su propia inscripción: salvaguarda técnica. Staff distintos no intervienen en asignado a otro. Política institucional definitiva sigue pendiente.

401 sin sesión,403 capability,404 recurso ajeno,409 estado/versión/asignación,419 CSRF,422 errors campos/documentos,429 límite y500 genérico. Mantenerno-store y rechazo bearer. Guardar borrador no envía; envío no admite ni publica.

## [S5] Pantallas sobre la plantilla Ant Design

Conservar título académico Sistematización de Herramientas Métricas para la Selección de Personal. Reutilizar patrones/componentes/layout/topbar/menu de plantilla (Lato/tokens actuales), no la página serif aislada anterior. No Inertia/V0 ni biblioteca nueva. No contenido demo (métricas/roles/mock notificaciones) en áreas funcionales.

Público /: inicio institucional con acciones ingresar/registrarse; /ingresar y /registro reales. Portal /portal/inscripcion y detalle/editar: topbar y navegación Mi inscripción/Documentos/Observaciones, guardado borrador y envío separados con listas de faltantes porS2, Upload integrado, estados yversiones visibles, historia/corrección/confirmaciones. Personal /personal/inscripciones y /{id}: sidebar/bandeja/detalle/descarga/observaciones/pedir corrección/tomar revisión.

Legado propio se consulta read-only en ruta separada si falta vínculo, con mensaje comprensible de titular pendiente; no explicación de APIs ni instrucción al público de comparar nombres. CLI privado resuelve en forma auditada. Ejemplos bajo /ejemplos y banner DEMO solo allí/recorridos de muestra. Retirar globalbanner, piloto real, rutasAPI, pie operador!=titulado y enlacesplantilla/técnicos de zonas funcionales. /estado-tecnico sigue accesible para diagnóstico separado.

RootUser flags determinan nav, no autoridad por JS. Caché/drafts/bloburls/mutations/peticiones pendientes se cancelan y limpian al logout/cambio, sin persistencia PII/tokens. Servidor confirma sesión/permiso cada operación. Desktop/mobile y focus/labels/loading/empty/retry/errores comprensibles.

## [S6] Privacidad documental y control provisional

Disco talent_private privado bajo storage/app/private, serve=false, no storage:link, no signed/temporary URLs. Ruta UUIDgenerada, nombre original saneado; descarga controlada en cada request con titular o reviewer autorizado; validar documentId pertenece al expediente y versión. Ningún acceso público a CI/histórico/títulos/foto ni publicación de perfil.

Reviewstaff solo con flag explícito, sent/assigned, no drafts/unlinked global; cuenta pública no concede capabilities. Técnico que provisiona/vincula por CLI no es automáticamente revisor. Preservar legados/datos/contactos y documento/source históricas. Capturas reales del usuario son referencia de UX, no fixtures ni archivos para reutilizar.

## [S7] Aceptación y evidencia futura

Tests únicamente tecnoweb18b_test (guardar guards); baseline filesystem antes de cambio para review, no SHA inventado. Datos/capturas ficticias. Tests-first baratos donde posible; confirmar falla antes fix. Revisión independiente solo tras verificación sin procesos pesados.

1. Register→login real, CSRF y no roles/review concedidos; manipular flags/body/stockadmin/token no habilita personal.
2. Borrador incompleto permitido, persiste alrecargar; titular/persona vínculo explícito, nadie recibe legados por nombre/email.
3. Cuatro documentos y datosfaltantes422 al enviar, sinestado/versión/eventos parciales; CV/provisiónopcional no sustitución automática.
4. MIME/tamaño/tipo falsos y falloStorage rechazan; versiones anteriores conservadas; descargaexacta autorizada, ajeno/visitante/draftstaff/signedURL no acceso.
5. Envío→bandeja→tomar→observación→pedir corrección→titular edita/adjunta/reenvía→historial; assignedstaff yholder diferentes; noadmisión/calificación/publicación.
6. Dos titulares aislados y staffcap false403; version vieja409 sin escrituras; test tomar concurrente y control lock.
7. LegacyCreator/holder/reviewer no se confunden; comando solo vínculo exacto confirmado, errores no alteran patrimonio/cuentas por email.
8. UI navegación pública/portal/sidebar, sinDEMO/técnicos en zonasreales; desktop/móvil,cache/private cleanup/races;build/tests/lint pertinente, health200 regresión.

Persistencia de desarrollo comparada antes/después de tests; sólo migracionesincrementales sobre desarrollo despuésschemaactual. Sin limpiar ni vincular registrosreales automáticamente. Report final distinguirá mocks unitariosde E2real, brechas, baselineLOCALE ylint de plantilla.

## [S8] Pendientes institucionales conservados

La matriz de envío fue confirmada por Marcelo como decisión operativa en esta tarea, no acta institucional. Equivalencia títulos, catálogo oficial, rangosPPA/admisión, verificacióndeidentidad/altaemail, consentimiento/conservación, denominaciones/responsabilidades/supervisión institucional y publicación siguen pendientes. No bloquear borrador por exigencias que aún no estén definidas; no sustituir evaluaciónhumana por booleano informático. Permisosstaff/claim/estados son controlesprovisionales del incremento, no facultadesdeaprobación.

## [S9] Fuera de alcance

Evaluación, notas/baremos/instrumentos, PPAcalculado/umbrales, publicación/perfiles públicos, empresasB/contacto, estado civilobligatorio, sin experiencia, antigüedadmáxima2años, OCR/IA/correo, membresías administrativas, V0/Inertia, dependenciasmasivas/limpieza de plantilla,APP_KEY cambios, recreaciónbases/roles, fresh/resetdesarrollo, commit/push/publicación.

## Tasks

- [x] T1: Registro/login y vínculos explíctos/legado; migraciones seguras — aceptación:graduate nunca reviewer y no transferencia implícita (covers: S1,S3,S4,S8).
- [x] T2: Borrador/documentos/envío y privacidad — aceptación:matrizS2/transacciones/descargas/versiones e isolamento aprobados (covers: S2,S3,S4,S6; depends: T1).
- [x] T3: Revisión/corrección/historial — aceptación:enviar→claim→observaciones→corregir→reenviar sin facultadesinadmisión (covers: S3,S4,S6; depends: T2).
- [x] T4: UI público/titulado/personal con layout elegido — aceptación:navegaciónespañol sinDEMO/técnicos y responsive/cache aislados (covers: S4,S5,S6; depends: T3).
- [x] T5: Verificación/revisión independiente/documentación — cierre con evidencias y brechas expresas; incidente remediado con autorización y originales/datos no seleccionados intactos. El criterio inicial de desarrollo inmutable durante todos los intentos no se cumplió: no se oculta ese antecedente (covers: S1,S7,S8,S9; depends: T4).

T5: el criterio original «desarrollo intacto» no se cumplió en todos los intentos por el incidente documentado. Los originales se conservaron; los cuatro expedientes/cuentas ficticios y sus asociados se retiraron puntualmente después de autorización expresa, con respaldo recuperable y comprobaciones antes/después. La evidencia de E2E corresponde a la ejecución posterior aislada; no presentar una reparación retrospectiva como si el incidente no hubiera ocurrido.
La implementación, build, pruebas focales, revisión y remediación autorizada están completados. Las brechas de concurrencia y pestañas se conservan como pendientes de verificación, no pruebas aprobadas.

## Antecedente: reporte del corte interno 05/10/2026

**What was built** — Piloto interno A: sesión/cookies/CSRF real con Sanctum4.3.3, alta de cuentas por comando privado con habilitación explícita, persona distinta de cuenta, creación/consulta/listado propio, edición transaccional con versión y bloqueo, historial privado. Interfaz React/Ant Design en español, confirmaciones, vacíos, errores por campo, recuperación de conflictos y limpieza de caché/borradores frente a logout/cambio de cuenta/respuestas tardías. Solo nombre obligatorio; académicos/PPA textos declarados, sin catálogo falso ni relación impuesta. No alta pública, documentos, evaluación, publicación, IA/OCR/correo.

Aislamiento por creador es control técnico del piloto, no permiso institucional aprobado. Cuentas/personas usadas en pruebas fueron ficticias exclusivamente en tecnoweb18b_test. No se poblaron cuentas/contraseñas de desarrollo por defecto; pilot:account las crea privadamente. Datos reales siguen sujetos a responsabilidades, consentimiento y conservación pendientes.

**Verification** — Ejecutada en Windows nativo/PowerShell:

| Comando/control | Evidencia final |
| --- | --- |
| PHPUnit con phpunit.xml | PASS 34 pruebas/255 aserciones; guard actual/config/URL/PDO cacheado, cookies, CSRF, aislamiento, versión/rollback/history/cuentas/health |
| Comparación desarrollo antes/después de suite | tablas/migraciones/counts idénticos; .env idéntico sin imprimir hash |
| migrate:status, migrate --pretend, migrate --force | desarrollo vacío inspeccionado, cinco migraciones pendientes/incrementales aplicadas; no fresh/reset en desarrollo |
| pnpm test:run --pool=forks --maxWorkers=2 --minWorkers=1 | 37 pruebas: 36 PASS / 1 PRE-EXISTING LOCALE-NUMBER-TEST; piloto19 PASS con HTTP controlado |
| ESLint archivos cambiados | PASS, exit0/max-warnings0 |
| ESLint global JSON final | PRE-EXISTING 82 errores/4 warnings; baseline84/4, dos any de signup retirados con logs de credenciales; no errores nuevos |
| pnpm build final | PASS exit0, TypeScript + Vite10494 módulos, Vite5m5s; bundle/Helmet/Sass heredados documentados |
| backend/tests/browser/pilot-flow.cjs | PASS ocho comprobaciones reales React/API/PostgreSQL: autenticación/dummy rechazado, CSRF/422, guardar-reload, editar/history1–2, 409v3 sin evento, cuentaB aislada/cache limpia, logout/health200/mobile390 |
| Dependencias/plataforma | Laravel12.69.3 y PHP8.4.26; solo Sanctum4.3.3 añadido sin updates/removals; pnpm9.15.4/lock SHA417177... conservados |

Revisión independiente posterior a verificación por un actor nuevo del mismo modelo de los implementadores: SPEC COMPLIANCE, CORRECTNESS y CODEBASE CONSISTENCY sin hallazgos CRITICAL nuevos. Revisor leyó código/diffs/logs, no repitió pruebas pesadas ni accedió a .env/datos. Brechas no bloqueantes: no test focal de fallo de historial en PATCH ni dos PATCH realmente simultáneos; transacción/lock presentes, 409/rollback/edición parcial probados. Todos los procesos propios terminaron antes de revisión; 8000 ajeno intacto. Artefactos de navegador fuera de Git y passwords temporales eliminadas.

Rama feat/talento-piloto, raíz existente elegida por AGENTS.md; sin commits/baseSHA/headSHA por prohibición del usuario. Revisión con snapshot filesystem previo y diffs --no-index; commits queda vacío. No se ejecuta Finalize commit/merge/push de Compose Next. Fuentes/licencias conservadas; TuCafé no releído por permiso pendiente.

**Journey log** —

1. Windows consumió el caret de la restricción Composer al pasar por .bat; se resolvió mediante php.exe/composer.phar, sin cambiar otros paquetes.
2. Un PDO cacheado seguro no basta: regresión sin limpieza reprodujo cambios de config DB/driver/URL y se reforzó el guard inmediatamente antes de wipe, con conexión explícita.
3. Se exigió CSRF incluso bajo PHPUnit en lugar del bypass de testing; cookies y revocación se ejercitaron realmente.
4. Se corrigió el padding content-box del Container solo en el piloto; medición móvil pasó de399 a375 px en viewport390.
5. Los conteos ESLint anteriores no acreditaban el final: se volvió a medir82/4; no se ocultó el fallo heredado de locale ni se confundieron tests UI controlados con E2E real.
