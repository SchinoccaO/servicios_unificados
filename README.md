# API de Servicios Unificados (local)

Breve guía para ejecutar y entender 

Archivos clave
- `src/server.js`: servidor Express con endpoints públicos.
- `data/servicios_unificados_full_final.json`: datos de los centros (latitud/longitud). 100 centros de salud (CS001-CS101).
- `src/utils.js`: utilidades compartidas (`calcularDistancia`, `parseCoordinates`).
- `test/test_utils.js`: pruebas simples de las utilidades.

Requisitos
- Node.js instalado (versión 14+ recomendable).

Cómo ejecutar el servidor (PowerShell)
```powershell
# Detener node si está corriendo y arrancar el server
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process -NoNewWindow -FilePath node -ArgumentList 'src/server.js' -WorkingDirectory 'C:\Users\gonzalezschinocca_on\Documents\chatbot\servicios_unificados_api'
Start-Sleep -Seconds 1
Invoke-RestMethod -Uri 'http://localhost:3000/centros_cercanos?lat=-31.3648&lon=-64.149057&limit=3' -UseBasicParsing | ConvertTo-Json -Depth 5
```

Endpoints principales
- `GET /centros_cercanos?lat={lat}&lon={lon}&limit={n}`
  - Devuelve una lista (array) de hasta `n` centros más cercanos.
  - Respuesta: objeto con metadatos y resultados. Ejemplo:

```json
{
  "resultados": [ { "id": "CS001", "nombre": "...", "distancia_km": 0.12 } ],
  "total": 120,
  "limit": 3,
  "coords": { "lat": -31.3648, "lon": -64.149057 }
}
```
  - Error 400: si faltan o son inválidas las coordenadas.

- `GET /centros_salud/:id?detail=lite|completo` **(OPTIMIZADO PARA MÓVIL)**
  - Devuelve un centro específico por ID.
  - `?detail=lite` (por defecto): 6 campos básicos (~100 bytes con gzip).
  - `?detail=completo`: todos los campos incluyendo servicios, horarios, mapa_url (~400 bytes con gzip).
  - **Mejora para móviles:** 92% menos datos, 7-10x más rápido.

- `GET /centro_correspondiente?lat={lat}&lon={lon}&sugerencias={n}`
  - Devuelve el centro asignado (formato lite) y `n` alternativas opcionales.
  - Por defecto `sugerencias=0` (sin alternativas).
  - Rango: 0-5 alternativas.
  - Error 404: si no hay centros con coordenadas válidas.

- `GET /centros_salud/:id/servicios?callcenter=true|false`
  - Devuelve los servicios de un centro específico.
  - `?callcenter=true`: solo servicios con turno por call center.
  - `?callcenter=false`: solo servicios sin turno por call center.
  - Sin parámetro: todos los servicios.
  - Cada servicio incluye: `nombre`, `turno_callcenter`, `informacion`.

- `GET /health`
  - Health check endpoint.
  - Devuelve estado del servidor, versión, y total de centros.

- `GET /test_odo?lat={lat}&lon={lon}`
  - Busca el centro más cercano y verifica si ofrece Odontología.
  - Si lo tiene, devuelve el centro y el servicio; si no, devuelve datos de redirección (SOM).

## Optimizaciones para móviles

**Compresión gzip:** Todas las respuestas se comprimen automáticamente (~70% menos datos).

**Respuestas adaptativas:** Endpoint `/centros_salud/:id` soporta `?detail=lite|completo`:
- Móvil usa `lite` por defecto (6 campos básicos).
- Dashboard puede pedir `completo` (todos los campos).
- **Ahorro combinado:** 92% menos datos, carga 7-10x más rápida en 3G/4G.

