---
feature: interfaz-institucional-proceso-a
status: delivered
updated: 2026-10-08
branch: feat/talento-piloto
commits: ""
---

# Interfaz institucional del proceso A

## Report

**What was built** — Rectificación solicitada por Marcelo: el recorrido real personaliza la composición principal en `layouts/app/app.tsx`, con SideNav fijo 200/64, HeaderNav, Content desplazable y FooterNav. `functional.tsx` sólo reexporta compatibilidad, sin shell alternativo activo. Ingreso/registro usan AuthenticationFrame extraído de las páginas originales y compartido con sus ejemplos; AccessFrame sólo adapta texto institucional y altura. Controles demo quedan en ejemplos; callbacks reales, tema derivado del template y componentes compartidos se conservan. La fuente externa no se modifica.

Portal agrupado, documentos privados/versionados, bandeja con filtros y detalle por pestañas siguen usando los servicios reales. La revisión del snapshot encontró 40 archivos iguales y 6 modificados, más inspección de cinco archivos nuevos de UI/tests: API, sesión, validaciones, permisos, titularidad e historial/versionado sin cambios. `docs/data/catalogo-uagrm.json` sigue como aporte no importado: falta acordar carrera ausente, sin hacer obligatoria Facultad ni bloquear datos anteriores.

**Verification** — Resultados de la rectificación:

- `pnpm exec vitest run src/pilot src/layouts/app/app.test.tsx --pool=threads --maxWorkers=1 --minWorkers=1 --testTimeout=15000 --reporter=json --outputFile=C:/Users/marcelo/AppData/Local/Temp/grupo18b-template-all-tests.json`: PASS 76/76, incluidas 13 nuevas. Es suite focal, no toda la del template.
- `pnpm exec eslint src/layouts/app/app.tsx src/layouts/app/app.test.tsx src/layouts/app/footer-nav.tsx src/layouts/app/functional.tsx src/pages/authentication/authentication-frame.tsx src/pages/authentication/sign-in.tsx src/pages/authentication/sign-up.tsx src/pilot/access.tsx src/pilot/template-auth.test.tsx --max-warnings 0`: PASS, exit 0.
- `pnpm build` (`tsc && vite build`): PASS, exit 0, 10508 módulos, build 2m30s. Avisos PRE-EXISTING HELMET-PURE, SASS-LEGACY y CHUNK-SIZE. Sin cambios posteriores de aplicación a estas comprobaciones.
- `node --check backend/tests/browser/ui-flow.cjs` actual: PASS.
- `ui-runtime.ps1 -Action Start`, luego `-Action Run`, finalmente `-Action Stop`, con `-Stage after -CaptureSeries template-base-final`: PASS completo anterior, 13 grupos/24 PNG; registro, borrador, adjuntos, envío, revisión, corrección/reenvío, aislamiento y logout. 2 titulados ficticios, 5 cargas, 2 envíos y 2 observaciones. Reporte conservado en C:/Users/marcelo/AppData/Local/Temp/grupo18b-ui-603e5baafda54d57b98f3eb51d171996/browser-result.json.
- Mismas tres acciones con `PILOT_E2E_LAYOUT_ONLY=1` y `-CaptureSeries template-base-access-verified`: PASS focal actual, 4 grupos/10 PNG; teclado sidebar 200/64, Drawer/cuenta móvil con Enter/Escape y retorno del foco, headings/rutas públicas, scroll hasta acciones finales y geometría sin superposición Content/Footer. Cero altas de titulados, documentos, envíos u observaciones en este modo; utiliza el revisor ficticio sembrado por el runtime. Log C:/Users/marcelo/AppData/Local/Temp/grupo18b-template-access-verified.log.
- Ambos pases acreditan testing, PostgreSQL tecnoweb18b_test, config/storage/cookie privados y preflight autenticado antes de escribir; fingerprint desarrollo idéntico `19fad91f...a43036`. Runtime STOPPED, credenciales temporales retiradas, puertos 8002/5174 libres.
- Lectura nativa de PNG por general-19/general-20: 24 pares (12 escritorio/12 móvil) y 2 extras mobile-bottom; sin solapamiento confirmado de controles. Referencia previa T5 `interfaz-proceso-a/after`, posterior portal/personal `template-base-final/after` y público más reciente `template-base-access-verified/after`. Comparación semántica, no pixel-perfect: antes página completa, ahora viewport con Content desplazable. Miniaturas móviles antiguas largas tienen límites de precisión.
- Re-review independiente general-21: cumplimiento, corrección y consistencia conformes, sin críticos pendientes. No hubo PASS completo único del harness actual ampliado: se acredita el completo anterior más el focal actual, con funciones compartidas. Los intentos fallidos/interrumpidos no se cuentan como PASS.

