---
feature: adaptacion-figma-primer-corte
status: delivered
updated: 2026-10-29
source: feat/talento-piloto
---

# Adaptación de Figma · landing, acceso y shell real

## Report

### Implementado localmente

Landing pública sin sidebar incluso con sesión activa; hero fotográfico, recorridos A/B con estados honestos y privacidad. Ingreso/registro conservan sus formularios y servicios reales dentro de tarjeta izquierda + aside institucional derecho, apilados en móvil. Shell privado con lateral azul de 264 px, activo rojo, cabecera contextual, cuenta/salida reales y drawer. Menús derivados de capacidades del servidor; sin selector de actor, recuperación falsa o banco público simulado.

No se modificaron backend, contratos, migraciones, motor de evaluaciones ni datos de desarrollo. Sesión, API, rutas, editor, documentos, revisión y evaluación coinciden con el snapshot inicial; package.json, pnpm-lock.yaml y Vite tampoco cambiaron. App.tsx/index.css del export y ZIP conservan sus hashes iniciales. No se copiaron materiales privados ni añadieron dependencias.

### Archivos afectados

Diez diferencias en frontend/src contra el baseline de 426 archivos: cinco modificados y cinco nuevos; total final 431, ninguno eliminado.

| Archivo en frontend/src/pilot | Cambio |
| --- | --- |
| public.tsx | Landing y presentación; conserva registro real. |
| access.tsx | Composición adaptable del acceso con panel institucional existente. |
| layout.tsx | Integra marco y cuenta; conserva provider, estados de sesión y guards. |
| pilot-frame.tsx (nuevo) | Marco público/privado, navegación, drawer y scroll del contenido. |
| figma-public.css / figma-shell.css (nuevos) | Estilos acotados y estados del shell. |
| figma-public.test.tsx / figma-shell.test.tsx (nuevos) | Regresiones de composición, formularios, capacidades, navegación y logout. |
| template-auth.test.tsx / ui.test.tsx | Expectativas ajustadas a composición y textos nuevos. |

login.tsx no necesitó cambios: sigue usando el adaptador de acceso y login real. Este documento y capturas/recibos son documentación de entrega.

### Verificación ejecutada

| Comando o recorrido | Resultado observado |
| --- | --- |
| Backend: php artisan test --filter="PilotAuthTest\|TalentSelfServiceTest\|TalentReviewRecordsTest\|HabilEvaluationTest" --no-ansi | PASS: 29 pruebas, 996 assertions; testing/pgsql/tecnoweb18b_test. |
| Frontend: corepack pnpm exec vitest run src/pilot --pool=threads --maxWorkers=2 --minWorkers=1 --testTimeout=30000 --reporter=verbose | Primera tanda: 144 PASS y 8 FAIL de 152. Seis fallos por matchMedia ausente en el test nuevo y dos timeouts. No se oculta esa ejecución fallida. |
| Repetición focal de figma-shell, review-design y ui, filtro "Shell institucional\|conserva texto local ante 409\|personal toma, registra", un worker y timeout 60 s | PASS: 12; 59 omitidas por filtro. Cubre los ocho fallos anteriores: los 152 casos tienen resultado aprobado entre tandas, no en una única suite verde. |
| Confirmación figma-shell + figma-public, un worker y timeout 60 s | PASS: 19/19 sobre la integración anterior al contraste y al P2; la comprobación posterior del matcher se registra por separado. |
| Regresión del P2 detectado por revisión independiente: URLs públicas con barra final | RED: cuatro casos fallaron antes del fix (diez omitidos por filtro). Después de usar matchPath del router: PASS 14/14 del shell, incluyendo sesión activa desktop y anónima móvil; lint/formato de los dos TS/TSX y build posteriores aprobaron. Total: 156 casos frontend con PASS entre tandas, no una suite única verde. |
| ESLint focal de ocho TS/TSX, --max-warnings 0; Prettier --check de diez archivos | PASS, exit 0. Prettier del último ajuste figma-shell.css también PASS. |
| corepack pnpm build: tsc && vite build | PASS posterior al último ajuste de clasificación pública, exit 0; 10518 módulos, 5 m 52 s. Un intento anterior al ajuste de contraste fue interrumpido por límite de 60 s y se repitió desacoplado. |
| Chrome/Playwright, recorrido A completo aislado | PASS: 15 grupos; dos titulares por UI, cinco cargas/versiones documentales, dos envíos y dos observaciones, exclusivamente testing. |
| Complemento Hábil, mismo runtime aislado | PASS: seis comprobaciones: asignación UI, imagen privada/zoom/opciones, guardado/recuperación, 14 ausencias confirmadas, envío congelado y resultado bruto sólo para personal. Banco privado real de 15 ejercicios; sin capturas públicas del instrumento. |
| Confirmación final de drawer sobre último CSS | PASS: 18 aserciones explícitas y seis estados hover/teclado/active entre titular y personal; Escape, foco devuelto y clic de cierre; bandeja vacía desktop HTTP200/data[]. Exit 0. |
| Detector estático Impeccable de seis fuentes UI, una ejecución | Tres advertencias analizadas, no equivalentes a fallos visuales o certificación de accesibilidad. |

