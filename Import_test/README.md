# Catálogo y Guía de Importación de Pruebas Psicométricas y de Aptitud

Este directorio contiene los paquetes estandarizados y listos para exportar/importar de cada uno de los tests de aptitud psicométrica a la plataforma de selección de personal del **Grupo 18B**.

Cada prueba está aislada en su propia carpeta y dispone de su archivo `.zip` independiente para que puedas compartirla o transferirla fácilmente a tu compañero de equipo.

---

## 📦 Estructura del Directorio

```text
Import_test/
├── 01_observacion_memoria_1/            # Test I: Observación y Memoria (Escena 1)
├── 01_observacion_memoria_1.zip
├── 02_observacion_memoria_2/            # Test II: Observación y Memoria (Escena 2)
├── 02_observacion_memoria_2.zip
├── 03_razonamiento_simbolos/            # Test II: Razonamiento con Símbolos (35 láminas)
├── 03_razonamiento_simbolos.zip
├── 04_aptitud_numerica_series/          # Test I: Series de Números (25 ítems texto)
├── 04_aptitud_numerica_series.zip
├── 05_aptitud_numerica_aritmetico/      # Test II: Razonamiento Aritmético (29 problemas texto)
├── 05_aptitud_numerica_aritmetico.zip
├── 06_aptitud_numerica_operaciones/     # Test III: Operaciones Rápidas (30 cálculos texto)
├── 06_aptitud_numerica_operaciones.zip
├── 07_relaciones_espaciales/            # Test I: Relaciones Espaciales y Ángulos (25 ítems)
├── 07_relaciones_espaciales.zip
├── 08_raven_matrices_1995/              # Test Raven: Matrices Progresivas (60 matrices)
├── 08_raven_matrices_1995.zip
├── 09_test_de_logro/                   # Test de Logro y Liderazgo (Motivación McClelland - 15 ítems)
├── 09_test_de_logro.zip
├── 10_habilidades_blandas/             # Formulario de Habilidades Blandas (28 reactivos)
├── 10_habilidades_blandas.zip
├── comandos_artisan/
│   └── TestPackageImport.php            # Comando Artisan universal listo para copiar
└── README.md                            # Esta guía
```

---

## 📋 Catálogo de Pruebas Disponibles

| # | Código / Carpeta | Nombre del Instrumento | Tipo de Reactivo | Total Ítems | Opciones | Archivo ZIP |
|---|---|---|---|:---:|:---:|---|
| **1** | `01_observacion_memoria_1` | Test de Observación y Memoria - Escena I | Imagen + Preguntas de texto | 6 | A - E | `01_observacion_memoria_1.zip` |
| **2** | `02_observacion_memoria_2` | Test de Observación y Memoria - Escena II | Imagen + Preguntas de texto | 6 | A - E | `02_observacion_memoria_2.zip` |
| **3** | `03_razonamiento_simbolos` | Test de Razonamiento con Símbolos | Láminas gráficas (Analogías, Series, Figuras) | 35 | A - E | `03_razonamiento_simbolos.zip` |
| **4** | `04_aptitud_numerica_series` | Test de Aptitud Numérica - Series de Números | 100% Texto (Series lógicas) | 25 | A - E | `04_aptitud_numerica_series.zip` |
| **5** | `05_aptitud_numerica_aritmetico` | Test de Aptitud Numérica - Razonamiento Aritmético | 100% Texto (Problemas aplicados) | 29 | A - D | `05_aptitud_numerica_aritmetico.zip` |
| **6** | `06_aptitud_numerica_operaciones` | Test de Aptitud Numérica - Operaciones Rápidas | 100% Texto (Cálculo ágil 2 min) | 30 | A - D | `06_aptitud_numerica_operaciones.zip` |
| **7** | `07_relaciones_espaciales` | Test de Capacidad Perceptiva - Relaciones Espaciales | Láminas gráficas (Líneas y ángulos) | 25 | A - E / 1 - 8 | `07_relaciones_espaciales.zip` |
| **8** | `08_raven_matrices_1995` | Test de Matrices Progresivas (Raven - 1995) | Matrices gráficas en JPG | 60 | 1 - 8 | `08_raven_matrices_1995.zip` |
| **9** | `09_test_de_logro` | Test de Logro y Liderazgo (Motivación de McClelland) | Cuestionario Likert (Logro, Afiliación, Poder) | 15 | 1 - 5 | `09_test_de_logro.zip` |
| **10** | `10_habilidades_blandas` | Formulario de Evaluación de Habilidades Blandas | Autopercepción de competencias reales | 28 | 1 - 5 | `10_habilidades_blandas.zip` |

---

## 📊 Reglas de Calificación Especiales

### Test 9: Test de Logro y Liderazgo (Motivación de McClelland)
Evalúa las 3 necesidades de motivación laboral de David McClelland:
1. **Motivación de Logro:** Suma de los reactivos `1, 4, 7, 10, 13` (Rango: 5 a 25 puntos).
2. **Motivación de Poder:** Suma de los reactivos `2, 5, 8, 11, 14` (Rango: 5 a 25 puntos).
3. **Motivación de Afiliación:** Suma de los reactivos `3, 6, 9, 12, 15` (Rango: 5 a 25 puntos).

