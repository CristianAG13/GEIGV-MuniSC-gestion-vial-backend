# Sistema de Auditoría - Implementación Backend NestJS

## Descripción General

El sistema de auditoría está implementado como un módulo global en NestJS que registra automáticamente todas las operaciones CRUD y eventos importantes del sistema. Los **superadministradores** e **inspectores** tienen acceso a los logs de auditoría.

## Arquitectura del Sistema

### Componentes Principales

1. **AuditLog Entity** - Entidad que almacena los logs en la base de datos
2. **AuditService** - Servicio principal para crear y consultar logs
3. **AuditController** - Controlador con endpoints para consultar logs (superadmin e inspector)
4. **AuditInterceptor** - Interceptor para logging automático
5. **AuditAccessGuard** - Guard que protege los endpoints de auditoría (permite superadmin e inspector)

## Base de Datos

### Tabla `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'AUTH', 'SYSTEM', 'ROLE_CHANGE'),
  entity ENUM('usuarios', 'transporte', 'operadores', 'reportes', 'roles', 'solicitudes', 'system', 'authentication'),
  entityId VARCHAR(255),
  userId VARCHAR(255),
  userEmail VARCHAR(255),
  userRoles TEXT,
  description TEXT NOT NULL,
  changesBefore JSONB,
  changesAfter JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userAgent VARCHAR(1000),
  ip VARCHAR(45),
  url VARCHAR(500)
);
```

## Endpoints de API

### Consulta de Logs (Superadmin e Inspector)
- `GET /audit/logs` - Obtener logs con filtros y paginación
- `GET /audit/stats` - Obtener estadísticas de auditoría
- `GET /audit/export` - Exportar logs a CSV
- `GET /audit/logs/entity/:entity/:id` - Logs por entidad específica
- `GET /audit/logs/user/:userId` - Logs por usuario específico

### Registro de Logs (Interno)
- `POST /audit/log` - Crear un nuevo log de auditoría

## Cómo Implementar en tus Controladores

### Opción 1: Usando el Decorator @Audit (Automático)

```typescript
import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor, Audit } from '../audit/interceptors/audit.interceptor';
import { AuditEntity, AuditAction } from '../audit/entities/audit-log.entity';

@Controller('users')
@UseInterceptors(AuditInterceptor) // Aplicar el interceptor
export class UsersController {
  
  @Post()
  @Audit(AuditEntity.USUARIOS, AuditAction.CREATE) // Descripción generada automáticamente
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Audit(AuditEntity.USUARIOS, AuditAction.UPDATE) // Descripción generada automáticamente
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Audit(AuditEntity.USUARIOS, AuditAction.DELETE) // Descripción generada automáticamente
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

### Opción 2: Usando el Servicio Directamente (Manual)

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuditEntity } from '../audit/entities/audit-log.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService, // Inyectar el servicio
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const result = await this.usersService.create(createUserDto);
    
    // Registrar en auditoría
    await this.auditService.logCreate(
      AuditEntity.USUARIOS,
      result,
      `Se creó el usuario ${result.email}`,
      req.user?.id,
      req.user?.email,
      req.user?.roles?.map(r => r.name),
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.url,
      }
    );
    
    return result;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    // Obtener datos actuales antes de actualizar
    const currentUser = await this.usersService.findOne(+id);
    
    const result = await this.usersService.update(+id, updateUserDto);
    
    // Registrar en auditoría
    await this.auditService.logUpdate(
      AuditEntity.USUARIOS,
      id,
      currentUser,
      result,
      `Se actualizó el usuario ${result.email}`,
      req.user?.id,
      req.user?.email,
      req.user?.roles?.map(r => r.name)
    );
    
    return result;
  }
}
```

### Opción 3: En el Servicio (Recomendado)

```typescript
// users.service.ts
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuditEntity } from '../audit/entities/audit-log.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser?: any) {
    const user = await this.userRepository.save(createUserDto);
    
    // Auditoría
    await this.auditService.logCreate(
      AuditEntity.USUARIOS,
      user,
      `Se creó el usuario ${user.email}`,
      currentUser?.id,
      currentUser?.email,
      currentUser?.roles?.map(r => r.name)
    );
    
    return user;
  }

  async assignRoles(userId: number, assignRolesDto: AssignRolesDto, currentUser?: any) {
    const user = await this.findOne(userId);
    const oldRoles = user.roles.map(r => r.name);
    
    // Asignar nuevos roles
    const updatedUser = await this.performRoleAssignment(userId, assignRolesDto);
    const newRoles = updatedUser.roles.map(r => r.name);
    
    // Log específico para cambios de roles
    await this.auditService.logRoleChange(
      user.id.toString(),
      user.email,
      oldRoles,
      newRoles,
      `Se cambiaron los roles del usuario ${user.email}`,
      { assignedBy: currentUser?.email }
    );
    
    return updatedUser;
  }
}
```

## Logging de Eventos de Autenticación

En tu `AuthService`, puedes agregar logs de autenticación:

```typescript
// auth.service.ts
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, request: any) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (user) {
      const tokens = await this.generateTokens(user);
      
      // Log exitoso
      await this.auditService.logAuth(
        `Usuario ${user.email} inició sesión exitosamente`,
        user.id.toString(),
        user.email,
        {
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          success: true,
        }
      );
      
      return tokens;
    }
    
    // Log fallido
    await this.auditService.logAuth(
      `Intento de inicio de sesión fallido para ${loginDto.email}`,
      undefined,
      loginDto.email,
      {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        success: false,
        reason: 'Invalid credentials',
      }
    );
    
    throw new UnauthorizedException('Credenciales inválidas');
  }

  async logout(user: any, request: any) {
    await this.auditService.logAuth(
      `Usuario ${user.email} cerró sesión`,
      user.id.toString(),
      user.email,
      {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      }
    );
  }
}
```

## Descripciones Automáticas Específicas

El sistema de auditoría genera automáticamente descripciones específicas para diferentes entidades cuando no se proporciona una descripción estática en el decorador `@Audit`.

### Para Usuarios (AuditEntity.USUARIOS)

**Ejemplos de descripciones generadas automáticamente:**

- **CREATE**: `Se creó usuario: martin@ejemplo.com (ID: 123)`
- **UPDATE**: `Se actualizó usuario: martin@ejemplo.com (ID: 123)`
- **DELETE**: `Se eliminó usuario: martin@ejemplo.com (ID: 123)`
- **ROLE_CHANGE**: `Se modificaron roles del usuario: martin@ejemplo.com (ID: 123)`

### Para Operadores (AuditEntity.OPERADORES)

**Ejemplos de descripciones generadas automáticamente:**

- **CREATE**: `Se creó operador: Juan Pérez (CC: 12345678) (ID: 456)`
- **UPDATE**: `Se actualizó operador: Juan Pérez (CC: 12345678) (ID: 456)`
- **DELETE**: `Se eliminó operador: Juan Pérez (CC: 12345678) (ID: 456)`
- **UPDATE (Asociar Usuario)**: `Se asoció usuario con operador: Juan Pérez (CC: 12345678) (ID: 456)`
- **UPDATE (Remover Asociación)**: `Se removió asociación de usuario del operador: Juan Pérez (CC: 12345678) (ID: 456)`

### Uso Recomendado

```typescript
@Controller('users')
@UseInterceptors(AuditInterceptor)
export class UsersController {
  
