---
name: Sistematización de Herramientas Métricas para la Selección de Personal
description: Expediente oficial verificable, construido como producto contemporáneo — UAGRM, Administración de Empresas
colors:
  primary: "#880000"
  blue: "#2A3964"
  info-surface: "#EEF4FC"
  info-border: "#C6D5EA"
  surface: "#FFFFFF"
  background: "#F5F6F8"
  text: "#202837"
  secondary: "#526075"
  border: "#DCE1E8"
typography:
  display:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.35
  title:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  banner: "4px"
  chip: "6px"
  default: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.default}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "#941C18"
    textColor: "{colors.surface}"
    rounded: "{rounded.default}"
    height: "40px"
  button-primary-active:
    backgroundColor: "#610003"
    textColor: "{colors.surface}"
    rounded: "{rounded.default}"
    height: "40px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.default}"
    height: "40px"
    padding: "0 12px"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.default}"
    padding: "24px"
  card-document:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.default}"
    padding: "20px"
  app-sidebar:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
    width: "200px"
  nav-item-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.blue}"
    rounded: "{rounded.default}"
  info-notice:
    backgroundColor: "{colors.info-surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.default}"
  table-header:
    backgroundColor: "{colors.background}"
    textColor: "{colors.blue}"
---

# Design System: Sistematización de Herramientas Métricas para la Selección de Personal

## Overview

**Creative North Star: "El Expediente Oficial"**

El sistema se comporta como papelería oficial verificable: una franja, un sello, una versión, un historial. Lo que se ve en pantalla debe poder defenderse como constancia. De ahí que la estructura sea explícita — cabeceras que declaran, secciones que separan, versiones que se numeran — y que el color se use como señal administrativa, no como decoración: el rojo sella, el azul estructura, el resto es tinta sobre papel claro.

Ese rigor documental se ejecuta como **producto contemporáneo**, no como papelería anticuada. La densidad es alta donde hay datos (tablas, expedientes, historiales) y el aire es generoso donde hay decisiones (acceso, envío, corrección, estados vacíos). La jerarquía se construye con tamaño y peso de una sola familia tipográfica, y la separación con bordes finos y fondos apenas distintos, no con marcos ni ornamento. Una sola familia, dos acentos, ningún adorno: el sistema es sobrio porque tiene que ser creíble, no porque tenga que ser aburrido.

**Rechazos confirmados.** Nada de papelería anticuada, tipografía condensada ni una interfaz enteramente gris. Nada de degradados de producto de consumo, tableros gamificados ni ilustración decorativa. Un aviso nunca se resuelve bajando la saturación hasta volverlo ilegible.

Este mundo es **provisional**: PRODUCT.md lo registra como dirección técnica de trabajo y no como manual oficial ni aprobación institucional. Un rediseño posterior puede reemplazarlo; los recursos aportados (escudo, marca horizontal, logotipo de carrera, fotografía) y sus licencias se conservan en cualquier caso.

**Key Characteristics:**
- Dos acentos con reparto estricto: rojo institucional como sello, azul marino académico como estructura.
- Una sola familia tipográfica (Lato 400/700 servida localmente), jerarquía solo por tamaño y peso.
- Superficies planas con una sombra ambiental tenue; la separación real la hacen los bordes de 1 px.
- Densidad de expediente: metadatos compactos, tablas de servidor, historial completo y siempre visible.
- Estructura declarativa: franjas y reglas de 3–4 px que marcan jerarquía sin decorar.
- Foco siempre visible: anillo de 3 px en azul marino, separado 3 px del control.

## Colors

Una paleta de dos acentos institucionales sobre papel claro: el rojo firma, el azul sostiene, los neutros llevan el contenido.

### Primary
- **Rojo Institucional Profundo** (`#880000`): el sello. Es `colorPrimary` y `colorLink`, la franja superior de 4 px de la cabecera y de la tarjeta de inicio, y el relleno de la acción principal. Su escasez es el punto: nunca cubre una región mayor que una franja o un botón.

