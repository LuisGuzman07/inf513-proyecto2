---
feature: catalogo-uagrm-inscripcion-titulado
status: delivered
updated: 2026-10-11
branch: feat/talento-piloto
commits:
---

# Catálogo UAGRM para la inscripción del titulado

## Report

**What was built** — Selección guiada de facultad (opcional) y carrera desde el catálogo de trabajo UAGRM (`docs/data/catalogo-uagrm.json`, versión `2026-10-07-investigacion-1`: 18 facultades, 121 asociaciones), servido exclusivamente desde Laravel. Búsqueda sin tildes ni mayúsculas, carrera filtrada por facultad o agrupada por facultad sin ella, aviso y limpieza sólo de carrera al cambiar de facultad, excepción manual "No encuentro mi carrera" que conserva el texto y marca revisión pendiente sin bloquear el envío, y textos anteriores intactos hasta su sustitución explícita. Persistencia idempotente (`catalog:import`, claves estables, sin borrados, filas referenciadas conservadas), validación de correspondencia facultad-carrera en Laravel, etiqueta histórica congelada e historial/versionado intactos. Decisiones técnicas de trabajo, sin aprobación institucional.

**Verification** — Backend `CatalogUagrmTest` (10 pruebas/164 aserciones: correspondencia, manual, legados, edición parcial que conserva referencia/etiqueta, inactiva rechazada sin escrituras, cambio explícito con historial encadenado) + `CatalogImportSafetyTest` (4 pruebas/27 aserciones: archivo malformado sin cambios parciales, import repetido sin cambios, referenciadas conservadas): PASS, sólo `tecnoweb18b_test` con guards. Suite completa: 78 pruebas/988 aserciones PASS. `php -l` + Pint PASS. Frontend `catalog.test.tsx` (9 pruebas: normalización, nombres fuente, sufijos excluidos, agrupación, filtros, aviso/limpieza, conservación de referencia, manual, legados, carga/error/reintento): PASS. Suite focal completa: 85/85 PASS. `tsc --noEmit`, ESLint focal `--max-warnings 0` y Prettier PASS. `pnpm build` PASS (10509 módulos, 3m17s; avisos PRE-EXISTING Helmet/Sass/chunk). Navegador real sobre runtime aislado de tests (`PILOT_E2E_CATALOG_ONLY=1`): PASS 9 grupos (preflight con revisor sembrado, sesión anónima, consulta 18/121/filtro/búsqueda, búsqueda UI sin tildes, selectores UI con guardado/recarga, cambio de facultad, manual + 422 sin escrituras, edición parcial que conserva referencia/etiqueta, legados + aviso en detalle), BROWSER_EXIT=0, 5 capturas desktop/móvil en `docs/verification-captures/catalogo-uagrm/after`, STOPPED con fingerprint de desarrollo idéntico antes/después y puertos libres. Desarrollo intacto (sin escrituras en este cierre). Sin commits.

**Journey log** — (1) Un `catalog_id` real mide 90 caracteres: columnas ampliadas de 64 a 128 antes de importar. (2) Los hijos WMI no heredan entorno: un probe manual corrió con `.env` de desarrollo; se corrigió incrustando variables como hace `ui-runtime.ps1`, y desarrollo verificado intacto. (3) En AntD v6 el valor elegido vive en `.ant-select-content-has-value`, no en `.ant-select-selection-item`: la selección funcionaba y sólo fallaba la verificación del harness. (4) Búsqueda tipeada + Enter no confirma de forma fiable en Chromium para el combo de carrera tras elegir facultad; se usa navegación por teclado verificada y filtrado en cliente sobre la lista única (la búsqueda sigue cubierta por facultad en navegador, backend y jsdom). (5) El flujo visitó el expediente de A con sesión de B y obtuvo el 404 correcto de aislamiento; se reordenó a la sesión del titular.

## Cierre técnico focal

Importación en dos fases: validación total previa (estructura, unicidad, correspondencias, longitudes) sin escribir nada ante el primer error; aplicación transaccional idempotente con conteos exactos (nuevas/actualizadas/desactivadas/referenciadas conservadas). Paridad de búsqueda: la API expone `source_names` y React filtra por nombre + fuentes con claves limpias (el sufijo "· revisión pendiente" no participa); facultad con la misma normalización. Conservación histórica probada: referenciadas que faltan en un archivo nuevo siguen activas; editar otro campo conserva referencia/etiqueta y suma un evento sin tocar carrera; inactivas rechazan nuevas selecciones sin escrituras; cambiar de carrera encadena el historial. Hallazgos restantes sin defecto reproducible en este incremento: chequeo redundante de facultad, contadores sólo de mensaje, UI de lista única correcta a escala 121 y paridad de normalización fuera del español.

