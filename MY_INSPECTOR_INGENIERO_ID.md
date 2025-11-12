# Endpoint: Obtener ID de Inspector/Ingeniero

## Descripción
Este endpoint permite a inspectores e ingenieros obtener su propio ID de usuario y datos personales para utilizarlos al rellenar boletas en el sistema.

## Información del Endpoint

**URL:** `GET /users/me`

**Autenticación:** Requerida (JWT Bearer Token)

**Roles Permitidos:**
- `superadmin`
- `ingeniero`
- `inspector`

## Uso

### Request

```http
GET /users/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer {token}
Content-Type: application/json
```

### Response Exitosa (200 OK)

```json
{
  "id": 5,
  "name": "Juan",
  "lastname": "Pérez",
  "email": "inspector@test.com",
  "roles": ["inspector"]
}
```

### Respuestas de Error

#### 401 Unauthorized - Token inválido o no proporcionado
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 403 Forbidden - Usuario no tiene el rol adecuado
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

#### 404 Not Found - Usuario no encontrado
```json
{
  "statusCode": 404,
  "message": "Usuario con ID 5 no encontrado"
}
```

## Campos de la Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID único del usuario (usar este para rellenar boletas) |
| `name` | string | Nombre del usuario |
| `lastname` | string | Apellido del usuario |
| `email` | string | Email del usuario |
| `roles` | string[] | Array de roles asignados al usuario |

## Ejemplos de Uso

### JavaScript / Node.js

```javascript
// 1. Primero hacer login
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'inspector@test.com',
    password: 'password123',
  }),
});

const { access_token } = await loginResponse.json();

// 2. Obtener mi información
const myInfoResponse = await fetch('http://localhost:3000/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  },
});

const myInfo = await myInfoResponse.json();
console.log('Mi ID es:', myInfo.id);
console.log('Mi nombre es:', myInfo.name, myInfo.lastname);
```

### cURL

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"inspector@test.com","password":"password123"}' \
  | jq -r '.access_token')

# 2. Obtener mi información
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Postman

1. **Login:**
   - Method: `POST`
   - URL: `http://localhost:3000/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "inspector@test.com",
       "password": "password123"
     }
     ```
   - Copiar el `access_token` de la respuesta

2. **Obtener Mi Información:**
   - Method: `GET`
   - URL: `http://localhost:3000/users/me`
   - Headers:
     - `Authorization`: `Bearer {access_token}`
     - `Content-Type`: `application/json`

## Integración en el Frontend

### React Example

```jsx
import { useState, useEffect } from 'react';

function InspectorProfile() {
  const [myInfo, setMyInfo] = useState(null);

  useEffect(() => {
    const fetchMyInfo = async () => {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch('http://localhost:3000/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        setMyInfo(data);
      } catch (error) {
        console.error('Error al obtener información:', error);
      }
    };

    fetchMyInfo();
  }, []);

  if (!myInfo) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Mi Perfil</h2>
      <p><strong>ID:</strong> {myInfo.id}</p>
      <p><strong>Nombre:</strong> {myInfo.name} {myInfo.lastname}</p>
      <p><strong>Email:</strong> {myInfo.email}</p>
      <p><strong>Roles:</strong> {myInfo.roles.join(', ')}</p>
    </div>
  );
}
```

### Hook Personalizado para Obtener ID del Usuario

```jsx
// hooks/useCurrentUser.js
import { useState, useEffect } from 'react';

export function useCurrentUser() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener información del usuario');
        }

        const data = await response.json();
        setUserId(data.id);
        setUserName(`${data.name} ${data.lastname}`);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  return { userId, userName, loading, error };
}

// Uso en componente de crear boleta
function CreateBoletaForm() {
  const { userId, userName, loading, error } = useCurrentUser();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <form>
      <input type="hidden" name="inspectorId" value={userId} />
      <p>Inspector: {userName} (ID: {userId})</p>
      {/* resto del formulario */}
    </form>
  );
}
```

## Casos de Uso

### 1. Rellenar Boletas Automáticamente

Cuando un inspector o ingeniero accede al formulario de crear boleta, el sistema puede:
1. Llamar a `/users/me` al cargar la página
2. Obtener el ID del usuario
3. Prellenar el campo "Inspector/Ingeniero" automáticamente

### 2. Mostrar Perfil del Usuario

Mostrar la información del usuario actual en la interfaz:
- Nombre completo
- Email
- Roles asignados
- ID del usuario

### 3. Validación de Permisos

Verificar que el usuario tenga los roles adecuados antes de mostrar ciertas funcionalidades.

## Notas Importantes

1. **Seguridad:** El endpoint requiere autenticación mediante JWT. El token debe incluirse en el header `Authorization`.

2. **Roles:** Solo usuarios con roles de `inspector`, `ingeniero` o `superadmin` pueden acceder a este endpoint.

3. **ID del Usuario:** El ID retornado es el identificador único del usuario en la base de datos. Este ID debe usarse al crear boletas u otros registros que requieran identificar al inspector/ingeniero.

4. **No se expone la contraseña:** Por seguridad, la contraseña del usuario nunca se incluye en la respuesta (está marcada con `@Exclude()` en la entidad).

5. **Información actualizada:** La información retornada siempre refleja el estado actual del usuario en la base de datos, incluyendo cambios recientes en roles o datos personales.

## Diferencias con Otros Endpoints

### vs `/users/:id`
- `/users/me`: Obtiene la información del usuario autenticado (el que hace la petición)
- `/users/:id`: Obtiene información de cualquier usuario por ID (requiere permisos de superadmin/ingeniero)

### vs `/operators/my-operator`
- `/users/me`: Obtiene el ID del usuario del sistema (tabla `users`)
- `/operators/my-operator`: Obtiene el ID del operador asociado (tabla `operators`)

Estos son diferentes porque un usuario puede ser inspector/ingeniero sin ser operador de maquinaria.

## Testing

Para probar el endpoint, ejecuta:

```bash
node test-my-inspector-ingeniero-id.js
```

O usa Postman/Thunder Client siguiendo los pasos descritos arriba.

## Troubleshooting

### Error: "Unauthorized"
- Verifica que el token JWT sea válido
- Asegúrate de incluir "Bearer " antes del token en el header

### Error: "Forbidden resource"
- El usuario no tiene uno de los roles requeridos (inspector, ingeniero, superadmin)
- Verifica los roles del usuario con `/auth/profile`

### Error: "Usuario con ID X no encontrado"
- El usuario fue eliminado de la base de datos
- El token puede estar corrupto o pertenecer a un usuario que ya no existe
