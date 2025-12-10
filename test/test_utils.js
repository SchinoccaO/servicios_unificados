const assert = require('assert');
const { calcularDistancia, parseCoordinates } = require('./src/utils');

console.log('Ejecutando tests de utils...');

// Test 1: distancia cero para misma coordenada
const d0 = calcularDistancia(-31.3648, -64.149057, -31.3648, -64.149057);
assert.strictEqual(d0, 0, 'Distancia entre el mismo punto debe ser 0');

// Test 2: tipo numérico y valor razonable (distancia pequeña)
const d1 = calcularDistancia(-31.3648, -64.149057, -31.3620, -64.1500);
assert.strictEqual(typeof d1, 'number');
assert.ok(d1 > 0 && d1 < 1, 'Distancia esperada menor a 1 km para puntos cercanos');

// Test 3: parseCoordinates con aliases y strings
const p1 = parseCoordinates({ query: { lat: '-31.3648', lon: '-64.149057' } });
assert.strictEqual(p1.lat, -31.3648);
assert.strictEqual(p1.lon, -64.149057);

const p2 = parseCoordinates({ query: { latitude: '-31.3648', longitude: '-64.149057' } });
assert.strictEqual(p2.lat, -31.3648);
assert.strictEqual(p2.lon, -64.149057);

// Test 4: parseCoordinates inválido
const p3 = parseCoordinates({ query: {} });
assert.ok(p3.error, 'Debe devolver error cuando faltan coordenadas');

console.log('Todos los tests pasaron.');
