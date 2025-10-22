-- Script para solucionar el error de auditoría
-- Ejecutar este script en MariaDB/MySQL

USE geigv;

-- Hacer backup de los datos si los hay
CREATE TABLE audit_logs_backup AS SELECT * FROM audit_logs;

-- Eliminar la tabla actual con problemas de ENUM
DROP TABLE audit_logs;

-- TypeORM recreará automáticamente la tabla con las nuevas definiciones VARCHAR
-- cuando se reinicie la aplicación

-- Para verificar que se eliminó correctamente
SHOW TABLES LIKE 'audit_logs';