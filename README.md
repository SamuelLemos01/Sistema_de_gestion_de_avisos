# Dashboard de Mantenimiento - Argos Colombia

© 2025 **Hector Parra** - Empleado en prácticas en Argos

## Descripción

Sistema web de gestión y análisis de avisos de mantenimiento para Argos Colombia. Permite cargar, procesar y visualizar datos de mantenimiento a través de archivos Excel (XLSX) o CSV, generando tablas de resumen, gráficos estadísticos y análisis detallados por grupo, estado, tiempo y encargados.

## Estructura del Proyecto

```
trabajo/
├── assets/
│   ├── banner.png      # Banner corporativo Argos para header
│   ├── logo.png        # Logo de Argos
│   ├── tablet.png      # Imagen decorativa para datos crudos
│   └── hombre.png      # Imagen decorativa para gráficos
├── ini.html            # Página principal HTML
├── inicio.css          # Estilos CSS con diseño corporativo Argos
├── Inicio_MODIFICADO.js # Lógica JavaScript principal
└── README.md           # Documentación del proyecto
```

## Características Principales

### 📊 Análisis de Datos de Abril
- **Procesamiento automático**: Detecta archivos de abril.xlsx y organiza por meses
- **Estados de sistema**: Clasifica avisos por MECE, METR, MIMP, ORAS
- **Grupos de planificación**: Separa análisis por ELE y ETN
- **Resúmenes estadísticos**: Calcula porcentajes de cerrados y totales
- **Filtrado temporal**: Permite filtrar por mes específico

### 🔧 Análisis de Avisos de Mantenimiento
- **Organización semanal**: Estructura datos por semanas de trabajo
- **Seguimiento de atrasos**: Identifica y cuenta avisos atrasados
- **Gestión por encargados**: Analiza rendimiento individual
- **Análisis por sistemas**: Distribución de trabajo por sistema (H01, H02, etc.)
- **Filtros dinámicos**: Filtrado por semana y encargado

### 📈 Visualización Avanzada
- **Gráficos interactivos**: Usa Chart.js para visualizaciones dinámicas
- **Tablas responsivas**: Headers fijos y scroll horizontal/vertical
- **Datos crudos**: Vista completa con filtros múltiples y selección de columnas
- **Diseño corporativo**: Colores y elementos visuales de Argos

## Funciones JavaScript Principales

### 🔄 Procesamiento de Archivos

#### `processFile()`
- **Propósito**: Función principal para iniciar el procesamiento de archivos
- **Funcionalidad**: 
  - Detecta tipo de archivo (CSV/XLSX)
  - Determina si es archivo de abril o avisos
  - Llama a las funciones específicas de procesamiento
- **Uso**: Se ejecuta al hacer clic en "Procesar Archivo"

#### `processXLSXFile(file)` y `processCSVFile(file)`
- **Propósito**: Procesamiento específico según formato de archivo
- **Funcionalidad**:
  - Convierte archivos Excel/CSV a formato JSON
  - Maneja fechas de Excel (números seriales)
  - Filtra registros vacíos
  - Valida estructura de datos

### 📅 Gestión de Datos de Abril

#### `organizeDataByMonth()`
- **Propósito**: Organiza registros de abril por meses
- **Funcionalidad**:
  - Maneja diferentes formatos de fecha (string, Date, número)
  - Convierte fechas seriales de Excel a meses
  - Crea estructura de datos por mes
  - Actualiza filtros dinámicamente

#### `calculateMonthlySummaries()`
- **Propósito**: Calcula estadísticas mensuales para abril
- **Funcionalidad**:
  - Cuenta avisos por grupo (ELE/ETN) y estado
  - Calcula porcentajes de cerrados
  - Genera totales y subtotales
  - Prepara datos para gráficos

#### `filterByMonth()`
- **Propósito**: Aplica filtros por mes en vista de abril
- **Funcionalidad**:
  - Filtra datos según mes seleccionado
  - Actualiza tablas y gráficos dinámicamente
  - Maneja vista "todos los meses"

### 📋 Gestión de Avisos

#### `organizeAvisosByWeek()`
- **Propósito**: Organiza avisos por semanas de trabajo
- **Funcionalidad**:
  - Agrupa registros por semana
  - Extrae encargados únicos
  - Actualiza filtros de semana y encargado
  - Ordena semanas numéricamente

#### `calculateWeeklySummaries()`
- **Propósito**: Calcula estadísticas semanales de avisos
- **Funcionalidad**:
  - Cuenta totales y atrasados por grupo
  - Analiza rendimiento por encargado
  - Calcula porcentajes de atrasos
  - Genera resúmenes globales

#### `filterAvisosByWeek()`
- **Propósito**: Aplica filtros en sección de avisos
- **Funcionalidad**:
  - Filtra por semana y/o encargado
  - Actualiza todas las vistas simultáneamente
  - Recalcula estadísticas filtradas

### 📊 Renderizado de Tablas

#### `renderStatusTable(data)`
- **Propósito**: Genera tabla de estados para abril
- **Funcionalidad**:
  - Clasifica estados por MECE/METR
  - Calcula totales por grupo ELE/ETN
  - Aplica estilos de color por estado
  - Muestra porcentajes de cerrados

