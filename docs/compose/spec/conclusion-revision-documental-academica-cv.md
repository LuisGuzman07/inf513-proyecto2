---
feature: conclusion-revision-documental-academica-cv
status: delivered
updated: 2026-10-12
branch: feat/talento-piloto
commits:
---

# Conclusión de revisión documental, revisión académica y CV del proceso A

## Report

### Resultado

Cierre técnico verificado en la rama feat/talento-piloto, sin commit/HEAD, push ni publicación. La revisión independiente general-28 detectó tres críticos y su re-revisión confirmó los tres resueltos, sin nuevos bloqueantes: resumen académico vigente distinto de última registrada; CV presente sin opción inválida de ausencia y feedback 422 útil; cuatro eventos con etiquetas humanas. Se conserva el alcance aprobado, no se calcula/normaliza PPA ni se añaden rangos, rúbricas, admisión o publicación.

El incremento completo incorpora review_concluded y sus transiciones documentadas en S5. Este ciclo no agrega otros estados ni permisos: las correcciones de presentación y del harness no equivalen a «sin cambios de estados» en el incremento completo.

### Verificación ejecutada

| Comprobación | Resultado observado |
| --- | --- |
| Backend: php vendor/bin/phpunit --configuration phpunit.xml | PASS 87/87, 1302 aserciones, exit 0; guards de testing + conexión PostgreSQL real exclusivamente tecnoweb18b_test. Sin cambios backend posteriores a esa ejecución. |
| Pint focal: TalentReviewController.php y TalentReviewRecordsTest.php | PASS 2 archivos. |
| Frontend: corepack pnpm exec vitest run src/pilot src/layouts/app/app.test.tsx --pool=threads --maxWorkers=1 --minWorkers=1 --testTimeout=15000 --reporter=json | PASS conjunto final-06: 103/103, cero fallos, exit 0. No se sustituyó por pases aislados. |
| corepack pnpm exec tsc --noEmit | PASS, exit 0. |
| ESLint focal --max-warnings 0: records, workflow, review-design, ui, catalog, types y api | PASS, exit 0. |
| Prettier check de archivos frontend modificados | PASS, exit 0. |
| corepack pnpm run build | PASS, exit 0; DRIVER_COMPLETED antes de re-revisión. |
| Navegador real: review-flow.cjs, RUN10 sobre Preview del build verificado | PASS, 28 comprobaciones, 32 capturas escritorio/móvil, cero findings, exit 0. Runtime exclusivamente testing/tecnoweb18b_test, procesos propios y puertos privados 8002/5174. |
| Revisión independiente y re-revisión focal general-28 | Inicial: tres críticos. Final: todos resueltos, sin nuevos bloqueantes; cumplimiento S2–S7, corrección y consistencia corroborados. |

El recorrido real acredita revisión académica y ausencia → conclusión con mapa confirmado → corrección → sustitución del histórico/incorporación CV/cambio de PPA declarado → reenvío/toma → anteriores → nuevas revisiones/reconclusión. Incluye lectura del titular sin mutaciones, descargas históricas/CV, 403/404, conflictos de versión UI/API con conservación de datos, doble conclusión sin cambios, rechazo en estados no editables, revisión de histórico v2 seguida de v1 manteniendo el resumen vigente y etiquetas de los cuatro eventos.

### Evidencia y conservación

Serie exclusiva: docs/verification-captures/revision-documental-academica-cv-cierre. Total físico conciliado: 112 PNG, distribuidos en 32 del PASS final RUN10 (after/1ced3be5-77dd-4937-a6d3-d8cce23fc1af), 28 del PASS anterior RUN06 y 52 de diagnóstico de ocho intentos FAIL. Las series históricas del catálogo/proceso A no se mezclan con esta cuenta. evidence.json indexa intentos, checks, capturas, modos y pruebas de runtime; query-performance.json conserva la muestra de CPU. Los intentos fallidos no se presentan como PASS ni reemplazan RUN10.

Cada runtime terminó STOPPED con fingerprint antes/después igual. Prueba ampliada de solo lectura final: tecnoweb18b conserva users/people/registrations/events 1/1/1/1, documents/observations 0/0 y catálogo 18/121; fingerprint 93ea267288346adbeb85996e49a0604d62b5b59d66ea6e31310f087751f3c82b idéntico y hash de .env 4db0ee1a991d75b0cde7e1d93e3cd604ae969d0a2e1eaaf80f50bb2a511b1ec4 sin cambios. APP_KEY, credenciales y registros existentes conservados. No migraciones en desarrollo; las migraciones incrementales siguen pendientes allí hasta una operación autorizada. Puertos privados liberados y credenciales efímeras eliminadas.