Límites: no se volvió a ejecutar backend en esta rectificación sin cambios de backend; no se acredita concurrencia/múltiples pestañas ni interacción horizontal adicional de tabla/pestañas móvil. El snapshot de 46 archivos no incluía el harness: se inspeccionó su implementación actual, sin certificar su diff histórico exacto. Git sin HEAD/commits, rama feat/talento-piloto; sin rango SHA inventado, commit, publicación ni push.

**Journey log** — (1) La aclaración de Marcelo llevó a personalizar el marco principal y el acceso originales, no mantenerlos sólo como ejemplos junto a otro shell. (2) WMI/preflight DB/HTTP permiten pruebas aisladas; el guard rechazó sobrescribir capturas y se eligieron destinos nuevos. (3) DatePicker Enter enviaba el Form: usar Tab; Select por teclado, mock URL y asserts apropiados para Empty/animaciones en jsdom. (4) view_image devolvía éxito sin píxeles: lectura nativa suplementaria y geometría/fotos del fondo resolvieron la brecha de scroll frente a solapamiento. (5) Cerrar sesión no coincidía por case con Cerrar Sesión: regex como logout existente y Escape del componente. Otro intento terminó con página cerrada; se aisló teclado/acceso sin repetir altas y se registraron completo anterior y focal actual por separado.

## [S1] Objetivo y límites de trabajo

Mejorar la aplicación existente para que el titulado complete su inscripción/documentos y el personal revise expedientes con claridad. Primero portal y bandeja/detalle; después inicio, registro e ingreso. Mantener íntegro el título “Sistematización de Herramientas Métricas para la Selección de Personal”.

Base contractual: inscripcion-talento-expediente-privado.md, S2–S6 y pendientes S8–S9. La mejora no cambia validaciones, obligatoriedad vigente, sesión, permisos, estados de negocio, persistencia, titularidad ni versiones. Sí se aprobó expresamente una ampliación compatible de la consulta de bandeja, detallada en S4. Observaciones actuales son generales: no existe asociación observación→campo/documento; se acercan al área de edición sin inventar relaciones. Documento aprobado por Marcelo vía Question antes de implementar; por prohibición de commits, in-progress corresponde al primer cambio local, no a un commit.

Workspace elegido por AGENTS.md: raíz existente C:/UAGRM/Tecnologia Web/proyecto-grupo18b/tecnoweb-18b-seleccion-personal, sin otro worktree ni Git interno. Rama actual feat/talento-piloto, sin HEAD/commits. Revisión mediante snapshot filesystem previo C:/Users/marcelo/AppData/Local/Temp/grupo18b-before-ui-4c53acdb16e14c05bef812a4d4ea4360 (42 archivos, sin .env), no rango SHA inventado. Sin commits/push/publicación, incluidos los pasos de finalización upstream de Compose Next. pnpm efectivo 9.15.4; dependencias existentes, sin reinstalación ni actualizaciones masivas.

## [S2] Dirección visual y shell compartido