### Secondary
- **Azul Marino Académico** (`#2A3964`): la estructura. Es `colorInfo`, el fondo del sidebar de personal, el respaldo de la marca horizontal y de la fotografía, la regla estructural de 3 px a la izquierda de grupos y tarjetas de documento, el color del encabezado de tabla, el texto de marca y el anillo de foco. Es el color dominante del sistema, y lo es precisamente porque no compite con el rojo.

### Tertiary
- **Azul Informativo Claro** (`#EEF4FC`) con borde **`#C6D5EA`**: exclusivo de avisos informativos. Existe porque un `colorInfo` oscuro hace que antd derive un gris apagado que se lee como bloque deshabilitado; el aviso informativo tiene que leerse como información, no como deshabilitado. Las advertencias y los errores conservan la semántica de antd y no usan este par.

### Neutral
- **Sustrato Blanco** (`#FFFFFF`): superficie de tarjetas, campos y paneles.
- **Niebla de Fondo** (`#F5F6F8`): fondo de layout, encabezado de tabla, contexto resaltado y fila hover. La diferencia con el sustrato es mínima a propósito.
- **Tinta de Registro** (`#202837`): texto principal.
- **Gris Azulado de Apoyo** (`#526075`): texto secundario, etiquetas de metadatos, pie de página.
- **Borde de Papel** (`#DCE1E8`): bordes y separadores de 1 px. Es el recurso principal de separación del sistema.

### Named Rules
**The Two-Accent Rule.** El rojo no cubre más que una franja o la acción principal; el azul marino carga toda la estructura. Ninguno de los dos se diluye en degradados ni se usa como relleno de superficie grande.

**The Legible-Notice Rule.** Un aviso informativo usa `#EEF4FC` con borde `#C6D5EA` y conserva la tinta `#202837`. Nunca se comunica información bajando el contraste: si algo importa, se sostiene con color y borde propios.

## Typography

