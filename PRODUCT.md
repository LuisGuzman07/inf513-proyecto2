# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Titulado UAGRM — usuario principal del proceso A.** Egresado o titulado de la UAGRM que se postula sin vacante previa. Entra por autoservicio con cuenta propia: la crea en `/registro`, ingresa en `/ingresar`, guarda un borrador o envía su inscripción en `/portal/inscripcion`, carga documentos privados y corrige su expediente cuando recibe una observación. Trabaja desde navegador de escritorio o móvil, sin acompañamiento de personal administrativo. La cuenta y la persona son entidades distintas con vínculo explícito: no se transfieren expedientes antiguos por coincidencia de nombre o correo.

**Personal revisor — usuario secundario.** Miembro del área con la capacidad técnica `can_review_talent`. Consulta la bandeja en `/personal/inscripciones`, abre un expediente, toma la revisión, registra observaciones y concluye la revisión. La habilitación, la toma de revisión y los estados son controles técnicos provisionales, no facultades institucionales de admisión o aprobación.

**Responsable empresarial — proceso B.** Persona con cuenta propia vinculada explícitamente a una empresa activa. Comparte las solicitudes y candidatos de esa empresa con sus otros responsables activos; no representa otras empresas ni obtiene revisión de talento universitario. Una solicitud pública sin cuenta permanece sin empresa atribuida hasta una vinculación verificada por el personal.

**Personal de servicios — proceso B.** Cuenta con `can_manage_services`, capacidad técnica provisional separada de `can_review_talent`. Gestiona solicitudes empresariales y verifica su vinculación; no obtiene facultades del proceso A por esa capacidad. Empresas y responsables se habilitan mediante operaciones administrativas locales explícitas, nunca por coincidencia de nombre, correo o dominio. Esta separación es una decisión técnica de Marcelo, no una matriz institucional aprobada.

## Product Purpose

Sistematizar las herramientas métricas de la selección de personal de la UAGRM, empezando por el proceso A: sustituir una inscripción dispersa o en papel por un expediente privado digital, con autoservicio del titulado, documentos privados versionados, revisión humana trazable y corrección con historial.

El éxito en el estado actual es que el recorrido completo del proceso A funcione sobre datos reales de runtime, no sobre mocks: registro e ingreso reales, borrador recuperable, documentos privados con versiones, envío, bandeja del personal, observación, corrección y reenvío, con la versión obsoleta rechazada y el historial conservando actor y cambios. Sobre esa base ya operan tres instrumentos del piloto: Hábil con resultado bruto, Dominós con captura y envío sin puntuación, y el 16 FP A/B como banco textual de captura. Inscribirse no equivale a publicarse: la admisión, la publicación, las entrevistas, el correo, el OCR y la IA no están implementadas y no deben presentarse como disponibles; tampoco existe calificación para Dominós ni para el 16 FP.

## Positioning

Todo argumento que un producto vecino no podría sostener con verdad:

- **Inscripción interna distinta de publicación.** El expediente vive privado y solo se publicaría tras evaluación y autorización institucional, que hoy no existen. Ningún estado del sistema equivale a admisión.
- **PPA declarado, nunca calculado.** El sistema conserva el índice que declara el titulado; no calcula, no pondera, no fija umbrales y no lo usa como criterio de admisión. No se inventan fórmulas ni rangos.
- **Revisión humana con versiones, no un booleano.** Cada documento y cada cambio conserva versión, actor y fecha, y una edición obsoleta se rechaza en lugar de sobrescribir. El catálogo UAGRM es dato de trabajo congelado por referencia textual, no un criterio de admisión ni de equivalencias.
- **Rastro honesto de lo que todavía no existe.** La interfaz explica lo disponible y lo pendiente sin prometer funciones activas, y las páginas de la plantilla se conservan identificadas como DEMO.

## Operating Context

