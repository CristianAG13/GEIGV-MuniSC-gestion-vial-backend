# 🔒 Restricciones de Operarios - Implementación

## 📋 Resumen

Se ha implementado un sistema de restricciones para que los usuarios con rol **"operarios"** solo puedan ver y trabajar con **sus propios datos** (boletas municipales y de alquiler).

---

## 🎯 Funcionalidad Implementada

### 1. **Restricciones para Operarios**

Los operarios ahora tienen las siguientes limitaciones:

#### ✅ **Reportes Municipales (Boletas Municipales)**
- ✅ Solo pueden **crear** reportes asociados a su perfil de operario
- ✅ Solo pueden **ver** sus propios reportes
- ✅ Solo pueden **editar** sus propios reportes
- ❌ No pueden ver reportes de otros operarios

#### ✅ **Reportes de Alquiler (Boletas de Alquiler)**
- ✅ Solo pueden **crear** reportes de alquiler asociados a su perfil
- ✅ Solo pueden **ver** sus propios reportes de alquiler
- ✅ Solo pueden **editar** sus propios reportes de alquiler
- ❌ No pueden ver reportes de alquiler de otros operarios

---

## 🔧 Cambios Técnicos Realizados

### 1. **Nuevo Decorador: `@CurrentUser()`**

Se creó un decorador personalizado para obtener fácilmente el usuario autenticado:

