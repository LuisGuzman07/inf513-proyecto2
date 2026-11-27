---
feature: evaluacion-es-usted-muy-habil
status: completed
branch: feat/talento-piloto
commits:
---

# ¿Es usted muy hábil? · banco privado y primera evaluación A

## Report

Implementado y verificado el banco privado, importador versionado, visor de personal, asignación por revisor actual, recorrido persistente del titular, envío final idempotente y puntuación bruta en Laravel. Se conserva el layout existente (extensión Operate, sin rediseño). Sin commit, push ni publicación.

### Evidencia histórica de integración (superada por el cierre local siguiente)

Los resultados de pruebas, estado de importación local y pasos de activación de esta sección corresponden a la etapa anterior. La sección «Cierre y activación local» es la fuente vigente.

- Fuente: 15 ejercicios y 15 Markdown individuales, referencias y claves coherentes; 68 archivos inventariados más manifest intactos. SHA-256 del manifest: `1d9426e31e1865d87bb7ad2a669f899e928a792294cbf623efb00c41d3482224`. No se interpretó el Word ni la fotografía de equivalencias.
- Backend, exclusivamente PostgreSQL `tecnoweb18b_test`: tanda `Habil|TalentReviewRecordsTest` con 19 casos aprobados, dos fallos detectados y un omitido. Se corrigió la promoción de archivos en Windows (por archivo, con rollback de destinos propios) y la conservación del offset de timestamps PostgreSQL para confirmaciones estables. La repetición focal `HabilImportTest|test_submission_requires_current_version_and_absence_confirmation_then_freezes` pasó: 7 aprobados, 1 omitido, 313 aserciones. En conjunto, 21 casos distintos aprobados; no se repitieron las suites globales. Symlink de directorio omitido por falta de permiso de Windows para crear el enlace, no presentado como validado.
- Los casos ejecutados cubren importación íntegra/idempotente, paquetes inválidos sin escrituras, rollback ante fallo de DB, conformidad separada, recuperación de respuestas con sesión, campos/opciones rechazados, ACL y cambios de revisor, versiones 409, congelación y reenvío idempotente, 15 aciertos, mezcla y todos ausentes.
- Frontend: 77/77 pruebas en una tanda: 9 de recorrido sintético, 7 de contrato HTTP, 41 de revisión del expediente y 20 de UI existente. La revisión independiente detectó pérdida de elección local ante refetch fallido con datos previos; corregido manteniendo el runner montado. Su prueba focal adicional pasó (1 aprobada; los otros 9 casos del archivo fueron filtrados, no fallaron). Total: 78 casos distintos aprobados entre ambas ejecuciones.
- Lint focal y formato finales correctos. `pnpm build` (TypeScript + Vite) pasó; conserva avisos upstream de Sass/API legacy, anotaciones de react-helmet y tamaño de chunks. La última corrección de refetch se verificó después con su prueba focal, `tsc --noEmit`, ESLint y Prettier; no se repitió el build completo.
- Importación del paquete real dos veces bajo testing y storage TEMP aislado: 1 versión, 15 ejercicios, 1 conformidad; mismos IDs y archivos; copias privadas con hashes coincidentes y fuente externa sin cambios. No se importó ni pobló desarrollo.
- Navegador Chrome: banco con las 15 imágenes originales/reconstruidas, zoom, procedencia, cabeceras privadas, asignación UI y repetición idempotente aprobados. El primer intento no abrió navegador por incompatibilidad de la versión Chromium cacheada; se usa Chrome instalado, sin descargas. El fallo posterior de la simulación de imagen se localizó en el harness: StrictMode cancela el primer efecto, por lo que interceptar sólo una petición no garantiza un error visible. Se ajustó la interceptación hasta el reintento explícito. La continuación focal pasó: titular móvil sin respuestas preseleccionadas, reintento de imagen, zoom, fallo/reintento de guardado, recuperación tras reload, 409 con elección preservada, recuperación explícita del servidor y navegación que guarda; confirmación de ausentes, fallo/reintento del envío, envío idempotente, freeze tras reload, resultado bruto sólo para revisor y versión/estado padre sin cambios al responder/enviar. No se limpió ni reimportó el fixture para reanudar.
- Cierre del runtime: procesos propios detenidos, credenciales temporales retiradas y huella SHA-256 de datos de desarrollo idéntica antes/después. Capturas privadas de personal en escritorio y titular de 390px con geometría sin desbordamiento comprobada. La confirmación humana de la calidad de las reconstrucciones sigue siendo la declaración previa de Marcelo, no una nueva aprobación estética o institucional del agente.
- Auditoría de 584 archivos de frontend (src/public/dist): sin copias exactas del material fuente ni marcadores de claves fuente en el bundle. Claves reales sólo backend y respuesta privada del banco autorizado. Las capturas del instrumento están únicamente en TEMP privado del runtime, no en docs ni en el zip público.
- Revisión independiente backend read-only sin hallazgos concretos de fuga/ACL/idempotencia; revisión React focal con el hallazgo de refetch corregido. No sustituyen ejecución funcional ni revisión institucional.