## [S1] Problema
La carrera y la facultad hoy son textos libres declarados. La investigación aportada (`docs/data/catalogo-uagrm.json`, versión `2026-10-07-investigacion-1`, 18 facultades y 121 asociaciones facultad-carrera) permite ofrecer selección guiada sin imponer filtros de admisión ni equivalencias. El alcance aprobado es reemplazar escritura habitual por selección, conservando borradores incompletos, matriz de envío vigente y expedientes anteriores intactos.

Decisiones de este documento son configuración técnica de trabajo. No atribuyen aprobación institucional, vigencia, elegibilidad ni obligatoriedad de Facultad.

Workspace por AGENTS.md: raíz existente `C:/UAGRM/Tecnologia Web/proyecto-grupo18b/tecnoweb-18b-seleccion-personal`, sin worktree nuevo ni Git interno. Rama `feat/talento-piloto`. Sin commit/push/publicación. pnpm 9.15.4 y lock conservados. Fuente externa del template intacta.

## [S2] Comportamiento del formulario
Facultad opcional con selector y búsqueda insensible a mayúsculas/tildes. Carrera con selector y búsqueda; filtrada por Facultad cuando hay selección. Sin Facultad, búsqueda global con opciones agrupadas por facultad e identificación de la asociación elegida (misma carrera en varias facultades no se deduplica).

Al cambiar de Facultad, si la carrera elegida ya no corresponde, avisar y pedir nueva selección; limpiar sólo la selección de carrera. "No encuentro mi carrera" habilita declaración manual excepcional: conserva el texto de carrera con las validaciones existentes, marca que requiere revisión del catálogo y no bloquea el envío por ausencia en el catálogo. Borradores incompletos y reglas de envío vigentes se conservan.

Expedientes anteriores muestran sus textos declarados tal cual; si no coinciden con el catálogo, se permite sustitución mediante edición explícita. Ningún mapeo automático por semejanza.

## [S3] Persistencia idempotente
Migración incremental nueva: `catalog_faculties` (clave estable `catalog_id` texto PK, nombre, grupo, url, fecha consulta, estado, activa) y `catalog_career_options` (clave estable `catalog_id` texto PK, `faculty_catalog_id` texto, nombre, nombres fuente JSON, referencias admisiones JSON, evidencia, requiere revisión, notas JSON, versión catálogo, activa). Sin FK dura desde inscripciones hacia el catálogo: las inscripciones guardan claves como texto para no reescribir historial si el catálogo cambia.

Comando `catalog:import` idempotente: upsert por `catalog_id` desde `docs/data/catalogo-uagrm.json`, nunca borra filas (las ausentes se marcan inactivas), conserva filas referenciadas e historial. En desarrollo sólo aplica pendientes y conserva expedientes/datos existentes.

Inscripciones: nuevas columnas texto nulables `faculty_catalog_id`, `career_catalog_id`, `catalog_label` (etiqueta histórica de la selección), `catalog_version`, booleano `career_manual` (defecto falso). Los textos `faculty`/`career` siguen siendo la declaración vigente y conservan la matriz actual.

## [S4] Contratos
Backend es la única fuente servida a React; no hay listas duplicadas en el frontend.

- `GET /api/catalogo/facultades`: lista facultades activas (id, nombre, grupo). Requiere sesión Sanctum SPA + cuenta habilitada, igual que el resto del proceso A.
- `GET /api/catalogo/carreras?faculty_id=&search=`: opciones activas; `faculty_id` filtra por facultad; `search` normalizado (minúsculas, sin tildes) contra nombre y nombres fuente; sin facultad devuelve agrupación por facultad. Incluye `requiere_revision_catalogo` como dato informativo, nunca como rechazo.
- Inscripciones (`POST`/`PATCH /api/talento/inscripciones...`): aceptan además `faculty_catalog_id`, `career_catalog_id` y `career_manual` (bool). Reglas: IDs deben existir y estar activos; si ambos presentes, la opción debe pertenecer a la facultad (422 si no corresponde); si `career_manual` es verdadero, `career_catalog_id` debe ser nulo y el texto de `career` sigue las validaciones existentes; Facultad sigue opcional; ningún campo nuevo es obligatorio para guardar borrador ni para enviar. Con selección de catálogo, el backend fija los textos `faculty`/`career` desde el catálogo y congela `catalog_label` y `catalog_version`; en modo manual conserva el texto declarado y limpia la referencia.
- `RegistrationResource`: mantiene `academic` intacto y añade objeto `catalog` con ids, etiqueta histórica, versión, flag manual y nombre de facultad/opción resueltos. Historial y versión existentes registran estos cambios como cualquier otro campo.

Errores: 422 combinación inválida o IDs inexistentes/inactivos; 401/403/409/419 vigentes sin cambios.

