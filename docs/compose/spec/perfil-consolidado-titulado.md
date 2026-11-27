---
feature: perfil-consolidado-titulado
status: delivered
updated: 2026-11-13
source: feat/talento-piloto
---

# A05 · Perfil interno consolidado del titulado

## Report

**Qué se construyó** — Una superficie interna única, `/personal/inscripciones/:id/perfil`, que reúne en un solo recorrido lo que hasta ahora estaba repartido entre las pestañas del expediente: datos personales y académicos declarados, documentos vigentes con sus versiones anteriores, conclusión documental, revisión académica y revisión del CV separando lo vigente de lo anterior, evaluaciones asignadas y enviadas, resultado bruto de Hábil, Dominós y 16 FP como captura sin calificación, observaciones, próxima acción derivada del estado e historial. No agrega endpoints ni permisos: compone respuestas ya autorizadas de Laravel (`staffDetail`, `historial`, `observaciones` y la lista de evaluaciones del expediente) y se abre desde el expediente de revisión.

**Verificación**

- `src/pilot/profile.test.tsx`: **6/6**. Regresión de vecindad `src/pilot/portal-figma.test.tsx`: **9/9**. Tanda conjunta: **15/15**.
- Prettier, ESLint (`--max-warnings 0`), `tsc --noEmit` y build de Vite: exit 0 sobre el código final.
- Chrome contra Laravel y PostgreSQL de `tecnoweb18b_test`: **22/22 comprobaciones**. Cubre datos y procedencia del catálogo con leyenda de perfil interno, documentos vigentes contra versiones anteriores descargables, revisiones vigentes y anteriores tras la corrección con aviso de CV ausente, perfil actualizado tras corrección y reenvío (versión 22 del expediente), Hábil con resultado bruto y regla, ambas formas del 16 FP y Dominós sin puntuación, un 16 FP pendiente en el lateral, observaciones e historial con autor y versión, ausencias informadas como «No registrado» —nunca cero ni aprobación—, estados vacíos en un expediente accesible al revisor, y rechazo del titular, del anónimo y de los endpoints internos (`403`/`404`/`401`) además del ocultamiento en la interfaz.
- Capturas: 14 PNG privados (siete superficies × escritorio 1365×950 y móvil 390×844) sin desborde horizontal, más dos documentos sintéticos de sustitución. Todo en la carpeta privada persistente, fuera de Git.
- Huella de la base de desarrollo antes y después del arnés: idéntica (`8712a880…`).

**Intentos interrumpidos, no presentados como aprobados**: tres corridas previas se detuvieron por anclaje de pestañas de AntD 6 y por localizadores `has:`/`exact` del propio arnés; sus directorios quedaron separados. La corrida que aprueba las 22 comprobaciones es la del 13/11 con runtime nuevo.

**Comportamiento esperado registrado**: `TalentRegistrationPolicy::review` no incluye `draft`, de modo que el personal recibe `404` ante un borrador del titular. Es el alcance vigente —el titular prepara y luego envía— y no se amplió el permiso; los estados vacíos se comprueban con un expediente ya accesible al revisor.

**Observación cosmética**: los identificadores largos de la regla de corrección se parten a mitad de palabra por `overflow-wrap: anywhere`, que es la guarda que evita el desborde; no se cambió para no invalidar las capturas verificadas.

## [S1] Problema

El personal revisa un expediente recorriendo pestañas separadas: datos, documentos, revisión documental, revisión académica, revisión del CV, pruebas, observaciones e historial. Cada sección responde bien a su propia tarea, pero no existe una lectura consolidada del titulado: para responder «¿qué sabe el sistema de esta persona y qué falta?» hay que abrir varias pestañas y reconstruir mentalmente el estado, la procedencia y la fecha de cada dato.

Notion 09 registra el hueco como **«A05 parcial sin vista consolidada»**. La referencia Figma sí contiene una pantalla de expediente (`RecordWorkspace`), con pestañas, una grilla de datos y un panel lateral de próxima acción, pero no incluye evaluaciones, Dominós, 16 FP ni el resultado bruto, y arrastra piezas no trasladables (actores mock, progreso porcentual inventado, visor OCR simulado y acciones de publicación inexistentes).

## [S2] Diseño

