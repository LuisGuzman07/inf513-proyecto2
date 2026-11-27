---
feature: adaptacion-figma-segundo-corte
status: delivered
updated: 2026-10-30
source: feat/talento-piloto
---

# Segundo corte Figma · portal titular, documentos y Hábil

## Report

### Implementado

Entrega local del segundo corte en la aplicación real, conservando React/TypeScript/Ant Design, Laravel/Sanctum y PostgreSQL. El portal organiza cinco grupos navegables sin desmontar el formulario ni perder selecciones; diferencia avance local, archivos seleccionados y versión confirmada. Los faltantes reutilizan las validaciones actuales y llevan al campo o documento. Guardar borrador y enviar siguen siendo operaciones distintas con confirmación del servidor; observaciones generales, corrección, reenvío e historial se conservan.

Documentos usa una lista adaptable con archivo vigente, fecha, versión y anteriores descargables mediante autorización existente. “Cargado” no significa revisado, auténtico ni aprobado. No cambian tipos, requisitos, límites o privacidad.

Hábil mantiene sus 15 ejercicios reales privados, instrucciones/ejemplo, imagen completa con ampliación y A–H sin preselección. Añade mapa de ejercicios guardados/pendientes, foco al navegar, estado local frente a guardado confirmado y resumen previo al envío. Guarda antes de avanzar; un error conserva elección e índice. El error de envío se comunica dentro del modal; aceptación de ausencias inicialmente falsa, reiniciada al reabrir. El estado enviado congela respuestas y el bruto continúa exclusivo del personal autorizado. El resumen numérico compacto evita desplazar las acciones fuera de la vista móvil.

Ajustes acotados del primer corte: hero móvil compacto y panel institucional sin fotografía/logos repetidos, conservando identificación y título académico completo. Contraste renderizado: ayudas/secundarios **3.35 → 6.39:1**, etiqueta Requiere corrección **1.83 → 7.53:1**, estado de guardado **14.28:1**. En la confirmación final, casilla y acción activa **14.79:1**; el control inactivo se registra exento. Son mediciones parciales, no certificación WCAG AA integral.

### Verificación ejecutada

Todos los comandos frontend se ejecutaron en frontend/ con pnpm9.15.4. Backend únicamente en testing/pgsql/tecnoweb18b_test y sin runtime de navegador concurrente. No se ejecutaron suites globales de demos.

| Comprobación | Resultado observado |
|---|---|
| corepack pnpm exec vitest run src/pilot --pool=threads --maxWorkers=1 --minWorkers=1 --testTimeout=60000 --hookTimeout=60000 --reporter=verbose | Primera tanda: **171 PASS / 6 FAIL**, 177 casos; no se describe como verde. |
| Repeticiones focales tras ajustar aserciones/entorno de tests | Primera: **2 PASS / 5 FAIL / 45 filtrados**; tres archivos completos: **31 PASS / 1 FAIL**; última: **1 PASS / 8 filtrados**. Los 177 casos originales tienen PASS entre tandas, **no una única ejecución final conjunta**. |
| Regresión final de evaluations.test.tsx, filtro “guarda antes del resumen\|muestra el envío no confirmado”, un worker, timeout60000 | **2 PASS / 16 filtrados**: repite un caso original y añade uno para rechazo de envío. No se suma como otra suite completa. |
| PHP8.4 artisan test --filter='PilotAuthTest\|TalentSelfServiceTest\|TalentReviewRecordsTest\|HabilEvaluationTest' --no-ansi | **29 PASS / 996 aserciones**, base aislada. |
| corepack pnpm exec eslint sobre TS/TSX afectados --max-warnings 0; prettier --check sobre fuentes afectadas | **Exit0**. Confirmación final sobre los archivos Hábil modificados: lint/formato **Exit0**. |
| corepack pnpm build después del último cambio | **Exit0**, TypeScript y Vite,10519 módulos,1m37s. Antes se corrigieron10 diagnósticos de tipos en dos tests (opción exact no soportada); no se ocultó ese fallo. |

