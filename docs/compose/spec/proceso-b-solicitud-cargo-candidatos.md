---
feature: proceso-b-solicitud-cargo-candidatos
status: delivered
updated: 2026-11-13
source: feat/talento-piloto
---

# Proceso B · solicitud de servicio, descripción del cargo y candidatos vinculados

## Report

**Qué se construyó** — El primer recorrido real del proceso B sobre la base existente: solicitud inicial sin cuenta y gestión continua mediante cuentas personales vinculadas a una empresa. El alta pública emite un **folio** y un **código mostrado una sola vez** (reutilizable para consultar el resumen mínimo; no es un código de un solo uso). La gestión privada exige sesión Sanctum y vinculación empresarial activa o la capacidad provisional de personal `can_manage_services`. Solicitud, cargo, candidatos e historial persisten en PostgreSQL vía Laravel, con control de versión.

**Verificación ejecutada**

- **Backend consolidado final: 58/58 casos, 1.232 aserciones, exit 0**, incluidos 8 de regresión del proceso A. Focos: cuenta empresarial deshabilitada con sesión abierta y privacidad del creador (2/2, 49 aserciones); PATCH que conserva idiomas omitidos, no agrega historial en un no-op y acepta alta sin idiomas (2/2, 27 aserciones).
- Operación administrativa: PilotAccountCommandTest **7/7, 62 aserciones**, incluyendo capacidad de servicios confirmada, denegación sin confirmación y rechazo de capacidades combinadas.
- **Pint PASS**: tanda de 41 archivos más el foco final de modelo, normalización y la nueva regresión de PATCH. El primer control encontró un import sin usar y dos fines de línea; corregidos y repetidos.
- **Frontend: 86/86 en siete archivos + 8/8 en el foco final de entradas** (94 casos únicos cubiertos entre tandas). Incluye 45 pruebas nuevas de API, formulario y acceso B, ocho de entradas autenticadas y regresiones de portada/login/shell. Se conservaron las aserciones de registro, contraseñas y permisos.
- Chrome, recorrido completo: **8 bloques aprobados**, **24 capturas**, escritorio 1365×950 y móvil 390×844, contra Laravel y PostgreSQL reales de `tecnoweb18b_test`. Alta pública S11-B/C, resumen y confirmación, consulta mínima tras recarga, vinculación por personal, dos responsables compartiendo solicitud, edición de cargo y candidatos, diez actividades ordenadas, 409 y recuperación, empresa ajena denegada por URL/API/ID de candidato, revisor A sin B y desactivación con sesión abierta.
- Chrome, foco final de navegación: **11/11**, ocho capturas adicionales. Inicio y `/registro` llevan a los paneles correctos de responsable y personal B, sin crear solicitudes ni candidatos.
- Ambas ejecuciones de verificación cerraron procesos propios y confirmaron la misma huella de desarrollo antes/después (`8712a880…`). Durante esa fase no se aplicaron migraciones B ni altas en desarrollo; la activación técnica posterior autorizada se registra en el cierre de abajo.
- **Controles finales aprobados:** TypeScript, ESLint con cero warnings y Prettier; build Vite en exit 0 (10.530 módulos). Permanecen advertencias conocidas de dependencias/tamaño de chunk y avisos del entorno sintético jsdom/React Router: no se afirma que se hayan eliminado.

**Evidencia privada persistente:** `C:/Users/marcelo/grupo18b-evidencia-privada/2026-11-13-proceso-b/`. Browser-final, browser-entrypoints e intentos previos separados; resultados, medidas de overflow global y por componente, capturas y huellas. Manifiesto SHA-256 de archivos de código ensayados. Sin credenciales, paquetes, instrumentos ni capturas privadas en Git. El visor sólo devuelve confirmación textual: no se afirma inspección visual de píxeles ni conformidad WCAG integral.

**Correcciones durante la entrega:** consulta pública demasiado amplia y recuento de candidatos; historial interno expuesto a empresas; falsa inferencia de permiso a partir del listado compartido; ausencia de alta empresarial autenticada; tope ocho de actividades y beneficios obligatorios sin respaldo; cláusula de veracidad no acordada; desborde de 6 px en actividades; destino legado incorrecto desde inicio/registro para cuentas B.