**Archivo:** `src/auth/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Uso:**
```typescript
@Get('some-endpoint')
async someMethod(@CurrentUser() user: any) {
  // user contiene { id, email, roles: [{ id, name }] }
}
```

---

### 2. **Nuevo Método en OperatorsService**

**Archivo:** `src/operators/operators.service.ts`

Se agregó un método para encontrar un operario por su `userId`:

```typescript
async findByUserId(userId: number): Promise<Operator | null> {
  const operator = await this.operatorsRepository.findOne({
    where: { userId },
    relations: ['user']
  });

  return operator;
}
```

---

### 3. **Modificaciones en MachineryService**

**Archivo:** `src/machinery/machinery.service.ts`

Se modificaron los siguientes métodos para aceptar un parámetro opcional `operatorId`:

#### `findAllReports(operatorId?: number)`
```typescript
findAllReports(operatorId?: number) {
  const whereClause = operatorId ? { operador: { id: operatorId } } : {};
  
  return this.reportRepo.find({
    where: whereClause,
    relations: { operador: true, maquinaria: true, materiales: true },
    order: { fecha: 'DESC', id: 'DESC' },
  });
}
```

#### `findAllRentalReports(operatorId?: number)`
```typescript
findAllRentalReports(operatorId?: number) {
  const whereClause = operatorId ? { operador: { id: operatorId } } : {};
  
  return this.rentalRepo.find({ 
    where: whereClause,
    relations: ['operador'],
    order: { fecha: 'DESC', id: 'DESC' },
  });
}
```

---

### 4. **Modificaciones en MachineryController**

**Archivo:** `src/machinery/machinery.controller.ts`

Se agregaron validaciones en los siguientes endpoints:

#### **POST /machinery/report** (Crear Reporte Municipal)
```typescript
@Post('report')
async createReport(@Body() dto: CreateReportDto, @CurrentUser() user: any) {
  // Si es operario, solo puede crear reportes para sí mismo
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    const operator = await this.operatorsService.findByUserId(user.id);
    if (!operator) {
      throw new ForbiddenException('No tienes un perfil de operario asociado');
    }
    
    // Forzar que el operadorId sea el del usuario actual
    dto.operadorId = operator.id;
  }
  
  return this.service.createReport(dto);
}
```

#### **GET /machinery/report** (Listar Reportes Municipales)
```typescript
@Get('report')
async findAllReports(@CurrentUser() user: any) {
  // Si es operario, solo puede ver sus propios reportes
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    const operator = await this.operatorsService.findByUserId(user.id);
    if (!operator) {
      throw new ForbiddenException('No tienes un perfil de operario asociado');
    }
    return this.service.findAllReports(operator.id);
  }
  
  // Para otros roles, ver todos los reportes
  return this.service.findAllReports();
}
```

#### **PATCH /machinery/report/:id** (Actualizar Reporte Municipal)
```typescript
@Patch('report/:id(\\d+)')
async updateReport(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: any,
  @CurrentUser() user: any,
) {
  // Si es operario, verificar que el reporte le pertenezca
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    const operator = await this.operatorsService.findByUserId(user.id);
    if (!operator) {
      throw new ForbiddenException('No tienes un perfil de operario asociado');
    }
    
    const report = await this.service.findReportById(id);
    if (report.operador?.id !== operator.id) {
      throw new ForbiddenException('No tienes permiso para editar este reporte');
    }
  }
  
  return this.service.updateReport(id, dto);
}
```

#### **POST /machinery/rental-report** (Crear Reporte de Alquiler)
```typescript
@Post('rental-report')
async createRentalReport(@Body() dto: CreateRentalReportDto, @CurrentUser() user: any) {
  // Si es operario, solo puede crear reportes de alquiler para sí mismo
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    const operator = await this.operatorsService.findByUserId(user.id);
    if (!operator) {
      throw new ForbiddenException('No tienes un perfil de operario asociado');
    }
    
    // Forzar que el operadorId sea el del usuario actual
    dto.operadorId = operator.id;
  }
  
  return this.service.createRentalReport(dto);
}
```

#### **GET /machinery/rental-report** (Listar Reportes de Alquiler)
```typescript
@Get('rental-report')
async findAllRentalReports(@CurrentUser() user: any) {
  // Si es operario, solo puede ver sus propios reportes de alquiler
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    const operator = await this.operatorsService.findByUserId(user.id);
    if (!operator) {
      throw new ForbiddenException('No tienes un perfil de operario asociado');
    }
    return this.service.findAllRentalReports(operator.id);
  }
  
  // Para otros roles, ver todos los reportes de alquiler
  return this.service.findAllRentalReports();
}
```

#### **PATCH /machinery/rental-report/:id** (Actualizar Reporte de Alquiler)
```typescript
@Patch('rental-report/:id(\\d+)')
async updateRentalReport(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: any,
  @CurrentUser() user: any,
) {
  // Si es operario, verificar que el reporte de alquiler le pertenezca
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    const operator = await this.operatorsService.findByUserId(user.id);
    if (!operator) {
      throw new ForbiddenException('No tienes un perfil de operario asociado');
    }
    
    const rentalReport = await this.service.findRentalReportById(id);
    if (rentalReport.operador?.id !== operator.id) {
      throw new ForbiddenException('No tienes permiso para editar este reporte de alquiler');
    }
  }
  
  return this.service.updateRentalReport(id, dto);
}
```

---

### 5. **Actualización de MachineryModule**

**Archivo:** `src/machinery/machinery.module.ts`

Se importó el `OperatorsModule` para poder usar el `OperatorsService`:

```typescript
import { OperatorsModule } from 'src/operators/operators.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...]),
    OperatorsModule, // 👈 NUEVO
  ],
  ...
})
```

---

## 🔐 Flujo de Seguridad

### Para Operarios:

1. **Usuario se autentica** → Recibe JWT con roles
2. **Hace una petición** a crear/listar/editar reportes
3. **Backend verifica** si el usuario tiene rol `"operario"`
4. **Si es operario:**
   - Se busca su perfil de operador en la base de datos
   - Se **fuerza** que solo pueda trabajar con reportes asociados a su `operatorId`
   - Si intenta acceder a reportes de otros, recibe `403 Forbidden`
5. **Si no es operario** (admin, superadmin, etc.):
   - Puede ver y trabajar con todos los reportes

---

## 📊 Tabla de Permisos

| Rol | Ver Todos los Reportes | Crear Reportes Propios | Crear Reportes de Otros | Editar Reportes Propios | Editar Reportes de Otros |
|-----|------------------------|------------------------|-------------------------|--------------------------|---------------------------|
| **operario** | ❌ | ✅ | ❌ | ✅ | ❌ |
| **ingeniero** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **inspector** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **superadmin** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Pruebas Recomendadas

### 1. **Crear un usuario operario:**
```bash
POST /auth/register
{
  "email": "operario@test.com",
  "password": "123456",
  "name": "Juan",
  "lastname": "Pérez"
}
```

### 2. **Asignar rol "operario" al usuario** (desde superadmin)

### 3. **Asociar usuario con un operador** (desde superadmin):
```bash
PATCH /operators/{operatorId}/associate-user/{userId}
```

### 4. **Iniciar sesión como operario:**
```bash
POST /auth/login
{
  "email": "operario@test.com",
  "password": "123456"
}
```

### 5. **Intentar crear un reporte municipal:**
```bash
POST /machinery/report
Authorization: Bearer {token}
{
  "fecha": "2024-01-15",
  "operadorId": 999, // ❌ Esto será IGNORADO y forzado al operadorId correcto
  "maquinariaId": 1,
  ...
}
```

### 6. **Listar reportes:**
```bash
GET /machinery/report
Authorization: Bearer {token}
# ✅ Solo verá sus propios reportes
```

### 7. **Intentar editar reporte de otro operario:**
```bash
PATCH /machinery/report/123
Authorization: Bearer {token}
{
  "tipoActividad": "Nueva actividad"
}
# ❌ Si el reporte pertenece a otro operario, recibirá 403 Forbidden
```

---

## 📝 Notas Importantes

1. **Operario sin perfil asociado:**
   - Si un usuario tiene rol "operario" pero **no está asociado** a un operador en la tabla `operators`, recibirá un error `403 Forbidden` con el mensaje: _"No tienes un perfil de operario asociado"_

2. **Asociación usuario-operador:**
   - Es **CRÍTICO** que cada usuario con rol "operario" tenga su campo `userId` configurado en la tabla `operators`
   - Esto se hace mediante el endpoint: `PATCH /operators/:id/associate-user/:userId`

3. **Compatibilidad con otros roles:**
   - Los cambios **NO afectan** a otros roles (admin, superadmin, ingeniero, inspector)
   - Estos roles siguen teniendo acceso completo a todos los reportes

4. **Frontend:**
   - El frontend debe **ocultar** o **deshabilitar** opciones no permitidas para operarios
   - Ejemplo: No mostrar selector de operador al crear reportes
   - El backend siempre fuerza el operadorId correcto por seguridad

---

## 🚀 Próximos Pasos

- [ ] Actualizar el frontend para reflejar estas restricciones
- [ ] Agregar tests unitarios y e2e para validar las restricciones
- [ ] Documentar la asociación usuario-operador en el manual de administrador
- [ ] Considerar agregar un endpoint para que el operario vea su propio perfil

---

## 📞 Soporte

Si tienes dudas o problemas con la implementación, revisa:
- Este documento
- El código fuente en los archivos mencionados
- Los logs del servidor (incluyen mensajes descriptivos)

---

**Fecha de implementación:** Noviembre 4, 2025  
**Versión:** 1.0  
**Autor:** Sistema de Gestión Vial