Los fallos frontend fueron aserciones desactualizadas/ambiguas, espacios localizados, timing de Form y animación CSS de jsdom; se acotaron los proveedores de pruebas y selectores sin cambiar animación ni servicios de la app. Advertencias conservadas del build: chunk principal3485.20kB (>500kB), anotaciones PURE de react-helmet-async y Sass legacy-js-api. No se abrió refactor de bundle.

Navegador Chrome,1440×1000 y390×844:

- Primera ejecución **PARTIAL**,110 comprobaciones aprobadas,0 fallidas: registro/borrador/recarga, navegación sin pérdida, faltantes, selección/adjuntos/versiones y aislamiento. Se detuvo al capturar observaciones porque una navegación sólo de fragmento no refrescó los cambios hechos por personal en otro BrowserContext. Dos capturas con estado antiguo se excluyeron.
- Continuación **263 aprobadas /0 fallidas**, desde un checkpoint preparado con fixtures mediante endpoints reales y CSRF, no repetición completa del recorrido UI. Verificó observaciones/corrección/reenvío/historial, Hábil parcial **1 guardada/14 ausentes**, recorrido adicional completo **15/0**, recarga/congelación, resultado autorizado y rechazo a otras cuentas, logout/limpieza. No se mezclan parcial y completo como un mismo estado.
- Confirmación final acotada **83 aprobadas /0 fallidas**: cuatro recapturas Docs estables y modal Hábil desktop/móvil, navegación por teclado, devolución del foco, aceptación reiniciada y un envío parcial confirmado. En390×844: casilla hasta y582, cancelar hasta y634 y confirmar hasta y674; navegación a ejercicio15 sin PATCH ni cambio de versión.

Servicios propios cerrados por finally;0 listeners propios8002/5174, credenciales de fixtures eliminadas. Fingerprint desarrollo antes/después idéntico **8712a8804a97f6135fefffab3d94e6c3598cbeb3b3130aa050edc7693e928b73**. Storage/config cache del runtime privados TEMP; no fixtures ni limpiezas sobre desarrollo. Los servidores ajenos8001/5173 no se detuvieron.

### Evidencia visual y revisión

[Índice público antes/después](../../verification-captures/adaptacion-figma-segundo-corte/README.md):20 BEFORE y20 AFTER seleccionados, diez estados en escritorio/móvil. Los intentos públicos anteriores se preservan identificados; el índice y whitelist eligen sólo las20 tomas actuales. [Recibo saneado con hashes y tandas](../../verification-captures/adaptacion-figma-segundo-corte/evidence.json).

Se inspeccionaron los píxeles en siete lotes y una única confirmación final de seis PNG usando el modelo con visión de la sesión. Las ocho capturas Hábil BEFORE y dieciséis AFTER seleccionadas están exclusivamente en TEMP privado, nunca en docs/Notion/entrega pública. No se transcriben ejercicios, claves o resultados brutos. El visor textual que sólo confirma apertura no se utilizó como prueba de inspección.

La inspección detectó un toast temporal sobre la cabecera documental y un resumen móvil demasiado alto. Se recapturó Docs sin toast y se compactó sólo la navegación del resumen. La confirmación final constató modal completo y controles legibles, sin bloqueantes materiales visibles. En algunos pares documentales cambian anclaje/contexto y las versiones/fechas de fixtures: no se afirma comparación de píxeles estrictamente idénticos. El formulario y algunas pestañas continúan fuera del viewport; acceso por foco/scroll se verificó por separado. Se conserva el overflow móvil de pestañas de AntD; una etiqueta parcial en PNG no equivale a pérdida de contenido.