### Cierre y activación local (27/10/2026)

#### Verificación aislada

- Tanda final backend sobre tecnoweb18b_test: 21 aprobadas, 1 omitida, 957 aserciones. Incluyó HabilImportTest, HabilEvaluationTest y TalentReviewRecordsTest. La omisión fue la prueba de symlink de directorio, porque Windows no permitió crear el enlace; no se reporta como validada.
- Tanda final frontend afectada: 19/19 aprobadas: 12 de recorrido en evaluations.test.tsx y 7 de contrato en evaluations-api.test.ts. Cubrió la elección local frente a refetch fallido y exitoso, respuesta confirmada, reintentos, navegación, envío e idempotencia. Se canceló una tanda anterior que incluía 61 pruebas heredadas no relacionadas; no se considera aprobada.
- Alta interna focal sobre tecnoweb18b_test: PilotAccountCommandTest 4 aprobadas, 39 aserciones. Incluye nueva cuenta de revisor únicamente, password hasheado, cuenta anterior intacta y rechazo de confirmación sin insertar. Fixture sintético sólo en la base de pruebas; no se ejecutó el alta en desarrollo.
- Build de TypeScript y Vite: exit 0, 10.515 módulos transformados. El bundle principal existente queda en 3.471,58 kB y Vite mantiene avisos de react-helmet-async, API legacy de Sass y tamaño de chunks. Tras el build sólo se normalizó formato; Prettier y ESLint focal se comprobaron después, sin cambios lógicos.
- La fuente externa conserva intactos sus 69 archivos inventariados y el hash del manifest 1d9426e31e1865d87bb7ad2a669f899e928a792294cbf623efb00c41d3482224. Se comprobó que 584 archivos de frontend/src, frontend/public y frontend/dist no contienen copias exactas del material fuente ni marcadores de clave.

#### Activación en desarrollo

- Se verificó entorno local y PostgreSQL tecnoweb18b, distinto de tecnoweb18b_test. La huella normalizada de usuarios, personas, expedientes, eventos, documentos y observaciones coincide antes/después: 4a700702ec4b053889214ccf69d9f3725b2e271081cc16d18131b69c30cddb48. Conteos existentes iguales: 1 cuenta, 1 persona, 1 expediente, 1 evento, 0 documentos y 0 observaciones. La comparación omite sólo el valor de la nueva columna nullable event_version al normalizar la tabla de observaciones.
- La inspección encontró tres migraciones pendientes. Se aplicaron sólo de forma incremental: add_review_records (prerrequisito previo del detalle del expediente y de su campo event_version), create_instrument_bank y create_evaluation_assignments. migrate:status las confirma todas en Ran. No se usó migrate:fresh ni reset.
- Se ejecutó habil:import --marcelo-reviewed tres veces. Snapshot de base y almacenamiento privado antes/después de la tercera repetición idéntico: una versión (ID 01a17d73-56d2-709a-9c5d-4276f6d0603f), 15 ejercicios con los mismos IDs, una conformidad con el mismo ID/fecha, 69 archivos con el mismo SHA-256 agregado. La fuente conserva pendiente_cotejo y la conformidad sigue sin ser aprobación institucional. Asignaciones: cero.
- Laravel está iniciado en http://127.0.0.1:8001 y React/Vite en http://localhost:5173, con proxy React→Laravel. La salud de la API devolvió status/api/database OK por el puerto 8001 y por el proxy; la portada React devolvió HTTP 200. El banco anónimo devuelve 401 como debe.
- Se agregó dev-local.ps1 en la raíz para iniciar ambos servidores con una comprobación previa de la base local y un modo Status. El script no migra/importa ni crea datos; probado: servicio Laravel, React y proxy en True. Reutiliza servicios sanos existentes y no detiene procesos en puertos ocupados.
- No se crearon cuentas, titulares, expedientes, asignaciones ni respuestas ficticias. El estado previo contiene una cuenta con piloto habilitado, pero sin capacidad can_review_talent ni is_graduate; el único expediente es legacy_internal, sin titular ni revisor. Por ello no hay identidad/expediente elegible para acceder al banco, asignar o responder en desarrollo. No cambié permisos ni vínculos para sortearlo.

