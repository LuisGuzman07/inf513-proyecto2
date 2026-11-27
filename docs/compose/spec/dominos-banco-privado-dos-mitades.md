---
feature: dominos-banco-privado-dos-mitades
status: delivered
updated: 2026-11-12
source: feat/talento-piloto
---

# Dominós: banco privado y respuesta de dos mitades

## Report

**Cierre vigente:** ficha vertical de captura, superior = primera cifra literal del Word, inferior = segunda, 0–6 y `null` como ausencia. Recorrido verificado y perfil `dominos-0.3.0-capture-v1` activado localmente para asignación/captura/envío sin calificación. La fuente no se modificó ni se habilitó; ninguna regla física o institucional quedó confirmada.

**Verificación vigente:** backend 34 casos (33 aprobados, 1 omitido por symlink Windows), 1.356 aserciones; frontend conjunto 31/31 y repetición focal posterior 6/6 sin sumar conteos; build/TypeScript, lint y formato aprobados. Chrome 42/42 sobre fuente real en testing/TEMP, 12 JSON del titular sin campos de claves. Revisión independiente sin bloqueantes. Activación aditiva en `tecnoweb18b` con cuentas/expedientes/filas previas y 69 archivos privados anteriores preservados; no fixtures ni asignaciones creadas allí. Detalle vigente en [S7]; [S1]–[S6] conservan el historial del primer corte. La entrega funcional se realizó sin commit; el cierre local posterior, autorizado por el usuario, se registra al final. Sin push ni publicación.

## [S1] Problema

Hábil es hoy el único instrumento operativo. Su banco privado, importador, asignación, guardado, envío y resultado bruto asumen **una opción A–H por ejercicio y 15 ejercicios**. Dominós tiene 48 ejercicios cuya respuesta es un **par ordenado de enteros 0–6**, sin alternativa correcta entre letras, y requiere que el titular registre dos cifras por ficha. Sin un tipo de respuesta propio, Dominós sólo podría entrar al banco falseando el contrato: convirtiendo mitades en opciones (perdiendo el par), deduciendo respuestas, o duplicando el motor.

Marcelo aprobó visualmente las 48 reconstrucciones del paquete `dominos-reconstrucciones-48-v0.3.0`; esa aprobación es **de trabajo visual** y no define puntuación, tiempos, baremos ni orientación física de la clave.

## [S2] Diseño

### S2.1 Fuentes y conservación

El paquete privado vive en `resources/dominos-reconstrucciones-48-v0.3.0`, hermano del repositorio, fuera de Git y de `frontend/public`. No se regenera ni se altera: el importador lo **lee** y copia bytes a `storage/app/private/instruments`. `manifest.json` relaciona `id` (`DOM-EX-0NN`), `numero_impreso`, `imagen_original`, `imagen_reconstruida`, `fuente_grafica`, `respuesta_fuente` (literal, cifras, `paraId`, `numId`) y `coincidencia_matriz`. Nunca se vincula por orden de archivo ni por posición en una página: el número sale del rótulo impreso cotejado.

La aprobación visual de Marcelo sobre las 48 reconstrucciones se registra como **conformidad de trabajo** (`instrument_conformities`), con `institutional_approval = false` y un texto que la limita explícitamente a lo visual. El estado del manifest (`estado_visual` por ejercicio) se conserva tal cual como procedencia; la conformidad global no lo sobrescribe ni lo presenta como aprobación por ejercicio.

### S2.2 Contrato de respuesta de dos mitades

Un ejercicio Dominós se responde con:

- `first` y `second`: enteros **0–6** cada uno, o `null` en la mitad no respondida.
- `null` en la mitad significa _sin responder_, distinto de `0`, que es una respuesta válida.
- El par sin responder es `{first: null, second: null}` y cuenta como ausente.
- Un par con una sola mitad es **parcial**: no es ausente ni completo; se informa por separado.
- El orden escrito se conserva. **No se normaliza ni se invierte**, porque la orientación física de la clave está pendiente.

Representación persistida por ejercicio: `{"first": int|null, "second": int|null}`. En el JSON de `answers` se conserva exactamente ese objeto o `null`.

### S2.3 Tipos de respuesta compatibles

Se añade `answer_type` al instrumento (por versión) y `response_type` al ejercicio, con dos valores:

- `single_choice` — Hábil: opciones A–H, `correct_option` escalar. Comportamiento intacto.
- `two_halves` — Dominós: par 0–6, `correct_halves` (dos valores de fuente `correct_first`, `correct_second`), sin `correct_option`.