**Intentos separados:** cuatro corridas del recorrido completo; sólo la última está aprobada. Errores de selectores/payload del arnés y fallos de infraestructura se separan de los defectos de producto. La confirmación focal de entradas fue una corrida independiente; no sustituye el recorrido completo.

## [S1] Problema

El proceso B no tiene usuarios ni superficie en el piloto y su modelo de datos no existe. Los formularios reales están digitalizados como Word y describen campos concretos (empresa, contacto, especificaciones del puesto, perfil requerido, plazo, y la descripción de funciones con objetivo, actividades y condiciones). Reemplazarlos por campos genéricos de la referencia Figma perdería la trazabilidad con la fuente.

La entrada empresarial acordada es: consultar primero el talento universitario y después solicitar un servicio específico. Como el banco público sigue pendiente, no se simulan perfiles, consultas ni un requisito de haber visitado un número de fichas.

## [S2] Diseño

### S2.1 Correspondencia fuente → campo

Formularios originales en `resources/PROPUESTA CONSULTORA/`. Nada se renombra por estética: cada campo implementado declara su origen.

**S11-B · SOLICITUD DE SERVICIO DE SELECCIÓN 1.docx**

| Origen | Campo implementado |
| --- | --- |
| §1 Nombre de la empresa | `service_requests.company_name` |
| §1 Nombre del solicitante | `service_requests.contact_name` |
| §1 Cargo del solicitante | `service_requests.contact_position` |
| §1 Área / Departamento | `service_requests.contact_area` |
| §1 Correo electrónico | `service_requests.contact_email` |
| §1 Teléfono de contacto | `service_requests.contact_phone` |
| §2 Título exacto del puesto | `service_requests.position_title` |
| §2 Número de vacantes | `service_requests.vacancies` |
| §2 Modalidad de trabajo | `service_requests.modality` (`presencial`, `hibrido`, `remoto`) |
| §2 Tipo de jornada | `service_requests.workday` (`completo`, `medio`, `proyecto`) |
| §2 Ubicación física | `service_requests.location` |
| §2 Rango salarial (opcional) | `salary_currency`, `salary_min`, `salary_max` (todos nullable) |
| §2 Esquema de pago | `service_requests.payment_scheme` (`fijo`, `fijo_comisiones`) |
| §2 Prestaciones y beneficios | `service_requests.benefits` (opcional; vacío no equivale a denegación) |
| §3 Formación académica | `service_requests.required_education` |
| §3 Otros conocimientos específicos | `service_requests.required_knowledge` |
| §3 Tiempo de experiencia mínima | `service_requests.required_experience` |
| §3 Idiomas (idioma + nivel) | `service_requests.languages` (jsonb, `[{language, level}]`, nivel `basico|intermedio|avanzado`) |
| §4 Fecha límite para recibir terna | `service_requests.deadline` |
| §4 Esquema de honorarios | **no implementado** (fuera de alcance del piloto) |
| §4 Garantía de reposición | **no implementado** (fuera de alcance del piloto) |
| §5 Firmas | **no implementadas** (no hay firma electrónica) |

**S11-C · FORMULARIO DE DESCRIPCIÓN DE FUNCIONES.docx**

| Origen | Campo implementado |
| --- | --- |
| §1 Nombre del Puesto | `job_descriptions.position_title` (precargado desde S11-B §2) |
| §1 Área / Departamento | `job_descriptions.area` |
| §1 Reporta a (Jefe Directo) | `job_descriptions.reports_to` |
| §1 Personal a Cargo | `job_descriptions.headcount` (texto: cantidad o «Ninguno») |
| §2 Objetivo general del puesto | `job_descriptions.objective` |
| §3 Actividades y funciones principales | `job_descriptions.activities` (jsonb, lista ordenada editable, sin máximo de ocho) |
| §4 Nivel de estudios / carrera | `job_descriptions.required_education` |
| §4 Conocimientos técnicos / software | `job_descriptions.required_knowledge` |
| §4 Experiencia previa mínima | `job_descriptions.required_experience` |
| §5 Beneficios de ley / prestaciones superiores | **unificados** en `service_requests.benefits`; no se duplica el campo |
| §6 Modalidad y horario | `job_descriptions.work_schedule` |
| §6 Disponibilidad para viajar | `job_descriptions.travel` (`no`, `ocasional`, `constante`) |
| §6 Ambiente / esfuerzo físico | `job_descriptions.work_environment` |

