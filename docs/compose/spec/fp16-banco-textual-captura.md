---
feature: fp16-banco-textual-captura
status: delivered
updated: 2026-11-12
source: feat/talento-piloto
---

# 16 FP formas A y B: banco textual y recorrido de captura

## Report

**Qué se construyó** — Un banco textual privado con las formas A y B del 16 FP: 187 reactivos por forma con numeración 1–187 verificada y tres opciones a/b/c, importados como dos versiones asignables por separado mediante `php artisan fp16:import`. Un tercer tipo de respuesta, `single_choice_unscored`, captura una alternativa o ausencia sin clave ni puntuación; la consulta del revisor se rotula **«Respuestas capturadas; sin calificación»**. Hábil conserva su resultado bruto y Dominós su captura de dos mitades.

**Verificación**

- `php vendor/bin/phpunit --filter 'Fp16|Dominos|Habil'`: **47 pruebas, 1.527 aserciones**, 1 omitida por permisos de symlink en Windows, exit 0.
- Vitest sobre `evaluations`, `evaluations-dominos`, `evaluations-fp16` y `evaluations-api`: **34/34**, cuatro archivos, un solo fork.
- `tsc --noEmit`, ESLint focal, Prettier y build de Vite: exit 0 (advertencias preexistentes de dependencias y tamaño de chunk).
- Pint: controlador del banco y fixture del arnés, PASS.
- Paquete real: importación doble en `tecnoweb18b_test` con storage temporal; dos versiones, 187 reactivos cada una, misma identidad en la repetición.
- **Recorrido de navegador (13/11/2026)**: 7 comprobaciones aprobadas en Chrome contra Laravel y PostgreSQL reales del entorno aislado, con las 187 preguntas de cada forma — banco de las dos formas sin claves ni puntuación, asignación idempotente, instrucciones del titular, captura con tres alternativas sin preselección, guardado, recarga con recuperación de la letra, salto al reactivo 187, ausencias confirmadas (185 de 187), envío congelado con `409` posterior, aislamiento entre las dos cuentas y consulta del revisor con «Respuestas capturadas; sin calificación». Escritorio 1365×950 (forma A) y móvil 390×844 (forma B); 7 capturas privadas en TEMP.
- Dos defectos de presentación corregidos: el banco anunciaba «Opción única A–H» para un instrumento de tres letras y la ficha de la versión omitía el aviso de captura sin calificación y afirmaba reconstrucciones inexistentes en un banco textual.
- La migración incremental `add_unscored_letter_capture` y la importación privada se aplicaron en `tecnoweb18b` (13/11/2026): 2 versiones, 374 reactivos, 0 claves, 0 asignaciones creadas y repetición con los mismos identificadores. Sin fixtures, cuentas ni expedientes nuevos en desarrollo. Sin commit, push ni publicación.

## [S1] Problema

El 16 FP forma A y forma B están digitalizados como Word de texto: **187 reactivos por forma**, cada uno con **tres alternativas a/b/c** y una hoja de respuestas separada. El motor del piloto sólo conocía dos familias de respuesta — una letra A–H con clave (Hábil) y un par de mitades 0–6 (Dominós) —, y todas sus piezas asumían imagen por ejercicio y clave de corrección. Sin un tipo propio, el 16 FP sólo podría entrar falseando el contrato: convirtiendo texto en imágenes, inventando claves o reutilizando la regla de un punto por acierto de Hábil.

La corrección del 16 FP **no está conciliada**: la forma A tiene 184 asignaciones de reactivos a factores, la forma B presenta duplicados y omisiones (9/10, 63/64, 93/90, 105/106), existe la discrepancia de rótulo Q3/Q4 y no se aportaron tablas de conversión a estenes. Esos pendientes no impiden capturar fielmente lo que el titular responde.

## [S2] Diseño

### S2.1 Fuente privada y cotejo

Paquete privado `resources/fp16-formas-a-b-v1.0.0`, hermano del repositorio y fuera de Git. Conserva los dos Word digitalizados byte a byte con su SHA-256, las dos matrices fotografiadas de corrección como procedencia, un `manifest.json`, un JSON de reactivos por forma y `SHA256SUMS.txt`.

- **Formas separadas**: `formas/forma-a.json` y `formas/forma-b.json`; se importan y asignan por separado.
- **Numeración**: verificada 1–187 en ambas formas. La forma B reparte la lista del Word en varios `numId` con valores de inicio 1, 26, 51, 76, 101, 126, 151 y 176; respetar esos inicios produce la secuencia continua. Ignorarlos generaba numeraciones repetidas.
- **Texto y opciones**: el reactivo se extrae hasta el marcador `a)`; cada alternativa se separa con `b)` y `c)`. Se conservan tildes, comillas y puntuación; no se normaliza la redacción.
- **Tallos repetidos**: la forma A repite un tallo y la forma B tres, siempre con opciones distintas. Se conservan como reactivos independientes y se listan en el manifest; no se fusionan.
- **Ejemplos**: los cuatro ejemplos de cada forma se guardan aparte del banco y no cuentan entre los 187.
- **Figuras**: todos los reactivos son texto; no hay figura que vincular. Las fotografías de página son procedencia, no material del reactivo.