### Journey log

1. Report previo rectificado: 84/86 no era aprobación conjunta y faltaban browser/revisión. El reintento mostró referencia DOM desconectada en 724 ms; consulta/aserción se hicieron atómicas. No se demostró contaminación común del otro caso ni causalidad en reversión sobre árboles/carga distintos; ambas regresiones pasan en la ejecución conjunta final.
2. CPU sampling localizó consultas globales de roles → nombres accesibles/visibilidad → resolución recursiva de estilos heredados de jsdom30 (60 frames); consulta de Reintentar ~11.98 s. Búsquedas por texto/etiqueta acotadas conservan controles, lecturas, descargas y ausencia de acciones incluso ocultas; accesibilidad/visibilidad se comprueba en navegador. Sin mayores timeouts, hidden:true ni mocks de estilos.
3. Se corrigieron falsos409 por orden del mapa documental y estado anterior incorrecto al pedir corrección desde review_concluded; también históricos ocultos/incompletos y desborde de descarga en tabla (1267>1225 px), usando componentes del template.
4. Revisión encontró críticos pese a green: vigente≠última, ausencia con CV y etiquetas faltantes. Regresiones previas dieron cinco fallos/un pase; correcciones y siete casos nuevos pasan dentro del conjunto103/103 y del recorrido ampliado.
5. Runtime dev desprendido cayó por TTY/EPIPE; CI=true desactiva atajos interactivos. La carga inicial dev siguió fallando; RUN10 usa Preview del build ya aprobado con proxy aislado heredado, sin cambiar app/reglas. Se distinguen estos intentos FAIL de la evidencia final.

### Límites reales y pendientes

- No se afirma inspección visual de píxeles por el agente; se conservaron PNG y verificaciones DOM/geometría. La revisión estética humana de los avisos/cabecera/textos de capturas anteriores no se convierte en aprobación institucional ni se amplía en este cierre.
- La carrera simultánea real no fue ensayada: sí conflictos secuenciales de versión, transacciones/bloqueo y doble conclusión. Browser no recorre toda matriz401/419/422 ni segundo revisor; se complementa con autorización/validación backend y regresiones frontend, incluidos422 con errors y message.
- Build conserva warnings conocidos del template (bundle grande, Sass y anotaciones). No se actualizaron dependencias para suprimirlos.
- Institucionales: quién finaliza, qué habilita, obligatoriedad/rangos del valor revisado y redacción/rol del CV permanecen según Apéndice P. No conceden admisión/evaluación/publicación automática. Commit/push/publicación requieren autorización explícita y no se ejecutaron.

## [S1] Problema
El proceso A termina hoy su revisión en `in_review` con observaciones generales o `correction_requested`, sin un cierre documental (09: transición no documentada cuando no hay observaciones). La revisión académica existe sólo como PPA declarado sin valor revisado vinculado al histórico (07 paso 2, A02, A03), y el CV no tiene registro de revisión humana ni de ausencia (07 paso 3, A03: "CV ausente no bloquea ni produce «sin experiencia»"). Todo lo propuesto aquí es configuración técnica de trabajo; no atribuye aprobación institucional, vigencia ni permisos.

## [S2] Conclusión de revisión documental
Nueva acción humana del revisor asignado —responsable técnico provisional de este incremento, no permiso institucional aprobado— sobre un expediente `in_review`: registra responsable (reviewer autenticado), fecha (created_at) y las versiones documentales revisadas (snapshot por tipo: documento id + versión vigente de cada tipo presente). No cambia capacidades ni concede admisión, aprobación académica, evaluación o publicación: es sólo cierre documental, separado de esas decisiones.

Implementación mínima: reutiliza `registration_observations` con `kind='review_concluded'` (contenido = resumen/motivo requerido, máx. 4000, igual que las demás observaciones) más evento de historial con `changes.documents` (mapa tipo → `{document_id, version}`). Sin tabla nueva y sin nuevo permiso: exige sesión Sanctum, `can_review_talent`, expediente asignado a la cuenta (`reviewer_user_id`), estado `in_review` y versión coincidente, en transacción con `lockForUpdate` como `observe()`. Cada operación incrementa la versión en 1 y registra exactamente un evento (`TalentWorkflow::event`), igual que tomar/observar/corregir.