El E2E comprueba login válido/inválido, CSRF419, flags422, logout fallido con ocultación privada/reintento, aislamiento/caché entre titulares, borrador recuperable, validaciones de carga, descarga privada exacta, bloqueo tras envío, toma/observación/corrección, reemplazo con ambas versiones descargables, reenvío con revisor/historial y revocación de lectura/descarga tras logout. Drawer del personal: teclado, Escape, foco restaurado y cierre al navegar; cuenta por teclado. No se infiere funcionamiento de imágenes estáticas. El recorrido completo precede al ajuste localizado de contraste y al P2 posterior de clasificación de URLs públicas; las rutas canónicas, el contenido privado y los servicios no cambian. El último CSS se verifica con navegador focal, el matcher con 14 tests del shell y el conjunto con build final. No se presenta como otra ejecución del recorrido completo ni se recapturan superficies canónicas por este matcher, conforme a la revisión.

Runtime completo cerrado y archivo de credenciales eliminado; huella desarrollo antes/después idéntica: 8712a8804a97f6135fefffab3d94e6c3598cbeb3b3130aa050edc7693e928b73. Raíces 35016/10824 verificadas inactivas; referencia temporal 33264 cerrada verificando identidad/fecha de inicio. No se detuvieron servidores de desarrollo ajenos.

La confirmación final también cerró sus procesos y credenciales, con idéntica huella. Para el estado vacío comparable se reinicializó únicamente tecnoweb18b_test con migraciones existentes, después de verificar entorno testing, conexión PostgreSQL real mediante TestDatabaseGuard, storage/config cache TEMP y separación de desarrollo. Se eliminaron fixtures ficticios reproducibles de pruebas, no datos ni archivos de desarrollo. Los intentos previos fallidos se conservan como historia: errores de lanzamiento, medidas a mitad de transición, predicado que no aceptaba query string y supuesto de bandeja vacía con fixtures residuales. El último resultado PASS no borra esos intentos.

Advertencias build: anotaciones react-helmet-async, API legacy Sass y chunk principal >500 kB; sin error. Detector regex: dos falsos positivos por img con props spread de institutionalAssets (src real y carga/píxeles comprobados); advertencia de Lato registrada y no aplicada porque se conserva fuente local, licencia y dirección elegida. No se añadieron exenciones para esconder advertencias.

### Capturas inspeccionadas y comparación

Base relativa: [capturas del corte](../../verification-captures/adaptacion-figma-primer-corte/). Escritorio 1440×1000, móvil 390×844. Inspección de los PNG mediante el modelo de esta instancia con capacidad efímera: view_image/MCP sólo devolvían texto y esa confirmación NO se contó como inspección. Main leyó los resultados de píxeles. Sólo UI pública o datos ficticios testing; nada del banco privado.

Prefijos: ANTES = before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/; DESPUÉS = after/final-confirmation-complete/; FUENTE = reference/.

