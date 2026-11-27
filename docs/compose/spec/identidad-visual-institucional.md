---
feature: identidad-visual-institucional
status: delivered
updated: 2026-10-20
branch: feat/talento-piloto
commits:
---

# Identidad visual UAGRM · Administración de Empresas

## Corrección focal (S6 · T5–T8)

**Qué se construyó** — El expediente agrupa las revisiones documental, académica y CV en una pestaña **Revisión** de ancho completo, con tres secciones separadas y anclajes estables; desaparece la columna derecha estrecha y se conservan documentos, versiones, historial y las acciones autorizadas, con vista de sólo lectura para el titular. La bandeja usa tarjetas en móvil con nombre, estado, fecha y «Abrir expediente» visibles, sobre la misma consulta, búsqueda, filtro y paginación del servidor; en escritorio sigue la tabla. Las alertas informativas pasan a fondo `#EEF4FC` con borde `#C6D5EA` en lugar del gris derivado de un `colorInfo` oscuro. La cabecera muestra el original horizontal en una franja azul cuando hay ancho suficiente y el símbolo con identificación tipográfica en pantallas menores, sin deformar ni recortar. El inicio reemplaza el aviso técnico por dos bloques que separan lo disponible de lo que todavía no se ofrece. Se compactaron documentos y metadatos, las etiquetas dejaron de partirse a mitad de palabra y los anclajes quedan separados del borde del área desplazable. No cambiaron reglas, permisos, estados, validaciones ni contratos HTTP.

**Verificación** — Corrida definitiva `62649fbf-4eb5-497f-a919-c324e3b951e2`: 52 capturas, 90 comprobaciones aprobadas, 0 hallazgos, `BROWSER_EXIT=0`. Suite conjunta 111/111 en 23 archivos, `tsc --noEmit`, lint focal, formato y build con salida 0. Fingerprint de desarrollo idéntico antes y después. Paquete `grupo18b-identidad-visual-correccion.zip`: 55 archivos (52 PNG), 53 enlaces de archivo más 7 anclas, 0 rotos, 0 rutas absolutas, SHA-256 `C25B6E147816F2A8F6E73D7690A514402024EE604D163063DC73ECE369696233`.

**Revisión independiente** — general-40, modelo gpt-6.1-sol (igual al implementador): cero críticos; conformidad S6/T5–T8, corrección y consistencia contrastadas contra el snapshot previo, sin repetir suite, build ni navegador. Observaciones no críticas atendidas: encabezados de sección homogéneos (`h3` en los tres bloques), dimensiones reales del escudo `820×800`, token `colorInfoText` retirado por inerte, comprobación del último control endurecida para exigir las acciones del editor al pie, `Empty` explícito también en académica y CV, y `.gitignore` que cubre los artefactos locales de inspección. Riesgo residual declarado: la franja intermedia 768–1023 px no está capturada; la marca usa el símbolo desde `lg` justamente para no forzar el original horizontal en cabeceras estrechas.

**Journey log (corrección)**

1. El guion de captura heredado abortaba cada superficie por comparar el usuario completo contra `/api/auth/me`; al vincularse la persona el objeto cambia. Se comparó la identidad estable y, tras dos corridas sin poder depurarlo a ciegas, se escribió un capturador focal propio que registra hallazgos sin abortar la captura.
2. Tres hallazgos propios resultaron falsos: `contain`/`cover` no deforman el mapa de bits, «Tomar revisión» desaparece correctamente cuando el expediente ya está asignado, y el último control real del editor es el desplegable de historial.
3. El servidor de pruebas murió entre arranque y corrida (`ECONNRESET` en el preflight); el guion ahora espera disponibilidad real de `/api/health` y `/` antes de capturar, con un reintento.
4. La suite falló al activar Revisión por ancla: `scrollIntoView` no existe en jsdom. Se añadió el guard de tipo, que ahora es requisito para cualquier llamada en este repositorio.
5. Revisando los PNG se detectaron dos defectos reales: etiquetas partidas a mitad de palabra (`overflow-wrap: anywhere` en etiquetas) y encuadre del error que cortaba la etiqueta del campo. Ambos corregidos y recapturados.