Antes de confirmar, la pantalla muestra los documentos y versiones exactos que quedarán registrados (leídos del expediente vigente); el botón de confirmación del modal es la confirmación humana explícita. El servidor reconfirma las versiones dentro de la transacción (fuente autoritaria); la vista previa es informativa.

Si después se sustituye un documento: la conclusión no lo impide técnicamente por sí sola porque el historial es inmutable; para volver a adjuntar, el revisor debe pedir corrección por el mecanismo existente (que también origina desde `review_concluded`), lo que mueve a `correction_requested`. Tras reenvío y nueva toma, una conclusión nueva vuelve a cerrar; la anterior sigue consultable en el listado de conclusiones (nunca se oculta por el cambio de estado). Las versiones nuevas exigen conclusión nueva.

Tras una corrección queda pendiente: nueva conclusión documental (el estado deja de ser `review_concluded`), y se conservan como historia las revisiones académica/CV previas con sus banderas de vigencia (S3–S4). La definición institucional de quién finaliza (junior vs. responsable) sigue pendiente (pregunta Q1).

## [S3] Revisión académica (PPA sin cálculo)
El PPA declarado sigue intacto como texto del titulado. Nuevo registro separado por revisión, sólo lectura para el resto del sistema:

Tabla `academic_reviews`: `id` UUID, `registration_id` FK, `reviewer_id` FK users, `reviewed_ppa` texto 64 nullable, `declared_ppa_snapshot` texto 64 nullable (valor declarado al momento de la revisión, para identificar cambios posteriores sin calcular ni aplicar rangos), `historico_document_id` UUID + `historico_document_version` entero (referencia interna a un documento tipo `historico` de ese mismo expediente, no FK dura para no reescribir historial), `observations` texto requerido máx. 4000, timestamps. Sin columnas numéricas: no se calcula, normaliza ni compara nada; sin rangos ni decisiones de admisión.

Múltiples filas permitidas (cada revisión es un evento nuevo, nunca edición); se distingue última registrada (máxima fecha/id) de vigente: es vigente la última cuya dupla documento/versión sigue siendo la vigente del tipo `historico` y cuyo `declared_ppa_snapshot` coincide con el declarado actual; si el histórico se sustituyó o el declarado cambió, la anterior se conserva señalada como "corresponde a una versión anterior" y el expediente muestra "requiere nueva revisión académica". No cambia el estado del expediente.

## [S4] Revisión manual del CV
Mismo patrón, más liviano. Tabla `cv_reviews`: `id` UUID, `registration_id` FK, `reviewer_id` FK, `cv_document_id` UUID nullable + `cv_document_version` entero nullable, `absent` booleano (defecto falso), `observations` texto requerido máx. 4000, timestamps. Exclusivo: o bien referencia un documento tipo `cv` de ese expediente, o bien `absent=true` sin documento (combinación o ausencia de ambos → 422). Además Laravel valida que `absent=true` corresponda a un expediente sin CV vigente (si existe alguna versión tipo `cv`, 422 con mensaje de revisar el documento en lugar de registrar ausencia).

Registrar ausencia no bloquea el proceso, no cambia estados y no infiere experiencia: sólo deja constancia fechada con responsable. Si después se adjunta un CV, la constancia de ausencia se conserva y se muestra como anterior; el CV nuevo queda pendiente de revisión hasta su propia revisión. Sin puntuaciones, rúbricas ni escalas (las fuentes no las proporcionan para esta revisión). Múltiples filas permitidas; vigente la última cuya versión siga siendo la vigente del tipo `cv` (o la ausencia mientras no exista CV).

## [S5] Contratos, transiciones y permisos
El incremento completo incorpora `review_concluded` y las transiciones documentadas abajo; conserva las capacidades existentes. «Sin cambios adicionales de estados en este ciclo frontend» no significa ausencia de cambios de estado en el incremento completo. Autorización siempre en el servidor, en transacción con `lockForUpdate`; cada operación incrementa la versión en 1 y registra exactamente un evento (mismo `TalentWorkflow::event` de tomar/observar/corregir). Se distingue así:

| Condición | Respuesta |
| --- | --- |
| Sin sesión / sesión inválida | 401 (middleware existente) |
| Sesión válida sin capacidad (`can_review_talent` o cuenta no habilitada) | 403 |
| Con capacidad pero sin asignación en el expediente (o expediente propio) | 404 (convención vigente: no revelar existencia) |
| Asignado pero estado fuera de los editables de revisión, o versión obsoleta | 409 (conflicto de estado/versión, con mensaje) |
| Validación de contenido (documento ajeno/tipo erróneo, exclusivo incumplido, ausencia con CV vigente) | 422 |

