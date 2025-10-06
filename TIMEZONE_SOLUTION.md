# Solución para el problema de zona horaria en fechas

## Problema identificado
El sistema está mostrando:
- **formatted**: "06/10/2025, 08:06:18" (hora local)
- **original**: "2025-10-06T14:06:18.847Z" (hora UTC correcta)

La diferencia de 6 horas sugiere que las fechas se están convirtiendo a zona horaria local (-6 UTC, probablemente Colombia).

## Soluciones implementadas

### 1. Configuración de base de datos mejorada
```typescript
// En app.module.ts
timezone: '+00:00', // Forzar UTC
dateStrings: false, // Usar objetos Date
extra: {
  initSql: "SET time_zone = '+00:00';" // Forzar UTC en sesión DB
}
```

### 2. Transform en entidades
```typescript
// En audit-log.entity.ts
@CreateDateColumn()
@Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
timestamp: Date;
```

### 3. Servicio con transformación de fechas
```typescript
// En audit.service.ts
private transformLogsForResponse(logs: AuditLog[]): any[] {
  return logs.map(log => ({
    ...log,
    timestamp: log.timestamp.toISOString(), // Siempre ISO UTC
    timestampFormatted: this.formatDateUTC(log.timestamp),
    timestampMs: log.timestamp.getTime()
  }));
}
```

### 4. Interceptor UTC global (opcional)
```typescript
// En utc-date.interceptor.ts
// Asegura que todas las fechas se serialicen en UTC
```

## Recomendaciones para el frontend

### Opción 1: Usar la fecha original (recomendado)
```javascript
// En lugar de usar 'formatted', usar 'original' o 'timestamp'
const timestamp = auditLog.timestamp; // "2025-10-06T14:06:18.847Z"
const date = new Date(timestamp);

// Para mostrar en zona horaria específica
const displayDate = date.toLocaleString('es-CO', {
  timeZone: 'America/Bogota', // Zona horaria de Colombia
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
```

### Opción 2: Usar UTC siempre
```javascript
// Para mostrar siempre en UTC
const displayDate = date.toLocaleString('es-CO', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}) + ' UTC';
```

### Opción 3: Hook personalizado
```javascript
// hooks/useUTCDate.js
export const useUTCDate = () => {
  const formatUTC = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' UTC';
  };

  return { formatUTC };
};
```

## Solución recomendada

1. **Backend**: Usar las configuraciones implementadas para asegurar UTC
2. **Frontend**: Usar siempre `timestamp` (ISO string) y formatear según necesidad
3. **Consistencia**: Decidir si mostrar en UTC o zona local, pero ser consistente

## Verificación
Después de implementar los cambios:

```bash
# Verificar zona horaria de DB
mysql> SELECT @@time_zone, @@global.time_zone;

# Verificar API response
curl -X GET "http://localhost:3000/api/v1/audit/logs" | jq '.data[0].timestamp'
```

## Estado actual
✅ Configuración de DB actualizada
✅ Transform en entidad AuditLog  
✅ Servicio con transformación de fechas
✅ Interceptor UTC disponible
✅ Documentación creada

El problema debería resolverse usando la fecha `original` en lugar de `formatted` en el frontend, o aplicando formateo UTC explícito.