Reutilizar AppLayout con navigation (evita auth demo), SideNav y HeaderNav de la copia del template C:/Programacion/templates/react/antd-multipurpose-dashboard, Container, Card y componentes Ant Design existentes. Aclaración posterior aprobada por Marcelo vía Question: retomar directamente estructura visual del header/sidebar originales, incluyendo ancho 200/64 y colapso, breadcrumbs de destinos reales y menú de cuenta real. Parametrizar SideNav para rutas reales en lugar de duplicar otro sidebar; sin Logo/imagen de perfil/destinos/auth demo. Mantener el código de fuente externa intacto y el comportamiento default de ejemplos separado. El Card observado es un wrapper fino, no el componente descrito en instrucciones heredadas. Rectificación posterior: personalizar la composición en layouts/app/app.tsx, con sidebar fijo, HeaderNav, Content desplazable y FooterNav del template. FunctionalAppLayout sólo reexporta compatibilidad; no implementa un shell alternativo. El scroll propio del Content sustituye la decisión anterior de scroll de página; comprobar sus anchos además de los de body/documentElement.

ConfigProvider del recorrido real con tema claro scoped, defaultAlgorithm e inherit=false para evitar que preferencias demo cambien el aspecto institucional. Locale español y App.useApp para mensajes/modales. Paleta propuesta, no identidad oficial: azul #174A7E, azul suave #EEF4FB, fondo #F5F6FA, superficie #FFFFFF, texto #1D2939 y secundario #526075. Estados con tokens discretos y texto explícito, nunca sólo color. Mantener Lato/fallback existente: títulos peso 600/700, cuerpo/etiquetas legibles, numerales de versiones tabulares. No fuentes nuevas, logo oficial supuesto, imágenes decorativas ni estadísticas.

Espaciados 8/16/24/32 px; radio sobrio y superficies con separación clara. Contenido centrado con máximo 1320 px y max-width:100% del área disponible; respetar sidebar sin desborde. Header de altura adaptable: título completo, navegación funcional y menú de cuenta con identidad/cierre real. Sidebar de personal reutilizado; móvil con Drawer accesible y menú de cuenta operable. Sin rutas técnicas/ejemplos en navegación funcional. Mantener acceso de legado propio sin transferencias.

Acento distintivo y útil: cabecera de expediente con estado real y próxima acción concreta, no hero genérico ni progreso inventado. Desktop aprovecha espacio mediante datos agrupados y contexto/acciones lateral cuando cabe; móvil apila con prioridad para estado y observaciones. Foco visible, jerarquía de headings, labels accesibles y reducción de movimiento respetada.

Aclaración posterior de Marcelo sobre componentes: reutilizar también compuestos existentes, no sólo primitivas Antd. Cabeceras a través de PageHeader compartido (props opcionales de descripción/h1/caso sin modificar defaults demo); bandeja mediante AdvancedTable (exportación deshabilitada, actualización real, locale español y paginación externa controlada); cuenta mediante UserAvatar con icono genérico y verified=false, sin foto ficticia. Formularios siguen el patrón real Card/Form/Row/Col de user-account/details e information; nacimiento usa DatePicker de Antd con conversión UI Dayjs↔string ISO para conservar el contrato existente. Ninguna fuente externa se modifica.

## [S3] Portal del titulado: inscripción y documentos

Cabecera “Mi inscripción”, estado real y próxima acción: completar/guardar/enviar en borrador; espera de revisión en enviada/en revisión; atender observaciones y reenviar en corrección; vinculación pendiente del legado sin capacidades nuevas. Un formulario único, sin wizard que agregue estados ni pasos obligatorios.

Agrupar los campos existentes: datos personales (nombre, nacimiento, registro universitario, sexo), información académica (carrera, facultad, PPA declarado), contacto (correo/teléfono), intereses y movilidad (área y provincia/departamento/país), documentos. Dos columnas de campos cuando el ancho permite, una en móvil. Movilidad preserva sí/no/no informado; guardar incompleto no fuerza respuestas ni valores ficticios.

Distinguir “Necesario para enviar” de “Opcional”, según matriz vigente; no hacer required HTML/validaciones de completitud que impidan guardar borrador. Facultad opcional, cuatro documentos requeridos y CV/provisión opcionales; no equivalencia automática de títulos. Mensajes de usuario sin “piloto real”, rutas API, vocabulario de infraestructura o “máximo técnico”; límites existentes siguen visibles y exactos.