La columna `correct_option` existente pasa a ser **nullable**; el discriminador decide qué campo es autoritativo. Esto es una migración aditiva, no un reemplazo: Hábil conserva sus filas, su validación y su puntuación actuales.

### S2.4 Banco privado de Dominós

Reutiliza `InstrumentVersion`, `InstrumentExercise`, `instrument_conformities` y el disco `instrument_private`. Añade:

- Importación versionada, transaccional e idempotente por `manifest_sha256`, bajo el mismo advisory lock que Hábil.
- 48 ejercicios con `source_id` estable `DOM-EX-001…048`.
- Imagen reconstruida y original por ejercicio, con hash y ruta privada.
- Vista previa en el banco (personal autorizado) con zoom, navegación y número de ejercicio, mostrando original y reconstrucción y el par de fuente.
- Respuestas y claves **sólo** en el servidor y en las vistas autorizadas del personal. Nada en `frontend/public`, bundle, `localStorage` ni respuestas del titular.

### S2.5 Compatibilidad del motor

La validación de guardado y la de envío despachan por `answer_type`. La regla Hábil de un punto por acierto con máximo 15 se conserva literalmente para Hábil. Para Dominós **no se implementa calificación, crédito parcial, penalización, tiempo, baremo ni IQ/CI**: el envío congela respuestas y el resultado bruto queda ausente, no inventado.

Reutiliza autorización, versionado, `409` por conflicto, congelamiento, confirmación de ausentes y descarga de medios del flujo actual.

### S2.6 Instrumento no habilitado para aplicación

Dominós se importa y se previsualiza, pero **no puede asignarse a titulares** mientras la orientación física no esté resuelta. La asignación rechaza versiones cuyo `application_ready` sea falso; la versión permanece visible en el banco y Hábil sigue asignable.

## [S3] Fuera de alcance

Calificación automática de Dominós, crédito parcial, penalización, tiempos, baremos, IQ/CI, clasificación por carrera, publicación, proceso B, cambios en la orientación física de la clave, modificación de datos de desarrollo, commit o push.

## [S4] Implementado

### S4.1 Migración y modelos

- `backend/database/migrations/2026_10_30_000100_add_two_halves_response_type.php` — en `instrument_versions`: `answer_type` (default `single_choice`), `application_ready` (default `true`), `application_blocked_reason`; en `instrument_exercises`: `response_type`, `correct_first`, `correct_second`, `reconstruction_path`, `reconstruction_sha256`. `correct_option` y `points` pasan a nullable. Tres restricciones `CHECK`: enum de versión, enum de ejercicio y **forma única por tipo** (`single_choice` exige `correct_option` y prohíbe las mitades; `two_halves` exige ambas mitades 0–6 y prohíbe `correct_option`). Ninguna fila existente se reescribe.
- `InstrumentExercise` / `InstrumentVersion` — constantes de tipo, `isTwoHalves()`, `sourceKey()` (clave con la forma del tipo de respuesta) y las claves nuevas en `$hidden`.
- `backend/app/Support/EvaluationAnswers.php` — normalización y comparación por tipo: `normalize()`, `isAnswered()`, `isPartial()`, `matchesSource()`. Rechaza escalares, arrays de lista, claves extra y valores fuera de 0–6; conserva el orden.

### S4.2 Importación privada

- `backend/app/Support/DominosPackageImporter.php` + `php artisan dominos:import {path?} {--reviewed}` — valida el manifest completo antes de escribir: identificador y número impreso por ejercicio, presencia y MIME real de cada imagen, hash de reconstrucción y de original, ficha con el par literal, instrucciones y compuesto de ejemplos, `SHA256SUMS.txt`, y las dos condiciones de procedencia (la orientación debe declararse **no confirmada** y el paquete no puede declararse habilitado para aplicación). Inventaría los 214 archivos con hash. La escritura es una transacción bajo advisory lock, idempotente por `manifest_sha256`: si la versión existe se devuelve sin reescribir storage; si algo falla se borran staging y prefijo. Registra la conformidad visual no institucional sólo cuando se pide con `--reviewed`.
- Rutas: se valida segmento por segmento (sin `..`, sin rutas absolutas, sin caracteres inválidos de Windows) y se resuelve con `realpath` dentro de la raíz. Esto se corrigió al comprobar el paquete real, que contiene nombres como `fuentes/matrices/WhatsApp Image 2026-10-19 at 5.04.01 AM (2).jpeg`.