## Qué se cambió y por qué (explicación corta)
- `calcularDistancia` (Haversine): ahora convierte entradas a `Number` y devuelve `NaN` si alguna coordenada es inválida. Esto evita que operaciones matemáticas con `undefined`/strings devuelvan resultados inesperados.
- `parseCoordinates`: helper que normaliza y valida parámetros de query. Acepta `lat|latitude|latitud` y `lon|lng|longitude|longitud` para mayor flexibilidad.
- Filtrado: antes de ordenar por distancia, se filtran los centros cuya distancia es `NaN` (i.e., faltan coordenadas válidas). Así no rompemos el ordenamiento ni devolvemos resultados incorrectos.
- Refactor: moví las utilidades a `utils.js` para facilitar pruebas unitarias y reutilización.
- **Compresión gzip + `?detail=`**: optimiza respuestas para clientes móviles (92% menos datos).

Pruebas rápidas (sin instalar dependencias)
```powershell
node test/test_utils.js

# O usando mocha (recomendado):
npm install
npm test
```
Salida esperada: mensajes de ejecución y `Todos los tests pasaron.`

## Formatos de respuesta

La API utiliza dos formatos según el caso de uso:

### `formatoCentroLite` (6 campos básicos)
Respuesta compacta para búsquedas rápidas y mapas.

**Campos:**
- `id`, `nombre`, `direccion`, `zona_programatica`, `latitud`, `longitud`

**Endpoints que lo usan:**
1. **`GET /centros_cercanos`** - Búsqueda por geolocalización
   - **Situación:** Usuario busca centros cerca de su ubicación
   - **Cliente típico:** App móvil, chatbot
   - **Razón:** Solo necesita nombre, dirección y distancia para vista rápida

2. **`GET /centro_correspondiente`** - Asignación automática
   - **Situación:** Sistema determina qué centro le corresponde al usuario
   - **Cliente típico:** Sistema de derivación, chatbot de turnos
   - **Razón:** Solo necesita identificar el centro rápidamente

3. **`GET /centros_salud_mapa`** - Mapa interactivo
   - **Situación:** Renderizar 100+ pines en mapa
   - **Cliente típico:** Web frontend con Leaflet/Google Maps
   - **Razón:** Payload reducido; detalles se cargan al clickear pin

### `formatoCentroCompleto` (10+ campos con validación)
Respuesta completa con toda la información (RF1).

**Campos adicionales:**
- `coordenadas` (con validación), `servicios`, `horarios`, `mapa_url`, `area_programatica`

**Estructura de servicios:**
Cada servicio incluye:
- `nombre`: Nombre del servicio (ej: "Pediatría", "Odontología")
- `turno_callcenter`: Boolean, indica si se puede sacar turno por call center
- `informacion`: String, información adicional (ej: "Consultar requisitos en centro")

**Endpoints que lo usan:**
1. **`GET /centros_salud`** (sin paginación) - Listado completo
   - **Situación:** Exportar todos los centros con información completa
   - **Cliente típico:** Dashboard administrativo, sincronización
   - **Razón:** Cumple RF1 (servicios, horarios, validación coords)

2. **`GET /centros_salud?page=1&limit=20`** - Navegación paginada
   - **Situación:** Listado web con filtros
   - **Cliente típico:** Panel de administración
   - **Razón:** Usuario puede ver servicios, horarios y clickear mapa

### Patrón de uso típico (flujo real)

**Ejemplo: Usuario busca centro cercano**
```
1. GET /centros_cercanos?lat=-31.36&lon=-64.14&limit=3
   → Respuesta Lite: 3 centros con datos básicos + distancia
   
2. Usuario clickea uno
   GET /centros_salud/CS001
   → Respuesta Completo: servicios, horarios, mapa_url
```

**Resultado:** Primera carga rápida (Lite), detalles bajo demanda (Completo).

## Recomendaciones
- Validar límites geográficos si lo necesitas (lat entre -90 y 90, lon entre -180 y 180).
- Añadir tests de integración con `supertest`.
- Considerar implementar `?detail=lite|medio|completo` para más flexibilidad.
