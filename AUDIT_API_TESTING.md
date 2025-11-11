# Testing Audit System - Endpoints

## 🔍 Sistema de Auditoría - Pruebas de Endpoints

### Endpoints Disponibles

#### 1. **POST /api/v1/audit/log** - Crear Log Manual
```bash
curl -X POST http://localhost:3000/api/v1/audit/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "action": "CREATE",
    "entity": "usuarios",
    "entityId": "123",
    "description": "Prueba de log manual",
    "metadata": {
      "test": true
    }
  }'
```

#### 2. **GET /api/v1/audit/logs** - Consultar Logs (Superadmin e Inspector)
```bash
# Todos los logs
curl -X GET "http://localhost:3000/api/v1/audit/logs" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN"

# Con filtros
curl -X GET "http://localhost:3000/api/v1/audit/logs?action=CREATE&entity=usuarios&page=1&limit=5" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN"

# Con búsqueda por fechas
curl -X GET "http://localhost:3000/api/v1/audit/logs?startDate=2025-10-01&endDate=2025-10-07" \
  -H "Authorization: Bearer SUPERLADMIN_JWT_TOKEN"

# Con búsqueda de texto
curl -X GET "http://localhost:3000/api/v1/audit/logs?search=usuario" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN"
```

#### 3. **GET /api/v1/audit/stats** - Estadísticas (Superadmin e Inspector)
```bash
curl -X GET "http://localhost:3000/api/v1/audit/stats" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN"
```

#### 4. **GET /api/v1/audit/export** - Exportar CSV (Superadmin e Inspector)
```bash
curl -X GET "http://localhost:3000/api/v1/audit/export" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN" \
  --output audit-logs.csv
```

#### 5. **GET /api/v1/audit/logs/entity/:entity/:id** - Logs por Entidad
```bash
curl -X GET "http://localhost:3000/api/v1/audit/logs/entity/usuarios/123" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN"
```

#### 6. **GET /api/v1/audit/logs/user/:userId** - Logs por Usuario
```bash
curl -X GET "http://localhost:3000/api/v1/audit/logs/user/456" \
  -H "Authorization: Bearer SUPERADMIN_JWT_TOKEN"
```

## 📝 Valores Válidos para Filtros

### Actions (Acciones)
- `CREATE` - Creación de registros
- `UPDATE` - Actualización de registros  
- `DELETE` - Eliminación de registros
- `AUTH` - Eventos de autenticación
- `SYSTEM` - Eventos del sistema
- `ROLE_CHANGE` - Cambios de roles

### Entities (Entidades)
- `usuarios` - Gestión de usuarios
- `transporte` - Vehículos y maquinaria
- `operadores` - Operadores de maquinaria
- `reportes` - Reportes del sistema
- `roles` - Cambios en roles y permisos
- `solicitudes` - Solicitudes de roles
- `system` - Eventos del sistema
- `authentication` - Eventos de autenticación

### Formatos de Fecha
Las fechas deben estar en formato ISO 8601:
- `2025-10-06` (solo fecha)
- `2025-10-06T10:30:00Z` (fecha y hora UTC)
- `2025-10-06T10:30:00-05:00` (fecha y hora con zona horaria)

## 🧪 Ejemplos de Respuestas

### Respuesta de Logs
```json
{
  "data": [
    {
      "id": "uuid-123",
      "action": "CREATE",
      "entity": "usuarios",
      "entityId": "123",
      "userId": "456",
      "userEmail": "admin@example.com",
      "userRoles": ["ingeniero"],
      "description": "Se creó el usuario test@example.com",
      "changesBefore": null,
      "changesAfter": {
        "id": 123,
        "email": "test@example.com",
        "name": "Test User"
      },
      "timestamp": "2025-10-06T10:30:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.100",
      "url": "/api/v1/users",
      "metadata": {
        "method": "POST"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### Respuesta de Estadísticas
```json
{
  "totalLogs": 1500,
  "logsByAction": {
    "CREATE": 450,
    "UPDATE": 600,
    "DELETE": 150,
    "AUTH": 250,
    "SYSTEM": 30,
    "ROLE_CHANGE": 20
  },
  "logsByEntity": {
    "usuarios": 500,
    "transporte": 400,
    "operadores": 300,
    "reportes": 200,
    "roles": 50,
    "authentication": 50
  },
  "logsByUser": [
    {
      "userId": "123",
      "userEmail": "admin@example.com",
      "count": 200
    }
  ],
  "logsToday": 25,
  "logsThisWeek": 180,
  "logsThisMonth": 750
}
```

## 🔐 Autenticación y Permisos

### Para Endpoints Públicos de Logging
- Requiere JWT válido de cualquier usuario autenticado
- Se usa para crear logs desde la aplicación

### Para Endpoints de Consulta
- Requiere JWT de usuario con rol `superadmin`
- Solo superadministradores e inspectores pueden ver los logs

### Obtener JWT Token
```bash
# Login para obtener token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "your_password"
  }'
```

## ⚠️ Errores Comunes

### 1. Error de Enum Inválido
```json
{
  "statusCode": 400,
  "message": [
    "action must be one of the following values: CREATE, UPDATE, DELETE, AUTH, SYSTEM, ROLE_CHANGE"
  ],
  "error": "Bad Request"
}
```
**Solución**: Usar solo los valores válidos listados arriba.

### 2. Error de Fecha Inválida
```json
{
  "statusCode": 400,
  "message": [
    "startDate must be a valid ISO 8601 date string (e.g., 2025-10-06 or 2025-10-06T10:30:00Z)"
  ],
  "error": "Bad Request"
}
```
**Solución**: Usar formato ISO 8601 correcto.

### 3. Error de Permisos
```json
{
  "statusCode": 403,
  "message": "Acceso denegado: solo superadministradores e inspectores pueden acceder a los logs de auditoría",
  "error": "Forbidden"
}
```
**Solución**: Usar token de superadministrador o inspector.

## 🚀 Script de Prueba Rápida

```bash
#!/bin/bash
# Guardar como test-audit.sh y ejecutar: bash test-audit.sh

# Variables
BASE_URL="http://localhost:3000/api/v1"
SUPERADMIN_TOKEN="YOUR_SUPERADMIN_JWT_TOKEN"

echo "🔍 Testing Audit System..."

# 1. Crear log manual
echo "1. Creating manual log..."
curl -s -X POST "$BASE_URL/audit/log" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -d '{
    "action": "SYSTEM",
    "entity": "system",
    "description": "Test log from script"
  }' | jq .

# 2. Obtener estadísticas
echo "2. Getting stats..."
curl -s -X GET "$BASE_URL/audit/stats" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq .

# 3. Obtener logs recientes
echo "3. Getting recent logs..."
curl -s -X GET "$BASE_URL/audit/logs?limit=5" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq .

echo "✅ Test completed!"
```

---

**Nota**: Reemplaza `YOUR_JWT_TOKEN` y `SUPERADMIN_JWT_TOKEN` con tokens reales obtenidos del login.