Decisiones de correspondencia: los campos de formación, conocimientos y experiencia se mantienen en ambos bloques con su procedencia: requisitos de la solicitud S11-B y descripción detallada S11-C. No se sobrescriben entre sí. Honorarios, garantías y firmas quedan fuera; el plazo es una fecha declarada, sin cálculo de terna. Los ocho renglones de actividades del Word son una presentación del papel, no un límite: Notion 07/08 prohíben expresamente imponer ese máximo. Las validaciones de integridad de este corte son técnicas y provisionales, no obligatoriedad institucional.

Fuentes contrastadas: Notion 07 (recorrido B y separaciones), 08 (B01, B02 y B03) y 14 (entrada empresarial banco → servicio específico y confirmación separada). La decisión posterior de Marcelo incorpora cuentas para la gestión continua, conservando el alta inicial sin cuenta. No se atribuye esa decisión a Administración.

### S2.2 Modelo de datos

- `companies`: la organización dueña de solicitudes y cargos. `name`, `legal_name` opcional, `contact_email` corporativo declarado, `status` (`active`, `inactive`), `version`, marcas de tiempo.
- `company_users`: vinculación explícita entre un `users` existente y una `companies`. `role` (`hr_manager`), `status` (`active`, `inactive`), `linked_by_user_id`, `linked_at`, `disabled_at`. Índice único `(company_id, user_id)`. **No se vincula por nombre, correo ni dominio**: sólo por operación administrativa.
- `service_requests`: identidad propia (`id` uuid), `folio` único legible (`B-AAAA-000N`), **`company_id` nullable** (una solicitud pública nace sin empresa), `status` (`submitted`, `in_review`, `linked`), los campos de S2.1, `access_code_hash`, `created_by_user_id` nullable (actor del historial), `version`, marcas de tiempo.
- `job_descriptions`: 1:1 con la solicitud (`service_request_id` único), los campos de S11-C.
- `service_candidates`: varias por solicitud — `full_name`, `contact_email`, `contact_phone`, `notes`, `version`, marcas de tiempo. **No** exige ser titulado UAGRM, no crea cuenta y no publica nada en el proceso A.
- `service_request_events`: historial append-only (`action`, `version`, `actor_user_id` nullable, `actor_kind` (`company_user`, `staff`, `public`), `changes` jsonb). La vinculación de la solicitud a una empresa deja evento. La vinculación de miembros conserva `linked_at`, `linked_by_user_id` y `disabled_at`; no se afirma que exista un historial append-only de miembros.

### S2.2.1 Ajuste de alcance: empresa, cuentas personales y autorización por empresa

Decisión técnica de Marcelo para la implementación; **no** es una matriz de permisos aprobada por Administración.

- Se separan tres cosas: **empresa**, **usuario autenticado** (Sanctum, cookies/CSRF, sin autenticación paralela ni selector local de actores) y **vinculación** usuario–empresa con estado y capacidad.
- Una empresa puede tener varios responsables activos, cada uno con sus propias credenciales; dos responsables de la misma empresa trabajan sobre las solicitudes compartidas.
- Ser responsable empresarial **no** concede `can_review_talent`, administración global, acceso al banco privado de instrumentos ni acceso a expedientes universitarios privados.
- La desactivación de la vinculación retira el acceso de inmediato, aunque la sesión siga abierta: la pertenencia se evalúa en cada petición, no al iniciar sesión.
- Alta de empresas y vinculación de responsables: **operación administrativa local explícita** mediante comando seguro (`pilot:company`, patrón `pilot:account`), documentada. Sin pantalla de administración de miembros en este corte, sin invitaciones y sin autorregistro de representación.
- El registro público vigente sigue creando **sólo titulares**.
- Una solicitud pública nace **pendiente de vinculación verificada**: no se atribuye a una empresa existente por nombre, correo o dominio declarado. La vinculación administrativa deja historial.

### S2.2.2 Alcance del folio y del panel empresarial