### S4.3 Contrato, motor y DTO

- `EvaluationController` — `assign` rechaza versiones sin `application_ready` **con el motivo**; el estado inicial de un instrumento de dos mitades es `{first: null, second: null}` por ejercicio. `saveAnswers` normaliza con `EvaluationAnswers` leyendo el cuerpo crudo del JSON (para que `TrimStrings`/`ConvertEmptyStringsToNull` no conviertan un cero en ausencia). `submit` cuenta ausentes por «ninguna mitad respondida»; con `two_halves` **congela y deja `raw_result = null`**; con `single_choice` conserva exactamente la regla `source_one_point_per_correct_v1` y el máximo 15. El endpoint de imágenes acepta `DOM-EX-###`, exige pertenencia a la versión y valida el MIME servido (`png`/`jpeg`) con `nosniff`.
- `EvaluationData` — DTO del titular: `partial_count`, `answer_type`, y por ejercicio `response_type` más `options` (Hábil) o `halves: {min, max}` (Dominós). DTO del personal: añade `source_answer` **sólo con `staff = true`** y omite `raw_result` cuando es `null`.
- `InstrumentBankController` — resumen y detalle exponen `answer_type`, `application_ready`, `application_blocked_reason` y el par de fuente; las imágenes sirven la reconstrucción con reserva al `image_path` y validan MIME.

### S4.4 Banco y vista previa

`InstrumentBankPage` muestra el tipo de respuesta y una etiqueta «No habilitada para aplicación». `InstrumentDetailPage` añade un aviso de vista previa con el motivo del bloqueo, formatea el par literal de fuente sin publicarlo en este informe y, para dos mitades, un aviso de que el orden escrito se conserva y la correspondencia física está pendiente. La vista ya existente conserva original y reconstrucción lado a lado, navegación Anterior/Siguiente con el número de ejercicio, zoom en modal con la opción de tamaño original desplazable y el texto fuente plegado.

### S4.5 Interfaz del titular

- `evaluations-types.ts` — unión discriminada por `response_type`: `SingleChoiceExercise` (`options`) o `TwoHalvesExercise` (`halves`); `HalvesAnswer` y `ExerciseAnswer`.
- Formulario: para dos mitades se rinden **dos `Select` 0–6** etiquetados «Primera mitad» y «Segunda mitad» por ejercicio, con `aria-label` que incluye el número, ayuda asociada por `aria-describedby`, opción vacía «Sin responder» y limpieza por mitad; los controles de Hábil (radio A–H) quedan intactos.
- Estado: el mapa distingue **Guardada**, **Parcial: falta una mitad** y **Pendiente**; el conteo de parciales se informa aparte del de ausentes; el resumen de envío y la confirmación posterior repiten esa distinción; las instrucciones cambian de texto según el tipo. «Quitar respuesta» deja el par en `{null, null}` y no en cero. La comparación de cambios usa las dos mitades, así que un cero sin guardar cuenta como cambio real.
- Personal: el selector de asignación deshabilita las versiones no habilitadas y lo indica en la etiqueta; un envío de Dominós sin regla de puntuación muestra un aviso explícito en lugar de un puntaje.

### S4.6 Decisión sobre el código de rechazo

`[S2.6]` pedía `409` para la asignación bloqueada. Se implementó **422 con error de campo** (`instrument_version_id`) porque en esta API `409` está reservado al conflicto de versión y su texto al usuario habla de «otra edición cambió la versión», lo que sería falso aquí; el 422 permite mostrar el motivo junto al selector. La regla efectiva —no se puede asignar una versión no habilitada— se cumple y está cubierta por prueba.

## [S5] Verificación ejecutada — primer corte histórico

Base de datos: sólo `tecnoweb18b_test`, con guardas de entorno y huella de desarrollo idéntica antes/después (`8712a8804a97f6135fefffab3d94e6c3598cbeb3b3130aa050edc7693e928b73`). Ningún dato de desarrollo fue creado, migrado ni importado.

