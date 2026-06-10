-- 005_create_quotations.sql
-- Cotizaciones: NO afecta stock, NO genera movimientos, solo registra intencion de compra

CREATE TABLE IF NOT EXISTS `quotations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuarioId` INT NOT NULL,
  `estado` ENUM('Pendiente','Aprobada','Rechazada','Convertida') NOT NULL DEFAULT 'Pendiente',
  `nota` VARCHAR(255) DEFAULT NULL,
  `total` INT NOT NULL DEFAULT 0,
  `convertedToSaleId` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quotations_usuario` (`usuarioId`),
  KEY `idx_quotations_fecha` (`fecha`),
  KEY `idx_quotations_estado` (`estado`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `quotationId` INT NOT NULL,
  `productoId` INT NOT NULL,
  `codigo_snapshot` VARCHAR(64) NOT NULL,
  `nombre_snapshot` VARCHAR(190) NOT NULL,
  `precio_snapshot` INT NOT NULL,
  `cantidad` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_quotation_items_quotation` (`quotationId`)
) ENGINE=InnoDB;

-- Agregar columna tipo a print_jobs para distinguir ventas de cotizaciones
ALTER TABLE `print_jobs` ADD COLUMN `tipo` ENUM('sale','quotation') NOT NULL DEFAULT 'sale' AFTER `saleId`;
ALTER TABLE `print_jobs` ADD COLUMN `quotationId` INT DEFAULT NULL AFTER `saleId`;