- **Público**: conocer los servicios y consultar perfiles autorizados del banco (no implementado aún), enviar una consulta inicial sin cuenta.
- **Folio + código**: resumen mínimo y estado de esa solicitud. **No** lista candidatos, no descarga documentos, no consulta informes y no modifica la solicitud.
- **Panel empresarial (cuenta autenticada y vinculación activa)**: crear solicitudes y describir cargos con S11-B/S11-C, listar y consultar las de **su** empresa, editar lo permitido con control de versión, añadir y editar candidatos, consultar el historial pertinente.
- **Personal de la plataforma**: capacidad explícita y provisional para gestionar servicios empresariales. No se reutiliza `can_review_talent` como permiso universal de B.
- El panel empresarial **no** expone observaciones internas, documentos privados ni resultados psicométricos por pertenecer a la empresa.
- El candidato empresarial queda fuera de este corte: no obtiene acceso al panel de Recursos Humanos.

### S2.3 Folio, código de acceso y protección

El folio **no es un secreto**: es un identificador legible. Al confirmar, el sistema devuelve una vez un `access_code` aleatorio; se guarda sólo su hash. La consulta posterior sin cuenta exige **folio + código** (`POST /api/servicios/consulta`), con límite de intentos por IP. Sin ambos, la respuesta es `404` genérico, nunca un mensaje que confirme la existencia del folio. El personal autorizado entra por sesión y capacidad, no por folio.

Allowlist del resumen: folio, estado, nombre declarado de empresa, puesto, vacantes, modalidad, jornada, ubicación, plazo y fechas de creación/actualización. No devuelve contacto, salario, descripción completa, candidatos ni su cantidad, identificadores internos, historial, documentos o informes.

### S2.4 Recorrido

1. Entrada pública de B: se explica que el talento universitario se consulta primero y que el banco público no está disponible; no se simula.
2. Formulario de solicitud (S11-B) → descripción del cargo (S11-C) → **resumen** → confirmación explícita con casilla → `folio` + `access_code` mostrados una vez.
3. Consulta posterior sin cuenta con folio + código (sólo lectura).
4. Bandeja privada del personal (`/personal/servicios`): búsqueda, estado, plazo, vacantes; detalle con solicitud, descripción, candidatos e historial.
5. Edición con `version` (conflicto `409`) e historial; alta y edición de candidatos.

### S2.5 Permisos y límites

Ninguna capacidad nueva se concede a las cuentas existentes. Operaciones por actor:

| Operación | Público | Folio + código | Responsable empresarial (vinculación activa) | Personal de plataforma |
| --- | --- | --- | --- | --- |
| Enviar solicitud + descripción | sí (throttle) | — | sí | — |
| Consultar resumen y estado | — | sí (mínimo) | sí (de su empresa) | sí |
| Listar solicitudes de la empresa | — | no | sí | sí (todas) |
| Editar solicitud/descripción con versión | — | no | sí (de su empresa) | sí |
| Alta y edición de candidatos | — | no | sí (de su empresa) | sí |
| Consultar historial | — | no | sí (el pertinente a su empresa) | sí |
| Vincular solicitud pública a empresa | — | no | no | sí (comando/política) |

La capacidad de gestión de servicios desde el área del personal es **explícita y provisional** (`can_manage_services`), separada de `can_review_talent`. Cada solicitud y cada candidato se autoriza en Laravel por política; ocultar menús no sustituye la autorización del servidor. El alta pública de solicitudes no requiere cuenta y se limita por throttling. No se reutilizan documentos, resultados ni permisos del proceso A.

El alta autenticada (`POST /api/personal/servicios`) deriva la empresa de la vinculación activa; si la cuenta tiene varias, sólo permite elegir entre sus empresas autorizadas. El alta pública conserva `company_id=null`. `GET /api/servicios/acceso` comunica pertenencias propias y capacidad explícita de personal; un `200` del listado compartido no se usa para inferir que un responsable es personal.

Historial empresarial: conserva acción, versión y fecha, pero todos los `changes` internos se entregan vacíos; los eventos de personal no revelan su actor. Para operaciones empresariales se informa sólo el nombre del responsable, no su identificador interno. El personal de servicios conserva la representación completa. No existe una superficie de observaciones internas ni se reutilizan resultados de A.

Operación administrativa local adicional: `pilot:account --services-manager` crea sólo una cuenta NUEVA, con contraseña oculta y confirmación explícita de `can_manage_services`, sin conceder `can_review_talent` ni titularidad. No se ejecutó en desarrollo durante esta entrega. `pilot:company` vincula usuarios ya existentes sin cambiar sus capacidades.

## [S3] Fuera de alcance

