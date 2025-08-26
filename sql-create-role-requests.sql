-- =========================================================
-- SQL para crear la tabla de solicitudes de rol
-- =========================================================

-- Crear la tabla role_requests
CREATE TABLE role_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    roleId INT NOT NULL,
    justification TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejectionReason TEXT NULL,
    reviewedBy INT NULL,
    reviewedAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para mejorar performance
    INDEX idx_user_id (userId),
    INDEX idx_role_id (roleId),
    INDEX idx_status (status),
    INDEX idx_reviewed_by (reviewedBy),
    
    -- Claves foráneas
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewedBy) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================================================
-- Datos de prueba para solicitudes de rol
-- =========================================================

-- Insertar algunas solicitudes de prueba
INSERT INTO role_requests (userId, roleId, justification, status) VALUES
(2, 1, 'Necesito permisos de administrador para gestionar el sistema de gestión vial de la municipalidad. Tengo experiencia previa en sistemas similares.', 'pending'),
(3, 2, 'Solicito el rol de usuario para poder acceder a las funcionalidades básicas del sistema. Soy empleado del departamento de obras públicas.', 'pending'),
(4, 3, 'Requiero acceso como invitado para revisar los reportes públicos de obras viales en mi sector.', 'approved');

-- =========================================================
-- Verificar que todo se creó correctamente
-- =========================================================

-- Mostrar la estructura de la tabla
DESCRIBE role_requests;

-- Mostrar los datos insertados
SELECT 
    rr.id,
    u.name as usuario,
    r.name as rol_solicitado,
    rr.justification,
    rr.status,
    rr.createdAt
FROM role_requests rr
JOIN users u ON rr.userId = u.id
JOIN roles r ON rr.roleId = r.id
ORDER BY rr.createdAt DESC;