**Workspace y Git (corrección)** — Raíz existente, rama `feat/talento-piloto`, repositorio sin commits: no hay SHA base/HEAD ni rango que registrar. Sin worktree, commit, push ni publicación, por instrucción expresa de Marcelo.

## Report

**Qué se construyó** — Identidad UAGRM / Administración aplicada sobre el template existente, mediante paleta y recursos centralizados, tema Ant Design clean, marca compacta y estilos del piloto. Inicio, ingreso y registro incorporan la fotografía real; el área de personal usa sidebar azul y superficies claras. El portal y los bloques documental, académico y CV conservan formularios, registros y acciones. Lato Latin 400/700 se sirve localmente con licencia SIL OFL 1.1; el favicon identifica UAGRM. El título académico completo permanece en inicio y contexto de acceso.

No se modificaron API de negocio, Sanctum/CSRF, sesión, permisos, titularidad, documentos privados, estados, versiones, catálogos ni validaciones. Los layouts compartidos y AuthenticationFrame no cambiaron respecto al snapshot. Los seis originales de imagen conservan sus SHA-256; los colores son una decisión técnica, no un manual oficial ni aprobación institucional.

Entrega para revisión visual de Marcelo: [índice HTML comparativo](../../verification-captures/identidad-visual-institucional/index.html), [guía y procedencia](../../verification-captures/identidad-visual-institucional/README.md) y [resultados consolidados](../../verification-captures/identidad-visual-institucional/verification.json). El índice selecciona 36 pares (72 PNG): 36 previos, 18 posteriores privados del mismo expediente y 18 posteriores públicos renovados tras corregir el fondo del banner. Las capturas históricas adicionales se conservan. La inspección visual de píxeles por el agente no quedó acreditada: se verificaron DOM, estilos, geometría, recursos y muestreo automático de color, sin afirmar aprobación estética ni accesibilidad integral.

**Verificación** — Ejecutada el 16/10/2026; no se sustituyen suites por comprobaciones aisladas.

| Comando / comprobación | Resultado observado |
| --- | --- |
| Frontend: `corepack pnpm exec vitest run src/pilot src/layouts/app/app.test.tsx --pool=threads --maxWorkers=1 --minWorkers=1 --testTimeout=15000` | PASS, 106/106 pruebas conjuntas en 9 archivos; exit 0. [Resultado JSON](../../verification-captures/identidad-visual-institucional/frontend-tests.json). |
| Frontend: `corepack pnpm exec tsc --noEmit` | PASS, exit 0. |
| Frontend: `corepack pnpm exec eslint src/pilot src/layouts/app/app.tsx src/pages/authentication/authentication-frame.tsx --max-warnings 0` | PASS, exit 0; lint focal, no lint global de demos. |
| Frontend: `corepack pnpm exec prettier --check src/pilot src/layouts/app/app.tsx src/pages/authentication/authentication-frame.tsx` | PASS, exit 0. CSS del banner comprobado nuevamente tras su corrección. |
| Frontend: `corepack pnpm build` | PASS, exit 0; repetido tras el último cambio CSS. WOFF2 y licencia presentes en dist. Avisos no fatales de anotaciones de dependencias y chunks mayores a 500 kB; no se amplió el alcance a optimización global de demos. |
| Backend: `php vendor/bin/phpunit --configuration phpunit.xml` | PASS, 87 pruebas / 1302 aserciones, exit 0. Guards de testing/pgsql/tecnoweb18b_test antes de RefreshDatabase. [Log](../../verification-captures/identidad-visual-institucional/backend-phpunit.log). |
| Raíz: `node --check backend/tests/browser/identity-flow.cjs` | PASS, exit 0. |
| Navegador: before 36 + after original 36 + renovación pública final 18 | Capturas completas. Teclado, Tab/foco de acceso, Drawer/cuenta, sidebar, carga de imágenes y Lato comprobados. Sin desborde horizontal global; la tabla móvil conserva desplazamiento interno. La comparación privada acredita DTO, historial, observaciones y bandeja iguales. |
| Recorrido UI separado: `PILOT_E2E_VERIFY_ONLY=1` | PASS: solicitar corrección, cambiar contacto y guardar, sustituir histórico, reenviar y tomar revisión. El informe original FAILED se conserva, no se reetiqueta como PASS. [Evidencia](../../verification-captures/identidad-visual-institucional/flow-verification.json). |
| Integridad y cierre | Ambos runtimes detenidos. Fingerprint de desarrollo antes = después: `4a700702ec4b053889214ccf69d9f3725b2e271081cc16d18131b69c30cddb48`. Sin migraciones ni escrituras de prueba en desarrollo. Índice: 74 enlaces locales, 0 rotos. |