- Honorarios, garantía de reposición y firmas del formulario de servicio.
- Banco público de talento universitario, perfiles consultables y requisito de haber visto fichas.
- Perfil ideal/real de habilidades y cualquier fórmula de brechas (siguiente incremento).
- Ranking, ajuste porcentual, límites de candidatos, terna automática, correo y publicación.
- Entrevistas, informes y cualquier decisión de selección.

## Tasks

- [x] T1: Migraciones y modelos de solicitud, descripción y candidatos con folio, versión y eventos (covers: S2.2)
- [x] T2: Alta pública con confirmación explícita, folio y código de acceso (covers: S2.3, S2.4)
- [x] T3: Consulta sin cuenta con folio + código y límite de intentos (covers: S2.3)
- [x] T4: Bandeja y detalle privados con edición versionada e historial (covers: S2.5)
- [x] T5: Alta y edición de candidatos vinculados (covers: S2.2, S2.4)
- [x] T6: Formularios React con los campos de S11-B/S11-C y resumen previo (covers: S2.1, S2.4)
- [x] T7: Verificación en navegador aislado, regresiones, documentación y Notion (covers: S2.5)
- [x] T8: Empresa, vinculación usuario–empresa con estado y evento, y comando administrativo pilot:company (covers: S2.2.1)
- [x] T9: Autorización por empresa en cada solicitud y candidato, y capacidad provisional can_manage_services (covers: S2.2.1, S2.5)
- [x] T10: Panel empresarial autenticado con solicitudes, cargos, candidatos e historial propios (covers: S2.2.2)
- [x] T11: Vinculación de solicitudes públicas a una empresa con historial, y consulta mínima por folio + código (covers: S2.2.2)

## Journey log

- Las fuentes se extrajeron del `.docx` original leyendo `word/document.xml`; los rótulos de la tabla S2.1 son los del formulario, no una paráfrasis del prototipo Figma.
- Se retiró el máximo de ocho actividades al contrastar Notion 07/08: los renglones del papel no fijan un cupo. Salario y beneficios permanecen opcionales.
- La primera pasada frontend tuvo 66 aprobadas y 20 fallidas por montajes sin proveedor de consultas y expectativas anteriores a B. Se conservaron las aserciones de seguridad, se adaptaron los montajes a la aplicación real y la tanda de siete archivos pasó 86/86.
- TypeScript detectó propiedades opcionales en la matriz sintética de capacidades; se corrigió el estrechamiento del tipo, sin modificar permisos.
- El foco de entrada detectó un aviso falso de error durante la resolución de una sesión autenticada. Se restauró el indicador de carga; la prueba distingue el botón cargando del enlace de destino. Resultado final del foco: 8/8.
- La regresión de PATCH reprodujo que una edición de vacantes vaciaba idiomas omitidos. El valor inicial de idiomas pasó al modelo; el PATCH conserva lo no editado y el borrado explícito sigue siendo posible. Se comparan valores de JSONB, no el orden de claves. Foco 2/2 y consolidado 58/58 aprobados.

## Reproducir sin alterar desarrollo

Desde la raíz, con PostgreSQL `tecnoweb18b_test` desechable y dependencias instaladas (no se requieren paquetes privados de instrumentos para B):

```powershell
$reviewState = Join-Path $env:TEMP ('grupo18b-b-' + [guid]::NewGuid().ToString('N') + '.json')
pwsh -NoProfile -File backend/tests/browser/services-runtime.ps1 -Action Start -StatePath $reviewState
pwsh -NoProfile -File backend/tests/browser/services-runtime.ps1 -Action Prepare -StatePath $reviewState
pwsh -NoProfile -File backend/tests/browser/services-runtime.ps1 -Action Run -StatePath $reviewState
pwsh -NoProfile -File backend/tests/browser/services-runtime.ps1 -Action Stop -StatePath $reviewState
```

Si Run falla, ejecutar Stop igualmente para cerrar sólo los procesos propios. Cada Start necesita un archivo de estado nuevo. No correr PHPUnit concurrentemente con el navegador: las suites pueden limpiar únicamente la base de pruebas. Las cuentas del fixture se generan aleatoriamente y sus credenciales quedan en TEMP restringido hasta Stop, que las retira. La huella auditada por el runtime abarca usuarios y tablas de expediente A; no se presenta como hash de toda la base. La conexión y el almacenamiento de todas las escrituras se comprueban mediante las guardas de testing.