## [S5] Frontend
Reutiliza layout y componentes del template (Select con búsqueda, OptGroup, avisos, Card/Form/Row/Col existentes). Normalización local con la misma regla que el backend para nombre y nombres fuente; los textos informativos ("· revisión pendiente") no participan de las claves de búsqueda. Cambio de Facultad con carrera incompatible: aviso y limpieza sólo de carrera. Excepción manual: interruptor "No encuentro mi carrera" que muestra Input manual, conserva texto y marca revisión pendiente. Legados: si el texto no está en el catálogo, se muestra y se edita explícitamente.

## [S6] Verificación y evidencia
Pruebas con escritura/limpieza sólo en `tecnoweb18b_test`, verificando conexión real antes de escribir. Desarrollo conserva expedientes y datos (sólo migraciones pendientes + import idempotente).

Cubrir: búsqueda con/sin tildes, filtrado por facultad, agrupación sin facultad, cambio de facultad con aviso/limpieza, excepción manual con guardado/recarga, conservación de legados, rechazo 422 de combinación manipulada, guardado de borrador incompleto y matriz de envío intacta. Frontend: tests de selectores/excepción/legados, TypeScript, lint focal, build. Navegador real desktop 1440x960 y móvil 390x844 sobre runtime aislado de tests, con capturas. Actualizar contrato, README e informe con resultados reales y pendientes; conservar versiones anteriores.

## [S7] Fuera de alcance
Aprobación institucional, vigencia/elegibilidad, equivalencias de títulos, niveles/modalidades/planes como campos nuevos u obligatorios, reglas de PPA, filtros de admisión, obligatoriedad nueva de Facultad, verificación de identidad/email, correo, IA/OCR, publicación, cambios de APP_KEY/secretos, fresh/reset en desarrollo, actualizaciones masivas, commit/push/publicación.

## Tasks
- [x] T7.1: Persistencia idempotente del catálogo — aceptación: migración incremental + import upsert sin borrados, 18 facultades/121 opciones cargadas en tests, filas referenciadas conservadas (covers: S3)
- [x] T7.2: Consulta y validación en inscripciones — aceptación: endpoints facultades/carreras con búsqueda normalizada y validación facultad-carrera 422 ante combinación manipulada, textos/historial/versión intactos (covers: S4; depends: T7.1)
- [x] T7.3: Selectores y excepción manual en React — aceptación: facultad opcional con búsqueda, carrera filtrada/agrupada, aviso y limpieza al cambiar facultad, manual excepcional sin bloqueo de envío, legados visibles y editables explícitamente (covers: S2,S5; depends: T7.2)
- [x] T7.4: Verificación integral y evidencia — aceptación: backend/frontend/TS/lint/build frescos en tests, navegador desktop/móvil con capturas, desarrollo intacto, contrato/README/informe actualizados (covers: S6; depends: T7.1,T7.2,T7.3)
- [x] T7.5: Revisión independiente y entrega documentada — aceptación: cumplimiento/corrección/consistencia sin críticos, reporte honesto con comandos/capturas/brechas, sin commits (covers: S1,S7; depends: T7.4)

## Revisión independiente (T7.5)

Sin hallazgos críticos: cumplimiento S2–S6 por evidencia en código y artefactos, correctness (idempotencia, correspondencia 422, sin mapeos automáticos, sin nuevos bloqueos de envío, historial/versionado, aislamiento 404 intacto) y consistencia (patrones del repo, componentes del template, fuente externa intacta). No críticos de entonces, resueltos o documentados en el cierre T8: filtro cliente ampliado a nombres fuente con claves limpias; validación previa total del import sin parciales y conteos exactos; resto sin defecto reproducible (chequeo redundante, UI de lista única a escala 121, paridad fuera del español).

## Tareas del cierre técnico focal (T8)

- [x] T8.1: Importación segura — aceptación: archivo malformado rechazado sin cambios parciales, reimportación sin cambios, referenciadas conservadas con conteos exactos (covers: S3)
- [x] T8.2: Paridad de búsqueda — aceptación: `source_names` en API y filtro cliente, facultad con la misma normalización, verificación UI sin tildes y teclado en navegador (covers: S2,S5; depends: T8.1)
- [x] T8.3: Conservación histórica — aceptación: referenciada ausente sigue activa, edición parcial conserva referencia/etiqueta/historial, inactiva rechazada, cambio explícito encadena historial (covers: S2,S4; depends: T8.1)
- [x] T8.4: Verificación integral, informe y capturas unificadas — aceptación: regresiones/TS/lint/build frescos, navegador con 5 capturas conservadas, desarrollo intacto, informe actualizado (covers: S6; depends: T8.1,T8.2,T8.3)