La suite conjunta precedió únicamente al ajuste CSS del fondo del banner; después se repitieron la regresión pública de navegador, el formato CSS y el build de producción (que incluye TypeScript). No cambió código TypeScript/negocio después de la suite. No se ejecutaron la suite global del frontend/demos ni su lint global; no se presentan como aprobados.

**Archivos del incremento** — Producción: `frontend/src/pilot/{identity.ts,brand.tsx,brand.css,design.ts,styles.css,portal.css,records.css,public.tsx,access.tsx,layout.tsx}`, `frontend/index.html` y `frontend/public/fonts/lato/{lato-latin-400.woff2,lato-latin-700.woff2,OFL.txt}`. Pruebas: `identity.test.ts`, `template-auth.test.tsx` y `backend/tests/browser/identity-flow.cjs`. Documentación: README raíz, este contrato y la serie de capturas/manifiestos/índice. Los componentes de negocio de expedientes y editor no se modificaron.

**Revisión independiente** — general-36, modelo gpt-6.1-sol (igual al implementador delegado): cero críticos; conformidad S1–S5, corrección y consistencia local contrastadas contra snapshot y evidencia, sin repetir suites ni navegador. No otorga aprobación estética o institucional. Observaciones no bloqueantes conservadas: Inter/Roboto de las demos siguen enlazadas externamente en index.html; el guion recopila contraste pero no lo convierte en aserción. Las muestras posteriores se analizaron y ninguna calculable quedó bajo el umbral aplicable; transparencias/raster no quedan certificados.

**Workspace y Git** — Raíz existente `C:/UAGRM/Tecnologia Web/proyecto-grupo18b/tecnoweb-18b-seleccion-personal`, rama `feat/talento-piloto`. Repositorio unborn, sin SHA base/HEAD ni rango de commits. Revisión por snapshot previo del piloto y de layouts/auth compartidos; los archivos fuera de ese snapshot se inspeccionaron contra el contrato, sin tratarlos automáticamente como nuevos. Por instrucción expresa de Marcelo no se creó worktree, commit, push ni publicación; esa restricción prevalece sobre la finalización Git habitual de Compose Next.

**Journey log**

1. Interrupciones diferenciadas: general-34 fue cancelado; un intento terminó con 3221225786 (compatible con interrupción de consola); otro alcanzó TSC exit 0 sin exit final de Vite. No se registraron como errores reproducibles de compilación. La invocación directa inicial de Vitest agotó 60 s del ejecutor, sin resultado; la ejecución supervisada posterior terminó.
2. El guion esperaba 422 para credenciales de cuenta inexistente; el contrato real devuelve 401. Se corrigió la aserción, no AuthController. La carga inicial de Vite superó 20 s; con arranque caliente/espera de 90 s se completaron las capturas sin build previo por pantalla.
3. Guardar el borrador vuelve al detalle: el guion buscaba después el cargador del editor. Se corrigió la navegación y una nueva ejecución completa del recorrido pasó. El FAILED histórico y sus 36 capturas válidas se conservan separados del PASS posterior.
4. Lato dependía de una URL bloqueada por el navegador aislado: se sirvieron localmente 400/700 con licencia. El banner aportado es blanco/transparente (15.653/15.660 píxeles visibles claros); el fondo blanco se corrigió a azul y se renovaron las 18 capturas públicas, con aserción del fondo y nuevo build.
5. La inspección de imagen sólo devolvió texto, no píxeles visibles al agente. Se entregan PNG, estilos, geometría y límites para revisión humana; ni los pases técnicos ni el muestreo automático constituyen aprobación estética.

