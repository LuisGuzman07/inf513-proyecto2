---
feature: primer-commit-y-preparacion-instrumento
status: delivered
updated: 2026-10-30
source: feat/talento-piloto
---

# Primer commit local y preparación del siguiente instrumento

## Report

### Resultado

Base completa preparada para el primer commit local autorizado, en la raíz/rama existente, con índice explícito y auditado; no se usó git add . ni incorporación indiscriminada. Incluye859 archivos:545 frontend,134 backend,174 docs y6 raíz;10 migraciones,ambos lockfiles,ejemplos de configuración sin secretos,licencias MIT/OFL y documentación. No se inicializó otro Git ni se borraron archivos para excluirlos. El SHA es el del commit que contiene este documento: se obtiene con git log -1 y se informa en la entrega y Notion después de crearlo, sin intentar incrustar su propio hash en el contenido.

README actualizado para instalar desde un clon, copiar ejemplos sin sobrescribir entornos, conservar APP_KEY existente, preparar migraciones/catálogo y arrancar con dev-local.ps1. Explica obtener Hábil por canal privado y pasarlo mediante ruta explícita ../../resources; advierte el fallback antiguo sources del importador sin modificarlo. Un clon no trae material privado,cuentas o datos personales. El segundo corte visual queda cerrado;compactación menor de navegación móvil diferida.

Dominós queda preparado como **propuesta específica, no instrumento operativo**:13 fuentes comprobadas,48 ejercicios únicos y4 ejemplos;respuesta de dos mitades0–6. El cotejo y la ampliación concreta están enS2.6/S2.7. Matriz detallada con localizadores y transcripciones exclusivamente privada TEMP; no se versionan claves,imágenes o reconstrucciones del instrumento. Hábil se mantiene sin cambios como instrumento operativo y regresión. No se modificaron motor,contratos,cuentas,permisos,datos de desarrollo u originales.

### Verificación conjunta y conservación de evidencia

En frontend/,con pnpm9.15.4:

~~~powershell
corepack pnpm exec vitest run src/pilot --pool=threads --maxWorkers=1 --minWorkers=1 --testTimeout=60000 --hookTimeout=60000 --reporter=verbose
~~~

**PASS:177/177 pruebas,14/14 archivos,0 fallos,exit0;1931.83 segundos.** Ejecución2026-10-30T11:07:30–11:39:49Z,sin automatización de navegador ni runtime de pruebas concurrente. Resultado real leído del recibo y cierre del log, no agregado de tandas. No se cambiaron tests para conseguirlo. El conteo final vigente es177, no se añaden repeticiones anteriores ni se interpreta como178por sumar una regresión por separado. No es la suite global de demos.

No se repitieron backend,build,lint o TypeScript aprobados del segundo corte porque este cierre sólo cambia .gitignore,README y este documento. El staging normalizó CRLF aLF en un script de navegador backend según atributos existentes,sin reescribirlo en disco ni cambiar semántica. Las advertencias PRE-EXISTING-EOL/WS de git diff --cached --check abarcan CRLF de documentación/catálogo y espacios finales heredados en demo/licencia; se documentan, no se ocultan mediante reformateo masivo. No se afirma diff-check limpio.

### Auditoría del contenido preparado

- Antes del staging se inspeccionaron estado Git,instrucciones raíz/frontend,ignores anidados y ejemplos. Identidad Git ya configurada;sin hooks activos en .git ni core.hooksPath personalizado. No se instaló ni saltó un hook.
- Lista de rutas exactas NUL,validada contra los proyectos y archivos raíz,usada con git add --pathspec-from-file/--pathspec-file-nul. Índice inicial vacío;todo trabajo local ajeno/ignorado se preservó.
- Escaneo del índice real,no sólo de working tree:859 blobs,aproximadamente29.6MB,670 archivos de texto,comparación con114 hashes únicos de materiales privados y dos secretos locales sin mostrar valores;0 hallazgos en esas comprobaciones. Se revisaron campos sensibles vacíos de los ejemplos y fixtures inequívocamente sintéticos. Es evidencia acotada,no certificación universal de ausencia de secretos desconocidos.
- Excluidos env reales,credenciales/claves,bases/copias,storage salvo placeholders .gitignore,uploads,caché,deps,builds,temporales/logs,comprimidos,estado de herramientas y fuentes/materiales privados. Los trece originales de Dominós conservaron hashes,al igual que las entradas cotejadas del RAR;no se aplicaron migraciones/importaciones ni fixtures a desarrollo.
- Evidencia pública incluida:146 PNG (106del primer corte,40seleccionados del segundo) y sus recibos saneados. Los lotes históricos,JSON crudo,logs,ZIP y capturas descartadas quedan locales,sin borrado. Las40rutas PNG del índice vigente están en Git. Los informes históricos conservan procedencia y README aclara que sus artefactos no se distribuyen todos en un clon.