| Comprobación                                          | Comando                                                                                                                                          | Resultado                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend focal (Dominós + evaluaciones + instrumentos) | `php vendor/bin/phpunit --filter 'Dominos\|Evaluation\|Instrument'`                                                                              | **18 pruebas, 917 aserciones, 0 fallos**                                                                                                                                                                                                                                      |
| Formato PHP                                           | `php vendor/bin/pint --test` sobre los 12 archivos tocados                                                                                       | **exit 0** (dos archivos ajenos al incremento, `tests/browser/habil-fixture.php` y `habil-resume.php`, arrastran estilo previo: **PRE-EXISTING**)                                                                                                                             |
| TypeScript                                            | `tsc --noEmit`                                                                                                                                   | **exit 0**                                                                                                                                                                                                                                                                    |
| Lint focal                                            | `eslint` sobre los 5 archivos de evaluación con `--max-warnings 0`                                                                               | **exit 0**                                                                                                                                                                                                                                                                    |
| Formato JS                                            | `prettier --check` sobre los 6 archivos                                                                                                          | **limpio** (dos archivos se reformatearon antes de pasar)                                                                                                                                                                                                                     |
| Build                                                 | `pnpm build` (tsc + vite)                                                                                                                        | **exit 0**                                                                                                                                                                                                                                                                    |
| Pruebas React                                         | `vitest run` sobre `evaluations.test.tsx` y `evaluations-dominos.test.tsx` con `--testTimeout=60000 --pool=forks --poolOptions.forks.singleFork` | **23 pruebas, 0 fallos**                                                                                                                                                                                                                                                      |
| Paquete real, validación de sólo lectura              | script temporal sobre `resources/dominos-reconstrucciones-48-v0.3.0`                                                                             | **48 ejercicios, 214 archivos, digest `017a0de3…` abajo**, `version_label` `dominos-0.3.0`, ids `DOM-EX-001…048`, 11 pares con un cero                                                                                                                                        |
| Paquete real, importación doble en `tecnoweb18b_test` | `php artisan dominos:import --reviewed` ×2 + recuento                                                                                            | **misma versión en ambas** (`01a19ddc-bfa9-7092-bfa9-503e9c7cf84d`), 48 ejercicios, **214 archivos almacenados** (incluido el JPEG con espacios y paréntesis), conformidad `institutional_approval = false`, `application_ready = false`, 0 versiones `single_choice` creadas |
| Recorrido real en navegador (aislado, Chrome)         | `runtime.ps1` (backend 8002 + Vite 5174, storage en TEMP) + Playwright                                                                           | **21 comprobaciones, todas aprobadas**                                                                                                                                                                                                                                        |

Detalle del recorrido de navegador (fixture sintético en `tecnoweb18b_test`, nunca material real en capturas):

- Banco privado, versión no habilitada: aviso «Vista previa: versión no habilitada para aplicación», motivo visible, aviso de orientación pendiente, original y reconstrucción visibles, zoom en diálogo con tamaño original, navegación al ejercicio 2 mostrando un par sintético con cero literal. Sin desborde horizontal a 1440 (contenedor 1176 px) ni a 390 px.
- Titular, prueba de dos mitades: dos combobox con nombre accesible «Primera/Segunda mitad del ejercicio 1», lista completa 0–6, selección de **0**, guardado confirmado y estado del mapa **«Ejercicio 1 · Parcial: falta una mitad»**; el valor guardado se muestra como `0` y el parcial se informa aparte. Sin desborde horizontal a 1440 ni a 390 px. Sin errores de consola distintos del `401` intencional de `/api/auth/me` antes de ingresar (única respuesta HTTP ≥ 400 registrada).
- Capturas: `docs/verification-captures/dominos-banco-privado/after/` — `banco-dominos-escritorio.png`, `banco-dominos-movil.png`, `prueba-dominos-escritorio.png`, `prueba-dominos-movil.png`.
- Cierre: procesos propios detenidos, puertos 8002/5174 liberados y huella de desarrollo sin cambios.

Lo que **no** se ejecutó: migración ni importación en la base de desarrollo; pruebas globales de las pantallas de demostración de la plantilla; calificación, tiempos o baremos (fuera de alcance por definición).

### Revisión independiente

Un revisor separado (subagente de sólo lectura, sin acceso a mi razonamiento) auditó el diff contra las siete preguntas críticas —fuga de claves, cero frente a `null`, regresión de Hábil, idempotencia y rutas de la importación, bloqueo en servidor, autorización del personal y accesibilidad del nuevo control— y devolvió **cero hallazgos bloqueantes**. Se aplicaron tres correcciones a partir de sus observaciones:

1. La restricción `CHECK` usaba `BETWEEN` sobre columnas nullable, y en PostgreSQL `NULL BETWEEN 0 AND 6` no la viola: ahora exige `IS NOT NULL` en ambas mitades y `points IS NULL`.
2. Se eliminó una variable sin uso en `EvaluationData`.
3. El tipo del instrumento en la asignación declaraba `application_ready`/`application_blocked_reason`, que el DTO del titular no envía: se tipó con la forma real del payload.