| Superficie | Comparación válida | Observación |
| --- | --- | --- |
| Landing | ANTES public-landing-{desktop,mobile}.png → DESPUÉS ficticio-home-{desktop,mobile}.png; FUENTE figma-landing-{desktop,mobile}.png | Recupera hero fotográfico azul y recorridos. Título más grueso y hero de distinta altura. Fidelidad orientativa 4/5. |
| Ingreso | ANTES public-login-{desktop,mobile}.png → DESPUÉS ficticio-login-{desktop,mobile}.png; FUENTE figma-login-{desktop,mobile}.png | Tarjetas separadas y orden formulario/aside; foto y contenido institucional real conservados. 4/5. |
| Registro | ANTES public-register-{desktop,mobile}.png → DESPUÉS ficticio-register-{desktop,mobile}.png; FUENTE figma-register-{desktop,mobile}.png | Cuatro campos reales; contenido continúa bajo primer viewport, desplazamiento comprobado. 4/5 desktop, 3,5/5 móvil. |
| Titular | ANTES holder-registration-{desktop,mobile}.png y mobile-nav → DESPUÉS holder-a-initial-{desktop,mobile}.png, holder-a-mobile-account.png; drawer final after/drawer-contrast-delivery/holder-close-{hover,keyboard}.png; FUENTE figma-holder-shell-{desktop,mobile}.png | Marco nuevo conserva editor real, no formulario mock. Cierre oscuro corregido; PNG finales confirman X blanca y anillo blanco de foco íntegro. |
| Personal | ANTES staff-registrations-desktop.png → after/drawer-contrast-delivery/staff-empty-desktop.png; móvil vacío before/staff-mobile-settled/staff-mobile-settled.png → after/staff-mobile-settled-final/staff-mobile-settled.png; recorrido poblado DESPUÉS ficticio-personal-queue-{desktop,mobile}.png y staff-mobile-account.png; drawer final after/drawer-contrast-delivery/staff-close-{hover,keyboard}.png | Estado vacío equivalente en ambos tamaños, separado del recorrido poblado. Shell/drawer 264 px, azul/rojo, cuenta real. 4/5. |

Inspección de las 11 referencias correctas, las 12 capturas antes y recaptura vacía, las 34 del recorrido completo y el vacío nuevo. Puntuaciones: juicio visual orientativo, no métrica automática ni aprobación institucional. No se encontraron imágenes rotas o acciones esenciales tapadas en lo visible. El contenido bajo el viewport no se considera ausente; el E2E comprueba el desplazamiento y las acciones. El cierre oscuro fue el único ajuste visual posterior, localizado al estado hover/foco de AntD.

Las cinco capturas finales de after/drawer-contrast-delivery también se inspeccionaron por píxeles: cuatro cierres/drawers válidos con X blanca, foco visible en keyboard, marcas/menús completos, sin clipping; la bandeja desktop vacía conserva el mismo contenido del antes. El marco cambia deliberadamente, no se afirma identidad pixel-perfect. Esas cuatro imágenes sustituyen la evidencia de cierre anterior. Recibo verificable y hashes en [evidence.json](../../verification-captures/adaptacion-figma-primer-corte/evidence.json).

Evidencia no apta para comparación: la primera imagen raíz figma-reference-landing-desktop.png mostraba acceso, no landing; usar las referencias corregidas de reference/. El primer before staff móvil estaba cargando: usar staff-mobile-settled. La captura auxiliar ficticio-student-documents-mobile.png muestra datos personales por reposicionamiento responsive: NO se usa como prueba visual de documentos; descargas y versiones se comprobaron por UI/HTTP. Las capturas corrected muestran documentos tras reenvío, no la etiqueta global de estado: esa condición la acredita respuesta/historial.

### Abrir comparaciones antes/después

| Superficie | Antes escritorio | Después escritorio | Antes móvil | Después móvil |
| --- | --- | --- | --- | --- |
| Landing | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/public-landing-desktop.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/ficticio-home-desktop.png) | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/public-landing-mobile.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/ficticio-home-mobile.png) |
| Ingreso | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/public-login-desktop.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/ficticio-login-desktop.png) | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/public-login-mobile.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/ficticio-login-mobile.png) |
| Registro | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/public-register-desktop.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/ficticio-register-desktop.png) | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/public-register-mobile.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/ficticio-register-mobile.png) |
| Titular · formulario inicial | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/holder-registration-desktop.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/holder-a-initial-desktop.png) | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/holder-registration-mobile.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/holder-a-initial-mobile.png) |
| Personal · bandeja vacía | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/staff-registrations-desktop.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/drawer-contrast-delivery/staff-empty-desktop.png) | [Antes](../../verification-captures/adaptacion-figma-primer-corte/before/staff-mobile-settled/staff-mobile-settled.png) | [Después](../../verification-captures/adaptacion-figma-primer-corte/after/staff-mobile-settled-final/staff-mobile-settled.png) |

