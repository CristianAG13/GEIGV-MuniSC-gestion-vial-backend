-- Tabla de carretas/trailers
CREATE TABLE IF NOT EXISTS `carretas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `placa` VARCHAR(32) NOT NULL,
  `tipoMaquinaria` ENUM('vagoneta', 'cabezal') NOT NULL,
  `categoria` ENUM('carreta', 'material') NOT NULL,
  `materialTipo` ENUM('desecho', 'plataforma') DEFAULT NULL,
  `activa` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_placa` (`placa`),
  INDEX `idx_placa` (`placa`),
  INDEX `idx_tipoMaquinaria` (`tipoMaquinaria`),
  INDEX `idx_categoria` (`categoria`),
  INDEX `idx_materialTipo` (`materialTipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de ejemplo (opcional)
INSERT INTO `carretas` (`placa`, `tipoMaquinaria`, `categoria`, `materialTipo`, `activa`) VALUES
('C-001', 'vagoneta', 'carreta', NULL, 1),
('C-002', 'vagoneta', 'carreta', NULL, 1),
('C-003', 'cabezal', 'carreta', NULL, 1),
('M-001', 'cabezal', 'material', 'desecho', 1),
('M-002', 'cabezal', 'material', 'plataforma', 1);
