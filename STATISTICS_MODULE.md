# 📊 MÓDULO DE ESTADÍSTICAS - Sistema de Gestión Vial

## Descripción General

El módulo de estadísticas proporciona una vista completa y detallada de todos los datos del sistema, incluyendo métricas avanzadas, tendencias y análisis para la toma de decisiones.

## 🎯 Características Principales

### 1. **Dashboard Completo**
- Resumen general del sistema
- Métricas de todos los módulos
- Indicadores clave de rendimiento (KPIs)
- Alertas del sistema
- Tendencias de crecimiento

### 2. **Estadísticas por Módulo**
- **Usuarios**: Registros, actividad, roles
- **Maquinaria**: Utilización, reportes, tipos
- **Operadores**: Actividad, asignaciones, rendimiento
- **Reportes**: Frecuencia, tipos, patrones
- **Auditoría**: Logs, seguridad, eventos

### 3. **Análisis Avanzado**
- Patrones temporales (por hora, día, mes)
- Tendencias de crecimiento
- Detección de picos de actividad
- Métricas de rendimiento
- Alertas automáticas

### 4. **Filtros Flexibles**
- Rangos de fecha personalizados
- Períodos predefinidos (hoy, semana, mes, etc.)
- Filtros por entidad específica

## 🛠️ Endpoints Disponibles

### Dashboard y Resumen
```http
GET /api/v1/statistics/dashboard
GET /api/v1/statistics/overview
```
**Permisos**: superadmin, ingeniero, inspector

### Estadísticas por Módulo
```http
GET /api/v1/statistics/users
GET /api/v1/statistics/machinery  
GET /api/v1/statistics/operators
GET /api/v1/statistics/reports
GET /api/v1/statistics/audit
```

### Análisis y Tendencias
```http
GET /api/v1/statistics/trends
```

## 📋 Parámetros de Consulta

### Filtros de Fecha
```javascript
// Por período predefinido
?period=today|week|month|quarter|year

// Por rango personalizado
?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z

// Combinado
?period=month&startDate=2024-01-01
```

## 📊 Estructura de Respuesta