Drawer móvil: [titular antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/holder-registration-mobile-nav.png) → [titular final con foco](../../verification-captures/adaptacion-figma-primer-corte/after/drawer-contrast-delivery/holder-close-keyboard.png); [personal antes](../../verification-captures/adaptacion-figma-primer-corte/before/03a58fde-53aa-4d7f-a2cb-8f4a30f09736/staff-registrations-mobile-nav.png) → [personal final con foco](../../verification-captures/adaptacion-figma-primer-corte/after/drawer-contrast-delivery/staff-close-keyboard.png). Cuenta real abierta: [titular](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/holder-a-mobile-account.png) y [personal](../../verification-captures/adaptacion-figma-primer-corte/after/final-confirmation-complete/staff-mobile-account.png).

### Cómo abrir y límites

Con PostgreSQL/backend local ya configurados: desde raíz, ./dev-local.ps1 -Action Start. Sólo frontend: entrar en frontend y ejecutar corepack pnpm dev. Vite ya usa localhost:5173 y proxy predeterminado localhost:8001; no hace falta definir API_PROXY_TARGET cada vez. Puede configurarse frontend/.env.local para un destino diferente sin secretos VITE_. Esta configuración no se cambió en el corte.

Abrir http://localhost:5173/, /ingresar o /registro. Registro sólo de titular; cuenta revisora mediante alta local explícita previamente documentada, nunca selector de actor. Titular: /portal/inscripcion y /portal/pruebas. Personal autorizado: /personal/inscripciones y /personal/instrumentos. No se dejan runtimes QA para uso normal.

Límites: Chrome automatizado y dos tamaños principales; no matriz multibrowser ni certificación WCAG AA. Pestañas móviles de AntD conservan overflow y menú; fechas pueden partir p. m. y la cuenta abreviarse en cabecera (completa en menú). El aside continúa bajo el primer viewport. Proceso B, publicación, banco público, recuperación, correo, OCR/IA, reglas PPA/tiempos y definiciones F3/Notion14 siguen pendientes. Sin commit, push ni publicación.

### Revisión independiente y cierre

Verificación final completa. Primera revisión independiente fresca general-60 (mismo modelo que implementadores): cero hallazgos críticos y un P2 de URLs con barra final, reproducido y corregido con el matcher instalado de React Router; cuatro regresiones nuevas y 14/14 del shell posteriores. El mismo revisor comprobó fuentes, hashes y logs de la corrección y emitió resolved — SHIP, sin críticos ni P2 pendientes. No exigió recaptura por el matcher: no modifica CSS o superficies canónicas. No había un agente especializado de revisión Impeccable expuesto; se usó general con contrato y paquete de evidencia, sin iniciar otra revisión visual. La evaluación visual del revisor es documental: no se atribuye inspección propia de píxeles; la inspección real de PNG registrada corresponde al modelo de la sesión.

Notion 09, 12, 13 y 14 actualizado mediante notas aditivas, sin reemplazar F3 ni historia y sin advertencias en respuestas de escritura. Las notas distinguen implementación/verificación técnica local y pendientes institucionales. No se publicó código, capturas o material privado.

Entrega local en feat/talento-piloto, rama aún sin HEAD/base SHA y con cero archivos rastreados. No se hizo commit, push, merge o publicación. PRODUCT.md/DESIGN.md se conservaron del baseline; algunas descripciones del marco anterior no reflejan este corte y no se actualizaron silenciosamente. Este contrato y Report registran la adaptación efectivamente entregada.


## [S1] Problema y evidencia

La exportación de Figma es referencia visual, no una implementación de negocio. El corte adapta landing, ingreso/registro reales y shell autenticado de la aplicación actual. Las rutas, capacidades, sesiones, contratos API y datos existentes son autoridad funcional; no se reemplaza frontend/ ni se importan simulaciones.

Fuentes consultadas: Notion 09 (implementación y primer corte), 12 incluida F3 (identidad/export y revisión publicada), 13 (instrumentos/activación), 14 completa (reunión y pendientes). La continuidad del 29/10 permite implementar desde el export sin terminar Make. F3 describe simulaciones y defectos del prototipo, no fallos probados de Laravel ni autorización para ampliar alcance.