Estados editables de revisión por endpoint (todos exigen asignado + versión coincidente):
- `concluir-revision`: sólo `in_review`. Repetirla sobre `review_concluded` → 409 (nada que concluir; ante nuevos documentos rige el ciclo de corrección).
- `revision-academica` y `revision-cv`: `in_review` o `review_concluded` (dimensiones independientes, 07); nunca `draft`, `submitted` sin tomar, `correction_requested` ni legados. Tras corrección y reenvío, el revisor retoma (`submitted` → tomar → `in_review`) y registra de nuevo según las banderas de vigencia.

- Nuevo estado `review_concluded` (sigue la convención inglesa existente). Transiciones: `in_review → review_concluded` (concluir, asignado); `review_concluded → correction_requested` (corrección, asignado); `correction_requested → submitted` (reenvío, titular, existente).
- `POST /api/personal/inscripciones/{id}/concluir-revision` `{version, content, documents: [{type, id, version}]}` → 200 Resource. El mapa debe coincidir con las versiones vigentes por tipo dentro de la transacción; el orden del array no tiene significado. Sin asignación → 404; estado distinto de `in_review`, versión obsoleta o mapa documental distinto → 409.
- `POST /api/personal/inscripciones/{id}/revision-academica` `{version, reviewed_ppa?, historico_document_id, observations}` → 200; 422 si el documento no existe, no es del expediente o no es tipo `historico`; sin cambio de estado.
- `POST /api/personal/inscripciones/{id}/revision-cv` `{version, cv_document_id?, absent?, observations}` → 200; 422 si ambas/neither; sin cambio de estado.
- `RegistrationResource` aditivo: `document_conclusions: [{id, reviewer: {id, name}, created_at, summary, versions: {tipo: {id, version}}}]` (todas, nunca ocultas por el estado) + `concluded` derivado (`status === 'review_concluded'`); `academic_reviews` (lista con `vigente` calculada + snapshot del declarado) y `cv_reviews` (lista con `vigente`/`pendiente` calculados); `academic` y textos intactos. Las banderas de vigencia se calculan comparando versiones referenciadas contra versiones vigentes por tipo, sin persistirlas (evitan reescritura del historial).
- Bandeja del personal: incluye `review_concluded` en el alcance del asignado (query + policy `review()`); el titular ve etiqueta "Revisión documental concluida" y próxima acción de espera. Historial registra `review_concluded`, `academic_review_recorded`, `cv_review_recorded` / `cv_absence_noted` con actor, versión y cambios.
- 401/403/404/409/419/422 vigentes. Descargas y aislamiento sin cambios.

## [S6] Pantallas con componentes del template
Sin rutas nuevas salvo las existentes; se extiende el panel "Revisión privada" (staff, asignado) con tres bloques `Card`/`Form` y se añade lectura en el detalle:

- Conclusión documental: botón "Concluir revisión documental" + `Input.TextArea` de resumen en el formulario existente de revisión (visible sólo si `in_review` y asignado); el modal de confirmación lista los documentos y versiones que quedarán registrados (leídos del expediente) y su botón es la confirmación explícita. Tras concluir: `Alert` de estado + historial de conclusiones (todas, con versiones) + botón de corrección para reabrir.
- Revisión académica: `Descriptions` (PPA declarado entonces/ahora con aviso si cambió, revisado, histórico utilizado con versión y descarga, responsable, bandera vigente/anterior) + formulario (`Input` PPA revisado opcional, `Select` de versiones del histórico, `TextArea` observaciones) con validación de presencia del histórico.
- Revisión del CV: si hay CV, `Select` de sus versiones + observaciones; si no, texto "Sin CV adjunto en el expediente" + `Checkbox` "Registrar ausencia de CV" + observaciones; ausencias anteriores listadas como tales y bandera "pendiente de revisión" ante CV nuevo. Sin campos numéricos.
- Titular: `Alert` informativo de conclusión y `Descriptions` de solo lectura para las dos revisiones (sin acciones). `StatusTag`, `NextAction` y `statusLabels` extendidos con el nuevo estado. Sin mocks ni textos DEMO.