### Revisión independiente y cierre

Revisor fresco general-69,después del fin de la corrida y auditoría;sin repetir suites/build/navegador/PHP. **Aprobado con observación no bloqueante,sin P0/P1/P2.** Contrastó todos los859 blobs con sus tamaños/SHA-256,stage0 y árbol de revisión f72ee21bccaea116e6d07c64492bfd53de7e8f3c;verificó177/14/exit0,originales13/13,ejemplos,licencias,lockfiles,fixtures,ignores y enlaces de las40capturas. No se atribuye una auditoría completa al explorador previo,que fue parcial.

Se verificó y corrigió suP3 documental: la opción actual es escalar **nullable**,no una obligación de respuesta no-null. El vacío por mitad es una necesidad futura distinta. Los únicos cambios posteriores al árbol revisado son esa precisión y el cierre de este documento;no invalidan pruebas funcionales. La revisión no volvió a inspeccionar píxeles ni certificó toda la aplicación o todos los secretos posibles.

Notion13/14 recibieron notas aditivas del cotejo/propuesta,preservando versiones previas;sin imágenes,claves o material privado. El SHA/resultado del commit se añade después de ejecutarlo. Capacidad temporal usada para visión revocada con confirmación. Se conserva la prohibición de push,publicación y despliegue. El primer commit se crea sin --no-verify,amend,reset o limpieza destructiva.


## [S1] Problema

El usuario cerró visualmente el segundo corte y autorizó expresamente el primer commit local de la base completa. La siguiente prioridad es preparar un instrumento con fuentes cotejadas, evaluando primero Dominós, sin ampliar todavía el motor. La autorización sustituye la prohibición anterior de commit sólo para este cierre; no autoriza push, publicación o despliegue.

## [S2] Diseño y criterios

### S2.1 Workspace y conservación

Raíz/rama existentes indicadas por el usuario, feat/talento-piloto, .git igual common-dir y sin HEAD/baseSHA al iniciar. Se conserva todo trabajo local y fuentes hermanas resources; no nueva worktree, borrados, cambios de cuentas/permisos o datos de desarrollo. Primera base completa: fuentes frontend/backend, migraciones, ejemplos no privados, lockfiles, licencias y documentación vigente. No se amplía el alcance a rediseño o motor.

### S2.2 Auditoría del primer commit

Inventariar estado completo, instrucciones y candidatos. Ajustar exclusiones mínimas de secretos, entornos salvo ejemplos saneados, credentials, archivos personales/privados, uploads/storage/bancos/claves/capturas privadas, deps/build/temp/logs/archivos comprimidos. No eliminar archivos locales para excluirlos. Preparar sólo allowlist revisada; inspeccionar nombres, tamaños y contenido efectivo del índice, con escaneo que informe rutas/líneas/categorías, nunca secretos. Conservar fixtures claramente sintéticos de tests como código, no claves reales. Verificar README de instalación/arranque e importación privada del paquete Hábil con ruta explícita; no distribuirlo. Commit local convencional una vez verificado/revisado el índice; informar SHA y estado posterior. No mezclar trabajo ajeno inadvertido.

### S2.3 Regresión conjunta

Una corrida conjunta final de frontend afectado (src/pilot), con ajustes de tests ya aplicados, un worker y timeout adecuado, sin navegador concurrente ni nuevos runtimes. Registrar PASS/FAIL/skip reales; no sumar tandas como una corrida. Si falla, reproducir y corregir únicamente defecto demostrado sin debilitar aserciones, verificar alcance afectado. No repetir backend/build/checks aprobados salvo cambios invalidantes. Revisión independiente posterior al cierre de comandos pesados.

### S2.4 Preparación instrumental

