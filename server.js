const express = require('express');
const data = require('./servicios_unificados_full_final.json'); // carga el JSON

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint raíz para probar si el servidor funciona
app.get('/', (req, res) => {
  res.send('API de servicios de salud');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// - CENTROS DE SALUD - //
app.get('/centros_salud', (req, res) => {
  res.json(data.centros_salud);
});

// Devolver un centro de salud por id (CS001, CS002, etc.)
app.get('/centros_salud/:id', (req, res) => {
  const centro = data.centros_salud.find(c => c.id === req.params.id.toUpperCase());
  if (centro) {
    res.json(centro);
  } else {
    res.status(404).json({ error: 'Centro no encontrado' });
  }
});

// Devuelve centros de salud paginados
app.get('/centros_salud', (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10)); 
  // limite máximo de 20 para no saturar

  const total = data.centros_salud.length;
  const totalPages = Math.ceil(total / limit);

  // Si la página no existe, devolvemos vacíos
  if (page > totalPages) {
    return res.json({
      resultados: [],
      pagina: page,
      siguientePagina: null,
      total,
      totalPaginas: totalPages
    });
  }

  const start = (page - 1) * limit;
  const end   = start + limit;

  const results = data.centros_salud.slice(start, end);

  res.json({
    resultados: results,
    pagina: page,
    siguientePagina: page < totalPages ? page + 1 : null,
    total,
    totalPaginas: totalPages
  });
});


// Fórmula de Haversine para calcular distancia en kilómetros
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Devuelve los centros más cercanos a una coordenada
app.get('/centros_cercanos', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const limit = parseInt(req.query.limit) || 3; // cuántos devolver, por defecto 3

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Debes indicar lat y lon' });
  }

  // Calcula la distancia a cada centro
  const centrosOrdenados = data.centros_salud.map(c => ({
    ...c,
    distancia: calcularDistancia(lat, lon, c.latitud, c.longitud)
  }))
  .sort((a, b) => a.distancia - b.distancia)
  .slice(0, limit);

  res.json(centrosOrdenados);
});

app.get('/centros_salud/:id/servicios', (req, res) => {
  const { id } = req.params;
  const callcenter = req.query.callcenter;
  const centro = data.centros_salud.find(c => c.id === id.toUpperCase());
  if (!centro) return res.status(404).json({ error: 'Centro no encontrado' });

  let servicios = centro.servicios;
  if (callcenter === 'true') servicios = servicios.filter(s => s.turno_callcenter);
  if (callcenter === 'false') servicios = servicios.filter(s => !s.turno_callcenter);

  res.json(servicios);
});