## [S7] Verificación propuesta
Backend en `tecnoweb18b_test` con guards: concluir registra responsable/fecha/versiones y no otorga nada (bandeja/permisos/estados iguales salvo el nuevo); concluir exige asignado + `in_review` + versión (401/403/404/409 según matriz); cada operación suma versión y un evento; repetir conclusión → 409; sustituir tras concluir exige corrección previa y la conclusión anterior permanece consultable; nueva conclusión tras el ciclo registra versiones nuevas. Académica exige histórico propio, admite revisado nullable y conserva snapshot del declarado (bandera si cambia o el histórico se sustituye); CV exige documento-xor-ausencia, ausencia con CV vigente → 422, ausencia posterior a adjunto queda como anterior con pendiente, y nada de esto bloquea el envío (matriz intacta) ni etiqueta experiencia. Historiales encadenados por dimensión. Frontend focal: paneles visibles según estado/asignación, formularios con validación y lectura del titular; `tsc`, ESLint focal, Prettier. Navegador real desktop/móvil sobre runtime aislado: concluir → sustituir vía corrección → reconcluir, con capturas; desarrollo intacto con fingerprint. Revisión independiente antes de dar por entregado.

## [S8] Fuera de alcance
Admisión, evaluación, publicación, ficha pública, instrumentos/baremos, fórmulas, rangos PPA, entrevistas/agenda, OCR/IA/correo, cambios de APP_KEY/secretos, migraciones en desarrollo fuera de pendientes incrementales, actualizaciones masivas, commit/push/publicación. No se toca titularidad, sesión ni documentos existentes.

## Apéndice E — Evidencia en fuentes
- S11-A: dos actividades manuales del junior (análisis del CV y entrevista); PPA como "evaluación técnica"; CV "si es que tiene"; provisión opcional oral.
- 07 pasos 2–3 y A03: revisor deja responsable/fecha/motivo; PPA declarado vs. verificado con histórico; CV ausente no bloquea ni etiqueta.
- 09 continuidad: cierre documental con responsable e historial, separado de admisión/publicación; transición de cierre sin definir (quién finaliza, qué habilita).
- 07 estados: tarea humana pendiente/en curso/completada; resultado ausente ≠ cero; expediente puede tener revisión concluida y otros pasos pendientes a la vez.
- Separaciones 07: PPA ≠ prueba técnica; perfil interno ≠ ficha pública; sin promedios globales ni filtros numéricos inventados.

## Apéndice P — Preguntas para Administración (con recomendación)
- Q1 ¿Quién concluye la revisión documental (junior asignado vs. responsable)? **Resuelto provisionalmente por indicación en revisión**: el revisor asignado como responsable técnico (no permiso institucional); la definición institucional sigue pendiente.
- Q2 ¿Qué habilita la conclusión? **Recomiendo**: nada automático; sólo constancia + visibilidad para pasos futuros.
- Q3 ¿PPA revisado obligatorio? ¿Rangos por facultad? (V03 pendiente.) **Recomiendo**: nullable y sin rangos hasta respuesta.
- Q4 ¿Quién revisa el CV y con qué redacción se registra su ausencia? **Recomiendo**: el asignado; texto actual propuesto sin etiquetas de experiencia.
- Q5 ¿Sustituir documentos tras concluir exige nuevo ciclo de corrección? **Resuelto por indicación en revisión**: sí (diseñado así, con reconclusión y conclusiones anteriores consultables).
- Q6 ¿Una sola revisión visible o múltiples? **Recomiendo**: última vigente + historial completo (append-only).

## Tasks
- [x] T9.1: Backend conclusión documental — aceptación: endpoint transaccional con responsable/fecha/versiones y vista previa confirmada, sin cambiar capacidades; 401/403/404/409 según matriz; cada operación suma versión y un evento; repetir → 409; conclusiones anteriores siempre consultables (covers: S2,S5)
- [x] T9.2: Backend revisiones académica y CV — aceptación: tablas y endpoints con validaciones exclusivas (histórico propio, snapshot del declarado, ausencia sólo sin CV vigente), vigencia calculada última-vs-vigente, sin cálculo ni estados nuevos salvo el documentado, historiales encadenados (covers: S3,S4,S5; depends: T9.1)
- [x] T9.3: Frontend panel y lectura — aceptación: confirmación con vista previa, historiales y banderas visibles según estado/asignación con componentes del template, lectura del titular, etiquetas del nuevo estado (covers: S6; depends: T9.2)
- [x] T9.4: Verificación, revisión independiente y entrega — aceptación: regresiones/TS/lint/build/navegador frescos, capturas, revisión sin críticos, informe honesto, sin commits (covers: S7; depends: T9.3)