## [S1] Objetivo y límites

Identificar la aplicación real con UAGRM y la Carrera de Administración de Empresas, conservando el template React/Ant Design, título académico completo y recorridos del proceso A. La dirección seleccionada por Marcelo se registra en Notion 12 (3fb2585d73c181d2aa78c95a28a09068), consultada el 16/10/2026. Las referencias visuales no aportan reglas de negocio ni equivalencias de instrumentos.

Sin modificaciones de Sanctum/CSRF, autorización, titularidad, documentos privados, estados, versiones, catálogo, payloads HTTP, validaciones u obligatoriedad. Sin backend nuevo, evaluaciones, puntuaciones, fórmulas, entrevistas, publicación ni commit. No migraciones/escrituras de prueba en desarrollo.

## [S2] Dirección de diseño

- Base muestreada UAGRM: rojo #880000 y azul #2A3964. Decisiones propuestas: superficie #FFFFFF, entorno #F5F6F8, texto #202837 y borde #DCE1E8. No se cuenta con manual oficial.
- Una familia de interfaz: Lato y fallbacks existentes; sin dependencia de paquete nueva. Pesos 400/700 Latin WOFF2 servidos localmente para no depender de Google Fonts en el piloto; SIL OFL 1.1 y atribución conservadas junto a los archivos. Título principal 32 px escritorio/24 px móvil; encabezados de tarea 24 px; cuerpo16 px, utilidad14 px. Jerarquía por tamaño/peso, no por una segunda familia ornamental.
- Firma: identificación universitaria/carrera y composición rojo/azul con fotografía auténtica; el resto permanece sobrio para permitir leer datos, documentos e historial.
- Inicio: título académico completo y propósito, fotografía sin deformar, identificación institucional y explicación A operativo/B pendiente sin CTA falso. Mantener rutas y acciones reales.
- Acceso: marco AuthenticationFrame existente adaptado desde AccessFrame; fotografía lateral escritorio, prioridad al formulario móvil. No copiar fondos de otras universidades ni mezclar autenticación demo.
- Trabajo: marca compacta en cabecera, sidebar azul del personal, contenido blanco, bordes discretos y avisos claros. Mantener h1 Mi inscripción/Bandeja/nombre del expediente; no repetir el título largo en toda cabecera móvil.
- Expedido/revisiones: conservar observaciones y todos los registros/versiones, reducir duplicaciones de avisos informativos sin eliminar advertencias de corrección/versión/privacidad ni acciones permitidas.

## [S3] Recursos y procedencia

Archivos ya aportados por Marcelo en frontend/public; no se modifican originales ni se atribuye autorización institucional o licencia no informada. La URL de descarga original de cada archivo no fue aportada; se distinguirá cualquier coincidencia verificada con fuente pública de una inferencia por nombre.

| Archivo | Dimensiones | Uso propuesto |
| --- | --- | --- |
| uagrm-logo.jpg | 1600×1600 | Símbolo UAGRM compacto, fondo original conservado. |
| uagrm-banner.png | 707×88, alfa | Marca horizontal en presentación donde conserve legibilidad/proporción. |
| adm-empresas-logo.jpg | 1253×1253 | Identificación de carrera, sin recolorear ni recortar. |
| adm-empresas-edificio.jpg | 1280×853 | Inicio/acceso, no detrás de campos ni tablas. |
| fcee-logo.jpg | 1080×1080 | Contexto de unidad académica, secundario; no banda de patrocinadores. |
| ficct-logo.png | 687×892, alfa | Conservado; no se presenta automáticamente como unidad impulsora ni alianza. |