### Dashboard Completo
```json
{
  "overview": {
    "totalUsers": 150,
    "activeUsers": 140,
    "totalMachinery": 25,
    "totalReports": 1200,
    "auditLogsTotal": 5000,
    "systemUptime": "24h 30m"
  },
  "users": {
    "totalUsers": 150,
    "usersByRole": [...],
    "topActiveUsers": [...],
    "recentRegistrations": [...]
  },
  "machinery": {
    "totalMachinery": 25,
    "machineryByType": [...],
    "topActiveMachinery": [...],
    "reportsByType": [...]
  },
  "trends": {
    "userGrowth": 15.2,
    "reportGrowth": 8.7,
    "activityGrowth": 12.3
  },
  "alerts": [
    {
      "type": "warning",
      "title": "Usuarios Inactivos",
      "message": "5 usuarios no han iniciado sesión en el último mes",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Estadísticas de Auditoría Mejoradas
```json
{
  "totalLogs": 5000,
  "logsToday": 45,
  "logsByAction": {
    "CREATE": 1200,
    "UPDATE": 1800,
    "DELETE": 300,
    "AUTH": 1500,
    "SYSTEM": 200
  },
  "logsByHour": [
    { "hour": 0, "count": 12 },
    { "hour": 1, "count": 8 },
    // ... 24 horas
  ],
  "logsByDay": [
    { "date": "2024-01-15", "count": 45 },
    { "date": "2024-01-14", "count": 38 }
    // ... últimos 30 días
  ],
  "securityEvents": [
    {
      "type": "AUTH",
      "count": 1500,
      "lastOccurrence": "2024-01-15T09:30:00Z"
    }
  ],
  "errorRate": 2.5,
  "averageLogsPerDay": 42.3,
  "peakActivity": {
    "hour": 14,
    "day": "2024-01-15",
    "count": 78
  },
  "trends": {
    "dailyGrowth": 5.2,
    "weeklyGrowth": 15.8,
    "monthlyGrowth": 23.1
  }
}
```

## 🔧 Implementación Técnica

### Arquitectura
```
src/statistics/
├── dto/
│   ├── statistics.dto.ts     # DTOs para todas las estadísticas
│   └── date-range.dto.ts     # DTO para filtros de fecha
├── statistics.controller.ts   # Controlador REST
├── statistics.service.ts     # Lógica de negocio
└── statistics.module.ts      # Módulo NestJS
```

### Servicios Integrados
- **UsersService**: Estadísticas de usuarios
- **MachineryService**: Métricas de maquinaria
- **OperatorsService**: Datos de operadores
- **AuditService**: Logs y eventos de seguridad
- **RolesService**: Información de roles

### Base de Datos
Utiliza queries optimizadas con:
- Agregaciones SQL nativas
- Índices en campos de fecha
- Consultas en paralelo para mejor rendimiento
- Sanitización de datos para evitar errores

## 📈 Casos de Uso

### 1. Dashboard Ejecutivo
Mostrar métricas clave para toma de decisiones:
```javascript
const stats = await fetch('/api/v1/statistics/dashboard?period=month');
// Usar stats.overview para KPIs principales
```

### 2. Análisis de Tendencias
Identificar patrones de crecimiento:
```javascript
const trends = await fetch('/api/v1/statistics/trends');
// Mostrar gráficos de crecimiento
```

### 3. Monitoreo de Seguridad
Supervisar eventos de auditoría:
```javascript
const audit = await fetch('/api/v1/statistics/audit');
// Alertar sobre eventos sospechosos
```

### 4. Optimización Operacional
Analizar uso de maquinaria:
```javascript
const machinery = await fetch('/api/v1/statistics/machinery?period=week');
// Identificar maquinaria subutilizada
```

## 🚨 Alertas del Sistema

El módulo genera alertas automáticas para:

### Usuarios
- Usuarios inactivos por más de 30 días
- Picos inusuales de registros
- Problemas de autenticación

### Maquinaria
- Máquinas sin reportes en 7 días
- Uso excesivo de combustible
- Mantenimientos pendientes

### Auditoría
- Actividad sospechosa
- Intentos de acceso fallidos
- Cambios de roles no autorizados

## 🔒 Seguridad y Permisos

### Niveles de Acceso
- **Superadmin**: Acceso completo a todas las estadísticas
- **Ingeniero**: Acceso a estadísticas operacionales
- **Inspector**: Acceso de solo lectura a métricas relevantes

### Protecciones
- Autenticación JWT requerida
- Validación de roles por endpoint
- Sanitización de datos sensibles
- Rate limiting para prevenir abuso

## 📋 Tareas Pendientes

### Próximas Mejoras
- [ ] Exportación a PDF/Excel
- [ ] Notificaciones en tiempo real
- [ ] Predicciones basadas en ML
- [ ] Comparativas entre períodos
- [ ] Métricas personalizables por usuario

### Optimizaciones
- [ ] Cache para consultas frecuentes
- [ ] Consultas asíncronas para mejor UX
- [ ] Compresión de respuestas grandes
- [ ] Paginación para datasets extensos

## 🧪 Testing

Ejecutar pruebas del módulo:
```bash
# Pruebas unitarias
npm test statistics

# Pruebas de integración
npm run test:e2e statistics

# Pruebas manuales con script
node test-statistics.js
```

## 📚 Referencias

- [NestJS Documentation](https://nestjs.com/)
- [TypeORM Query Builder](https://typeorm.io/select-query-builder)
- [JWT Authentication](https://jwt.io/)
- [SQL Optimization](https://use-the-index-luke.com/)

---

**Fecha de creación**: Noviembre 2024  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de Desarrollo GEIGV MuniSC