#### Acceso para revisión

Para el acceso manual, el comando existente ahora admite crear una cuenta nueva exclusivamente revisora. No se ejecutó durante esta tarea; no se crearon cuentas ni se alteraron roles de desarrollo:

~~~powershell
Set-Location backend
php artisan pilot:account --reviewer
~~~

Solicita nombre/email, contraseña dos veces en entrada oculta y confirmación sí/no (el default es no; confirmar sí para crear). Con sí crea una cuenta única con talent_pilot_enabled=true, can_review_talent=true e is_graduate=false; no concede publicación/administración y muestra el ID sin mostrar la contraseña. Con no, email repetido o entrada inválida, no crea la cuenta. La cuenta genérica existente no se modifica. El mecanismo se probó sólo con fixtures de tecnoweb18b_test.

1. Ejecutar desde backend el comando de alta revisora indicado arriba. La contraseña se introduce en los prompts ocultos y la confirmación explícita debe ser sí.
2. La persona titulada se registra en http://localhost:5173/registro. Ese registro público concede sólo la capacidad del titular.
3. El titular inicia sesión en http://localhost:5173/ingresar, completa /portal/inscripcion, adjunta los documentos requeridos por el formulario y pulsa Enviar a revisión.
4. El revisor inicia sesión con la cuenta creada, abre http://localhost:5173/personal/inscripciones y pulsa Tomar revisión en la inscripción enviada.
5. En el expediente tomado, abre Pruebas → elige una versión del banco → Asignar prueba.
6. El titular abre http://localhost:5173/portal/pruebas, responde A–H, guarda y confirma el envío final. El revisor vuelve a Pruebas en ese expediente para consultar el resultado bruto.

Los servidores quedan en marcha. Los pasos de registro y carga pueden iniciarse, pero todavía no existe la cuenta revisora que crea el paso 1 ni un titular/inscripción nueva; por eso la toma de revisión y la evaluación no pueden ejecutarse hasta que Marcelo recorra esos pasos. El expediente legacy_internal se conserva intacto. No se modificaron permisos ni se crearon registros por detrás.

### Ejecución reproducible y límites

Los tests Laravel heredan `PilotHttpTestCase` y el guard de base exclusiva. Los fixtures son sintéticos; el recorrido real usa `backend/tests/browser/habil-runtime.ps1` (`Start`, `Prepare`, `Run`, `Stop`). `Prepare` verifica destino antes de migrar incrementalmente/importar. `Resume` permite reanudar sólo su fixture detenido conservando storage y huella de desarrollo, renovando exclusivamente las contraseñas ficticias de A/B y staff. No restablece la base ni elimina registros. `HABIL_CONTINUE_HOLDER=1` omite el recorrido visual del banco ya comprobado, sin atribuirse esa cobertura. Ejecutar estos drivers fuera del timeout corto del terminal mediante proceso independiente y consultar sus logs privados. Nunca usar el Run genérico de ui-runtime, que escribe capturas públicas.

Para otra instalación, aplicar migraciones de forma incremental y ejecutar explícitamente `habil:import --marcelo-reviewed`; consultar README. En el desarrollo local descrito arriba sí se aplicaron las migraciones aditivas requeridas y se importó el paquete idempotentemente. No se ensayaron carreras simultáneas con dos conexiones PostgreSQL, fallos de disco duro ni despliegue productivo. Los locks, versiones y retries secuenciales sí se comprobaron; no se afirma una prueba de carga o de concurrencia real. La conformidad de Marcelo permanece separada del manifest pendiente y de cualquier aprobación institucional.

## [S1] Alcance y fuente

Paquete externo intacto: ../sources/grupo18b-es-usted-muy-habil-imagenes-respuestas/es-usted-muy-habil/. README, manifest, instrucciones, ejemplo, 15 Markdown individuales y clave general leídos. 15 ejercicios habil-01…habil-15, cada PNG completo con matriz y alternativas A–H. El ejemplo no puntúa. No CI/IQ, baremos, aprobado/reprobado, interpretación psicológica, publicación, cierre temporal ni otros instrumentos. El material recibido menciona 30 minutos; no constituye un plazo digital implementado.