Quedan anotadas como pendientes, sin cambio en este corte: `down()` no restaura el `NOT NULL` original; la versión es inmutable a nivel de modelo, así que habilitar `application_ready` más adelante necesitará una ruta de código dedicada; `SHA256SUMS.txt` se comprueba presente pero no se coteja línea por línea; `package_date` usa una fecha fija en lugar de la del manifest; el paso a «parcial» no se anuncia en una región viva; y algunas aserciones históricas de importación quedaron después de `expectException`, por lo que son código muerto.

## [S6] Límites y pendientes del primer corte — cierre posterior en S7

1. **La orientación física de la clave sigue sin resolverse.** La fuente lo declara: «La matriz presenta 48 coincidencias bajo lectura por bloques 2 columnas × 3 filas, sin numeración de ventanillas; no confirma por sí sola el orden físico de las mitades ni equivalencias por inversión» (`resources/dominos-reconstrucciones-48-v0.3.0/revision/alcance-y-precisiones.md`). Por eso el instrumento queda `application_ready = false`, el orden escrito se conserva sin normalizar y no se califica.
2. **La versión real todavía no está activada en desarrollo.** Falta, cuando se decida, `php artisan migrate` y `php artisan dominos:import --reviewed` sobre `tecnoweb18b`. Ambas operaciones son aditivas e idempotentes y se probaron dos veces en `tecnoweb18b_test`.
3. **La conformidad registrada es de trabajo visual**, no institucional, y no altera el estado del manifest ni la aprobación por ejercicio de las 45 reconstrucciones nuevas.
4. El recorrido de navegador usó un fixture sintético de dos y tres ejercicios con imágenes de 1×1 px: prueba el contrato y la disposición, **no** el cotejo visual del material real.
5. La verificación fue directa (autor de los cambios). Los puntos 1 y 2 requieren decisión de Marcelo/Administración; no se tomaron por inferencia.

## Tasks

- [x] T1: Migración aditiva y modelos con discriminador de tipo de respuesta — aceptación: Hábil sigue leyendo/escribiendo A–H y Dominós admite par 0–6/null (covers: S2.3, S2.5) — **hecho**: migración con tres `CHECK`, `isTwoHalves()`/`sourceKey()`, Hábil cubierto por `HabilEvaluationTest` (18/18).
- [x] T2: Importador Dominós idempotente y transaccional desde el paquete privado — aceptación: 48 ejercicios estables, hash de manifest idempotente, sin duplicados ni mutación de versiones usadas (covers: S2.1, S2.4) — **hecho**: 5 pruebas de importación; paquete real validado (48/214) e importado dos veces con la misma versión.
- [x] T3: Banco y vista previa privada con zoom y navegación — aceptación: personal autorizado ve original, reconstrucción y par de fuente sin exponerlos al titular (covers: S2.4) — **hecho**: DTO con `source_answer` sólo para personal, aviso de vista previa y recorrido de navegador con capturas.
- [x] T4: Motor de guardado/envío por tipo de respuesta — aceptación: cero ≠ null, valores fuera de 0–6 rechazados, Hábil sin regresión (covers: S2.2, S2.5) — **hecho**: 8 formas inválidas rechazadas, cero preservado en base y en pantalla, `raw_result` nulo para Dominós y regla Hábil intacta.
- [x] T5: Bloqueo de asignación de Dominós y registro de conformidad visual — aceptación: asignación rechazada y conformidad no institucional registrada (covers: S2.1, S2.6) — **hecho**: rechazo en el servidor (422 con motivo), opción deshabilitada en la interfaz y conformidad `institutional_approval = false`.
- [x] T6: Verificación aislada, documentación y Notion — aceptación: pruebas en `tecnoweb18b_test`, foco TypeScript/lint/build, informe actualizado sin material privado (covers: S2.6) — **hecho**: ver [S5]; Notion actualizado de forma aditiva; sin material ni claves.

## Journey log

