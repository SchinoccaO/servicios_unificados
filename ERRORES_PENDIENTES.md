# Errores y Pendientes para Próxima Sesión

## Fecha: 2025-12-12

### ❌ Casos de Prueba No Completados

1. **Caso B de /test_odo**: Centro con odontología pero SIN callcenter
   - **Problema**: Todos los 100 CS tienen `turno_callcenter: true` en odontología
   - **Ubicación**: Línea 517 de `servicios_unificados_full_final.json` - CS017 tiene `"turno_callcenter": false` pero al probarlo encuentra otro centro más cercano
   - **Solución pendiente**: 
     - Crear test unitario con mock data
     - O modificar temporalmente un centro para testing
   - **Código implementado**: ✅ Lógica completa en líneas 148-167 de server.js

2. **Caso C de /test_odo**: Centro más cercano sin odontología → SOM
   - **Problema**: Todos los 100 CS tienen odontología en servicios
   - **Solución pendiente**:
     - Crear test unitario con mock
     - O usar coordenadas extremadamente lejanas (fuera de Córdoba)
   - **Código implementado**: ✅ Lógica completa en líneas 168-180 de server.js

### ⚠️ Limitaciones de Testing Actual

- **PowerShell + Node.js**: El servidor se detiene al ejecutar comandos subsecuentes en la misma terminal
- **Background Jobs**: Start-Job funciona pero dificulta ver logs en tiempo real
- **Solución temporal**: Servidor en job separado, comandos en terminal principal

### ✅ Cambios Commiteados (6ba2766)

- RF7: Validaciones defensivas con Array.isArray() (3 ubicaciones)
- Fix: SOM data ahora del JSON (no hardcoded)
- Edge case: 3 casos odontología implementados
- Tests exitosos: 6 de 7 endpoints verificados

### 📋 Próximos Pasos

1. **Tests unitarios**: Crear suite con mocha para casos B y C de /test_odo
2. **RF6+**: Continuar revisión de requerimientos
3. **Integración**: Probar flujo completo del bot con API
4. **Documentación**: Actualizar README con casos de /test_odo

### 🔍 Notas Técnicas

- **Caso B existe pero no testeable**: CS017 "Villa Azalais OESTE" tiene `"Odontología": turno_callcenter: false` (línea 517)
- **Todos los CS tienen coordenadas válidas**: No hay centros sin latitud/longitud
- **SOM ID**: "SOM" en centros_salud (línea ~3560)
- **Array validations**: Previenen crashes si JSON se corrompe o API recibe datos malformados
