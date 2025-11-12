# 🔧 Fix: Inspector puede crear boletas de alquiler

## 📋 Problema Original

El inspector no tenía permisos explícitos para crear boletas de alquiler en el endpoint `POST /api/v1/machinery/rental-report`.

## ✅ Solución Implementada

Se agregaron decoradores `@Roles()` explícitos a los endpoints de reportes de alquiler y reportes municipales para garantizar que el inspector tenga los permisos necesarios.

---

## 🔨 Cambios Realizados

### 1. **Endpoints de Reportes de Alquiler** (rental-report)

Se agregó el decorador `@Roles('superadmin', 'ingeniero', 'inspector')` a los siguientes endpoints:

#### ✅ POST `/api/v1/machinery/rental-report` (Crear)
```typescript
@Post('rental-report')
@Roles('superadmin', 'ingeniero', 'inspector')
@Audit(AuditEntity.REPORTES, AuditAction.CREATE)
async createRentalReport(@Body() dto: CreateRentalReportDto, @CurrentUser() user: any) {
  // El instructorIngenieroId se asigna automáticamente al usuario actual
  if (!dto.instructorIngenieroId) {
    dto.instructorIngenieroId = user.id;
  }
  return this.service.createRentalReport(dto);
}
```

**Características:**
- ✅ Inspector puede crear boletas de alquiler
- ✅ El `instructorIngenieroId` se asigna automáticamente al ID del usuario actual si no se especifica
- ✅ Se registra en auditoría

#### ✅ GET `/api/v1/machinery/rental-report` (Listar)
```typescript
@Get('rental-report')
@Roles('superadmin', 'ingeniero', 'inspector')
async findAllRentalReports(@CurrentUser() user: any) {
  // Operarios solo ven sus propios reportes
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    return this.service.findAllRentalReports(user.id);
  }
  // Inspector, ingeniero y superadmin ven todos los reportes
  return this.service.findAllRentalReports();
}
```

#### ✅ GET `/api/v1/machinery/rental-report/:id` (Ver detalle)
```typescript
@Get('rental-report/:id(\\d+)')
@Roles('superadmin', 'ingeniero', 'inspector')
findRentalReportById(@Param('id', ParseIntPipe) id: number) {
  return this.service.findRentalReportById(id);
}
```

#### ✅ PATCH `/api/v1/machinery/rental-report/:id` (Actualizar)
```typescript
@Patch('rental-report/:id(\\d+)')
@Roles('superadmin', 'ingeniero', 'inspector')
@Audit(AuditEntity.REPORTES, AuditAction.UPDATE)
async updateRentalReport(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: any,
  @CurrentUser() user: any,
) {
  // Verificación de propiedad para operarios
  if (user.roles?.some((r: any) => r.name === 'operario')) {
    const rentalReport = await this.service.findRentalReportById(id);
    if (rentalReport.instructorIngeniero?.id !== user.id) {
      throw new ForbiddenException('No tienes permiso para editar este reporte de alquiler');
    }
  }
  return this.service.updateRentalReport(id, dto);
}
```

---

### 2. **Endpoints de Reportes Municipales** (report)

Para mantener consistencia, también se agregó el decorador `@Roles()` a los reportes municipales:

#### ✅ POST `/api/v1/machinery/report` (Crear)
```typescript
@Post('report')
@Roles('superadmin', 'ingeniero', 'inspector', 'operario')
@Audit(AuditEntity.REPORTES, AuditAction.CREATE)
async createReport(@Body() dto: CreateReportDto, @CurrentUser() user: any) {
  // Lógica existente para operarios
}
```

#### ✅ GET `/api/v1/machinery/report` (Listar)
```typescript
@Get('report')
@Roles('superadmin', 'ingeniero', 'inspector', 'operario')
async findAllReports(@CurrentUser() user: any) {
  // Lógica existente para operarios
}
```

