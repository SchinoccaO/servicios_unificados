const assert = require('assert');
const { calcularDistancia, parseCoordinates } = require('../utils');

describe('Utils', function() {
  describe('calcularDistancia', function() {
    it('devuelve 0 para el mismo punto', function() {
      const d0 = calcularDistancia(-31.3648, -64.149057, -31.3648, -64.149057);
      assert.strictEqual(d0, 0);
    });

    it('distancia razonable para puntos cercanos', function() {
      const d1 = calcularDistancia(-31.3648, -64.149057, -31.3620, -64.1500);
      assert.strictEqual(typeof d1, 'number');
      assert.ok(d1 > 0 && d1 < 1);
    });
  });

  describe('parseCoordinates', function() {
    it('parsea lat/lon con strings y aliases', function() {
      const p1 = parseCoordinates({ query: { lat: '-31.3648', lon: '-64.149057' } });
      assert.strictEqual(p1.lat, -31.3648);
      assert.strictEqual(p1.lon, -64.149057);

      const p2 = parseCoordinates({ query: { latitude: '-31.3648', longitude: '-64.149057' } });
      assert.strictEqual(p2.lat, -31.3648);
      assert.strictEqual(p2.lon, -64.149057);
    });

    it('acepta coma decimal', function() {
      const p = parseCoordinates({ query: { lat: '-31,3648', lon: '-64,149057' } });
      assert.strictEqual(p.lat, -31.3648);
      assert.strictEqual(p.lon, -64.149057);
    });

    it('valida rangos', function() {
      const p = parseCoordinates({ query: { lat: '100', lon: '0' } });
      assert.ok(p.error);
    });

    it('error si faltan coords', function() {
      const p = parseCoordinates({ query: {} });
      assert.ok(p.error);
    });
  });
});