#### `renderSummaryTable()` y `renderSummaryTableFiltered()`
- **Propósito**: Genera tablas de resumen mensual
- **Funcionalidad**:
  - Vista completa vs vista filtrada
  - Organiza meses cronológicamente
  - Calcula totales y porcentajes
  - Formato tabular responsivo

#### `renderAvisosPlanificacionTable()`
- **Propósito**: Tabla de planificación de avisos
- **Funcionalidad**:
  - Muestra totales y atrasados por grupo
  - Aplica filtros de semana/encargado
  - Calcula porcentajes dinámicamente
  - Actualización en tiempo real

#### `renderAvisosAtrasadosTable()`
- **Propósito**: Tabla de resumen semanal de atrasos
- **Funcionalidad**:
  - Vista panorámica por semanas
  - Separa análisis ELE/ETN
  - Porcentajes por semana
  - Totales generales

### 📈 Visualización Gráfica

#### `renderChart()` y `renderChartFiltered()`
- **Propósito**: Genera gráficos de barras para abril
- **Funcionalidad**:
  - Usa Chart.js para interactividad
  - Vista completa vs filtrada por mes
  - Múltiples datasets (cerrados/totales ELE/ETN)
  - Responsive y adaptativo

#### `renderAvisosChart()`
- **Propósito**: Gráfico de avisos por encargado
- **Funcionalidad**:
  - Análisis de rendimiento individual
  - Comparación totales vs atrasados
  - Ordenación alfabética de encargados
  - Escalas automáticas

### 🗃️ Gestión de Datos Crudos

#### `renderRawData()`
- **Propósito**: Vista completa de datos sin procesar
- **Funcionalidad**:
  - Tabla interactiva con todos los campos
  - Filtros múltiples (grupo, estado, tiempo)
  - Selección de columnas visible
  - Headers fijos con scroll

#### `applyRawDataFilters()`
- **Propósito**: Sistema de filtrado de datos crudos
- **Funcionalidad**:
  - Filtros combinables múltiples
  - Búsqueda en tiempo real
  - Contador de registros visibles
  - Reset de filtros

#### `toggleColumnVisibilityCheckboxes()`
- **Propósito**: Control de visibilidad de columnas
- **Funcionalidad**:
  - Mostrar/ocultar columnas específicas
  - Checkboxes dinámicos
  - Actualización de contadores
  - Persistencia de selección

### 🛠️ Funciones Auxiliares

#### `getMonthOrder()` y `sortMonths()`
- **Propósito**: Ordenación cronológica de meses
- **Funcionalidad**:
  - Convierte nombres a números
  - Ordenación de enero a diciembre
  - Soporte para meses en español

#### `getFileExtension(filename)`
- **Propósito**: Detecta formato de archivo
- **Funcionalidad**:
  - Extrae extensión del nombre
  - Conversión a minúsculas
  - Validación de formatos soportados

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Diseño responsive con colores corporativos Argos
- **JavaScript ES6**: Lógica de aplicación moderna
- **Chart.js**: Gráficos interactivos y responsivos
- **Papa Parse**: Procesamiento de archivos CSV
- **SheetJS (XLSX)**: Lectura de archivos Excel

## Colores Corporativos Argos

- **Verde Argos**: #C4D600 (primario)
- **Azul Argos**: #071D49 (secundario)
- **Blanco**: #FFFFFF (fondo)

## Instalación y Uso

1. **Preparación**:
   ```bash
   # Asegurar estructura de carpetas
   mkdir assets
   # Colocar imágenes en assets/
   ```

2. **Archivos requeridos**:
   - `banner.png`, `logo.png`, `tablet.png`, `hombre.png` en `/assets/`
   - Archivos de datos: `abril.xlsx` o `avisos.xlsx`

3. **Ejecución**:
   - Abrir `ini.html` en navegador web
   - Seleccionar archivo Excel o CSV
   - Hacer clic en "Procesar Archivo"
   - Explorar las diferentes secciones generadas

## Formatos de Datos Soportados

### Archivo de Abril (abril.xlsx)
- **Columnas requeridas**:
  - `Fecha de aviso`: Mes en formato texto
  - `Grupo planif.`: ELE o ETN
  - `Status sistema`: MECE, METR, MIMP, ORAS
  - `Denominación`: Descripción del aviso

### Archivo de Avisos (avisos.xlsx)
- **Columnas requeridas**:
  - `Semana`: Número de semana
  - `Sistema`: Código de sistema (H01, H02, etc.)
  - `Grupo planif.`: ELE o ETN
  - `Encargado`: Nombre del responsable
  - `atrasados`: 1 para atrasado, 0 para al día

## Características Responsive

- **Desktop**: Vista completa con imágenes decorativas
- **Tablet**: Imágenes redimensionadas automáticamente  
- **Móvil**: Imágenes ocultas, prioridad a funcionalidad

## Soporte y Mantenimiento

Para reportar problemas o solicitar mejoras, contactar con el equipo de hectorivanparrahernandez@gmail.com de Argos Colombia.

---

**Desarrollado con ❤️ para Argos Colombia** 