Consultar Notion13/14 y originales disponibles. Verificar identidad/forma/procedencia de Dominós sin adjudicar edición por semejanza. Inventario privado con hashes y localizadores por ejercicio/fuente: instrucciones, ejemplos, cantidad real, modalidad, numeración y correspondencia con claves, omisiones/duplicados/contradicciones/ilegibles y regla de corrección efectivamente respaldada. No resolver respuestas por intuición o equivalencia con otro test. Separar cotejo documental de aprobación institucional. Resultado público saneado sin imágenes/clave ni contenido íntegro del instrumento; matriz detallada sólo TEMP privado.

### S2.5 Propuesta y entrega

Propuesta específica desde lo observado: reutilización de banco privado, asignación, versiones, guardado/envío y límites del formato actual frente a la respuesta requerida. Separar contenido listo, reconstrucciones pendientes, reglas pendientes y baremos/interpretación no automatizables. No editar motor, contratos ni base. Actualización Notion aditiva con resultados comprobados y bloqueos, sin material privado. Un documento de incremento reúne contrato, propuesta e informe. Las acciones autorizadas se ejecutan sin pausa tras plan; sólo decisiones nuevas realmente bloqueantes requieren usuario.

### S2.6 Cotejo realizado: candidato seleccionado y límites

**Candidato para el siguiente incremento: material recibido como “Test de Dominós”, identidad editorial/forma no confirmadas.** No se lo denomina D-48/D-70, ni se equipara con TIG o con las matrices de Documento105.pdf/Respuestas.txt. Éstos son otros materiales, no una tercera clave de Dominós.

Se prioriza porque tiene cobertura gráfica completa y una modalidad siguiente concreta y acotada. No se declara listo para aplicación/corrección automática. Como comparación documental, Notion13 registra para16FP A/B diferencias de claves/factores y paraPDF/TXT duplicados/contradicciones que requieren otro cotejo; no se reabrieron aquí esos binarios ni se los seleccionó como atajo sin verificación. Hábil sigue siendo el único instrumento operativo.

Fuentes físicas inspeccionadas en resources/Test/Test de Dominos/: Test de Dominos.docx (8525200 bytes) y12 fotografías JPEG,13 archivos/10946321 bytes en total. Extracción OOXML a TEMP privado:70 partes,49 medios (una imagen de ejemplos y48 ejercicios); sin cambios insertados/eliminados pendientes en el Word. Los metadatos de edición del archivo no identifican autor/editorial/edición del instrumento. Se conservaron hashes de los13 originales y localizadores OOXML por ejercicio; no se modificaron ni distribuyeron. Una comparación adicional de las13entradas correspondientes de Test.rar, leídas como streams sin extraer sobre resources, dio13/13 hashes iguales a la carpeta expandida. El listado del RAR no añade otro manual de Dominós; se inventariaron por nombre los ocho documentos/formularios de PROPUESTA CONSULTORA, sin presentarlos como una lectura de contenido.

Se inspeccionaron los píxeles de49 medios y12 fotografías en ocho lotes con el modelo de visión de la sesión. El inventario privado enlaza cada número impreso con medio OOXML, párrafo y fotografía de página. Resultado:48 identificadores únicos1–48,sin omisiones ni duplicados de número en el conjunto de ejercicios, ocho páginas de seis ejercicios en fotos,cuatro ejemplos A–D en la introducción. A/B están resueltos en la fuente y C/D son prácticas; no se fabricaron soluciones para C/D. Los nombres imageN.png NO coinciden siempre con el número impreso (por ejemplo image2→2,image3→1;image32→32,image33→31;image42→42,image43→41): importar ordenando por el localizador cotejado, nunca por filename o relación OOXML.