Conservar el manifest original y el estado pendiente_cotejo. Registrar por separado la conformidad explícita de Marcelo: revisó las 15 reconstrucciones, patrones y correspondencia de respuestas; es conformidad de trabajo visual del piloto, no aprobación institucional ni equivalencia psicométrica. Se registra en servidor la fecha de registro, no se inventa una fecha de revisión.

## [S2] Importación y persistencia privada

Artisan habil:import {path?} {--marcelo-reviewed}. Default el paquete hermano indicado. Validar TODO antes de escribir: 15 IDs/números únicos 1…15, claves A–H, punto por acierto =1, todos los archivos listados con hash/tamaño coincidentes, PNG/dimensiones, originales, Markdown frontmatter/referencias/clave y clave general, ejemplo e instrucciones. Prohibir rutas absolutas/traversal/symlinks fuera de raíz; referencias coherentes. Cualquier fallo => sin filas ni archivos nuevos. Importación transaccional/idempotente por SHA-256 del manifest; versión derivada del digest y fecha de paquete, nunca presentada como edición científica. No duplicar ni sobrescribir una versión aplicada. Copias sólo en Storage::disk(instrument_private), raíz storage_path(app/private/instruments), serve=false, visibility private. No rutas públicas, no claves en VITE ni bundle. Guardar manifest y fuentes completos privados, incluidos Markdown originales, no servir el HTML del paquete.

Contrato común de modelos (para implementación coordinada):
- InstrumentVersion: uuid id; name; version_label (fecha+digest); package_date; manifest_sha256 unique; source_review_state; instructions (texto candidato sin fuentes/claves); instructions_source_markdown hidden; example_text (explicación recibida, respuesta del ejemplo D permitida); example_image_path hidden; storage_prefix hidden; manifest json hidden; source_file_hashes json hidden. Relation exercises() orden por number y conformity().
- InstrumentExercise: uuid id; instrument_version_id FK; source_id string habil-NN; number int; correct_option char hidden; points=1; image_path/original_path/answer_markdown hidden; image_sha256/original_sha256; source_review_state; review_note. Unique(version,source_id) y unique(version,number).
- InstrumentConformity: version FK unique, reviewer_name=Marcelo; statement textual; recorded_at; institutional_approval=false. Nunca modifica source_review_state.
- EvaluationAssignment: uuid id, registration_id FK, instrument_version_id FK, assigned_by FK, version int=1, status assigned|in_progress|submitted, answers json (canonical ID -> A…H o null), submitted_at nullable, raw_result json hidden. Unique(registration,version de instrumento). Assignment version independiente del expediente.

## [S3] Autorización y rutas HTTP

Todas las rutas dentro del grupo existente Sanctum/RequirePilotSpaSession/auth/EnsurePilotEnabled; usar sesión/CSRF real, no demo. Banco sólo can_review_talent. Asignar/listar/resultados por expediente sólo revisor asignado habilitado y no titular propio; no asignar legacy ni sin holder. Control técnico provisional del piloto, no permiso institucional. Titular sólo sus asignaciones por holder_user_id e is_graduate. Aislar imágenes por assignment y expediente; IDs ajenos/inexistentes =>404, sin sesión401, capacidad insuficiente403.

Todas las respuestas JSON usan {data:…}. Rutas:
- GET /api/personal/instrumentos -> VersionSummary[] {id,name,version_label,package_date,source_review_state,exercise_count,conformity:{reviewer_name,statement,recorded_at,institutional_approval}|null}.
- GET /api/personal/instrumentos/{version} -> VersionSummary + instructions, example_text, example_image_url, exercises:[{id:source_id,number,reconstructed_url,original_url,source_answer,answer_markdown,source_review_state,review_note}]. Staff únicamente.
- GET /api/personal/instrumentos/{version}/imagenes/{kind}/{sourceId} -> medios originales (kind original|reconstructed|example, sourceId habil-NN o example). Tipos y paths allowlist, nunca parámetros de ruta de disco. Cache-Control private,no-store y nosniff.
- GET /api/personal/inscripciones/{registration}/evaluaciones -> Assignment[] staff asignado.
- POST misma ruta {version:registration.version,instrument_version_id:uuid} -> Assignment (201 nuevo/200 existente). Reimport igual no duplica, y asignación repetida de la misma versión retorna la misma; bajo lockForUpdate de registration, comprobar versión salvo repetición ya existente. Exigir conformity de versión, 409 si no. Crear evento instrument_assigned mediante TalentWorkflow::event, sin cambiar status padre. DTO incluye registration_version para refrescar expediente.
- GET /api/personal/evaluaciones/{assignment} -> Assignment staff con resultado bruto sólo tras enviado.
- GET /api/talento/evaluaciones -> AssignmentSummary[] propias.
- GET /api/talento/evaluaciones/{assignment} -> Assignment (sin claves, manifest, notas fuente, Markdown ni raw_result).
- GET /api/talento/evaluaciones/{assignment}/imagenes/{sourceId} -> sólo reconstrucción asignada o example. Nunca original, clave, Word o Markdown.
- PATCH /api/talento/evaluaciones/{assignment}/respuestas {version,answers:{habil-NN:A…H|null}} -> Assignment. Sólo claves conocidas; rechazar payload/campos/opciones extra. Lock row, 409 obsoleta, no escrituras tras enviado, incrementar versión sólo por cambio efectivo, guardar en Laravel. No completar por abrir la página.
- POST /api/talento/evaluaciones/{assignment}/enviar {version,confirm_unanswered:boolean} -> Assignment. Bajo lock: repetido enviado =>200 misma confirmación inmutable (sin segunda puntuación); primera vez requiere versión actual, 409 obsoleta; ausencias sin confirm_unanswered true =>422. No aceptar respuestas ni puntaje por este endpoint.

