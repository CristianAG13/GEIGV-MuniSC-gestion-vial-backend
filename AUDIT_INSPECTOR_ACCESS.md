# Actualización de Permisos del Módulo de Auditoría

## Cambio Implementado

Se ha actualizado el sistema de permisos del módulo de auditoría para permitir que los usuarios con rol **inspector** puedan acceder a los logs de auditoría, además de los superadministradores.

## Archivos Modificados

### 1. Nuevo Guard: `AuditAccessGuard`
**Archivo**: `src/audit/guards/audit-access.guard.ts`

```typescript
// Roles permitidos para acceder al módulo de auditoría:
// - superadmin
// - super_admin  
// - inspector
```

### 2. Guard Original Actualizado: `SuperAdminGuard`
**Archivo**: `src/audit/guards/super-admin.guard.ts`

También se actualizó para incluir inspector como respaldo.

### 3. Controlador de Auditoría
**Archivo**: `src/audit/audit.controller.ts`

Todos los endpoints de consulta (`GET`) ahora usan `AuditAccessGuard`:
- `GET /api/v1/audit/logs` - Obtener logs con filtros
- `GET /api/v1/audit/stats` - Estadísticas de auditoría  
- `GET /api/v1/audit/logs/entity/:entity/:id` - Logs por entidad
- `GET /api/v1/audit/logs/user/:userId` - Logs por usuario
- `GET /api/v1/audit/users/activity-summary` - Resumen de actividad

### 4. Módulo de Auditoría
**Archivo**: `src/audit/audit.module.ts`

Se registró el nuevo `AuditAccessGuard` como provider.

## Roles con Acceso al Módulo de Auditoría

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| `superadmin` | ✅ Completo | Acceso total a todos los logs y estadísticas |
| `inspector` | ✅ Solo lectura | Puede ver logs y estadísticas para inspeccionar actividad |
| `ingeniero` | ❌ Sin acceso | No tiene permisos de auditoría |
| `operario` | ❌ Sin acceso | No tiene permisos de auditoría |
| `invitado` | ❌ Sin acceso | No tiene permisos de auditoría |

## Funcionalidades Disponibles para Inspector

Los inspectores pueden:

1. **Ver Logs de Auditoría**:
   ```http
   GET /api/v1/audit/logs?page=1&limit=20&entity=usuarios
   ```

2. **Ver Estadísticas del Sistema**:
   ```http
   GET /api/v1/audit/stats
   ```

3. **Ver Logs por Entidad Específica**:
   ```http
   GET /api/v1/audit/logs/entity/usuarios/123
   ```

4. **Ver Actividad por Usuario**:
   ```http
   GET /api/v1/audit/logs/user/456
   ```

5. **Ver Resumen de Actividad**:
   ```http
   GET /api/v1/audit/users/activity-summary
   ```

## Permisos NO Incluidos

Los inspectores **NO** pueden:
- Crear logs manualmente (`POST /audit/log`)
- Modificar configuraciones del sistema
- Eliminar logs de auditoría
- Acceder a módulos de administración de usuarios o roles

## Validación de Permisos en Frontend

Para validar en el frontend si un usuario puede acceder al módulo de auditoría:

```javascript
// Verificar acceso al módulo de auditoría
const canAccessAudit = user.roles.some(role => 
  role.name === 'superadmin' || 
  role.name === 'super_admin' ||
  role.name === 'inspector'
);

if (canAccessAudit) {
  // Mostrar enlace/botón del módulo de auditoría
  console.log('Usuario puede acceder al módulo de auditoría');
}
```

## Casos de Uso para Inspector

1. **Supervisión de Actividad**: Ver qué acciones han realizado los operarios
2. **Control de Calidad**: Revisar cambios en reportes y maquinaria
3. **Seguimiento de Usuarios**: Monitorear actividad de usuarios específicos
4. **Análisis de Tendencias**: Ver estadísticas de uso del sistema
5. **Investigación de Incidentes**: Revisar logs para resolver problemas

## Mensajes de Error

Si un usuario sin permisos intenta acceder:

```json
{
  "statusCode": 403,
  "message": "Acceso denegado: solo superadministradores e inspectores pueden acceder a los logs de auditoría",
  "error": "Forbidden"
}
```

## Testing

Para probar el acceso como inspector:

1. **Crear/Obtener usuario inspector**:
   ```http
   POST /api/v1/auth/login
   {
     "email": "inspector@ejemplo.com",
     "password": "password123"
   }
   ```

2. **Usar el token para acceder a auditoría**:
   ```http
   GET /api/v1/audit/logs
   Authorization: Bearer {token-de-inspector}
   ```

3. **Verificar respuesta exitosa** (status 200) en lugar de 403.

## Consideraciones de Seguridad

- Los inspectores tienen acceso de **solo lectura** a los logs
- No pueden modificar o eliminar información de auditoría
- El acceso está limitado a endpoints específicos de consulta
- Todos los accesos siguen siendo registrados en los logs de auditoría

Este cambio permite a los inspectores cumplir con sus funciones de supervisión y control de calidad sin comprometer la seguridad del sistema.