Rutas, alternativas textuales y dimensiones centralizadas. Logos con object-fit contain y tamaño explícito; fotografías con relación nativa o recorte documentado, nunca estiradas. No hotlinks de imágenes para la app. Source hashes se conservarán en evidencia.

Lato procede de Google Fonts (`fonts.gstatic.com/s/lato/v25/`), sin modificar los WOFF2: archivos `lato-latin-400.woff2` y `lato-latin-700.woff2`, con licencia en `frontend/public/fonts/lato/OFL.txt`. El subconjunto cubre los caracteres de la interfaz en español. Fotografía con recorte `cover`, posición `50% 48%`; logos con `contain`. Los seis originales de imagen conservan sus SHA-256 del inventario previo. FCEE/FICCT se conservan sin atribuirles participación institucional no definida.

## [S4] Evidencia previa y comparabilidad

Capturar home, ingreso, registro, portal, bandeja y detalle con los tres bloques recientes, a1440×960 y390×844. Usar mismos anclajes, estado ficticio y nombres visibles antes/después; guardar en serie identidad-visual-institucional, no en series históricas. Una brecha técnica de captura se documenta con su causa y evidencia disponible, sin bloquear por sí sola la implementación ya autorizada. Referencias públicas ya preparadas: siete URLs de Notion, screenshots/estilos visibles capturados en references/manifest.json; no repetir investigación ni enviar registros, formularios o tests externos.

Limitación técnica inicial: view_image devuelve confirmación textual sin píxeles al agente; dos proveedores de inspección visual no estuvieron disponibles. No se afirma inspección estética de píxeles ni fidelidad de clon. Se conservarán PNG, estilos/estructura y límites para revisión visual de Marcelo; si se habilita inspección visual real, se documentará por separado.

## [S5] Verificación y aceptación

- Conexión real testing/pgsql/tecnoweb18b_test, storage/cookie/config privados, propiedad de procesos y preflight reviewer antes de datos ficticios. Fingerprint de desarrollo antes/después; APP_KEY/.env/credenciales conservadas.
- Escritorio/móvil sin desborde ni ocultar contenido como solución; proporciones y carga de imágenes, contraste calculado, foco visible, navegación por teclado, Drawer/cuenta y acceso a acciones principales.
- Recorridos existentes: guardar borrador/documentos/envío/revisión/corrección/reenvío y bloques documental/académico/CV. No sustituir integración por mocks ni pases aislados por suite conjunta.
- Suite afectada conjunta, TypeScript, lint focal, formato y build; resultados reales con logs/capturas. Registrar deuda preexistente sin limpieza ajena al alcance.
- Entrega con archivos modificados, procedencia de recursos, índice antes/después y brechas. Revisión independiente de código; visual final pendiente de Marcelo, no aprobación de Administración.

## [S6] Corrección focal posterior a la revisión visual del ZIP

Marcelo revisó el paquete de capturas y dejó hallazgos priorizados; esta sección los adopta como requisitos. No cambian reglas, permisos, estados, validaciones ni contratos HTTP, y se conservan paleta, Lato, fotografías, template y título académico.

- Expediente: las revisiones documental, académica y CV salen de la columna derecha estrecha y pasan a una pestaña **Revisión** de ancho completo con tres secciones diferenciadas y anclajes estables (`revision`, `revision-documental`, `revision-academica`, `revision-cv`). Se conservan documentos, versiones, historial y todas las acciones autorizadas; la vista del titular es de sólo lectura. Datos sigue siendo la pestaña inicial.
- Avisos: las alertas informativas usan superficie azul muy claro `#EEF4FC`, borde `#C6D5EA` y texto oscuro `#202837`, en lugar del tono gris que antd deriva de un `colorInfo` oscuro. Las advertencias y errores conservan su semántica y sus avisos.
- Marca: en escritorio la cabecera muestra el original horizontal (707×88) con altura legible y respaldo azul, sin recorte ni deformación; en móvil usa el símbolo cuadrado con identificación tipográfica, sin forzar la marca horizontal en un espacio diminuto.
- Bandeja móvil: tarjetas con nombre, estado, fecha de envío y enlace **Abrir expediente** visible sin desplazamiento horizontal. Se conserva la misma consulta, búsqueda, filtro por estado y paginación del servidor; escritorio mantiene la tabla.
- Inicio: se reemplaza el aviso técnico grande por información dirigida al usuario, separando lo disponible de lo que todavía no se ofrece, sin prometer funciones activas.
- Compactación y navegación: se reducen espacios y metadatos de documentos y revisiones sin perder legibilidad, y los anclajes/foco quedan separados del borde del área desplazable. Se verifica que navegar por hash y enfocar controles no oculte títulos bajo la cabecera, incluido el último control junto al pie.