Export: resources/Grupo 18B - Plataforma de seleccion de personal - Figma, 31 archivos. Referencia principal: src/App.tsx, PublicHeader/PublicLanding/AccessPage/RegistrationPage/Header/Sidebar y src/index.css. React19/Tailwind4/Vite8 del export no se incorporan a la app React18/AntD6/Vite5. Sólo se ejecuta una copia TEMP, con cambios técnicos de arranque documentados. ZIP y carpeta original son sólo lectura.

Workspace explícito del usuario: raíz Git real, rama feat/talento-piloto, no worktree nueva. Git no tiene HEAD/base SHA ni archivos rastreados; se conserva el trabajo previo y se usa baseline temporal de 426 archivos frontend/src más configuración para revisión por diff. Sin commit, push, merge ni publicación, incluso documentación. La revisión visual se integra aquí y no en otro informe raíz.

## [S2] Diseño y contratos

### S2.1 Separación pública y privada

Landing / sin sidebar interna, incluso con sesión activa: cabecera institucional pública, fotografía real de campus/Administración, título académico completo, acciones de ingreso/registro o continuar según sesión. Reproducir composición y lenguaje de Figma (hero fotográfico, bloques de recorrido y privacidad), sustituyendo promesas de banco público/servicios B por estados honestos de pendiente sin acciones falsas. No selector de actores, estadísticas inventadas, recuperación simulada, contactos públicos o listados ficticios.

La clasificación pública usa matchPath de React Router con coincidencia completa, compartiendo su semántica para /ingresar/ y /registro/ sin introducir nuevas rutas de backend.

### S2.2 Ingreso y registro reales

Mantener /ingresar y /registro, formularios AntD existentes, errores cliente/servidor, loading, no doble envío, autocompletado correcto, limpieza de contraseñas y redirección por capacidades reales. Adaptar distribución de tarjeta y panel institucional de Figma; conservar campos reales (incluido nombre y confirmación) y requisitos actuales, no los seis caracteres del mock. El registro sólo crea titular. No recuperación o alta pública de personal/empresa.

### S2.3 Shell autenticado

Cabecera con título/contexto, cuenta y salida; rail lateral azul oscuro con selección roja, enlaces actuales y drawer móvil con botón abrir/cerrar, cierre al navegar y foco/teclado. Menús derivados de is_graduate y can_review_talent, nunca de selección local de actor. Mantener expediente legado sólo consulta y todos los accesos actuales. Sin buscador global, contadores o módulos simulados. El contenido de portal, bandeja, documentos, revisión/historial y evaluaciones no se rediseña en este corte.

### S2.4 Invariantes funcionales

Preservar PilotSession, session.run, query keys usuario/generación, Sanctum cookies/CSRF y logout (incluido error/reintento y limpieza de caché privada). No cambios de backend/API, migraciones, datos de desarrollo, reglas, permisos ni persistencia funcional localStorage. Hábil permanece en banco privado con 15 ejercicios reales; seis ejemplos de Figma no entran al producto. Sin reglas PPA/tiempos o baremos nuevos.

### S2.5 Recursos y alcance visual

Reutilizar institutionalAssets y fuentes Lato locales/licencia. Fotografía y logos con proporciones nativas; no copiar resources completo, instrumentos, claves ni assets innecesarios al bundle/public. Mantener componentes compartidos Card/Container/UserAvatar y AntD; si se separa el shell piloto del layout DEMO, no alterar el área de demos. CSS nuevo acotado para no recolorear ni redistribuir las pantallas de negocio fuera del marco.

Dirección fijada por el export, sin torneo de conceptos: landing Persuade; acceso/shell Operate. Comparar con capturas de la copia del export y la aplicación vigente a 1440px y 390px. Adaptaciones intencionales: texto de producto veraz, funcionalidades reales, menús por capacidades y componentes AntD. No se promete copia pixel-perfect de simulaciones incompatibles.

### S2.6 Verificación y evidencia