```text
                  ESQUEMA DE CALIFICACIÓN (Matriz 3 Columnas)
       LOGRO                 AFILIACIÓN                 PODER
  Preg. 01: [ 1-5 ]       Preg. 03: [ 1-5 ]       Preg. 02: [ 1-5 ]
  Preg. 04: [ 1-5 ]       Preg. 06: [ 1-5 ]       Preg. 05: [ 1-5 ]
  Preg. 07: [ 1-5 ]       Preg. 09: [ 1-5 ]       Preg. 08: [ 1-5 ]
  Preg. 10: [ 1-5 ]       Preg. 12: [ 1-5 ]       Preg. 11: [ 1-5 ]
  Preg. 13: [ 1-5 ]       Preg. 15: [ 1-5 ]       Preg. 14: [ 1-5 ]
 -----------------       -------------------     -----------------
    TOTAL LOGRO           TOTAL AFILIACIÓN           TOTAL PODER
```

**Generación del Gráfico de Barras:**
Se construye un gráfico de barras comparando las 3 dimensiones (**LOGRO**, **AFILIACIÓN**, **PODER**). La barra que obtiene el mayor valor numérico se destaca visualmente con color, indicando el motivador/estilo de liderazgo dominante del postulante.

---

### Test 10: Formulario de Evaluación de Habilidades Blandas
Evalúa el comportamiento laboral real en 5 dimensiones (28 reactivos totales en escala 1 a 5):
1. **Habilidades Comunicativas:** Ítems `1 al 6` (6 a 30 puntos).
2. **Capacidad para el Trabajo en Equipo:** Ítems `7 al 10` (4 a 20 puntos).
3. **Manejo del Estrés y Conflictos:** Ítems `11 al 20` (10 a 50 puntos).
4. **Evaluación de la Responsabilidad:** Ítems `21 al 24` (4 a 20 puntos).
5. **Búsqueda de Información y Aprendizaje:** Ítems `25 al 28` (4 a 20 puntos).

---

## 🚀 Cómo Importar los Tests en Laravel

### Requisito previo para tu compañero de equipo:
Si tu compañero no tiene aún el comando `TestPackageImport.php` en su proyecto Laravel, solo debe copiar el archivo:
```powershell
# Desde la raíz del proyecto:
Copy-Item "Import_test/comandos_artisan/TestPackageImport.php" "backend/app/Console/Commands/TestPackageImport.php"
```

---

### Opción 1: Importar TODOS los tests de una sola vez
Para importar todos los tests disponibles automáticamente en la base de datos:
```powershell
cd backend
php artisan test:package-import --all
```

---

### Opción 2: Importar un test individual desde su carpeta
Puedes pasar la ruta relativa o absoluta de la carpeta:
```powershell
cd backend
php artisan test:package-import Import_test/09_test_de_logro
php artisan test:package-import Import_test/10_habilidades_blandas
```

---

### Opción 3: Importar un test individual directamente desde su archivo `.zip`
El comando extrae y procesa el `.zip` de forma automática y transparente:
```powershell
cd backend
php artisan test:package-import Import_test/09_test_de_logro.zip
php artisan test:package-import Import_test/10_habilidades_blandas.zip
```

---

### Opción 4: Sobrescribir o actualizar un test existente
Si modificaste las preguntas o respuestas de un paquete ya registrado y deseas recargarlo limpiamente:
```powershell
cd backend
php artisan test:package-import Import_test/09_test_de_logro.zip --force
```

---

## 🛠️ ¿Cómo Crear y Añadir un Nuevo Test en el Futuro?

El sistema está diseñado de forma modular. Para añadir cualquier nuevo test (por ejemplo, `11_nuevo_test`), solo necesitas crear una carpeta con la siguiente estructura:

```text
11_nuevo_test/
├── assets/                  # (Opcional) Si la prueba tiene imágenes
│   ├── imagen_1.jpg
│   └── imagen_2.png
├── package.json             # Metadatos del instrumento
├── items.json               # Preguntas, opciones y claves
└── README.md                # Breve descripción
```

### Formato de `package.json`
```json
{
  "name": "Nombre Completo del Test",
  "slug": "nombre-del-test",
  "category": "Razonamiento Verbal / Aptitud / etc.",
  "author": "Nombre del Autor o Fuente",
  "time_limit_minutes": 30,
  "instructions": "Instrucciones detalladas que leerá el postulante.",
  "example_text": "Texto explicativo del ejemplo inicial.",
  "example_image": "assets/ejemplo.jpg",
  "answer_type": "single_choice",
  "option_labels": ["A", "B", "C", "D"],
  "total_exercises": 20,
  "scoring_enabled": true
}
```

*(Para cuestionarios de perfil o autopercepción sin clave correcta única, usar `"answer_type": "single_choice_unscored"` y `"scoring_enabled": false"`).*

Una vez creada la carpeta:
1. Puedes comprimirla en un `.zip` con el mismo nombre.
2. Ejecutas `php artisan test:package-import Import_test/11_nuevo_test` y quedará listo en la plataforma.