Verificación de esta corrección: capturas nuevas de escritorio y móvil de las superficies afectadas, inicio desde arriba, formulario editable con errores, pestaña Revisión y bandeja móvil; suite conjunta del frontend afectado, TypeScript, lint focal, formato y build.

Resultados de la corrida final (`62649fbf-4eb5-497f-a919-c324e3b951e2`, runtime aislado testing/pgsql/tecnoweb18b_test, 52 PNG, 90 comprobaciones, 0 hallazgos): la pestaña Revisión ocupa al menos el 60 % del ancho útil en ambos tamaños, sin la columna derecha anterior, con sus tres secciones y los formularios autorizados; el portal del titular no ofrece mutaciones; `Abrir expediente` queda dentro de la vista inicial de la tarjeta móvil; las anclas `#documentos`, `#observaciones` y `#revision` se midieron con navegación real y ningún título quedó bajo la cabecera; el formulario editable mostró su error de validación y el último control quedó alcanzable; sin desborde horizontal global. Las etiquetas de metadatos dejaron de partirse a mitad de palabra (`break-word` y ancho mínimo de etiqueta) y los historiales usan dos pares por fila. Evidencia e índice: `docs/verification-captures/identidad-visual-correccion-focal/`; paquete `grupo18b-identidad-visual-correccion.zip` (55 archivos, 52 PNG, 0 enlaces rotos). Suite conjunta 111/111, TypeScript, lint focal, formato y build con salida 0; fingerprint de desarrollo idéntico antes y después.

## [S7] Ajuste focal responsive de resúmenes, aviso de envío y cabecera

Marcelo revisó visualmente el expediente y confirmó las correcciones anteriores; pidió conservar el diseño y ajustar cuatro puntos observados en las capturas.

- Resúmenes de revisión: los valores y la descarga del resumen académico se recortaban por la derecha a 390 px. Ahora hay una sola estructura (`dl`/`dt`/`dd`) y el CSS coloca el valor junto a la etiqueta desde 576 px y debajo de ella por debajo de ese ancho; la descarga entra en el ancho disponible. Se aplicó el mismo criterio a los resúmenes de CV y documental y al historial de versiones, conservando todos los campos y el tamaño del texto.
- Comprobación de contenido: además del desborde global, se mide cada componente (ancho de filas, `scrollWidth` frente a `clientWidth` y borde derecho de cada botón contra su contenedor).
- Aviso de envío: cuando los datos y documentos están completos pero quedan cambios sin guardar, el aviso lo indica y aclara que el envío usa la última versión guardada. La regla de envío no cambia: el botón permanece deshabilitado en ese estado, y las validaciones existentes se conservan.
- Cabecera y navegación: medidas a 768, 1023 y 1024 px, sin recortes y sin tapar contenido. Hasta 991 px se usa el símbolo con identificación tipográfica y desde 992 px la marca horizontal.

Verificación: capturas nuevas de los anchos afectados, comprobaciones focalizadas del frontend y build. No cambian estados, permisos, contratos ni comportamiento de negocio.