| Aspecto | Comprobado | Límite / acción concreta |
|---|---|---|
| Identidad/procedencia | Título Word “Test de Dominós”; matriz fotografiada rotulada Test de Dominos/Confidencial/Clave matriz de corrección; paquete local recibido y hashes. | Falta portada/manual con autor/editorial, edición/forma y autorización/condiciones de uso digital. Cantidad48 no identifica edición. |
| Instrucciones | Observar grupos y determinar puntos de cada mitad0–6. La foto indica responder en números en hoja separada y no escribir sobre cuadernillo. | El Word sólo transcribe parte de las instrucciones; conservar texto completo desde la foto, no sustituirlo por una descripción de reconstrucción. No aparece duración final en estas fuentes. |
| Ejemplos y ejercicios | A–D,48 ejercicios gráficos1–48; no hay alternativas múltiples A–H. | Revisar orientación de las dos mitades, especialmente fichas inclinadas; no copiar semántica de single-choice. |
| Clave del Word |48 pares con valores dentro0–6;primeros24 usan numeración automática OOXML desde1,últimos24 números literales25–48. | La extracción de texto sola pierde numeración de1–24; usar OOXML, no renumerar a ciegas. Presencia y dominio válidos no prueban corrección. |
| Clave fotográfica | Una cara con instrucciones y24 posiciones de pares; otra con24 posiciones, fotografiada dos veces. | Sin números de ejercicio visibles en posiciones; falta hoja/plantilla de respuesta numerada para conciliar48correspondencias. Las dos fotos de la misma cara no son dos claves independientes. No se eligió un orden espacial por intuición. |
| Calidad gráfica | Número y disposición de todos los ejercicios identificables. | Marcas/trazos afectan estímulos de6,9,23,29,33, entre otros;34 tiene una marca ambigua en la zona de respuesta (no se interpreta como valor).46/48 tienen bordes muy ajustados. La legibilidad de conjunto no certifica cada punto ni aptitud de aplicación. Cotejar/limpiar o reconstruir con revisión, nunca corregir la fuente silenciosamente. |
| Corrección | La matriz dice que contiene respuestas correctas y explica superposición/ventanillas y casillero Puntaje. | No se encontró regla explícita de puntos, penalización, crédito parcial, ausentes, equivalencia al invertir mitades, conversiones o baremos. No trasladar un punto/acierto de Hábil ni máximo15/48 por suposición. |

No se constató una contradicción de clave ya resoluble: el bloqueo es **correspondencia y orientación no certificadas**. La matriz privada conserva transcripción literal y referencias, sin promoverla a clave de aplicación. Las marcas dudosas de los ejercicios no se usan como respuestas. No se resolvieron razonamientos del test.

**Fuentes Notion actuales consultadas:**13,editada2026-10-30T06:04:23.406Z, secciones “Inventario y grado de preparación” (fila Dominós), “Consultas concretas para Administración y el digitalizador”, “Consulta posterior: presentación digital de gráficos y reutilización” y “Recomendación para el incremento”:48 medios/48 pares,conciliación y orientación pendientes,no identificar edición por cantidad.14,editada2026-10-30T06:04:23.445Z, “1. Lo expresado en la reunión” y “3. Modelo propuesto para categorías, planes y resultados”: la conversación menciona25 segundos para Dominós y luego20para otros,pero declara protocolo final ambiguo. No se activan esos tiempos ni se confunden con30minutos/15nominales de Hábil. Notion es antecedente; las observaciones de los binarios actuales se distinguen de su auditoría histórica.

### S2.7 Incremento siguiente propuesto, no implementado

**Alcance implementable después de cotejo:** una segunda modalidad de respuesta, par orientado de enteros0–6,sin seleccionar alternativas ficticias ni cambiar Hábil. No un motor universal especulativo para todos los instrumentos.

