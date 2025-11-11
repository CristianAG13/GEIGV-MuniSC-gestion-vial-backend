\

# Modulo 1 Heidy API - Sistema de Autenticación y Control de Roles

## 🚀 Información General

API RESTful construida con NestJS para gestión de usuarios, autenticación JWT y control de roles.

- **Versión:** 1.0.0
- **Base URL (Desarrollo):** `http://localhost:3001/api/v1`
- **Base URL (Producción):** `http://geigv-munisc-gestion-vial-backend-production.up.railway.app/api/v1`
- **Base de Datos:** MariaDB
- **Autenticación:** JWT (JSON Web Tokens)

## 📋 Requisitos

- Node.js 18+
- MariaDB
- npm o yarn

## ⚙️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (.env)
DB_HOST=localhost
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=geigv
JWT_SECRET=tu-clave-secreta-muy-segura
JWT_EXPIRES_IN=1h
PORT=3000
NODE_ENV=development

# Iniciar en modo desarrollo
npm run start:dev
```

## 🔐 Autenticación

### Registro de Usuario
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "123456",
  "name": "Nombre Usuario"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nombre Usuario",
    "roles": []
  },
  "expires_in": 3600
}
```

### Inicio de Sesión
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nombre Usuario",
    "roles": ["user"]
  },
  "expires_in": 3600
}
```

### Obtener Perfil
```http
GET /api/v1/auth/profile
Authorization: Bearer {token}
```

### Renovar Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}
```

## 👥 Gestión de Usuarios

> **Nota:** Todos los endpoints de usuarios requieren autenticación JWT

### Listar Usuarios
```http
GET /api/v1/users
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`, `manager`

### Crear Usuario
```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "nuevo@example.com",
  "password": "123456",
  "name": "Nuevo Usuario",
  "roleIds": [1, 2]
}
```
**Roles requeridos:** `ingeniero`

### Obtener Usuario Específico
```http
GET /api/v1/users/{id}
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`, `manager`

### Actualizar Usuario
```http
PATCH /api/v1/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nombre Actualizado",
  "email": "nuevo-email@example.com",
  "roleIds": [1]
}
```
**Roles requeridos:** `ingeniero`

### Asignar Roles a Usuario
```http
POST /api/v1/users/{id}/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "roleIds": [1, 2, 3]
}
```
**Roles requeridos:** `ingeniero`

### Quitar Rol Específico
```http
DELETE /api/v1/users/{id}/roles/{roleId}
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`

### Activar/Desactivar Usuario
```http
PATCH /api/v1/users/{id}/activate
Authorization: Bearer {token}

PATCH /api/v1/users/{id}/deactivate
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`

### Eliminar Usuario
```http
DELETE /api/v1/users/{id}
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`

### Estadísticas de Usuarios
```http
GET /api/v1/users/stats
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`

**Respuesta:**
```json
{
  "totalUsers": 10,
  "activeUsers": 8,
  "inactiveUsers": 2
}
```

### Filtrar Usuarios por Rol
```http
GET /api/v1/users?role=admin
Authorization: Bearer {token}
```

## 🎭 Gestión de Roles

### Endpoints Públicos (Solo para Testing/Desarrollo)

#### Probar Conexión
```http
GET /api/v1/roles/test
```

**Respuesta:**
```json
{
  "message": "✅ El endpoint de roles funciona correctamente",
  "timestamp": "2024-01-XX...",
  "service": "roles-service"
}
```

#### Crear Roles por Defecto
```http
POST /api/v1/roles/public/default
```

**Roles creados:**
- `superadmin` - Administrador con todos los permisos
- `ingeniero` - Ingeniero con permisos de gestión
- `inspector` - Inspector con permisos de gestión
- `operario` - Operario con permisos de gestión
- `invitado` - Usuario invitado con permisos limitados

#### Listar Roles (Público)
```http
GET /api/v1/roles/public
GET /api/v1/roles/public?active=true
```

#### Crear Rol (Público)
```http
POST /api/v1/roles/public
Content-Type: application/json

{
  "name": "editor",
  "description": "Editor de contenido"
}
```

#### Obtener Rol Específico (Público)
```http
GET /api/v1/roles/public/{id}
```

#### Estadísticas de Roles (Público)
```http
GET /api/v1/roles/public/stats
```

### Endpoints Protegidos

> **Nota:** Todos estos endpoints requieren autenticación JWT y roles específicos

#### Listar Roles
```http
GET /api/v1/roles
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`, `manager`

#### Crear Rol
```http
POST /api/v1/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "moderator",
  "description": "Moderador de contenido"
}
```
**Roles requeridos:** `ingeniero`

#### Actualizar Rol
```http
PATCH /api/v1/roles/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "super-admin",
  "description": "Super administrador",
  "isActive": true
}
```
**Roles requeridos:** `ingeniero`

#### Activar/Desactivar Rol
```http
PATCH /api/v1/roles/{id}/activate
PATCH /api/v1/roles/{id}/deactivate
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`

#### Eliminar Rol
```http
DELETE /api/v1/roles/{id}
Authorization: Bearer {token}
```
**Roles requeridos:** `ingeniero`

## 🛠️ Testing Rápido

### 1. Verificar que la API funciona
```bash
curl http://localhost:3001/api/v1/roles/test
```

### 2. Crear roles por defecto
```bash
curl -X POST http://localhost:3001/api/v1/roles/public/default
```

### 3. Ver roles creados
```bash
curl http://localhost:3001/api/v1/roles/public
```

### 4. Registrar un usuario
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ingeniero@heidy.com",
    "password": "123456",
    "name": "Ingeniero"
  }'
```

## 📊 Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Solicitud incorrecta
- `401` - No autorizado (token inválido/faltante)
- `403` - Prohibido (sin permisos)
- `404` - Recurso no encontrado
- `409` - Conflicto (recurso ya existe)
- `500` - Error interno del servidor

## 🔒 Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `ingeniero` | Ingeniero | Acceso completo a todos los recursos |
| `inspector` | Inspector | Inspección de obras, visualización de estadísticas y **acceso al módulo de auditoría** |
| `operario` | Operario | Acceso básico, gestión de perfil propio |
| `invitado` | Invitado | Acceso de solo lectura limitado |

## 🐛 Solución de Problemas

### Error 404 en endpoints
- Verificar que la aplicación esté corriendo en el puerto 3001 (desarrollo)
- Comprobar que uses el prefijo `/api/v1/`

### Error de conexión a base de datos
- Verificar configuración en archivo `.env`
- Comprobar que MariaDB esté corriendo en el puerto 3307

### Error de autenticación
- Verificar que el token JWT esté incluido en el header Authorization
- Comprobar que el token no haya expirado

## 📝 Notas de Desarrollo

- Los endpoints `/api/v1/roles/public/*` son solo para testing y desarrollo
- En producción, remover o proteger estos endpoints públicos
- El campo `password` se excluye automáticamente de las respuestas
- Las contraseñas se hashean automáticamente con bcrypt
- Los tokens JWT expiran en 1 hora por defecto