Documentos con nombre comprensible, requisito vigente, archivo vigente/nombre/fecha/tamaño, y carga/sustitución sólo en estado editable. Seleccionar no equivale a subir. Mostrar versión vigente en primer plano, anteriores en despliegue accesible; descarga privada disponible a quien ya está autorizado. Mantener 10 MiB, PDF/JPEG/PNG y foto sólo imágenes; nada de previews públicos o eliminación documental nueva.

Observaciones generales cerca del encabezado de edición/documentos, con motivo de corrección visible y listado completo accesible. No asociar texto automáticamente a campos ni duplicar notas como si tuvieran destinos específicos. Historial accesible mediante despliegue o pestaña, preservando actor, acciones y cambios; no sobrecargar cada sección.

Acciones próximas al contenido: Guardar borrador y Enviar a revisión/Reenviar con jerarquía diferenciada; para inscripción nueva guardar primero, luego adjuntar/enviar. No enviar datos sin guardar: conservar detección de cambios, confirmaciones, bloqueo de navegación, avisos de descarte, manejo 409/422, busy de carga y selección de archivos. No perder borrador ni selección por refrescar documentos. Confirmaciones de éxito claras y errores por campo con recuperación.

## [S4] Personal: bandeja, detalle y ampliación compatible

Bandeja con titulado, carrera declarada, estado, fecha de envío disponible y acción de abrir expediente. Fecha ausente se indica como tal, no se inventa ni se etiqueta actualización como envío. Reviewer/versiones pueden seguir en contexto secundario. Tabla desktop, distribución móvil legible y scroll contenido sólo cuando inevitable; no ocultar desbordes de página con overflow-x:hidden.

Decisión aprobada por Marcelo vía Question: ampliación compatible, no carga masiva de expedientes completos. GET /api/personal/inscripciones conserva ruta, autorización, campos actuales, orden, page/per_page y meta; añade career:string|null al resumen y dos parámetros opcionales:

- search: texto de hasta 200 caracteres, trim; vacío equivale a ausencia; coincidencia literal parcial sin distinguir mayúsculas en nombre o carrera. %, _ y barra invertida se tratan como texto, no comodines introducidos por el usuario.
- status: submitted | in_review | correction_requested; ausencia equivale a todos los estados ya autorizados; inválido→422. No valores nuevos ni drafts/legados ajenos.

Aplicar búsqueda/estado dentro del scope autorizado antes de paginar; filtros combinados por AND, nombre/carrera por OR agrupado. meta.total refleja resultados filtrados, no sólo la página actual. Consultas parametrizadas y límites existentes. Sin migración. Sin filtros institucionales inventados por edad, PPA, sexo o carrera/facultad oficial.

Cliente tipado, filtros en la clave privada de QueryClient; cambio de búsqueda/estado reinicia página 1; limpiar filtros real; búsqueda por botón/Enter y filtro de estado, sin controles decorativos. Cancelar respuestas antiguas y conservar aislamiento por cuenta/generación. Distinguir bandeja vacía de sin coincidencias; mensajes de carga/error y reintento. No persistir PII ni consultas en localStorage.

Detalle con datos agrupados, documentos, observaciones e historial accesibles mediante pestañas/despliegues. Mantener acciones visibles según capacidad, asignación y estado: tomar revisión, registrar observación, solicitar corrección. Confirmar las mutaciones como hoy; motivo requerido según validación actual. No admitir, aprobar, calificar, publicar ni añadir roles. Acciones del servidor siguen siendo autoridad; tabla no permite lectura de borradores ajenos ni expedientes asignados a otro.

## [S5] Extensión a inicio, registro e ingreso

Después de concretar las dos áreas representativas, aplicar los mismos tokens, shell, espaciado, botones y jerarquía a las páginas reales existentes. Inicio con título académico y explicación breve de inscripción/documentos/revisión, CTAs reales y sin estadísticas o logotipo ficticios. Ingreso/registro reutilizan AuthenticationFrame extraído de pages/authentication: Row/Col, panel de presentación con colorPrimary y panel de formulario con colorBgContainer, dos columnas en escritorio y apilado en móvil. AccessFrame sólo adapta texto institucional y fullPage=false al Content existente. Los ejemplos sign-in/sign-up usan el mismo marco puro; controles demo no se suministran al recorrido real. Conservar labels/password accesibles, errores comprensibles, estado de carga, enlaces funcionales y capacidad real existente. No ampliar altas administrativas, registro de personas, verificación email o servicios externos.