1. **Preparar paquete privado versionado de Dominós.** Manifest con identidad provisional y procedencia explícita,48IDs ligados a números impresos,hash/original/página/medio/recorte/orientación por ítem,ejemplos separados y estado de revisión por recurso. Conservar originales; reconstrucción nueva como derivado versionado y pendiente de conformidad. No empaquetar para aplicación clave no conciliada. Matriz de48 filas con doble cotejo número↔fuente↔dos mitades↔posición en plantilla. Cualquier omisión/duplicado/conflicto bloquea esa versión.
2. **Ampliación mínima futura de representación.** Discriminador por modalidad: selección única existente frente a par de mitades. Respuesta estructurada con dos valores entero0–6 o null y orientación/localizadores definidos por ítem, no una letra ni un string “x/y”. Cero es dato real; null no se convierte a cero. No ordenar ni intercambiar mitades. Para fichas inclinadas, la interfaz deberá identificar inequívocamente primera/segunda mitad sobre el gráfico ya cotejado; no presuponer arriba/abajo universal. Semántica de respuesta parcial y equivalencia al invertir requieren confirmación antes del contrato definitivo.
3. **Reutilización real.** Banco y almacenamiento privado, versiones inmutables/conformidad separada,políticas de titular/revisor,asignación,locks/idempotencia,guardado/versiones/409,confirmación y congelación,imágenesBlob/zoom y limpieza de caché. No nuevas cuentas/capacidades. Hábil conserva su payload y regla actual; no reimportarlo para esta entrega.
4. **Cambios futuros delimitados.** HabilPackageImporter.php valida15IDs habil-NN yA–H;separar un importador concreto Dominós con garantías equivalentes. instrument_exercises.correct_option es char(1);no sirve para par: extensión aditiva versionada de corrección estructurada,separada del DTO titular. EvaluationData/EvaluationController admiten opción escalar nullable (A–H o null), sin representación de par ni parcial por mitad, y mantienen scoring fijo;validación,completitud y corrección deberán despachar por modalidad. frontend evaluations-types/API/runner usa EvaluationOption,igualdad escalar yRadio.Group;añadir control de dos mitades,comparación estructural y estado parcial respaldado por contrato. No generalizar personalidad como acierto/error.
5. **Resultado y reglas.** Con clave/orientación cotejadas puede prepararse comparación ordenada de pares; la puntuación bruta automática sólo se activa cuando se respalde la regla de puntos,ausencias/crédito parcial. Si no, no inventar un score ni un máximo: mantener corrección pendiente de definición. Baremos,percentiles,CI/IQ,clasificación,interpretación y decisión humana son capas distintas y quedan fuera. Tampoco temporizador,expiración,plan por profesión o ponderaciones sin confirmación.
6. **Verificación del incremento futuro.** Fixtures de pares completamente sintéticos: cero vs ausencia,ambasmitades/parcial,validación0–6,orientación/inversión,navegación y guardado/recarga,errores/409,idempotencia,envío/freeze y ACLsinclaves. Importación con número/imagen/clave faltante o duplicada debe ser atómica. Repetir regresiones Hábil de15,A–H,calificación actual y privacidad,en testing aislado;capturas privadas. No ejecutar pruebas de un motor inexistente en esta preparación.

**Clasificación de preparación:**

- **Cotejado y listo como inventario:**13 fuentes,hábitos de respuesta y dominio0–6,cobertura48/4,mapeo de número impreso a medio/foto;no significa versión lista para aplicar.
- **Reconstrucciones visuales:** ninguna nueva creada o aprobada;recursos marcados/recortados requieren revisión puntual y conformidad.
- **Aplicación/corrección:** identidad/forma,hoja numerada para conciliar48claves,orden/orientación,equivalencias,parciales,puntos/ausentes,tiempos y responsables/uso digital pendientes.
- **No automatizable ahora:** baremos,interpretación psicológica,categorías profesionales,ranking o fórmula global y decisión de selección.

Preguntas concretas a Administración:¿qué manual/edición y autorización respaldan el cuadernillo?;¿pueden aportar hoja de respuestas numerada y confirmar48 pares con orientación?;¿cómo tratar inversión,una sola mitad,ausencias y puntos?;¿qué recursos con marcas deben reemplazarse/cotejarse?;¿cuál es el protocolo de tiempo/navegación sin asumir lo conversado? Esos bloqueos no impiden registrar la base local ni preparar la ampliación,pero sí declarar Dominós operativo o puntuado.

## [S3] Fuera de alcance

Push/publicación/despliegue; nuevos instrumentos operativos o cambios de motor; tiempos/baremos/categorías/fórmulas no confirmados; cuentas/permisos/datos de desarrollo; modificación de originales y otra etapa de rediseño visual.

## Tasks

- [x] T1: Auditar base/exclusiones/README y preparar allowlist — aceptación: contenido previsto sin secretos/material privado y reproducibilidad documentada (covers:S2.1,S2.2).
- [x] T2: Corrida frontend conjunta — aceptación: resultado real leído, sin browser concurrente ni repetición injustificada backend/build (covers:S2.3).
- [x] T3: Cotejar candidato y definir propuesta — aceptación: identidad, inventario, respuesta/corrección y bloqueos trazables; no motor nuevo (covers:S2.4,S2.5).
- [x] T4: Revisar índice completo y entrega independientemente — aceptación: hallazgos resueltos o límites explícitos, tras comandos finalizados (depends:T1,T2,T3).
- [x] T5: Primer commit local e informar/Notion — aceptación: SHA, contenido y exclusiones comprobados, estado posterior, sin push/publicación (depends:T4).

## Journey log

- No hay grafo existente; no se genera para esta auditoría. Fuentes originales fuera de Git, con matriz de cotejo privada separada de la propuesta pública.

- La revisión independiente corrigió una precisión documental de nullabilidad;sin cambio de código o contrato. Corrida conjunta vigente177/177,en vez de agregar resultados históricos. Comparación13/13contra Test.rar sin modificar fuentes.
