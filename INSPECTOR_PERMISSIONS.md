# 👮 Permisos del Inspector - Documentación

## 📋 Resumen

Un **inspector** tiene los siguientes permisos en el sistema:

### ✅ Endpoints Accesibles

#### 1. **GET `/api/v1/users/me`** ✅
- **Descripción**: Obtener información del usuario actual
- **Propósito**: Permite al inspector obtener su propio ID y datos para rellenar boletas
- **Roles permitidos**: `superadmin`, `ingeniero`, `inspector`
- **Respuesta**:
```json
{
  "id": 5,
  "name": "Juan",
  "lastname": "Pérez",
  "email": "inspector@test.com",
  "roles": ["inspector"]
}
```

#### 2. **POST `/api/v1/machinery/rental-report`** ✅
- **Descripción**: Crear reportes de alquiler (boletas de alquiler)
- **Propósito**: Permite al inspector crear boletas de alquiler
- **Roles permitidos**: `superadmin`, `ingeniero`, `inspector`
- **Nota**: El `instructorIngenieroId` se asigna automáticamente al ID del usuario actual si no se especifica

#### 3. **GET `/api/v1/machinery/rental-report`** ✅
- **Descripción**: Listar reportes de alquiler
- **Propósito**: Permite al inspector ver todos los reportes de alquiler
- **Roles permitidos**: `superadmin`, `ingeniero`, `inspector`

#### 4. **GET `/api/v1/machinery/rental-report/:id`** ✅
- **Descripción**: Obtener detalles de un reporte de alquiler específico
- **Roles permitidos**: `superadmin`, `ingeniero`, `inspector`

#### 5. **PATCH `/api/v1/machinery/rental-report/:id`** ✅
- **Descripción**: Actualizar un reporte de alquiler
- **Roles permitidos**: `superadmin`, `ingeniero`, `inspector`

#### 6. **GET `/api/v1/audit/logs`** ✅
- **Descripción**: Obtener logs de auditoría (solo los propios)
- **Roles permitidos**: `superadmin`, `ingeniero`, `inspector`
- **Filtros automáticos para inspectores**:
  - Solo ve registros donde él es el autor (`userId`)
  - No puede ver registros de otros usuarios

#### 7. **GET `/api/v1/audit/my-logs`** ✅
- **Descripción**: Obtener solo los logs propios del inspector
- **Roles permitidos**: `superadmin`, `ingeniero`, `inspector`

---

## 🚫 Endpoints NO Accesibles

Los inspectores **NO** tienen acceso a:

### Gestión de Usuarios
- ❌ `POST /api/v1/users` - Crear usuarios (solo superadmin)
- ❌ `GET /api/v1/users` - Listar todos los usuarios (solo superadmin e ingeniero)
- ❌ `GET /api/v1/users/:id` - Ver detalles de otro usuario (solo superadmin e ingeniero)
- ❌ `PATCH /api/v1/users/:id` - Modificar usuarios (solo superadmin)
- ❌ `DELETE /api/v1/users/:id` - Eliminar usuarios (solo superadmin)

### Gestión de Roles
- ❌ `POST /api/v1/users/:id/roles` - Asignar roles (solo superadmin)
- ❌ `DELETE /api/v1/users/:id/roles/:roleId` - Remover roles (solo superadmin)

### Auditoría Completa
- ❌ `GET /api/v1/audit/stats` - Estadísticas de auditoría (solo superadmin e ingeniero)
- ❌ Ver logs de otros usuarios (filtrado automático)

---

## 🔧 Configuración Actual

### Controlador de Usuarios (`users.controller.ts`)

```typescript
/**
 * Obtener información del usuario actual (inspector/ingeniero)
 * Este endpoint permite a inspectores e ingenieros obtener su propio ID y datos
 * para utilizarlo al rellenar boletas
 */
@Get('me')
@UseGuards(RolesGuard)
@Roles('superadmin', 'ingeniero', 'inspector') // ✅ Inspector incluido
getMyInfo(@CurrentUser() user: any) {
  return this.usersService.getMyInfo(user.id);
}
```

### Controlador de Auditoría (`audit.controller.ts`)

```typescript
@Get('logs')
@UseGuards(RolesGuard)
@Roles('superadmin', 'ingeniero', 'inspector') // ✅ Inspector incluido
async getAuditLogs(
  @CurrentUser() user: any,
  @Query() filters: FilterAuditLogsDto,
) {
  // Filtrado automático: inspectores solo ven sus propios logs
  return this.auditService.getFilteredLogs(filters, user);
}
```

---

## 🐛 Solución de Problemas

### Error 403 (Forbidden)

Si un inspector recibe un error 403 al acceder a `/api/v1/users/me`, verificar:

#### 1. **Token JWT válido**
```bash
# Verificar que el token no esté expirado (tiene 1 hora de validez)
# Hacer login nuevamente si es necesario
```

#### 2. **Rol asignado correctamente**
```sql
-- Verificar roles del usuario en la base de datos
SELECT u.id, u.email, r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.userId
LEFT JOIN roles r ON ur.roleId = r.id
WHERE u.email = 'inspector@test.com';
```

Debe retornar:
```
id | email              | role
5  | inspector@test.com | inspector
```

#### 3. **Token contiene los roles**
El payload del JWT debe incluir los roles:
```json
{
  "sub": 5,
  "email": "inspector@test.com",
  "roles": [
    {
      "id": 3,
      "name": "inspector"
    }
  ],
  "iat": 1699999999,
  "exp": 1700003599
}
```

#### 4. **Verificar Guards**
El `RolesGuard` debe estar funcionando correctamente:
- Extrae los roles del usuario desde `user.roles`
- Compara con los roles requeridos usando `role.name`
- Permite acceso si hay coincidencia

---

## 🧪 Pruebas

### Script de Prueba
Ejecutar el script de prueba para verificar el acceso:

```bash
node test-inspector-me-endpoint.js
```

### Prueba Manual con cURL

```bash
# 1. Login
TOKEN=$(curl -X POST https://geigv-munisc-gestion-vial-backend-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"inspector@test.com","password":"Inspector123!"}' \
  | jq -r '.access_token')

# 2. Obtener información propia
curl https://geigv-munisc-gestion-vial-backend-production.up.railway.app/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Respuesta Esperada

```json
{
  "id": 5,
  "name": "Juan",
  "lastname": "Pérez",
  "email": "inspector@test.com",
  "roles": ["inspector"]
}
```

---

## 📝 Notas Importantes

1. **Tiempo de expiración del token**: 1 hora
2. **Renovación de token**: Usar `/api/v1/auth/refresh-token` antes de que expire
3. **Acceso a datos propios**: Los inspectores solo ven sus propios registros de auditoría
4. **Jerarquía de roles**:
   - `superadmin`: Acceso total
   - `ingeniero`: Acceso a gestión y visualización
   - `inspector`: Acceso limitado (solo datos propios)
   - `invitado`: Acceso mínimo

---

## 🔄 Última Actualización
- **Fecha**: 2025-11-12
- **Estado**: ✅ Configurado correctamente
- **Verificado**: Endpoint `/me` accesible para inspectores