Detector manual:1 ejecución,exit1,dos avisos evaluados: props de imagen por spread resueltas a asset real con dimensiones (falso positivo) y Lato conservada por dirección aprobada/licencia. No se presenta como detector limpio ni como auditoría completa.

Revisión independiente fresca **general-68**, mismo modelo que los implementadores, después del cierre de tests/build/runtime: **ningún hallazgo P0/P1/P2 sustentado**. Conclusiones separadas de cumplimiento, corrección y consistencia; confirmó hashes de18 archivos, logs29/996,regresión2/16,build final y recibo83/0. No repitió suites ni inspeccionó material privado. El cierre de PNG/Report/Notion señalado como pendiente se completó por main; no aparecieron cambios de código posteriores a la revisión.

### Conservación, límites y uso

Audit final:18 fuentes afectadas;431→434 archivos frontend/src; backend app/routes/migrations sin cambios. package.json,pnpm-lock.yaml y vite.config.ts idénticos al snapshot. App/CSS/ZIP de resources conservan sus hashes de S2.5. No nuevos permisos, contratos, instrumentos, baremos, temporizadores, PPA, OCR/IA/correo, B o publicación. El primer commit continúa pendiente por prohibición explícita en este corte; rama **feat/talento-piloto sin HEAD/baseSHA**, comparación contra snapshot PRE-EXISTING C2-6cb1236f.

Para revisar con cuentas reales existentes: ejecutar desde la raíz ./dev-local.ps1 -Action Start y abrir http://localhost:5173; no crea fixtures ni importa/migra. Titular: Mi inscripción/Documentos/Observaciones/Mis pruebas. Una asignación real continúa requiriendo al revisor autorizado; no se fabricaron cuentas, expedientes o pruebas en desarrollo para esta entrega. Los runtimes aislados de verificación no quedan activos.

Actualización aditiva de Notion09/12/13/14: cierre y alcance comprobado separados de pendientes institucionales; sin subir material privado. No commit, push ni publicación.


## [S1] Problema y fuentes

El primer corte fue aceptado visualmente por el usuario y cerrado técnicamente; no se repite su rediseño. Este incremento adapta portal, documentos y experiencia del instrumento existente, más tres correcciones acotadas: contraste renderizado, hero móvil y panel de acceso. La aplicación real y sus validaciones son autoridad funcional; Figma es referencia de composición, no de datos o reglas.

Fuentes actuales: cierre adaptacion-figma-primer-corte.md; AGENTS raíz y frontend (las secciones DEMO/publicación heredadas no autorizan acciones); Notion09 continuidad y cierre,12 incluida F3,13 conservación del núcleo real,14 decisiones/pendientes. Consultas frescas:09 editado2026-10-30T01:17:25.090Z;12 2026-10-29T20:41:20.549Z;13/14 2026-10-29T20:42:11Z. F3-03 se usa como criterio de coherencia, no como fallo probado de esta app; los cuatro defectos históricos ya resueltos del prototipo no se reabren.

Referencia export read-only: resources/Grupo 18B - Plataforma de seleccion de personal - Figma. App.tsx GraduatePortal2196–2721, EvaluationPlayer3571–3774; CSS portal2961–3257 y player3852–3950/responsive4190–4328. Mantener identidad aprobada, Lato local y React18/TypeScript/AntD/Vite existentes; no Tailwind/React19 del export. No nuevo torneo visual ni prototipo paralelo.

Workspace y autorización: raíz/rama explícitas del usuario, feat/talento-piloto; .git igual common-dir, sin HEAD/baseSHA y cero archivos rastreados. Snapshot PRE-EXISTING C2-6cb1236f: TEMP/grupo18b-corte2-baseline-6cb1236f4a2244568cfb8e31a79e0257,431 archivos frontend/src y snapshots de backend app/routes/migrations/configuración no secreta. No worktree nueva, stage, commit, push o publicación. El usuario autoriza diseño técnico, implementación y verificación hasta entrega sin pausa de aprobación del documento; esta autorización prevalece sobre las pausas/commit genéricos del flujo.