- 2026-10-30 — Paquete `dominos-reconstrucciones-48-v0.3.0` disponible; Marcelo aprueba visualmente las 48 reconstrucciones (registrado en Notion 13/14).
- 2026-11-02 — Contrato de dos mitades implementado en migración, modelos, importador y motor; banco y vista previa ampliados; interfaz de respuesta con dos selectores y estado parcial.
- 2026-11-02 — Validación de sólo lectura del paquete real: fallaba por nombres de archivo con espacios y paréntesis; se corrigió la validación de rutas segmento por segmento y el paquete pasó completo (48 ejercicios, 214 archivos).
- 2026-11-02 — Importación doble del paquete real en `tecnoweb18b_test` con storage temporal: misma versión, 214 archivos, conformidad no institucional, sin crear instrumentos `single_choice`.
- 2026-11-02 — La prueba de lista blanca del DTO del titular falló por los campos aditivos `partial_count` y `answer_type`; se actualizó la lista con comentario explícito. Sin otros cambios en pruebas existentes salvo el fixture de tipo.
- 2026-11-02 — Verificación agrupada (PHPUnit focal, Pint, TypeScript, ESLint, Prettier, build, Vitest) y recorrido de navegador aislado con capturas de escritorio y móvil; desarrollo intacto por huella.

## [S7] Ampliación: ficha vertical y captura sin calificación

Esta decisión técnica posterior de Marcelo sustituye el bloqueo funcional de [S2.6], sin modificar las fuentes ni validar su orientación física. La ficha de respuesta se muestra separada y en vertical: casilla superior = primera cifra literal del Word (`first`); inferior = segunda (`second`). Rango 0–6; `null` sigue siendo ausencia. Ninguna imagen se gira ni ningún par se invierte. La ayuda remite a los ejemplos A/B, sin exponer claves de los 48 ejercicios.

La habilitación debe crear una versión técnica nueva e idempotente; las versiones importadas, utilizadas o no, permanecen inmutables. La conformidad visual se conserva como no institucional; el contrato de captura tiene procedencia técnica separada, hash propio y vínculo con el manifest de origen. La orientación física continúa no confirmada y no se añade puntuación.

Antes de activar desarrollo se verifica revisor asigna → titular responde (incluido cero y parcial) → guarda → recarga/recupera → confirma envío con ausencias → congelamiento → consulta del revisor de las cifras enviadas. Las comprobaciones HTTP excluyen claves en el DTO del titular y prueban autorización. Luego, y sólo entonces, se aplican migraciones aditivas/importación en desarrollo, sin fixtures ni cambios de cuentas/expedientes. No commit/push/publicación.

- [x] C1: Completar ficha y consulta de cifras del revisor; ayuda breve, cero/null y sin puntaje.
- [x] C2: Publicar versión técnica inmutable de captura, idempotente, con procedencia separada.
- [x] C3: Verificación focal backend/React, estáticos/build y recorrido real aislado escritorio/móvil.
- [x] C4: Revisión independiente; activar únicamente migración/importación necesaria en desarrollo, cotejar conservación y documentar pasos manuales/Notion.

### Recorrido manual previsto con cuentas propias

1. Titular: ingresar por `/ingresar`; si todavía no tiene inscripción propia, completarla/enviarla desde el portal por el flujo existente. No convertir un expediente `legacy_internal` ni reasignarlo por coincidencia de nombre.
2. Personal con capacidad de revisión: abrir `/personal/inscripciones`, tomar la revisión del expediente elegible con «Tomar revisión» si corresponde y entrar en «Pruebas». Sólo el revisor asignado puede asignar/consultar sus evaluaciones; no puede revisar su propio expediente.
3. Seleccionar la versión `dominos-0.3.0-capture-v1` y «Asignar prueba». La versión fuente sin sufijo permanece en el banco como referencia no asignable.
4. Titular: abrir `/portal/pruebas` → «Abrir prueba». Leer ejemplos y ayuda; responder superior/inferior. Para comprobar captura puede ingresar un cero, guardar y recargar. El cero debe seguir visible; dejar una casilla sin responder se informa como parcial, no como cero.
5. «Revisar y enviar prueba»: revisar el resumen y confirmar expresamente las ausencias si las hay. Tras confirmar, las respuestas quedan congeladas y ya no aparecen controles editables. El aviso indica envío sin calificación automática: no hay puntaje, ni siquiera cero.
6. Revisor: volver al expediente → «Pruebas» → «Consultar respuestas capturadas (sin calificación)». Se leen superior/inferior y parciales; el banco y las claves siguen restringidos al personal autorizado.

Estos pasos quedan para las cuentas propias del usuario. El asistente no creó cuentas de demostración ni asignaciones en desarrollo; la activación ya se aplicó y su comprobante figura abajo.

### Evidencia vigente del cierre de captura (2026-11-12)