Resultados (corrida `aa58c665-6d71-471a-9f2b-93b70e400253`, runtime aislado testing/pgsql/tecnoweb18b_test): 19 capturas, 86 comprobaciones, 0 hallazgos. `resumen-academico-sin-recorte`, `resumen-cv-sin-recorte`, `resumen-documental-sin-recorte` y `historial-sin-recorte` a 390, 768 y 1024 px; `resumen-etiqueta-sobre-valor-390`; `cabecera-sin-recorte` y `cabecera-no-tapa-contenido` en inicio y detalle a 768, 1023 y 1024 px; `aviso-cambios-sin-guardar-explica` con el envío aún deshabilitado. Comprobaciones afectadas 73/73 (`review-design`, `ui`, `portal-design`, `template-auth`), `tsc --noEmit`, lint focal, formato y build con salida 0; fingerprint de desarrollo idéntico. Evidencia e índice en `docs/verification-captures/identidad-visual-ajuste-responsive/`.

Nota de coordinación: la crítica del 18/10 permanece en `.impeccable/critique/2026-10-18T02-44-00Z__frontend-src-pilot-records-tsx.md`, con su huella original. Coincidía al entregar S7; S8/S9 modifican después el código. El P2 de contraste sigue diferido y el snapshot no se cierra como si todos sus hallazgos estuvieran resueltos.

## [S9] Ayudas, observaciones y navegación a faltantes

Corrección focal del portal en modo Operate, preservando diseño, identidad, HTTP, validaciones, estados y permisos. Se sigue el backlog de la crítica para avanzar sobre el flujo, sin autosave, borrado de versiones ni reglas institucionales nuevas.

- Una observación ordinaria resulta visible aunque el expediente permanezca en revisión: contador, sección abierta al cargar y próxima acción que la menciona. El usuario puede cerrarla; no se inventan visitas previas ni estados de lectura.
- PPA declarado y Sexo declarado incorporan ayuda factual. Ambos siguen siendo texto declarado: sin cálculo, conversión, escala o categorías nuevas.
- Los faltantes de envío tienen acciones que llevan al campo, movilidad o documento correspondiente. En edición se usa el formulario existente sin cambiar de ruta ni descartar lo escrito; desde consulta se abre la edición por hash. El campo pendiente se relaciona con su ayuda mediante ARIA; el marcador se retira al completar el dato.
- El foco en los selectores de catálogo se intenta cuando el control ya está cargado. Se conserva el filtro, la selección manual excepcional y la advertencia de facultad/carrera incompatibles.

**Verificación agrupada** — TypeScript, lint focal, formato y build exit 0. La primera ejecución afectada tuvo 75/76 aprobadas; la restante era una aserción nueva que exigía un id específico para aria-describedby. Ant Design describe el campo mediante el contenedor de ayuda, por lo que se corrigió para validar la descripción accesible real y la regresión focal pasó 1/1. No se presenta como una segunda suite conjunta ni se repitió la suite global. Navegador aislado: ambos tamaños, enlaces a campo/documento conservando el borrador y observación ordinaria visible sin activar edición. Seis capturas nuevas en [portal-impeccable](../../verification-captures/portal-impeccable/index.html). Runtime detenido y fingerprint de desarrollo idéntico.

**Impeccable** — Contexto PRODUCT/DESIGN preservado, revisión de layout/corrección de fuentes sin críticos y detector estático de los cuatro TSX exit 0, sin hallazgos; este detector no certifica diseño ni WCAG. El P2 de contraste queda diferido y no se recalculó la crítica 25/40.

## Tasks

- [x] T9: Ajustar resúmenes de revisión al ancho disponible y comprobar su contenido — aceptación: sin recortes a 390/768/1024 px, datos conservados y descarga dentro del ancho (covers: S7).
- [x] T10: Aclarar el aviso de envío con cambios sin guardar — aceptación: el mensaje distingue datos completos de cambios pendientes y el envío sigue bloqueado (covers: S7).
- [x] T11: Verificar cabecera y navegación a 768/1023/1024 px, capturas nuevas y build — aceptación: sin recortes ni contenido tapado, comprobaciones afectadas y build con salida 0 (covers: S7; depends: T9, T10).
- [x] T12: Corregir PortalHome para abrir el legado en modo consulta y evitar duplicados — aceptación: las dos variantes legacy abren su expediente; el activo se prioriza; sin cambios de identidad ni permisos (covers: S8; depends: T11).
- [x] T13: Hacer visibles las observaciones ordinarias y añadir ayudas de declaración — aceptación: contador y contenido visibles sin cambio de estado; PPA y sexo conservan su validación original (covers: S9).
- [x] T14: Enlazar faltantes a campos y documentos preservando el borrador — aceptación: foco, ayuda accesible y navegación sin perder cambios locales; build y verificación afectada documentados (covers: S9; depends: T13).