- Asignatura Tecnología Web de la UAGRM. Proyecto académico de tres integrantes, no remunerado, con fecha límite 15/11/2026. Marcelo aporta los recursos de marca y dirige las decisiones.
- El docente de la asignatura escogerá aproximadamente ocho RF del universo RF01–RF24 y de las líneas A/B/Comunes; ni el conteo ni la selección equivalen a entregables comprometidos. SMTP/POP3 es condición interna de la asignatura, y OCR, IA y correo deberán verificarse como integraciones reales si entran en alcance.
- Notion es la fuente de requisitos en revisión (v1 con 28 filas, v2 con 31 filas), marcada `unverified` y sin aprobación institucional. No es acta firmada ni reemplaza una decisión del usuario.
- Entorno Windows nativo y PowerShell, PostgreSQL, dos runtimes en desarrollo (Vite en 5173, Laravel en 8001) y puertos de prueba separados. La verificación corre en runtime aislado sobre la base `tecnoweb18b_test`; la base de desarrollo `tecnoweb18b` no se reinicia ni se puebla con datos de prueba.
- Los datos de las pruebas son ficticios. Responsabilidades institucionales, consentimiento, verificación de identidad y correo, y conservación de documentos reales siguen pendientes.
- Un solo repositorio Git raíz con `frontend/`, `backend/` y `docs/`. La plantilla Ant Design y el esqueleto Laravel son fuentes externas de solo lectura, con licencia y atribución conservadas.

## Capabilities and Constraints

Implementado y verificado en el piloto del proceso A:

- Registro e ingreso reales con sesión Sanctum SPA y CSRF; el registro público solo habilita al titulado y nunca concede funciones administrativas.
- Borrador incompleto recuperable y envío con la matriz de datos y documentos del contrato. Edición concurrente segura: transacción con bloqueo y conflicto de versión que devuelve 409 sin escritura parcial.
- Documentos privados en el disco `talent_private` (`serve=false`), PDF/JPEG/PNG hasta 10 MiB, foto únicamente JPEG/PNG, descarga solo autorizada, versiones anteriores conservadas y descargables, e historial con versión, actor y cambios.
- Bandeja del personal con búsqueda, filtro por estado y paginación resueltos en el servidor; revisión con observaciones, corrección y reenvío.
- Catálogo UAGRM de trabajo (18 facultades, 121 asociaciones facultad–carrera, `catalog_version=2026-10-07-investigacion-1`) servido por Laravel, con búsqueda sin tildes y excepción manual excepcional que exige revisión del catálogo. Importación idempotente desde `docs/data/catalogo-uagrm.json`, que nunca borra filas referenciadas. La facultad es opcional.
- Chequeo técnico separado en `/estado-tecnico` contra `GET /api/health`, sin autenticación ni datos mock de la plantilla.
- El cierre de sesión elimina caché y borradores de la instancia.
- Banco privado de instrumentos versionado e idempotente, con asignación por el revisor del expediente y trazas de conformidad no institucional.
- **¿Es usted muy hábil?** operativo con 15 ejercicios A–H: guardado, recuperación, envío congelado y **resultado bruto** de un punto por acierto, visible sólo para el personal autorizado.
- **Dominós** con 48 ejercicios de dos mitades habilitado para **captura y envío sin puntuación**: ficha vertical (superior = primera cifra literal del Word; inferior = segunda), cero distinto de ausencia, parciales informados aparte y consulta de lo enviado por el revisor.
- **16 FP formas A y B** importadas como banco textual separado: 187 reactivos por forma con su numeración y tres opciones a/b/c, captura de una alternativa o ausencia, guardado y recuperación, envío congelado y consulta del revisor **sin calificación**. Sin claves, pesos, baremos ni tablas de estenes.
- **Perfil interno consolidado (A05)** en `/personal/inscripciones/:id/perfil`, sólo para el personal con capacidad de revisión: reúne datos declarados, documentos vigentes con sus versiones anteriores, conclusión documental, revisiones académica y de CV separando lo vigente de lo anterior, evaluaciones con resultado bruto de Hábil y captura sin calificación de Dominós y del 16 FP, observaciones, próxima acción derivada del estado e historial. Es interno: no publica el perfil ni agrega permisos.

Verificado frente a implementado: las pruebas automatizadas cubren importación, contenido, autorización, guardado/recarga, ausencias, congelamiento y ausencia de claves en el DTO del titular, con compatibilidad entre los tres instrumentos. El recorrido completo del **16 FP A/B** —asignación, instrucciones, captura, guardado, recarga y recuperación, ausencias confirmadas, envío congelado, aislamiento entre cuentas y consulta del revisor— se comprobó en Chrome contra la aplicación real en el entorno aislado `tecnoweb18b_test`, con las 187 preguntas de cada forma, en escritorio y en móvil. La prueba manual en desarrollo con cuentas propias sigue pendiente para Dominós y para el 16 FP, y la corrección psicométrica de ambos sigue sin reglas aprobadas.