La tanda nueva no se suma a los conteos históricos de [S5]. Se ejecutó sobre el incremento de captura, con fixtures exclusivamente en `tecnoweb18b_test`.

| Comprobación                                                                                       | Resultado observado                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `php vendor/bin/phpunit --filter 'Dominos\|Habil' --testdox`                                       | 34 casos: 33 aprobados, 1 omitido por permisos de symlink Windows; 1.356 aserciones; exit 0. Incluye importaciones de ambos instrumentos, tipos de respuesta, aislamiento, publicación inmutable, rollback e idempotencia. |
| Vitest conjunto: `evaluations.test.tsx`, `evaluations-dominos.test.tsx`, `evaluations-api.test.ts` | 31/31, 3/3 archivos; un solo fork y timeout 60 s. El timeout de consultas de Testing Library se amplió a 10 s por el arranque lento observado, sin cambiar lógica de producción.                                           |
| Ajuste posterior del figcaption de Dominós (sin «alternativas»)                                    | 6/6 casos focales Dominós; no son seis casos nuevos ni una segunda suite conjunta.                                                                                                                                         |
| `pnpm build` (TypeScript + Vite)                                                                   | Exit 0. Advertencias de dependencias/legacy Sass y tamaño de chunk; no son fallos de build.                                                                                                                                |
| ESLint focal 5 archivos / Prettier 6 archivos / Pint 15 archivos                                   | Exit 0 en los tres. `git diff --check` sin defectos del incremento; warning EOL del README preexistente conservado.                                                                                                        |
| Detector de interfaz sobre TSX/CSS                                                                 | Sin hallazgos en su análisis estático acotado; no equivale a conformidad WCAG certificada.                                                                                                                                 |
| Chrome real, paquete privado real de 48 ejercicios en testing y TEMP                               | 42/42 comprobaciones. Escritorio 1440×1000 y móvil 390×844, sin desborde horizontal medido.                                                                                                                                |

El recorrido verificó asignación por el revisor del expediente, ficha vertical con dos Select, cero y parcial guardados, recuperación del cero tras recargar, par completo y otro parcial conservados, confirmación expresa de 46 ausencias, envío congelado y rechazo 409 al intentar sobrescribirlo. El revisor abrió la consulta de cifras enviadas y distinguió cero/ausencia/parcial, sin puntaje inventado. Otro titular recibió 404 para asignación e imagen ajenas y 403 para el banco.

Se auditaron 12 cuerpos JSON reales del titular sin `correct_first`, `correct_second`, `correct_option`, `source_answer`, `answer_markdown` ni `raw_result`. Para evitar la pérdida/bloqueo de cuerpos CDP tras navegar, el harness bufferizó la respuesta HTTP real mediante `route.fetch()` antes de entregarla sin modificar a la página. El intento CDP anterior se conserva como intento incompleto; no se presenta como aprobado.

La geometría midió casilla inferior debajo de la superior e imagen sin transformación CSS (`none`). Las siete capturas con material real permanecen privadas en TEMP, fuera de Git, Notion y `frontend/public`; no son los PNG sintéticos históricos de [S5]. Comprobante local: `%TEMP%/dominos-close-final/` (`browser-report.json`, logs y códigos de salida). Runtime de pruebas cerrado; huella de desarrollo antes/después `7e632224feb65ba040c3b7277068dcb294cd51df5fdb0de7775acbaec4bc6bea`, idéntica.

`dominos:enable-capture ID_FUENTE` crea una versión nueva `-capture-v1` con contrato `vertical_word_pair_v1`, hash técnico canónico y vínculo con ID/hash/manifest de fuente. Copia ejercicios y conformidad visual sin alterar cifras ni estados históricos; reutiliza las rutas privadas inmutables. Repetir con la fuente o el perfil devuelve el mismo perfil incluso si ya fue asignado. No se habilita ni modifica la fuente; sólo el perfil nuevo es asignable. La decisión técnica se registra separada, con orientación física no confirmada y puntuación/tiempos/baremos nulos.

### Revisión independiente de S7

Un revisor nuevo, de sólo lectura, contrastó el diff, los archivos nuevos, los contratos de S7 y los comprobantes ejecutados, después del cierre de suites y runtime. Resultado: gate de código aprobado, sin incumplimientos o defectos críticos identificados; conclusiones separadas de cumplimiento, corrección/seguridad y consistencia. No repitió suites ni abrió imágenes, por lo que su revisión no se presenta como otra ejecución del recorrido. La activación de desarrollo se dejó ordenada después de este gate.

