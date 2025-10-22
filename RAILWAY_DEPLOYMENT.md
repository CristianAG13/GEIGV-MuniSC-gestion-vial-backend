# Configuración de Despliegue en Railway

## Variables de Entorno

Esta aplicación ahora soporta automáticamente las variables de entorno de Railway para MariaDB. No necesitas configurar variables adicionales.

### Orden de Prioridad de Configuración de Base de Datos

1. **MARIADB_PRIVATE_URL** (Recomendado para Railway)
   - Si esta variable existe, se usa automáticamente
   - Formato: `mariadb://username:password@host:port/database`

2. **Variables individuales de Railway** (MARIADB_*)
   - `MARIADB_PRIVATE_HOST` o `MARIADB_HOST`
   - `MARIADB_PORT`
   - `MARIADB_USER` o `MARIADB_USERNAME`
   - `MARIADB_PASSWORD` o `MARIADB_ROOT_PASSWORD`
   - `MARIADB_DATABASE`

3. **Variables tradicionales** (DB_*) - Fallback
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `DB_DATABASE`

### Variables Adicionales Opcionales

- `NODE_ENV`: Controla logging y sincronización
  - `production`: logging deshabilitado, sync solo si DB_SYNC=true
  - Otros valores: logging habilitado, sync habilitado por defecto

- `DB_SYNC`: Control manual de sincronización de esquema
  - `true`: Habilita sincronización automática
  - `false`: Deshabilita sincronización (recomendado para producción)

## Pasos de Despliegue en Railway

1. **Crear nuevo proyecto en Railway**
2. **Agregar plugin de MariaDB**
   - Esto creará automáticamente todas las variables MARIADB_*
3. **Conectar repositorio GitHub**
4. **Variables opcionales a agregar** (si necesitas control específico):
   ```
   NODE_ENV=production
   DB_SYNC=false
   ```
5. **Deploy automático**

## Verificación

Los logs de la aplicación mostrarán la configuración de base de datos utilizada:
```
Database configuration: {
  type: 'mariadb',
  host: 'mariadb.railway.internal',
  port: 3306,
  username: 'railway',
  password: '[HIDDEN]',
  database: 'railway'
}
```

## Troubleshooting

### Error ECONNREFUSED
- Verifica que el plugin MariaDB esté en el mismo proyecto
- Confirma que el servicio está "linked" al plugin de base de datos

### Variables no encontradas
- La aplicación usará valores por defecto seguros
- Revisa los logs para ver qué configuración se está usando

### Problemas de conexión
- En desarrollo local, asegúrate de tener un archivo `.env` con variables DB_*
- En Railway, las variables MARIADB_* se crean automáticamente