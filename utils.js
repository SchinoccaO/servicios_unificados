// Utilidades compartidas: Haversine y parseo de coordenadas
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const aLat1 = Number(lat1);
  const aLon1 = Number(lon1);
  const aLat2 = Number(lat2);
  const aLon2 = Number(lon2);

  if ([aLat1, aLon1, aLat2, aLon2].some(v => Number.isNaN(v))) {
    return NaN;
  }

  const dLat = (aLat2 - aLat1) * Math.PI / 180;
  const dLon = (aLon2 - aLon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(aLat1 * Math.PI / 180) * Math.cos(aLat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseCoordinates(req) {
  // aceptar varios aliases y reemplazar coma decimal por punto
  let latRaw = req.query.lat ?? req.query.latitude ?? req.query.latitud;
  let lonRaw = req.query.lon ?? req.query.lng ?? req.query.longitude ?? req.query.longitud;

  if (latRaw !== undefined) latRaw = String(latRaw).replace(',', '.');
  if (lonRaw !== undefined) lonRaw = String(lonRaw).replace(',', '.');

  const lat = latRaw !== undefined ? parseFloat(latRaw) : NaN;
  const lon = lonRaw !== undefined ? parseFloat(lonRaw) : NaN;

  if (isNaN(lat) || isNaN(lon)) {
    return {
      error: 'Debes indicar `lat` y `lon` como números (ej: ?lat=-31.3648&lon=-64.149057). También se aceptan `latitude`/`longitude` y `lng`.'
    };
  }

  // Validación de rango
  if (lat < -90 || lat > 90) {
    return { error: 'El parámetro `lat` debe estar entre -90 y 90.' };
  }
  if (lon < -180 || lon > 180) {
    return { error: 'El parámetro `lon` debe estar entre -180 y 180.' };
  }

  return { lat, lon };
}

module.exports = {
  calcularDistancia,
  parseCoordinates
};