## [S2] Contratos del incremento

### S2.1 Dirección y ajustes focales

Base institucional actual: rojo #880000, navy #1d294b/#2a3964, superficie blanca, Lato local y componentes compartidos. Modo Operate en portal/documentos/player; Persuade conservado en landing. Referencia Figma: cabecera contextual, navegación de secciones/ejercicios y acciones claras, sin estadísticas decorativas o simuladas.

Medir foreground/background renderizados, composición alfa, fuente/peso y ratio WCAG para ayudas, subtítulos y etiquetas de estado de las superficies afectadas. Objetivo4.5:1 texto normal y3:1 grande; distinguir controles inactivos, fondos de imagen/gradiente no medibles por color plano y límites reales. Corregir sólo casos insuficientes, preservando rojo/navy y semántica de estados. No declarar certificación WCAG AA completa.

Hero móvil: reducir altura/espacio superior excesivos, manteniendo fotografía, título académico completo y acciones actuales. Acceso: un bloque institucional más corto, sin repetición de logos/fotografía/explicaciones, manteniendo identificación y título completo en escritorio/móvil; formularios, payloads, limpieza de secretos y sesión intactos. No cambios al shell ya entregado salvo corrección focal necesaria y respaldada.

### S2.2 Portal y estado del expediente

Cabecera derivada de estado real, versión confirmada y próxima acción. Navegación por datos personales, información académica, contacto/disponibilidad, documentos y revisión/envío, agrupando campos actuales. Preservar URLs/fragments y IDs de anclajes existentes.

Un solo RecordEditor/Form y Documents montados. Navegar entre secciones usa scroll/foco local, no rutas o desmontajes que disparen blocker o pierdan texto/selecciones. Todos los pasos se pueden consultar sin completitud previa; guardar borrador incompleto sigue permitido. Conservar facultad opcional, catálogo dependiente, excepción manual, textos históricos, movilidad false contestada frente a null y todas las validaciones actuales.

Resumen de faltantes reutiliza missingForSubmission/validaciones existentes. Cada faltante enfoca campo/control documental sin perder lo escrito. Completitud no equivale a validación total o aprobación; Laravel conserva autoridad para422 y conflictos409. Distinguir borrador local, archivos seleccionados sin adjuntar, operación en curso y versión confirmada por servidor. No mostrar Guardado antes de respuesta válida ni contar archivo seleccionado como cargado.

Guardar y enviar diferenciados. Conservar confirmaciones existentes, versionado, errores y reintento; envío depende del registro guardado y se bloquea por dirty/busy como hoy, no por la sección activa. Acciones accesibles con teclado y scroll móvil sin tapar campos, avisos o última acción. No introducir un endpoint, regla de guardado o autosave nuevo.

Observaciones generales del personal visibles con cantidad/autor/fecha y motivo de corrección cuando existe. No inventar asociación a campos, estado resuelta ni checklist aprobado: Observation no contiene esos datos. Corrección y reenvío conservan transiciones y revisor/historial. Legado permanece consulta, sin editor nuevo ni pruebas habilitadas por presentación.

### S2.3 Documentos privados

Reutilizar los seis tipos y cuatro requisitos actuales: histórico, CI, fotografía y título académico necesarios; provisión nacional/CV opcionales. Presentar archivo vigente, fecha y versión, carga/sustitución y acceso a versiones anteriores, con descargas autorizadas reales.

Seleccionado local no equivale a adjunto confirmado. Archivo cargado no equivale a documento revisado, auténtico o aprobado; sólo mostrar revisión si hay evidencia real vigente del modelo. No OCR ni marcas Verificado deducidas de una carga. Mantener MIME/extensión/tamaño10MiB actuales y foto JPEG/PNG, errores y409. No borrar versiones, cambiar storage o producir URLs públicas. Mantener callbacks de selección/upload para no perder otras selecciones ni el borrador del formulario.

