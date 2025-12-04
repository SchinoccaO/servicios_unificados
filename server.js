
console.log('✅ Este es el server.js correcto');

const express = require('express');
const data = require('./servicios_unificados_full_final.json');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// MIDDLEWARE DE LOG BÁSICO
// ---------------------------
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------------------
// ENDPOINT RAÍZ
// ---------------------------
app.get('/', (req, res) => {
  res.send('API de servicios de salud municipales');
});

app.get('/debug', (req, res) => {
  res.send('OK: estás en el archivo correcto');
});

// ---------------------------
// UTIL: FÓRMULA HAVERSINE
// ---------------------------
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Para no repetir estructura en varios endpoints
function formatoCentroLite(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    zona_programatica: c.zona_programatica,
    direccion: c.direccion,
    latitud: c.latitud,
    longitud: c.longitud
  };
}

app.get('/test_odo', (req, res) => {
  console.log('[DEBUG] Entró al endpoint /centro_odontologia');
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Debes indicar lat y lon' });
  }

  // Ordenar centros por distancia a coordenadas del usuario
  const centrosOrdenados = data.centros_salud
    .map(c => ({
      ...c,
      distancia: calcularDistancia(lat, lon, c.latitud, c.longitud)
    }))
    .sort((a, b) => a.distancia - b.distancia);

  const asignado = centrosOrdenados[0];

  // Buscar servicio "Odontología" por nombre exacto
  const servicioOdo = asignado.servicios.find(
    s => s.nombre.toLowerCase().includes('odonto')
  );

  if (servicioOdo) {
    // Caso A: el centro más cercano tiene odontología
    return res.json({
      tipo: 'centro_con_odontologia',
      centro: {
        id: asignado.id,
        nombre: asignado.nombre,
        direccion: asignado.direccion,
        zona_programatica: asignado.zona_programatica,
        distancia_km: Number(asignado.distancia.toFixed(2))
      },
      servicio: {
        nombre: servicioOdo.nombre,
        turno_callcenter: servicioOdo.turno_callcenter || false
      }
    });
  } else {
    // Caso B: no tiene odontología → redirigir a SOM
    return res.json({
      tipo: 'sin_odontologia',
      mensaje: 'Tu centro más cercano no ofrece odontología actualmente.',
      redireccion: {
        titulo: 'Servicio de Orientación Municipal (SOM)',
        contacto: '0800-XXX-SOM',
        link: 'https://cordoba.gob.ar/som'
      }
    });
  }
});





// ---------------------------
// LISTADO DE CENTROS
// ---------------------------

// Un solo endpoint:
// - sin page/limit → devuelve todo (útil para backoffice, pruebas)
// - con page/limit → paginado (para el bot, paneles, etc.)
app.get('/centros_salud', (req, res) => {
  const total = data.centros_salud.length;

  const pageRaw = req.query.page;
  const limitRaw = req.query.limit;
  const zonaFiltro = req.query.zona_programatica;

  // Filtrado por zona programática (opcional)
  let centrosFiltrados = data.centros_salud;
  if (zonaFiltro) {
    centrosFiltrados = centrosFiltrados.filter(
    c => c.zona_programatica.toLowerCase() === zonaFiltro.toLowerCase()
    );
  }
const totalFiltrados = centrosFiltrados.length;

  // Si NO pasan paginación -> devolver todo
  if (!pageRaw && !limitRaw) {
    return res.json({
      total,
      resultados: data.centros_salud
    });
  }

  // Con paginación
  const page = Math.max(1, parseInt(pageRaw) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(limitRaw) || 10)); // máx 20

  const totalPaginas = Math.ceil(total / limit);
  if (page > totalPaginas) {
    return res.json({
      resultados: [],
      pagina: page,
      siguientePagina: null,
      total,
      totalPaginas
    });
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const resultados = data.centros_salud.slice(start, end);

  res.json({
    resultados,
    pagina: page,
    siguientePagina: page < totalPaginas ? page + 1 : null,
    total,
    totalPaginas
  });
});