### S2.2 Tipo de respuesta `single_choice_unscored`

Se añade un tercer tipo junto a `single_choice` y `two_halves`:

- `instrument_versions.option_labels` (jsonb) define las etiquetas ofrecidas; para el 16 FP es `["A","B","C"]`. Sin valor, el comportamiento histórico sigue siendo A–H.
- `instrument_versions.scoring_enabled` nace en `true` y se importa en `false` para el 16 FP.
- `instrument_exercises.texto` y `opciones` (jsonb `{a,b,c}`) llevan el enunciado y las alternativas como datos.
- Las columnas de imagen y sus hashes pasan a **nullable**, y `example_image_path` también: un reactivo textual no inventa un activo.
- La restricción `CHECK` exige `correct_option IS NULL` para este tipo, de modo que **no puede existir clave** en la base.

El envío sólo calcula resultado bruto cuando `scoring_enabled` es verdadero y el tipo es `single_choice`. Dominós y el 16 FP congelan respuestas con `raw_result = null`.

### S2.3 Importación transaccional e idempotente

`php artisan fp16:import {path?}` lee el paquete y lo valida **entero** antes de escribir: nombre y versión del paquete, dos formas, 187 reactivos con numeración consecutiva, tres opciones no vacías, ausencia de claves o pesos, hash del Word, hash de la clave gráfica y digest de forma. Cualquier desviación rechaza el paquete completo sin filas ni archivos.

El digest de forma combina el JSON canónico de reactivos con el SHA-256 del Word; una versión ya importada se devuelve intacta, incluso si está asignada. La escritura usa transacción, `pg_advisory_xact_lock`, staging y promoción archivo por archivo (Windows). Se copian el Word, la matriz de clave y el JSON de reactivos al disco privado; nada se escribe en `frontend/public`.

La conformidad registrada es **estructural y no institucional**: declara el cotejo de 187 reactivos, numeración y tres opciones, y aclara que no valida claves, pesos, baremos ni interpretación. No se atribuye a una persona ni a Administración.

### S2.4 Recorrido de captura

Banco y vista previa (personal autorizado) → asignación por el revisor del expediente → titular responde una de tres alternativas o deja ausente → guarda → recarga y recupera → confirma envío con ausencias → respuestas congeladas → el revisor consulta **«Respuestas capturadas; sin calificación»**.

Cada pregunta se muestra con su enunciado y tres radios `A) …`, `B) …`, `C) …`, sin preselección. La captura no produce aciertos, errores, puntaje ni interpretación; el titular nunca recibe claves porque no existen en la base.

### S2.5 Fuera de alcance de este corte

Claves, pesos por factor, corrección, puntuaciones, baremos, estenes, tiempos, IQ/CI, clasificación por carrera, OCR, IA y canal de correo. Tampoco se implementa la selección de los ocho RF por correo: queda pendiente de las especificaciones del docente.

## [S3] Fuera de alcance

- Corregir o puntuar el 16 FP, incluida la forma A con sus 184 asignaciones.
- Resolver la discrepancia Q3/Q4 o los duplicados/omisiones de la clave B.
- Aplicar ambas formas como batería conjunta: son asignaciones independientes.
- Sustituir reactivos por imágenes generadas: el texto se conserva como texto.

## Tasks

- [x] T1: Paquete privado con 187 reactivos por forma, numeración, opciones y hashes — aceptación: dos formas con 1–187 continuos y tres opciones no vacías (covers: S2.1)
- [x] T2: Migración aditiva del tipo `single_choice_unscored`, etiquetas por versión y campos textuales — aceptación: Hábil y Dominós conservan su contrato; el 16 FP no admite clave (covers: S2.2)
- [x] T3: Importador y comando idempotentes, transaccionales y sin claves — aceptación: repetir no duplica; un paquete alterado no escribe nada (covers: S2.3)
- [x] T4: Recorrido de captura y consulta del revisor en React/Ant Design — aceptación: guardar, recargar, ausencias, congelado y «Respuestas capturadas; sin calificación» (covers: S2.4)
- [x] T5: Verificación focal, regresiones de Hábil/Dominós, documentación y Notion — aceptación: pruebas en `tecnoweb18b_test`, TypeScript/lint/build y estados separados (covers: S2.5)

## Journey log

- El primer intento de numeración ignoró `w:start` del `numbering.xml`: la forma B aparecía como listas de 1–25 repetidas. Respetar los inicios produjo la secuencia 1–187 sin huecos.
- El primer filtro de reactivos incluía el párrafo de instrucciones que menciona `a)`, `b)` y `c)`; se restringió a párrafos numerados y se excluyeron los cuatro ejemplos.
- Los tallos repetidos se detectaron como «duplicados»; al comparar texto **y** opciones resultaron reactivos distintos y se conservaron.
- Insertar `opciones` falló por falta de cast `array` en el modelo; se añadió.
- `option_texts` se calculaba con `$this` dentro de un método estático de `EvaluationData`; se corrigió a `self::`.
- `sourceKey()` devolvía `null` para un ejercicio sin clave y su firma no lo permitía; se amplió a `string|array|null`.