Suites desde `backend/`: `php vendor/bin/phpunit --filter Service` y `php vendor/bin/phpunit --filter PilotAccountCommandTest`. El foco adicional de navegación está en `services-entry-flow.cjs`; sus comprobantes se conservan separados del recorrido completo. La entrega funcional inicial quedó local para revisión. El cierre posterior autoriza commit/push y activación técnica incremental, no despliegue ni otro incremento.

## Cierre autorizado · publicación y activación técnica

Commit funcional de código y pruebas: **`ee17c64c2e02baf0b615656944ac867e62d85cf4`**. El commit documental que registra este SHA es posterior; ambos forman parte del cierre normal de `main` y `feat/talento-piloto`, sin reescribir historia. Repositorio privado, sin despliegue.

- Base real: `c1bf7777cca9b78a4eab6530abecceb71facf029`, conservando A05 y sus dos correcciones. Revisión independiente de lectura: ningún bloqueante identificado dentro del alcance inspeccionado. Los 68 hashes del comprobante previo coincidieron con el código local; no se repitieron suites sin cambios funcionales. El auxiliar local `frontend/.tmp-fix.cjs` se conserva fuera de la publicación mediante `.git/info/exclude`.
- Inspección previa: las cuatro migraciones siguientes eran las únicas pendientes; todas las anteriores estaban aplicadas. Se verificó entorno `local`, conexión PostgreSQL y base efectiva `tecnoweb18b`.

Comandos ejecutados desde `backend/` (sin fresh/reset ni fixtures):

```powershell
php artisan migrate:status --no-ansi
php artisan migrate --force --no-interaction --no-ansi --path=database/migrations/2026_11_13_000100_create_service_request_tables.php --path=database/migrations/2026_11_14_000100_create_company_tables.php --path=database/migrations/2026_11_14_000200_add_company_scope_to_service_requests.php --path=database/migrations/2026_11_14_000300_add_can_manage_services_to_users.php
php artisan migrate:status --no-ansi
# Desde la raíz, sólo arranque/salud, sin altas/importaciones/migraciones:
.\dev-local.ps1
```

Resultado: las cuatro migraciones aplicadas; seis tablas empresariales con **cero filas**, `can_manage_services=true` en **cero cuentas**, sin empresas, vínculos, solicitudes, cargos o candidatos creados. La huella de todas las tablas preexistentes (excepto el registro técnico de migraciones y la nueva columna de capacidad) coincidió antes/después: `774beb2090303f5878741eb7f9b581a54c1d6670028b8878960f0c7486fdc7c3`. La columna nueva se comprobó por separado: ninguna concesión.

Salud actual comprobada en Laravel `http://127.0.0.1:8001/api/health` y en el proxy `http://localhost:5173/api/health`: API/base `ok`. La aplicación pública arrancó en Chrome y renderizó el formulario S11-B; no hubo POST/PUT/PATCH/DELETE. El 401 de `/api/auth/me` corresponde al visitante sin sesión, no a un fallo de arranque. El primer lanzamiento quedó sin procesos tras el timeout del ejecutor; se conservó ese intento y se confirmó un arranque desacoplado posterior, sin duplicar servicios existentes.

**Activación técnica no equivale a recorrido autenticado de desarrollo.** No existen vínculos empresariales ni cuentas con capacidad B habilitada. Ese recorrido con cuentas propias sigue pendiente de preparación privada y deliberada. Los comandos exactos y permisos concedidos por cada operación están en README; no se ejecutaron esas altas.

ZIP privado: `C:/Users/marcelo/grupo18b-evidencia-privada/2026-11-13-proceso-b/grupo18b-b-capturas-aprobadas-privado-2026-11-13-v1.zip`, 2.848.364 bytes, SHA-256 `0629965af414ad6b5d4271491e1c5ed8156a5ecb343cf9789ac9dfcfc910ce62`. Contiene 35 archivos (32 PNG, índice HTML autónomo, LEEME y manifiesto). Extracción verificada, 32/32 hashes y 98 enlaces relativos resueltos dentro de la raíz, sin recursos de red. Se conserva la limitación del visor: este paquete facilita revisión humana; no acredita aprobación estética. No se incorpora a Git.