Assignment DTO: {id,registration_id,version,status,assigned_at,submitted_at,answered_count,unanswered_count,instrument:{id,name,version_label,exercise_count,source_review_state,conformity},instructions,example_text,example_image_url,exercises:[{id,number,image_url,options:[A…H]}],answers:{id:option|null}}. Staff añade raw_result tras envío {correct,incorrect,absent,score,max_score:15,scoring_rule:source_one_point_per_correct_v1}; candidato nunca raw_result ni corrección por ítem. La confirmación del titular muestra envío/respuestas/ausentes y versión aplicada. Resultados guardados atómicos en backend: correct+incorrect+absent=15; score=correct; sin penalización por error ni ausencia. No parent-status mutation al responder/enviar.

## [S4] Interfaz sobre layout actual

Extensión del proceso A en modo Operate, sin rediseño. Banco en /personal/instrumentos y /personal/instrumentos/{version}: recorrido 1…15, original/reconstruida completas y ampliables, respuesta fuente sólo personal, procedencia, Pendiente de cotejo del manifest + conformidad Marcelo separada. Adjuntar imágenes como blobs autenticados sin cache compartida y revocar ObjectURL al salir. No material en public ni bundle.

/portal/pruebas lista asignaciones propias; /portal/pruebas/{assignment} muestra instrucciones y ejemplo, cada imagen completa con Radio.Group A…H sin valor inicial, ampliar, indicador de avance y guardado. Botón Guardar respuesta y navegación que confirma guardado de cambios antes de cambiar de ejercicio; preservar elección si falla, indicar Sin guardar/Guardando/Guardado confirmado sólo tras respuesta real; impedir carreras/doble clic y avisar al salir con cambios. Recuperar servidor al recargar/login. Modal de envío con conteo ausentes, aceptación explícita si hay; envío final congela respuestas. Titular ve sólo confirmación.

Pestaña Pruebas en RecordPage: personal lista/asigna instrumento y ve resultado bruto de versión; titular ve sus pruebas. No nuevas capacidades: can_review_talent y revisor asignado. No fetch ni integración de mocks. Refrescar detalle/historia tras asignar por incremento parent.version. No tocar editor, revisiones previas ni sus validaciones.

## [S5] Verificación y límites operativos

Sólo tecnoweb18b_test y Storage privado de testing. Desarrollo no se limpia ni puebla con fixtures; puede aplicar únicamente migraciones incrementales si se necesitan, conservando filas. Comprobar importación íntegra/idempotente/fallos cero escrituras; respuestas conocidas 15 aciertos, mezcla y todos ausentes; preservación, revisión versión aplicada, 401/403/404/409, fuga de claves negativa, cambio revisor, carreras de versión y envío idempotente. TSC/lint focal/build y pruebas UI pertinentes agrupadas al final, sin ciclos por pantalla. Navegador escritorio/móvil con fixture y datos ficticios; evidencias que contengan instrumento/claves sólo privadas e ignoradas, nunca docs públicas. No commit/push/publicación.

## Tasks

- [x] E1: Validar fuentes y crear banco privado versionado/importador/visor (covers: S1, S2, S3, S4).
- [x] E2: Asignación y recorrido persistente, envío/puntuación bruto y aislamiento (covers: S3, S4; depends: E1).
- [x] E3: Verificación final agrupada, revisión independiente y documentación con resultados reales (covers: S5; depends: E2).