### S2.1 Superficie y composición

Un solo componente React con ruta propia bajo la misma guarda que el resto del área interna (`can_review_talent`), con la composición de la referencia adaptada a Ant Design: encabezado con nombre, titulación, identificador corto del expediente, versión y fecha de actualización; seis pestañas (Resumen, Documentos, Revisiones, Evaluaciones, Observaciones, Historial) y un panel lateral fijo con la próxima acción y enlaces al expediente de revisión. La grilla de datos es una lista de definición con etiqueta y valor que se apila en pantallas angostas, en lugar de una tabla de descripciones que recorta valores largos.

### S2.2 Contenido por sección

- **Resumen**: registro universitario, PPA declarado, titulación y facultad (del catálogo cuando existe), área de interés, contacto, nacimiento, disponibilidad declarada, estado, envío, revisor asignado y procedencia del catálogo, incluida la excepción manual.
- **Documentos**: el vigente por tipo y, aparte, las versiones anteriores conservadas, cada una descargable por su identificador real.
- **Revisiones**: conclusión documental con las versiones de documento consideradas; revisión académica con PPA revisado, PPA declarado al revisar, histórico considerado y aviso cuando el PPA declarado cambió; revisión del CV, incluida la ausencia registrada.
- **Evaluaciones**: instrumento, versión, estado, fechas, respuestas guardadas y ausentes; resultado bruto sólo cuando la versión lo calcula; Dominós y 16 FP rotulados como captura sin calificación.
- **Observaciones** e **Historial**: contenido, autor y fecha en ambos casos.

### S2.3 Vigente, anterior y ausente

Lo vigente se marca con etiqueta y lo anterior se conserva plegado con la leyenda «corresponde a una versión anterior»; cuando el expediente cambió después de la última revisión, la revisión académica avisa que requiere rehacerse. La ausencia se informa como «No registrado», «Sin documentos registrados», «Sin revisión académica vigente» o «Sin pruebas asignadas»: nunca como cero, como aprobación ni como porcentaje.

### S2.4 Próxima acción y procedencia

El panel lateral reutiliza el componente de próxima acción ya usado en el portal, con la variante de personal, y añade sólo dos datos derivados del estado real: requisitos pendientes para el envío y pruebas sin enviar. Cada bloque conserva autor y fecha cuando existen, y los enlaces llevan a las anclas reales del expediente (`#documentos`, `#revision`, `#historial`).

### S2.5 Autorización y límites

La ruta queda dentro de la guarda existente de capacidad; no se creó ningún endpoint, política ni permiso nuevo, y la pantalla no habilita publicación alguna: un aviso explícito recuerda que el perfil es interno y que publicar requiere una autorización separada que no está implementada.

## [S3] Fuera de alcance

- Ranking, porcentajes de avance, diagnóstico, puntuación global, umbrales o reglas de admisión.
- Calificación de Dominós o del 16 FP, y cualquier interpretación de sus respuestas.
- Publicación del perfil, ficha pública, exportación masiva y canal de correo.
- Escritura desde esta vista: las acciones de revisión siguen en el expediente.

## Tasks

- [x] T1: Ruta interna y composición de la vista con guarda existente (covers: S2.1, S2.5)
- [x] T2: Resumen de datos declarados con procedencia del catálogo (covers: S2.2, S2.4)
- [x] T3: Documentos vigentes y versiones anteriores descargables (covers: S2.2, S2.3)
- [x] T4: Revisiones vigentes y anteriores, con aviso de revisión académica vencida (covers: S2.2, S2.3)
- [x] T5: Evaluaciones con resultado bruto de Hábil y captura sin calificación de Dominós y 16 FP (covers: S2.2)
- [x] T6: Observaciones, próxima acción derivada e historial accesible (covers: S2.2, S2.4)
- [x] T7: Verificación en navegador aislado (22/22), regresiones y documentación (covers: S2.5)

## Journey log

- La primera tanda de pruebas falló por abrir pestañas antes de que resolviera la consulta del expediente; se corrigió esperando la pestaña por rol.
- Las aserciones sobre texto con varias interpolaciones se volvieron frágiles; se reemplazaron por coincidencias sobre el nombre de archivo y por la expansión explícita del bloque de versiones anteriores.