#### ✅ GET `/api/v1/machinery/report/:id` (Ver detalle)
```typescript
@Get('report/:id(\\d+)')
@Roles('superadmin', 'ingeniero', 'inspector', 'operario')
findReportById(@Param('id', ParseIntPipe) id: number) {
  return this.service.findReportById(id);
}
```

#### ✅ PATCH `/api/v1/machinery/report/:id` (Actualizar)
```typescript
@Patch('report/:id(\\d+)')
@Roles('superadmin', 'ingeniero', 'inspector', 'operario')
@Audit(AuditEntity.REPORTES, AuditAction.UPDATE)
async updateReport(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateReportDto,
  @CurrentUser() user: any,
) {
  // Lógica existente para operarios
}
```

---

## 📝 Documentación Actualizada

Se actualizó el archivo `INSPECTOR_PERMISSIONS.md` para reflejar los nuevos permisos:

### Permisos del Inspector

#### ✅ Reportes de Alquiler
- ✅ Crear boletas de alquiler
- ✅ Listar todas las boletas de alquiler
- ✅ Ver detalles de boletas de alquiler
- ✅ Actualizar boletas de alquiler

#### ✅ Reportes Municipales
- ✅ Crear boletas municipales
- ✅ Listar todas las boletas municipales
- ✅ Ver detalles de boletas municipales
- ✅ Actualizar boletas municipales

#### ✅ Auditoría
- ✅ Ver sus propios logs de auditoría
- ✅ Ver estadísticas de auditoría (si es necesario)

---

## 🧪 Script de Prueba

Se creó el script `test-inspector-rental-report.js` para verificar que el inspector puede:

1. ✅ Hacer login correctamente
2. ✅ Obtener su información (`/users/me`)
3. ✅ Crear boletas de alquiler (`POST /machinery/rental-report`)
4. ✅ Listar boletas de alquiler (`GET /machinery/rental-report`)

### Ejecutar el Script

```bash
node test-inspector-rental-report.js
```

**Nota:** Asegúrate de que el servidor esté corriendo en `http://localhost:3000` y que las credenciales del inspector en el script sean correctas.

---

## 🔐 Jerarquía de Permisos

| Rol | Reportes Municipales | Reportes de Alquiler | Auditoría | Gestión Usuarios |
|-----|---------------------|---------------------|-----------|------------------|
| **superadmin** | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos |
| **ingeniero** | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Ver |
| **inspector** | ✅ Todos | ✅ Todos | ✅ Propios | ❌ No |
| **operario** | ✅ Propios | ✅ Propios | ❌ No | ❌ No |

---

## 📦 Archivos Modificados

- ✅ `src/machinery/machinery.controller.ts` - Agregados decoradores `@Roles()` y `@Audit()`
- ✅ `INSPECTOR_PERMISSIONS.md` - Actualizada documentación de permisos
- ✅ `test-inspector-rental-report.js` - Script de prueba creado

---

## ✅ Verificación

Para verificar que el fix funciona correctamente:

1. **Revisar errores de compilación:**
   ```bash
   npm run build
   ```

2. **Ejecutar el script de prueba:**
   ```bash
   node test-inspector-rental-report.js
   ```

3. **Probar manualmente en el frontend:**
   - Iniciar sesión como inspector
   - Intentar crear una boleta de alquiler
   - Verificar que se crea exitosamente

---

## 🎯 Resultado Esperado

- ✅ El inspector puede crear boletas de alquiler
- ✅ El inspector puede ver todas las boletas de alquiler
- ✅ El inspector puede editar boletas de alquiler
- ✅ El `instructorIngenieroId` se asigna automáticamente al inspector actual
- ✅ Las acciones se registran en auditoría

---

## 📅 Fecha de Implementación

**12 de noviembre de 2025**

---

## 🚀 Próximos Pasos

Si es necesario, se pueden agregar más restricciones o permisos específicos según los requerimientos del sistema.
