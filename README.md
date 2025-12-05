# API de Servicios Unificados (local)

Breve guía para ejecutar y entender lo que se cambió en este proyecto.

Archivos clave
- `server.js`: servidor Express con endpoints públicos.
- `servicios_unificados_full_final.json`: datos de los centros (latitud/longitud).
- `utils.js`: utilidades compartidas (`calcularDistancia`, `parseCoordinates`).
- `test_utils.js`: pruebas simples de las utilidades.

Requisitos
- Node.js instalado (versión 14+ recomendable).

Cómo ejecutar el servidor (PowerShell)
```powershell
# Detener node si está corriendo y arrancar el server
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process -NoNewWindow -FilePath node -ArgumentList 'server.js' -WorkingDirectory 'C:\Users\gonzalezschinocca_on\Documents\chatbot\servicios_unificados_api'
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

- `GET /centro_correspondiente?lat={lat}&lon={lon}&sugerencias={n}`
  - Devuelve el centro asignado más cercano y `n-1` alternativas.
  - Error 404: si no hay centros con coordenadas válidas.

- `GET /test_odo?lat={lat}&lon={lon}`
  - Busca el centro más cercano y verifica si ofrece Odontología.
  - Si lo tiene, devuelve el centro y el servicio; si no, devuelve datos de redirección (SOM).

Qué se cambió y por qué (explicación corta)
- `calcularDistancia` (Haversine): ahora convierte entradas a `Number` y devuelve `NaN` si alguna coordenada es inválida. Esto evita que operaciones matemáticas con `undefined`/strings devuelvan resultados inesperados.
- `parseCoordinates`: helper que normaliza y valida parámetros de query. Acepta `lat|latitude|latitud` y `lon|lng|longitude|longitud` para mayor flexibilidad.
- Filtrado: antes de ordenar por distancia, se filtran los centros cuya distancia es `NaN` (i.e., faltan coordenadas válidas). Así no rompemos el ordenamiento ni devolvemos resultados incorrectos.
- Refactor: moví las utilidades a `utils.js` para facilitar pruebas unitarias y reutilización.

Pruebas rápidas (sin instalar dependencias)
```powershell
node test_utils.js

# O usando mocha (recomendado):
npm install
npm test
```
Salida esperada: mensajes de ejecución y `Todos los tests pasaron.`

Recomendaciones
- Considerar devolver siempre objetos con metadatos (p. ej. `{ resultados: [...], total }`) en lugar de arrays planos para facilitar paginación y manejo en frontends.
- Agregar tests con `mocha`/`jest` y un `package.json` con `npm test`.
- Validar límites geográficos si lo necesitas (lat entre -90 y 90, lon entre -180 y 180).

Si querés, puedo:
- Cambiar la respuesta de `/centros_cercanos` a un objeto con metadatos.
- Añadir `package.json` y tests con `mocha` o `jest`.
- Documentar más endpoints y ejemplos.