Primer incremento del proceso B implementado (estado de cierre y comprobantes en `docs/compose/spec/proceso-b-solicitud-cargo-candidatos.md`):

Referencia funcional: `ee17c64c2e02baf0b615656944ac867e62d85cf4` (código y pruebas; el commit documental de cierre puede ser posterior). Las cuentas empresariales son una decisión técnica de Marcelo para la implementación, no aprobación institucional. Activación técnica local sin datos B ni capacidades concedidas; uso autenticado con cuentas propias de desarrollo pendiente.

- Solicitud inicial sin cuenta con los campos S11-B/S11-C, resumen y confirmación explícita, folio persistente y código mostrado una sola vez. La consulta por folio y código es de sólo lectura y devuelve únicamente resumen mínimo y estado.
- Empresa separada de la cuenta personal; varios responsables activos comparten solicitudes, cargos y candidatos de su empresa. La pertenencia se comprueba en Laravel en cada petición y una baja retira el acceso con sesión abierta. El alta pública nunca atribuye automáticamente una empresa.
- Gestión de solicitudes y candidatos con control de versión, conflicto 409 e historial pertinente. No exige título UAGRM ni transfiere permisos, resultados o publicación del proceso A.
- Bandeja privada del personal con `can_manage_services`, vinculación verificada de solicitudes y operación administrativa local segura. El panel empresarial no accede a observaciones internas, documentos o resultados psicométricos.
- Recorrido comprobado en Chrome contra Laravel y PostgreSQL de `tecnoweb18b_test`, en escritorio y móvil. En el cierre autorizado posterior se aplicaron sólo las cuatro migraciones incrementales B a `tecnoweb18b`: tablas empresariales vacías, ninguna cuenta vinculada ni capacidad nueva concedida. Salud, proxy React y arranque público comprobados; el recorrido empresarial autenticado con cuentas propias de desarrollo sigue pendiente de su preparación privada. Sin despliegue.

Previsto y NO implementado:

- Del proceso B siguen fuera de este corte: invitaciones, acceso propio del candidato, administración de miembros desde la interfaz, perfil ideal/real de habilidades, evaluaciones de candidatos e informes. La solicitud inicial sin cuenta no habilita su gestión privada: esa gestión exige autenticación y autorización empresarial.
- Entrevistas (C09), publicación y perfiles públicos, PPA calculado, umbrales, informes comparativos, OCR (C04/RF13), IA (RF21/B04/B08) y el canal de operaciones por correo (C12/RF24, incluidos los ocho RF que el docente seleccione).
- Puntuación de Dominós y del 16 FP, baremos, estenes, tiempos, penalizaciones e IQ/CI: sin reglas aprobadas, no se implementan ni se simulan.

Restricciones y decisiones abiertas:

- Prohibido inventar PPA, fórmulas, instrumentos, documentos obligatorios, permisos o correspondencias facultad–carrera. Los criterios PPA, la obligatoriedad documental, los instrumentos completos y los permisos definitivos están pendientes.
- La aprobación institucional del catálogo UAGRM y la equivalencia entre títulos están pendientes.
- La coordinación entre pestañas sigue como brecha documentada; la sincronización de sesión entre pestañas está explícitamente fuera de alcance.
- CORS mínimo GET/OPTIONS sin cookies ni wildcard, admitiendo el origen de `FRONTEND_URL`; no constituye una política de autenticación futura. `APP_DEBUG=false` y errores normalizados a JSON genérico.
- Sin actualización masiva de dependencias: pnpm 9.15.4 y `pnpm-lock.yaml` fijados, y Laravel resuelto en lockfile con Sanctum como única incorporación.
- Sin commit, push ni publicación sin solicitud explícita del usuario.

## Brand Commitments