**Display Font:** Lato (with `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif)
**Body Font:** Lato — la misma familia; no hay una segunda familia ornamental.

**Character:** Humanista, neutra y muy legible en tamaños de datos. La jerarquía se construye exclusivamente con tamaño y peso, nunca con una segunda familia ni con condensación; los dos pesos servidos, 400 y 700, cubren cuerpo y énfasis. El subconjunto local cubre los caracteres del español.

### Hierarchy
- **Display** (700, 32 px, 1.25): títulos de página y título académico. Baja a **24 px / 1.35** por debajo de 768 px.
- **Headline** (700, 24 px, 1.35): encabezados de tarea, títulos de tarjeta de inicio y de acceso. Es también el tamaño de Display en móvil.
- **Title** (700, 20 px, 1.35): encabezados de grupo del portal y títulos de tarjeta de documento; la marca compacta usa 20 px con `letter-spacing: 0.04em`.
- **Body** (400, 16 px, 1.5): párrafos, valores de descripción, opciones. Línea de lectura larga contenida por ancho máximo en lugar de por columna estrecha.
- **Label** (400, 14 px, 1.5): etiquetas de metadatos, ayudas de campo, pie de página, subtítulo de marca. En móvil la copia de marca baja a 12 px.

Los encabezados resuelven al peso 700: antd pide 600 por defecto y el navegador elige la cara más cercana disponible, que es la única negrita servida.

### Named Rules
**The Single Voice Rule.** Una sola familia para todo, incluida la marca. La jerarquía se logra con tamaño y peso; no se añade una segunda familia para "dar carácter".

**The No-Condensation Rule.** La tipografía nunca se condensa ni se comprime para ganar ancho. Cuando algo no cabe, se reduce el contenido o se permite el salto de línea entre palabras.

## Layout

Modelo de aplicación con navegación fija y un único contenedor que desplaza:

- **Shell**: sidebar fijo a la izquierda, 200 px (`64 px` colapsado), fuera del flujo; cabecera, contenido y pie se separan con `margin-inline-start`. La cabecera mide `min-height: 80px` con `padding: 16px 24px` y es un hermano estático, no superpuesto. El contenido es **el único contenedor que desplaza**, con `padding: 24px 32px` en escritorio y `16px` por debajo de 768 px.
- **Anchos**: el contenedor de expediente y bandeja llega a **1320 px** y ocupa el ancho disponible; el marco de acceso a **1200 px**; la tarjeta de acceso a **520 px**; la copia de inicio se contiene a **960 px**; el título académico de cabecera a **650 px**.
- **Ritmo vertical**: pilas de 24 px entre bloques principales (`24px`), y **16 px** cuando la pantalla es compacta (por debajo de 576 px) o cuando la pila es de documentos. Separadores internos de 12 px entre metadatos de un mismo bloque.
- **Filtros de bandeja**: búsqueda elástica `flex: 1 1 280px`, filtro de estado `flex: 0 1 240px`, alineados por su base; por debajo de 576 px cada uno ocupa el 100 % del ancho.
- **Una sola presentación responsive**: la bandeja decide entre tabla y tarjetas con `Grid.useBreakpoint()`, y renderiza **una** de las dos, nunca ambas. La tabla conserva desplazamiento horizontal interno por debajo de ese umbral; el ancho del documento nunca desborda el layout — cuando algo es más largo que su columna, se parte, no se estira la página.
- **Umbrales observados**: 576 px (etiquetas de descripción con ancho mínimo 148 px, ficha de revisión a una columna), 768 px (densidad móvil, Display a 24 px), 992 px (`screens.lg`, donde la marca horizontal reemplaza al símbolo) y 1200 px (marco de acceso).

### Named Rules
**The One-Scroller Rule.** La cabecera, la navegación y el pie no se desplazan: solo el contenido lo hace. Un desplazamiento nunca tapa un título ni un control, y por eso los anclajes reservan un pequeño `scroll-padding-top` / `scroll-margin-top` en lugar de compensar una cabecera flotante que no existe.

**The One-Markup Rule.** Un mismo conjunto de marcado sirve para todos los anchos; el layout se reorganiza por CSS y por un único `useBreakpoint()`, no duplicando el DOM.

## Elevation & Depth

El sistema es **plano con una sombra tenue**. La profundidad no es un recurso expresivo por defecto: la jerarquía la sostienen el borde de 1 px `#DCE1E8` y la diferencia mínima entre `#FFFFFF` y `#F5F6F8`. La única sombra del sistema es ambiental y casi imperceptible, y existe para que una tarjeta se lea como objeto sobre el fondo, no para dramatizar.

### Shadow Vocabulary
- **Ambient card** (`box-shadow: rgba(140, 152, 164, 0.075) 0 6px 12px 0` light / `rgba(0, 0, 0, 0.2) 0 6px 12px 0` dark): la sombra base de las tarjetas. Es deliberadamente débil.
- **Structural rule** (borde, no sombra): regla de 3 px en `#2A3964` a la izquierda de grupos y tarjetas de documento, 3 px arriba de los paneles de revisión y 4 px arriba de la tarjeta de inicio y de la cabecera en rojo. Esta es la señal de jerarquía real del sistema.

### Named Rules
**The Flat-By-Default Rule.** Las superficies reposan planas. La profundidad aparece como respuesta a un estado o como regla estructural, nunca como decoración permanente.

**The Faint-Shadow Rule.** Solo existe la sombra ambiental de tarjeta. Añadir una segunda sombra o subir su opacidad rompe la calma del sistema: si algo necesita destacar, se destaca con estructura o con color, no con profundidad.

**The Reduced-Motion Rule.** Todo movimiento respeta `prefers-reduced-motion`. La accesibilidad declarada del producto es WCAG 2.1 AA, así que el movimiento es una mejora, nunca la única señal de un estado.

## Shapes

Lenguaje de esquinas suaves y constantes, con bordes finos:

- **Radio por defecto: 8 px** en tarjetas, campos, botones y elementos de menú. Es el radio del sistema.
- **Radio de chip: 6 px** para respaldos pequeños — la marca horizontal sobre azul y la tabla de ficha de revisión.
- **Radio de respaldo: 4 px** para el respaldo azul de la marca institucional.
- **Aristas rectas, esquinas suaves.** No hay formas de píldora propias; si aparecen, vienen de un componente de antd.
- **Bordes de 1 px** en `#DCE1E8` para separar, tanto en contenedores como en encabezados de tabla y bloques de historial.
- **Recorte** solo donde cumple una función: el marco de acceso y el panel de fotografía recortan para que el contenido no sangre fuera de la esquina redondeada.
- **Medios**: los logotipos usan `object-fit: contain` con dimensiones explícitas y nunca se recolorean ni recortan; las fotografías usan `object-fit: cover` con `object-position: 50% 48%`. Ningún mapa de bits se estira: `contain` y `cover` nunca deforman, solo `fill` lo haría.

## Components

### Buttons
- **Shape:** esquinas suaves de 8 px (radio del sistema), alto de control 40 px, relleno horizontal 16 px.
- **Primary:** relleno en Rojo Institucional Profundo `#880000` con texto en `#FFFFFF`; es la única acción que lleva el sello, y por eso una pantalla rara vez tiene más de una.
- **Hover / Focus:** los estados derivados del rojo semilla son `#941C18` al pasar el cursor y `#610003` al presionar; el botón de tipo enlace aclara a `#A13B33`. El sistema se inclina a un comportamiento **táctil y expresivo** en los estados: cambios de color perceptibles, sombra o desplazamiento visible al pasar el cursor y transiciones de 0.2–0.25 s. Hoy lo implementado es más contenido — las tarjetas transicionan `box-shadow 0.25s ease, transform 0.2s ease` y responden con `translateY(-2px)` — de modo que esa expresividad es la dirección elegida para el trabajo nuevo, no una descripción de lo ya construido. El foco es el anillo de 3 px en azul marino, nunca una simple variación de color.
- **Link:** los botones de tipo enlace usan el rojo institucional, nunca el azul de información por defecto de antd, para no caer bajo el umbral de contraste.
- **Disabled / Secondary:** se apoyan en los tokens de antd sin re-estilizar.

### Chips
- **Style:** el respaldo de la marca horizontal es un chip azul marino con 8 px de relleno vertical y 12 px horizontal, radio 6 px.
- **State:** los `Tag` de antd conservan sus variantes y no se re-estilizan.

### Cards / Containers
- **Corner Style:** 8 px.
- **Background:** `#FFFFFF` sobre fondo `#F5F6F8`.
- **Shadow Strategy:** únicamente la sombra ambiental de tarjeta; ver Elevation & Depth.
- **Border:** 1 px `#DCE1E8` cuando la tarjeta necesita separarse de otra tarjeta, más la regla estructural de 3 px en azul marino en grupos del portal, tarjetas de documento y paneles de revisión.
- **Internal Padding:** 24 px por defecto; **20 px** en tarjetas de documento; **16 px** en móvil.

### Inputs / Fields
- **Style:** superficie blanca, borde 1 px `#DCE1E8`, radio 8 px, alto 40 px. Las etiquetas permiten salto de línea (`line-height: 1.5`) para que un nombre largo no empuje el layout.
- **Focus:** anillo de **3 px en `#2A3964` separado 3 px** del control (`outline-offset: 3px`). El foco es siempre visible, nunca se retira con `outline: none`.
- **Error / Disabled:** heredan la semántica de antd. Los mensajes de validación deben permanecer alcanzables y legibles, sin recortarse contra el borde del área desplazable.

### Navigation
- **Sidebar:** azul marino `#2A3964` de fondo y texto en blanco; el elemento activo y el hover invierten a fondo blanco con texto azul, y el activo añade peso 700. La marca del pie de sidebar se lee en blanco.
- **Header:** fondo claro con borde inferior de 1 px y la franja superior de 4 px en rojo institucional. En `screens.lg` y superiores muestra la marca horizontal (707×88) dentro de un respaldo azul a 36 px de alto; por debajo usa el símbolo cuadrado junto al nombre tipográfico `UAGRM` / `Administración de Empresas`. El umbral es `lg`, no `md`, porque la marca horizontal no debe forzarse en una cabecera estrecha.
- **Móvil:** el nombre de cuenta se oculta y el avatar conserva su marca; la navegación no debe empujar el contenido ni provocar desborde horizontal global.

### Tables
- **Head:** fondo `#F5F6F8` con texto en azul marino; 16 px de relleno vertical y horizontal; hover de fila en `#F5F6F8`.
- **Behavior:** el desplazamiento horizontal vive dentro de la tabla, y las celdas parten palabras largas en lugar de ensanchar la página.
- **Narrow widths:** se reemplaza por tarjetas con nombre, estado, fecha y una acción **Abrir expediente** visible sin desplazar; misma consulta, mismo filtro y misma paginación de servidor.

### Signature: el expediente y su revisión
- **Ficha de revisión:** tabla de definiciones con borde de 1 px y radio 6 px, columnas `minmax(150px, 220px)` / `minmax(0, 1fr)`, filas de 10 px de relleno separadas por un borde superior de 1 px. Por debajo de 576 px colapsa a una columna. Existe para que las mismas etiquetas y valores se lean bien a cualquier ancho sin duplicar marcado.
- **Pestaña de revisión:** a ancho completo, con secciones `revision-documental`, `revision-academica` y `revision-cv` separadas por una regla superior y con desplazamiento propio de 24 px de margen, para que el ancla no quede pegada al borde del área desplazable.
- **Historial:** lista con viñeta desplazada 24 px y 16 px entre entradas; conserva actor, versión y cambios. Es contenido obligatorio, no un detalle plegable que se pueda perder.

## Do's and Don'ts

### Do:
- **Do** reservar el rojo `#880000` para la franja, el sello y la acción principal; una sola acción primaria por pantalla.
- **Do** usar el azul marino `#2A3964` para toda la estructura: sidebar, respaldos de marca, reglas de 3 px, encabezado de tabla y foco.
- **Do** mantener el radio del sistema en 8 px y el alto de control en 40 px.
- **Do** dejar siempre visible el foco: 3 px de contorno en azul marino con 3 px de separación.
- **Do** separar con bordes de 1 px `#DCE1E8` y con la diferencia mínima entre `#FFFFFF` y `#F5F6F8` antes de recurrir a una sombra.
- **Do** renderizar **una** sola presentación responsive por pantalla, eligiendo con `Grid.useBreakpoint()`.
- **Do** permitir que las palabras largas se partan entre palabras (`break-word`) en etiquetas, y en cualquier parte (`anywhere`) solo en valores de contenido y celdas.
- **Do** servir Lato 400/700 localmente en formato WOFF2 con la licencia SIL OFL 1.1 junto a los archivos.
- **Do** conservar los medios con `object-fit: contain` (logotipos) y `cover` con `object-position: 50% 48%` (fotografía), sin recolorear ni recortar los originales.

### Don't:
- **Don't** usar el azul de información `#EEF4FC` fuera de un aviso informativo, ni siquiera como fondo decorativo.
- **Don't** volver a derivar el aviso informativo de un `colorInfo` oscuro: antd produce un gris apagado que se lee como deshabilitado.
- **Don't** introducir una segunda familia tipográfica, condensar la existente ni subir el cuerpo por debajo de 14 px.
- **Don't** añadir una segunda sombra ni intensificar la sombra ambiental de tarjeta.
- **Don't** retirar el contorno de foco ni sustituirlo por un cambio de color únicamente.
- **Don't** animar sin respetar `prefers-reduced-motion`, ni hacer del movimiento la única señal de un estado.
- **Don't** presentar dos copias del mismo contenido, una por breakpoint, ni resolver un ancho insuficiente con desplazamiento horizontal de la página.
- **Don't** estirar, recolorear ni recortar los recursos institucionales aportados, y no sustituir el escudo por un logotipo inventado.