Capturas antes/después del mismo estado/viewport: landing, ingreso, registro, shell titular y personal, drawer/cuenta. Fixtures y escrituras HTTP sólo bajo guard testing/tecnoweb18b_test, storage TEMP y huella desarrollo antes/después. Capturas con instrumento/claves sólo privadas; públicas de este corte sin material del banco. Revisión visual batched escritorio+móvil, una corrección agrupada y como máximo una confirmación.

Regresiones de auth/UI/portal/revisión/evaluación y logout pertinentes; tsc, lint/formato focal y build sobre código final. Esperar a que toda verificación termine y detener runtimes propios de prueba antes de un revisor fresco independiente. Clasificar limitaciones/preexistentes y casos omitidos por separado. No repetir suites globales de demos ni comandos pesados ya aprobados sin motivo.

Actualizar este Report y Notion 09/12/13/14 de forma aditiva y concreta, distinguiendo implementado/comprobado de propuesto/pendiente, sin adjuntar secretos, datos locales o material de instrumentos.

## [S3] Fuera de alcance y continuidad

Nuevos instrumentos, proceso B, banco público, publicación, contacto intermediado, recuperación, correo, OCR/IA real, cálculos PPA, tiempos/expiración, fórmula global, baremos, consentimiento institucional y nuevos permisos siguen pendientes. No se trasladan promesas del export ni se consideran hallazgos F3 resueltos por este corte. Se conserva original y ZIP de Figma y todos los datos/roles/expediente legacy.

## Tasks

- [x] T1: Inspección de export/Notion y baseline — aceptación: inventario, límites, hashes y capturas antes inspeccionadas; bandeja móvil recapturada estable para comparación equivalente.
- [x] T2: Landing y acceso — aceptación: superficies Figma adaptadas con formularios reales y sin sidebar pública o funciones simuladas (covers: S2.1, S2.2, S2.5; depends: T1).
- [x] T3: Shell por capacidades — aceptación: navegación actual, cuenta/salida y drawer móvil con teclado/foco comprobados, sin cambiar datos o flujos (covers: S2.3, S2.4; depends: T1).
- [x] T4: Verificación agrupada — aceptación: tipos/lint/formato/build y regresiones; confirmación focal del último CSS, navegador aislado, capturas antes/después inspeccionadas y desarrollo intacto (covers: S2.6; depends: T2, T3).
- [x] T5: Revisión independiente y cierre — aceptación: criterios revisados tras verificación, P2 resuelto y confirmado SHIP; Report/Notion actuales con evidencia real y limitaciones; sin commit/push (depends: T4).

## Journey log

- Acceso a píxeles: los visores sólo devolvían texto. La capacidad efímera del modelo de esta instancia permitió inspeccionar PNG; se detectó referencia mal etiquetada y baseline móvil todavía cargando. No se certificó inspección a partir del texto del visor.
- La copia auxiliar del baseline necesitó CHANGELOG.md importado por la plantilla y PowerShell 7 explícito. Se conservaron intentos fallidos; ninguno justificó modificar la aplicación.
- Corrección de integración: el layout anterior restablecía overflow del body; el marco nuevo heredaba overflow-x hidden global. Se restauró sólo bajo body:has(.pilot-frame); luego 19 regresiones, lint/formato y tsc/build pasaron.
- Harness: se añadieron esperas de transición/medición del drawer; las operaciones de revisión vuelven a ancho desktop después de sus capturas móviles, para no buscar una pestaña fuera del área visible. No se modificó la lógica de negocio para hacer pasar el harness. Recorrido completo final: PASS.
- Corrección de contraste derivada de la inspección: hover AntD del cierre tomaba color de tema claro sobre drawer azul. Se preservó blanco en hover/focus-visible/active. La medición de teclado mostró luego outline rgb(173,92,83), aunque el icono ya era blanco: se reforzó sólo el selector del cierre para vencer la especificidad de AntD. La nueva medición confirmó foco visible, contorno blanco sólido de 3 px y fondo #35405e. Los fallos posteriores del harness se registran por separado del contraste, sin atribuirlos a una etiqueta de subphase desactualizada.
- Revisión independiente: comparación literal del pathname discrepaba con el router al recibir barra final. Se añadieron cuatro regresiones que fallaron antes del cambio, se usó matchPath de la dependencia instalada y aprobaron los 14 tests del shell, lint/formato y build final. No se amplió a nuevos alias, autenticación o recapturas.