## [S6] Verificación, evidencia y seguridad de pruebas

Marcelo autorizó Playwright aislado, sin sesiones personales. Capturar el estado actual antes de modificar UI, luego los mismos estados/viewports después: portal editable con documentos y corrección; bandeja y detalle de personal; escritorio 1440x960 y móvil 390x844. Extensión pública: capturas inicio/ingreso/registro al terminar. Evidencia sólo ficticia; campos password vacíos y sin tokens/secretos en capturas, logs, comandos o Git. Capturas previas del incremento son referencia histórica, no sustituyen antes actuales.

Raw artifacts bajo frontend/output/playwright/proceso-a o fuera de Git; copiar sólo capturas saneadas a docs/verification-captures/interfaz-proceso-a/{before,after}. Inspección visual y comparación emparejada por viewport/estado; comprobar título legible, labels, anchos, acciones, menú/sidebar, teclado y ausencia de desborde de página. Screenshots por sí solos no acreditan interacción.

Entorno de escritura exclusivo: APP_ENV=testing, PostgreSQL tecnoweb18b_test, APP_CONFIG_CACHE propio, DB_URL vacío, cookies propias, puertos privados libres distintos de desarrollo. Inspeccionar procesos/listeners; no confiar en puerto/health. pilot:e2e-fixture valida conexión real y sólo siembra revisor aleatorio. Antes de registrar usuarios por UI, autenticar ese revisor y comprobar identidad/capacidades contra fixture; si falla, no escribir. Además aislar sesiones/documentos/logs con LARAVEL_STORAGE_PATH hacia almacenamiento temporal propio (mecanismo confirmado en Laravel instalado), sin tocar .env ni APP_KEY ni añadir configuración de producción. Confirmar destinos DB/storage efectivos antes de seed.

Comparar fingerprint de desarrollo antes/después sin imprimir PII; no limpieza general ni creación de cuentas allí. PHPUnit conserva guards de RefreshDatabase inmediatamente antes de limpiar sólo tests. Ficheros/documentos sintéticos nuevos; no reutilizar archivos personales o de la remediación anterior.

Pruebas: regresiones backend de búsqueda/filtros (caso fuera de primera página, total/paginación, permisos, literales especiales y 422); UI de grupos/etiquetas/docs/acciones, filtros y reset de página, pestañas/historial, cambios sin guardar y 403/logout/caché; TypeScript, build y lint focal. Test-first cuando reproducción barata, verificar fallo esperado antes de implementar. Suites y logs frescos: no sustituir verificación actual por resultados previos. Identificar PRE-EXISTING LOCALE-NUMBER-TEST y deuda lint global si reaparecen; no arreglar demos ajenas.

Browser con flujo real guardar→recargar→adjuntar→enviar→personal tomar/observar/corregir→titulado corregir/reenvío, aislamiento y logout. Comprobar health. Ejecutar pesados secuencialmente; cerrar browser/servidores de tests antes de review. Revisor nuevo de modelo al menos equivalente recibe spec, snapshot/diff exacto y resultados concisos, nunca narrativa justificativa. Revisión separada de cumplimiento/corrección/consistencia; corregir críticos, re-verificar y re-revisar. Reportar brechas de verificación e institucionales como tales. No atribuir cobertura de concurrencia real o pestañas múltiples a esta mejora visual.

## [S7] Fuera de alcance

Nuevos requisitos/documentos/estados/permisos, decisiones institucionales, equivalencias de títulos, catálogos, PPA calculado/rangos, evaluación/admisión/publicación, IA/OCR/correo, logos o estadísticas ficticias, fuente/stack nuevo, cambios de APP_KEY/secretos, migraciones/limpieza de desarrollo, actualizaciones masivas, Git interno, commit/push/publicación. No transferir legados ni borrar datos reales; mantener guardas e incidente anterior documentado.

## Tasks