Observación no bloqueante conservada: un nombre de test histórico de importación promete una versión nueva aunque el cuerpo comprueba rechazo por alteración y conservación de la primera. No se cambió su conducta ni se repitió la suite por un cambio de nombre.

### Activación local completada y conservación comprobada

Después de las comprobaciones y la revisión independiente, en `backend/` y sobre `tecnoweb18b` se ejecutaron únicamente:

```text
php artisan migrate --path=database/migrations/2026_10_30_000100_add_two_halves_response_type.php --force
php artisan dominos:import <resources/dominos-reconstrucciones-48-v0.3.0> --reviewed
php artisan dominos:enable-capture <ID explícito de la fuente importada>
```

Importación y creación de perfil se repitieron para comprobar idempotencia: mismos IDs, sin más versiones ni archivos. La fuente conserva hash `017a0de32e0c886e7d3a3d84ea519b09ca3a9aad481471ae49802615b6c4c5ed`, 48 ejercicios y `application_ready=false`; el perfil nuevo tiene otros ID/hash, 48 ejercicios y `application_ready=true`. Sus claves, orden y rutas/hashes de imágenes son iguales a la fuente; comparte los mismos 214 archivos privados. `physical_orientation_confirmed=false`, `institutional_approval=false`, y puntuación/tiempos/baremos siguen nulos.

| Dato de desarrollo                     | Antes      | Después     |
| -------------------------------------- | ---------- | ----------- |
| Cuentas / personas / expedientes       | 2 / 1 / 1  | 2 / 1 / 1   |
| Asignaciones                           | 0          | 0           |
| Versiones / ejercicios / conformidades | 1 / 15 / 1 | 3 / 111 / 3 |
| Migraciones aplicadas                  | 10         | 11          |
| Catálogo carreras / facultades         | 121 / 18   | 121 / 18    |

Los 111 registros de ejercicios son 15 de Hábil más 48 de la fuente y 48 del perfil técnico: no son duplicaciones por repetir el importador. Antes/después se compararon hashes de las filas existentes usando las mismas columnas previas, se prohibieron crecimientos en tablas ajenas al incremento y se cotejaron los 69 archivos privados anteriores: **sin diferencias**. No se hizo `migrate:fresh` en desarrollo, no se alteraron permisos, vínculos ni expedientes y no se crearon respuestas o cuentas ficticias.

Comprobantes operativos locales: `dominos-close-final/dev-before.json`, `dev-after.json`, `dev-versions.json`, logs de migración/importación/perfil y `dev.exit=0` bajo TEMP. El revisor independiente reconcilió estos comprobantes y cerró C4 operacional sin nuevos bloqueantes; no ejecutó escrituras o suites adicionales. La habilitación es técnica y local, para captura/envío sin puntuación; no equivale a aprobación psicométrica ni institucional. El protocolo de corrección, la orientación física y los baremos siguen pendientes.

Notion 13 y 14 se actualizaron de forma aditiva, con confirmación de ambas operaciones y sin advertencias. Se distinguieron decisión técnica de captura, conformidad visual, activación local y reglas pendientes; no se subieron imágenes, claves o documentos privados, ni se reemplazaron históricos.

## [S8] Cierre con commit local autorizado

Posteriormente, el usuario solicitó explícitamente un commit local de código, migración, pruebas y documentación del incremento, junto con la actualización del README. Esta autorización satisface la regla de `AGENTS.md` «No hacer commit, publicar ni push sin solicitud explícita» sólo para el commit local; no autoriza push, publicación o despliegue. Los «sin commit» anteriores describen las entregas históricas.

La preparación usa una lista explícita de 23 archivos: implementación y pruebas Dominós/Hábil, migración aditiva, este informe y README. El README conserva badges y captura pública, documenta instalación local desde el código observado y distingue ambas modalidades de evaluación. Un ejemplo numérico de par se retiró del informe público, sin modificar las fuentes privadas.

El código de aplicación no cambió después del cierre de S7: se reutilizan sus pruebas, build y revisión independiente; los cambios posteriores son documentales. La comprobación del cierre se limita a formato Markdown, enlaces locales, sintaxis de ejemplos PowerShell y revisión del diff/índice. Credenciales, claves de corrección reales, paquetes privados, datos de desarrollo, builds, capturas privadas y temporales permanecen fuera. El SHA resultante se consulta en el historial Git y se entrega en el mensaje de cierre, sin introducir una referencia circular en este documento.