### S2.4 Experiencia de Hábil

Ficha de instrucciones y estado real de asignación/versión. Si se separa una vista inicial con Comenzar/Continuar, es sólo presentación local: abrir o comenzar no hace PATCH ni inventa transición persistida. Mantener instrucciones/ejemplo privado existente, legible y sin sustituir contenido.

Mapa de ejercicios y anterior/siguiente con número actual, respuesta guardada y pendientes, usando items/answers del servidor. El banco real sigue15ejercicios; no hacer del fixture sintético de2actual ni de los6del export el instrumento real. Imagen completa legible y zoom; A–H del servidor, ninguna preselección. Marca respondido significa respuesta guardada, nunca acierto.

Guardar únicamente a través del servicio actual con versión. Navegar a otro ejercicio conserva la semántica existente: guardar cambios antes de avanzar; ante error/conflicto, mantener elección e índice y permitir reintento/recuperación explícita. Distinguir selección local, guardando, guardado confirmado y error. Contadores de guardadas se basan en confirmación, no en clic local. No desmontar runner para una navegación de presentación ni degradar snapshot nuevo a viejo.

Resumen previo al envío con guardadas/ausentes y navegación para revisar. Guardar primero cambios como hoy; confirmación explícita e irreversible y aceptación de ausentes inicialmente falsa si existen. Envío actual usa versión/confirm_unanswered; estado enviado congela radios y conserva recuperación al recargar. Titular sin claves/bruto/aciertos; resultado bruto sólo personal autorizado. No cambiar asignación/idempotencia/versión aplicada/calificación o APIs.

### S2.5 Invariantes y límites técnicos

Preservar PilotSession/session.run, cookies/CSRF, query keys por usuario/generación, capacidades/titularidad, abortos y limpieza privada,403/401/409, historial y legado. Mantener contratos y backend app/routes/migrations sin cambios; no nueva dependencia o framework. No localStorage funcional ni actor selector. No mocks en servicios reales; tests sintéticos siguen sólo tests.

No copiar resources ni materiales privados a public/bundle. Conservar carpeta/ZIP originales y assets/licencias/proporciones. Hash inicialApp04BBD1E025643A4538ACB560FF92B7AD80E16A49366441BAEE02ACBE695E4538,CSSF7D3D75E22C44E9EE4396F8777D6BF80671EA8D9F6F0B52D1D4A9D37A9710F25,ZIP36268C41446AB33742B785C7907B477DBA6472FD61D6F8897A5CFA80AC8A6219.

### S2.6 Verificación y entrega

Before congelado mediante Preview del build del primer corte,431sourcesnapshot. Comparar estados equivalentes desktop1440×1000/móvil390×844; comprobar también navegación/acciones intermedias cuando sea relevante. Público: landing/acceso/portal/documentos ficticios/observaciones. Cualquier captura con ejercicio/ejemplo/claves o resultado privado va exclusivamente a TEMP privado, nunca docs/Git/Notion/ZIP público. Conservar sólo recibos saneados públicos de Hábil.

Fixtures/importación/limpieza sólo testing/pgsql/tecnoweb18b_test con TestDatabaseGuard de conexión real, storage/config cacheTEMP, puertos propios y fingerprint desarrollo antes/después. No8001/5173 ajenos. No mezclar suites destructivas backend con navegador sobre la misma base. El baseline se cierra antes de la verificación final; no rebuild hasta que termine el Preview congelado.

Implementar completo y luego agrupar regresiones afectadas (portal/catálogo/docs/revisión/evaluación/sesión) con workers/timeout adecuados, lint/formato focal,TypeScript/build. Registrar cada tanda, repetición,skip y fallo; no describir agregados como única suite verde. Sin suitesglobales DEMO ni repetición de PASS sin cambio invalidante.