- Nombre y título académico completo que debe conservarse: «Sistematización de Herramientas Métricas para la Selección de Personal», identificado con la UAGRM y la carrera de Administración de Empresas.
- Recursos aportados por Marcelo, conservados sin modificar: `uagrm-logo.jpg` (820×800), `uagrm-banner.png` (707×88, con alfa), `adm-empresas-logo.jpg` (1253×1253), `adm-empresas-edificio.jpg` (1280×853), `fcee-logo.jpg` (1080×1080) y `ficct-logo.png` (687×892, con alfa), además de la fotografía institucional. FCEE y FICCT se conservan sin atribuirles una participación institucional no definida.
- Lato Latin 400/700 servida localmente bajo SIL OFL 1.1, con licencia y atribución conservadas junto a los archivos.
- **La identidad visual es provisional y no vinculante**, confirmado por el usuario. La paleta UAGRM (rojo `#880000`, azul `#2A3964`), la superficie, la composición y la densidad son una dirección técnica de trabajo, no un manual oficial ni una aprobación institucional. Un rediseño posterior puede reemplazar el mundo visual; los recursos aportados y sus licencias se conservan en cualquier caso.
- Las páginas originales de la plantilla se conservan etiquetadas como DEMO — referencia de plantilla, incluido el login ficticio. No son funcionalidades entregadas, permisos reales ni integraciones verificadas, y no deben recibir datos personales reales.

## Evidence on Hand

- Documentación propia en `docs/`: contexto y alcance (`01-contexto.md`), decisiones y stack (`02-base-tecnica.md`), alcance de inspección del semestre anterior (`03-referencia-anterior.md`), comandos ejecutados y resultados (`04-verificacion.md`), fuentes Notion y estado de requisitos (`05-fuentes-notion.md`) y preparación de Windows (`06-preparacion-windows.md`).
- Contratos con Report, verificación y Tasks en `docs/compose/spec/`: `inscripcion-talento-expediente-privado.md`, `catalogo-uagrm-inscripcion-titulado.md`, `interfaz-institucional-proceso-a.md`, `identidad-visual-institucional.md`, `conclusion-revision-documental-academica-cv.md`, `evaluacion-es-usted-muy-habil.md`, `dominos-banco-privado-dos-mitades.md` y `fp16-banco-textual-captura.md`.
- Catálogo de trabajo y su esquema: `docs/data/catalogo-uagrm.json` (`schema_version=1.0`).
- Evidencia de navegador con capturas de escritorio y móvil, manifiestos, índices comparativos y paquetes ZIP para revisión visual en `docs/verification-captures/`.
- Fotografía institucional real aportada por Marcelo en `frontend/public`, usada en inicio y acceso.

Ausencias que el trabajo futuro NO debe rellenar con ficción: no hay testimonios, clientes, métricas de producto, precios, casos de estudio ni cifras institucionales oficiales, y no existe aprobación de Administración. La aprobación estética de los recursos de marca corresponde a Marcelo, no al agente. Los datos de las pruebas son ficticios y viven únicamente en `tecnoweb18b_test`.

## Product Principles

1. **Inscribirse no es publicarse.** Ninguna superficie sugiere admisión, aprobación, evaluación ni publicación, y cada estado se nombra como el control técnico provisional que es.
2. **Nada se inventa.** Sin PPA, fórmulas, instrumentos, obligatoriedad documental, permisos ni identidad institucional no aportados; lo pendiente se registra como pendiente tanto en el producto como en su documentación.
3. **El expediente es privado y trazable.** Documentos, versiones, actor e historial se conservan; una edición obsoleta se rechaza y nunca sobrescribe.
4. **La revisión es humana.** El sistema no sustituye la evaluación por un booleano ni por un cálculo: conserva el rastro para que una persona decida.
5. **Evidencia real, no simulada.** Las pruebas usan runtime y base aislados con datos ficticios; un mock, un health o un puerto no acreditan una integración, y el fallo preexistente se conserva con su nombre en lugar de reetiquetarse.

## Accessibility & Inclusion

Estándar requerido, declarado por el usuario: **WCAG 2.1 nivel AA**. El piloto solo aporta evidencia parcial —foco visible, navegación por teclado y contraste calculado en las capturas— sin medirse aún contra el estándar ni declarar conformidad. La verificación futura debe medirse contra WCAG 2.1 AA y no debe afirmar un cumplimiento que no haya comprobado.