// Un centro por ID
app.get('/centros_salud/:id', (req, res) => {
  const centro = data.centros_salud.find(
    c => c.id === req.params.id.toUpperCase()
  );
  if (!centro) {
    return res.status(404).json({ error: 'Centro no encontrado' });
  }
  res.json(centro);
});

// Servicios de un centro (con filtro por callcenter)
app.get('/centros_salud/:id/servicios', (req, res) => {
  const { id } = req.params;
  const callcenter = req.query.callcenter; // 'true' | 'false' | undefined

  const centro = data.centros_salud.find(
    c => c.id === id.toUpperCase()
  );
  if (!centro) {
    return res.status(404).json({ error: 'Centro no encontrado' });
  }

  let servicios = centro.servicios;
  if (callcenter === 'true') {
    servicios = servicios.filter(s => s.turno_callcenter);
  } else if (callcenter === 'false') {
    servicios = servicios.filter(s => !s.turno_callcenter);
  }

  res.json(servicios);
});

// ---------------------------
// CENTROS PARA EL MAPA (Leaflet)
// ---------------------------

// Versión “liviana” para pintar el mapa sin mandar todo el JSON gigante.
app.get('/centros_salud_mapa', (req, res) => {
  const centros = data.centros_salud.map(c => ({
    ...formatoCentroLite(c),
    servicios: c.servicios.map(s => s.nombre) // para resaltar odontología, etc.
  }));
  res.json(centros);
});

// ---------------------------
// CENTROS CERCANOS (lista)
// ---------------------------

app.get('/centros_cercanos', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const limit = Math.max(1, Math.min(10, parseInt(req.query.limit) || 3));

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Debes indicar lat y lon' });
  }

  const centrosOrdenados = data.centros_salud
    .map(c => ({
      ...c,
      distancia: calcularDistancia(lat, lon, c.latitud, c.longitud)
    }))
    .sort((a, b) => a.distancia - b.distancia)
    .slice(0, limit);

  res.json(
    centrosOrdenados.map(c => ({
      ...formatoCentroLite(c),
      distancia_km: Number(c.distancia.toFixed(2))
    }))
  );
});

// ---------------------------
// CENTRO CORRESPONDIENTE
// (el que “te toca” + sugerencias)
// ---------------------------

app.get('/centro_correspondiente', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const sugerencias = Math.max(1, Math.min(5, parseInt(req.query.sugerencias) || 3));

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Debes indicar lat y lon' });
  }

  // 1) calculamos distancia a todos (por ahora usamos distancia como criterio
  //    práctico de correspondencia)
  const centrosOrdenados = data.centros_salud
    .map(c => ({
      ...c,
      distancia: calcularDistancia(lat, lon, c.latitud, c.longitud)
    }))
    .sort((a, b) => a.distancia - b.distancia);

  const principal = centrosOrdenados[0];
  const alternativas = centrosOrdenados.slice(1, sugerencias);

  // 2) log mínimo para auditoría
  console.log(
    `[ASIGNACION] lat=${lat}, lon=${lon} -> centro=${principal.id} (${principal.nombre})`
  );

  res.json({
    centro_asignado: {
      ...formatoCentroLite(principal),
      distancia_km: Number(principal.distancia.toFixed(2))
    },
    alternativas: alternativas.map(c => ({
      ...formatoCentroLite(c),
      distancia_km: Number(c.distancia.toFixed(2))
    }))
  });
});

// ---------------------------
// OPCIONAL FUTURO: ZONA PROGRAMÁTICA POR POLÍGONOS
// ---------------------------

// Si en algún momento cargan un zonas_programaticas.json con polígonos,
// se puede implementar esta función y usarla dentro de /centro_correspondiente.
function zonaProgramaticaPorCoordenadas(lat, lon) {
  // TODO: implementar punto-en-polígono cuando tengamos los datos.
  // Por ahora devolvemos null para no romper nada.
  return null;
}

// ---------------------------
// START SERVER
// ---------------------------
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