### Rectificación solicitada después de la entrega del 08/10/2026

Marcelo aclaró que la base debe ser una copia completa personalizada sobre su estructura original, no conservarla sólo como ejemplos mientras el recorrido real usa otro shell. Se retoma la composición original en layouts/app/app.tsx: SideNav fijo 200/64, HeaderNav, Content con scroll propio y FooterNav. FunctionalAppLayout deja de ser implementación activa y conserva únicamente exports de compatibilidad. Registro/ingreso reutilizan el mismo marco extraído de las páginas originales de autenticación, conservando los callbacks y contratos reales. La fuente externa sigue intacta y los controles demo permanecen sólo en ejemplos.

Snapshot antes de esta rectificación: C:/Users/marcelo/AppData/Local/Temp/grupo18b-before-template-base-5b7630ea4e0141d286f85f98e467b0bd, 46 archivos sin .env. El Report acredita la rectificación revisada, separando pase completo anterior y focal actual. No se importa el catálogo ni se imponen selectores exclusivos antes de acordar una carrera ausente; catalogo-uagrm.json se conserva como aporte del usuario.

Procedencia visual de la rectificación: las 24 imágenes de interfaz-proceso-a/after fueron tomadas el 08/10/2026 entre 11:48 y 12:07, antes del snapshot de rectificación (12:53). Se conservan como referencia del estado anterior para comparar por basename/viewport con las nuevas series template-base; no son un before nuevo capturado retroactivamente. Las series fallidas no acreditan aceptación. Capturas de viewport del Content desplazable no muestran necesariamente todo el formulario: comprobar acceso mediante scroll y geometría respecto al Footer además de las imágenes.

- [x] R1: Reintegrar composición principal y acceso sobre originales — aceptación: sin derivación activa a shell/form frame paralelos; título/rutas/cuenta reales, Sidebar/Header/Content/Footer y marco de autenticación originales personalizados, ejemplos aislados (covers: S2,S5).
- [x] R2: Verificación de rectificación — aceptación: typecheck/build/lint/regresiones frescos; browser escritorio/móvil en DB/storage exclusivos; guards antes de escribir, desarrollo sin cambios y capturas adaptadas al scroll propio (covers: S3,S4,S5,S6; depends: R1).
- [x] R3: Revisión y documentación — aceptación: diff contra snapshot comprobado, permisos/contratos intactos, reporte actualizado con resultados reales y catálogo pendiente explícito (covers: S1,S6,S7; depends: R2).

### Entrega visual anterior conservada

- [x] T1: Baseline visual y shell/tokens scoped — aceptación: antes capturado en tests verificados; header/menú/sidebar móvil y tokens institucionales sin contaminar demos (covers: S1,S2,S6).
- [x] T2: Consulta compatible de bandeja y cliente tipado — aceptación: búsqueda/estado/carrera reales sobre scope autorizado antes de paginar, literales/422/totales probados (covers: S1,S4,S6).
- [x] T3: Portal agrupado y documentos — aceptación: datos/documentos/observaciones/acciones/versiones claras, borrador incompleto y conflictos preservados, desktop/móvil (covers: S2,S3,S6; depends: T1).
- [x] T4: Bandeja y detalle del personal — aceptación: tabla/filtros/paginación reales y detalle organizado, revisión/corrección según permisos existentes, desktop/móvil (covers: S2,S4,S6; depends: T1,T2).
- [x] T5: Inicio/registro/ingreso coherentes — aceptación: mismas superficies/jerarquía/tokens y acceso real sin DEMO/técnicos ni acciones ficticias (covers: S2,S5,S6; depends: T3,T4).
- [x] T6: Verificación integrada y capturas antes/después — aceptación: navegador real sobre tests exclusivos, comparaciones emparejadas, typecheck/build/regresiones frescos y desarrollo sin cambios (covers: S3,S4,S5,S6; depends: T2,T3,T4,T5).
- [x] T7: Revisión independiente y entrega documentada — aceptación: cumplimiento/corrección/consistencia sin críticos pendientes; report honesto con comandos/capturas/brechas y sin commits (covers: S1,S6,S7; depends: T6).
