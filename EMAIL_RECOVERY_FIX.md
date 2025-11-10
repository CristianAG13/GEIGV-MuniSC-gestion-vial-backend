# Solución para Error de Timeout en Recuperación de Contraseña

## Problema Identificado
El error `timeout of 10000ms exceeded` con código `ECONNABORTED` indica que la funcionalidad de recuperación de contraseña está fallando específicamente en el envío del email SMTP en producción, mientras que funciona correctamente en local.

## Causa Principal
El problema se debe a:
1. **Configuración SMTP inadecuada para producción**: Los timeouts por defecto de nodemailer son muy cortos para entornos de producción
2. **Variables de entorno faltantes o incorrectas**: `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_PORT`
3. **Restricciones de red en el servidor de producción**: Posible bloqueo de puertos SMTP

## Soluciones Implementadas

### 1. Configuración SMTP Mejorada
Se ha actualizado el transporter de nodemailer con:
```typescript
// Configuraciones adicionales para producción
connectionTimeout: 30000, // 30 segundos para conectar
greetingTimeout: 30000,   // 30 segundos para el saludo SMTP  
socketTimeout: 60000,     // 60 segundos para operaciones de socket
// Pool de conexiones para mejor rendimiento
pool: true,
maxConnections: 5,
maxMessages: 100,
```

### 2. Timeout Personalizado
Se implementó un timeout personalizado de 30 segundos para evitar que las operaciones se cuelguen indefinidamente:
```typescript
const emailTimeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Email timeout - operación cancelada después de 30 segundos')), 30000)
);
```

### 3. Validación de Configuración
Se agregó validación previa de las variables de entorno necesarias:
- `EMAIL_USER`: Email de Gmail
- `EMAIL_PASSWORD`: Contraseña de aplicación de Gmail
- `EMAIL_PORT`: Puerto SMTP (587)

### 4. Endpoint de Diagnóstico
Se creó el endpoint `GET /api/v1/auth/test-email-config` para verificar la configuración SMTP en producción.

## Configuración Requerida

### Variables de Entorno para Producción
```bash
# Email Configuration (Gmail)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion-gmail  # NO tu contraseña normal
EMAIL_PORT=587

# Frontend URL para enlaces de reset
FRONTEND_URL=https://tu-dominio-frontend.com
```

### Configuración de Gmail
Para usar Gmail en producción:

1. **Habilitar Verificación en 2 Pasos**:
   - Ir a: [Cuenta de Google > Seguridad](https://myaccount.google.com/security)
   - Activar "Verificación en 2 pasos"

2. **Crear Contraseña de Aplicación**:
   - Ir a: Cuenta de Google > Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones
   - Generar una contraseña específica para la aplicación
   - Usar esta contraseña en `EMAIL_PASSWORD`

## Verificación del Fix

### 1. Probar la Configuración
```bash
curl -X GET https://tu-backend.railway.app/api/v1/auth/test-email-config
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Conexión SMTP exitosa",
  "config": {
    "service": "gmail",
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "tu-email@gmail.com",
    "secure": false,
    "connectionTimeout": "30s",
    "socketTimeout": "60s"
  },
  "timestamp": "2024-11-10T..."
}
```

### 2. Probar Recuperación de Contraseña
```bash
curl -X POST https://tu-backend.railway.app/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@test.com"}'
```

## Debugging Adicional

### Logs a Revisar
Los siguientes logs te ayudarán a identificar el problema específico:

1. **Configuración válida**: `✅ Configuración de email válida`
2. **Conexión SMTP**: `✅ Conexión SMTP verificada exitosamente`
3. **Email enviado**: `✅ Email de recuperación enviado exitosamente`

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `EAUTH` | Credenciales incorrectas | Verificar EMAIL_USER y usar contraseña de aplicación |
| `ETIMEDOUT` | Timeout de conexión | Verificar conectividad de red, firewall |
| `ECONNREFUSED` | Puerto bloqueado | Verificar que el puerto 587 esté disponible |
| `ENOTFOUND` | Error DNS | Problema de resolución de smtp.gmail.com |

### Fallback Mode
Si el email falla, el sistema mostrará el token en los logs del servidor para uso manual:
```
🔑 FALLBACK - Token de recuperación: abc123...
📱 Enlace de recuperación: https://frontend.com/reset-password?token=abc123...
```

## Consideraciones de Producción

1. **Monitoring**: Implementar alertas para fallos de email
2. **Rate Limiting**: Limitar intentos de recuperación por usuario
3. **Alternativas**: Considerar servicios como SendGrid o AWS SES para mayor confiabilidad
4. **Logs**: Revisar logs de producción para identificar patrones de error

## Próximos Pasos

1. Desplegar los cambios a producción
2. Configurar las variables de entorno correctas
3. Probar el endpoint de diagnóstico
4. Verificar la funcionalidad completa de recuperación de contraseña
5. Monitorear logs para confirmar que el problema está resuelto