  // ✅ Sin descripción estática - usa descripción automática específica
  @Post()
  @Audit(AuditEntity.USUARIOS, AuditAction.CREATE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ❌ Con descripción estática - menos específica
  @Post()
  @Audit(AuditEntity.USUARIOS, AuditAction.CREATE, 'Usuario creado')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

**Ventajas de las descripciones automáticas:**
- Incluyen el email del usuario específico
- Son consistentes en todo el sistema
- Se adaptan automáticamente a los datos de la entidad
- Reducen código duplicado

## Consulta de Logs desde el Frontend

### Obtener Logs con Filtros

```javascript
// Frontend - servicio de auditoría
const auditService = {
  async getLogs(filters = {}) {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...filters
    });
    
    const response = await fetch(`/api/audit/logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  },

  async getStats() {
    const response = await fetch('/api/audit/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.json();
  },

  async exportLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    
    const response = await fetch(`/api/audit/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
};
```

## Filtros Disponibles

```typescript
interface FilterAuditLogsDto {
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH' | 'SYSTEM' | 'ROLE_CHANGE';
  entity?: 'usuarios' | 'transporte' | 'operadores' | 'reportes' | 'roles' | 'solicitudes' | 'system' | 'authentication';
  entityId?: string;
  userId?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // Busca en la descripción
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

## Configuración de Seguridad

Los usuarios con rol `superadmin` o `inspector` pueden acceder a los endpoints de consulta:

```typescript
// Verificar en el frontend antes de mostrar la interfaz
const canAccessAudit = user.roles.some(role => 
  role.name === 'superadmin' || 
  role.name === 'super_admin' ||
  role.name === 'inspector'
);

if (canAccessAudit) {
  // Mostrar módulo de auditoría
}
```

## Estructura de Respuesta de Logs

```json
{
  "data": [
    {
      "id": "uuid",
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
      "timestamp": "2025-10-06T10:30:00Z",
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.100",
      "url": "/api/users",
      "user": {
        "id": 456,
        "email": "admin@example.com",
        "name": "Admin User"
      }
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 10,
  "totalPages": 150
}
```

## Mejores Prácticas

### 1. No Registrar Información Sensible
- Las contraseñas se marcan automáticamente como `[REDACTED]`
- Evita registrar tokens, secrets, etc.

### 2. Usar Descripciones Descriptivas
```typescript
await this.auditService.logUpdate(
  AuditEntity.USUARIOS,
  userId,
  oldData,
  newData,
  `Administrador ${currentUser.email} actualizó el perfil del usuario ${user.email}` // ✅ Descriptivo
);
```

### 3. Gestión de Errores
El sistema de auditoría no debe fallar las operaciones principales:

```typescript
try {
  await this.auditService.logCreate(...);
} catch (error) {
  // Log el error pero no interrumpir el flujo
  console.error('Audit logging failed:', error);
}
```

## Monitoreo y Alertas

### Consultas útiles para monitoreo:

```sql
-- Actividad por usuario en las últimas 24 horas
SELECT userEmail, COUNT(*) as actions
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL 1 DAY
GROUP BY userEmail
ORDER BY actions DESC;

-- Eliminaciones recientes
SELECT * FROM audit_logs 
WHERE action = 'DELETE' 
AND timestamp >= NOW() - INTERVAL 7 DAY
ORDER BY timestamp DESC;

-- Cambios de roles
SELECT * FROM audit_logs 
WHERE action = 'ROLE_CHANGE'
ORDER BY timestamp DESC
LIMIT 50;
```

---

Para más información técnica, consulta el código fuente en `src/audit/`.