- [x] T1: Conservar referencias preparadas y capturar línea base propia con guards — aceptación: 36 PNG y manifiesto previo; brechas documentadas sin convertirlas en aprobación pendiente (covers: S3, S4).
- [x] T2: Centralizar identidad y recursos; aplicar a superficies existentes sin cambiar negocio — aceptación: seis superficies con tema, marca y recursos compartidos; título y recorridos conservados (covers: S1, S2, S3; depends: T1).
- [x] T3: Verificar recorridos, escritorio/móvil/teclado y comandos conjuntos — aceptación: capturas comparables y resultados efectivos de navegador, suite, TypeScript, lint y build (covers: S4, S5; depends: T2).
- [x] T4: Revisar y conciliar Report/recursos/resultados — aceptación: revisión independiente sin críticos e índice listo para Marcelo, sin commit (covers: S1, S5; depends: T3).
- [x] T5: Reorganizar el expediente en pestaña Revisión de ancho completo y bandeja móvil en tarjetas — aceptación: secciones documental/académica/CV diferenciadas y «Abrir expediente» visible en móvil, sin perder acciones, versiones ni historial (covers: S6; depends: T4).
- [x] T6: Corregir alertas informativas, marca de cabecera, inicio orientado al usuario y compactación — aceptación: avisos azul claro con texto legible, marca legible sin deformar, inicio sin aviso técnico y metadatos más compactos (covers: S6; depends: T5).
- [x] T7: Verificar navegación por hash, foco, formulario editable y superficies afectadas — aceptación: capturas nuevas escritorio/móvil sin títulos ni controles ocultos, último control alcanzable, suite/TypeScript/lint/formato/build con resultados reales (covers: S6; depends: T6).
- [x] T8: Conciliar Report y entrega de la corrección — aceptación: revisión independiente sin críticos y documento/índice listos para Marcelo, sin commit (covers: S6; depends: T7).



## [S8] Recuperación de expedientes legacy_internal en PortalHome

La verificación aislada confirmó que PortalHome filtraba legacy_internal y mostraba un alta nueva aunque el API devolvía el expediente legado del usuario. Si person_id ya estaba vinculado, guardar devolvía 409 y recargar regresaba al mismo editor vacío. Si no estaba vinculado, guardar devolvía 201 y creaba una segunda inscripción junto al legado. Ambos casos deben conducir al expediente previo de sólo consulta; si además hay una inscripción activa, se prioriza la activa. Crear un borrador nuevo sólo cuando el listado no contiene expediente. No se infiere titularidad, no se auto-vincula y no cambian permisos, estados ni HTTP.

Reproducción antes del arreglo: dos cuentas ficticias, testing/pgsql/tecnoweb18b_test; GET de bandeja y detalle devolvieron legacy_internal y 200. Caso vinculado: POST create 409 y bucle de recarga; caso no vinculado: POST create 201 duplicó la inscripción. Después: ambos llegan a `/expedientes-anteriores/{id}` con detalle 200, aviso de vinculación presente y editor nuevo ausente. Tests HTTP controlados cubren ambos estados y priorizan un expediente activo coexistente. Evidencia en `docs/verification-captures/p0-legado-aislado/README.md`. Se retiraron puntualmente las cuentas y registros de prueba sólo en tests; auditoría posterior usuarios/registros/personas = 0. Fingerprint de desarrollo antes/después idéntico.