Navegador final: teclado/foco,scroll/acciones,contraste; guardar/recargar,documentos/versiones,observaciones/corrección/reenvío y Hábil hasta envío y resultado autorizado. Capturas públicas comparables e inspeccionadas; instrumento privado. Inspección visual batched y a lo sumo una confirmación por correcciones; no hunts cosméticos abiertos. Detener servicios propios y esperar comandos antes de revisor fresco,modelo al menos igual al implementador. Revisar spec/correctness/consistencia; corregir críticos y confirmar resolución sin repetir trabajo aprobado.

Este único documento contiene Report/QA/tareas y límites. Actualizar Notion09/12/13/14 de forma aditiva sin claves/materiales. Entrega local, instrucciones para abrir y capturas públicas, sin commit/push/publicación. No se ejecuta el primer commit sugerido: la prohibición final del usuario es explícita.

## [S3] Fuera de alcance

Nuevos instrumentos y ampliación del motor;B/publicación/banco público/contacto;OCR/IA/correo reales; temporizadores/inicio persistente/expiración; baremos, nuevaspuntuaciones,IQ,interpretaciónpsicológica y categorización profesional. PPA provisional y protocolos20/25seg/30min/minuto por pregunta no se convierten en reglas. No ampliar permisos o documentos requeridos, ni convertir conformidad gráfica en validación institucional. No refresh silencioso de PRODUCT/DESIGN ni cambios a plantilla externa.

## Tasks

- [x] T1: Referencias,baseline y contrato — aceptación: fuentes actuales, snapshot431,20PNG públicos y8privadosBefore,contraste público finito y hashes originales conservados; inspección píxeles se completa enT5 (covers:S1,S2.6).
- [x] T2: Portal y documentos — aceptación: secciones sin pérdida de borrador/archivos, faltantes navegables, estados/observaciones y operaciones reales preservadas (covers:S2.2,S2.3;depends:T1).
- [x] T3: Hábil — aceptación: instrucciones/mapa15/guardado/pendientes/envío/congelado sin preselección o claves de titular; APIs intactas (covers:S2.4,S2.5;depends:T1).
- [x] T4: Ajustes focales — aceptación: contraste medido/corregido,hero móvil compacto,panel acceso simplificado con título completo (covers:S2.1;depends:T1).
- [x] T5: Verificación/revisión/entrega — aceptación: regresiones,static/build,navegadoraislado,fingerprint,capturas públicas/privadas correctas,revisión independiente,Report yNotionactuales;sincommit (covers:S2.6;depends:T2,T3,T4).

## Journey log

- Baseline servido por Preview del build congelado, no por sources que los implementadores modifican. Veinte capturas públicas y ocho Hábil exclusivamente privadas. Hábil enviadoBefore tiene1respuesta/14ausencias; no se presenta como15/0. El after debe separar estados comparables de cualquier recorrido adicional completo.
- ContrasteBefore: ayudas/secundarios rgba(0,0,0,.45) sobre blanco3.35:1; Tag Requiere corrección1.83:1; Borrador13.56:1. La primera composición alfa produjo NaN y se excluyó, conservando sólo mediciones finitas y ancestros auditables. Se corrigió el cálculo, no se atribuyó NaN a la app. AntD6usa colorTextDescription paraayudas/secundarios y colorWarning dentrodelTagstatus, no losaliases queparecíanresolverlos.
- Navegar secciones mantiene Form/Documents montados y evita Router porque su blocker de cambios pendientes también interceptaría saltos de fragmento. La nueva navegación no impone orden ni condiciones de guardado.

- Confirmación final: resumen móvil compacto con14 pendientes numéricos; error de envío visible dentro del modal con regresión específica. Dos tests focales y build posteriores aprobados;83 comprobaciones navegador y seis PNG inspeccionados sin nuevo bloqueante. Revisión independiente sin hallazgos concretos;sin cambios de código posteriores.
