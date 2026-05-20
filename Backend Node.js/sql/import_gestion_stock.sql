-- Import SQL (MySQL) - Gestion de stock y ventas
-- Objetivo: crear tablas base + seed minimo (sin contrasenas)

CREATE DATABASE IF NOT EXISTS `gestion_stock`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `gestion_stock`;

-- Limpieza (en orden por FK)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `sale_items`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `movements`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- === USERS ===
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `rol` ENUM('Administrador', 'Vendedor') NOT NULL DEFAULT 'Vendedor',
  `passwordHash` VARCHAR(255) NULL,
  `activo` TINYINT NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `failed_attempts` INT NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB;

-- === CATEGORIES ===
CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_nombre` (`nombre`)
) ENGINE=InnoDB;

-- === PRODUCTS ===
CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(64) NOT NULL,
  `nombre` VARCHAR(190) NOT NULL,
  `categoriaId` INT NOT NULL,
  `precio` INT NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `minimo` INT NOT NULL DEFAULT 0,
  `fechaIngreso` DATETIME NULL,
  `activo` TINYINT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_codigo` (`codigo`),
  KEY `idx_products_categoriaId` (`categoriaId`),
  KEY `idx_products_activo` (`activo`),
  CONSTRAINT `fk_products_categoria`
    FOREIGN KEY (`categoriaId`) REFERENCES `categories` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- === SALES ===
CREATE TABLE `sales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuarioId` INT NOT NULL,
  `metodoPago` ENUM('EFECTIVO', 'TARJETA', 'FACTURA') NOT NULL DEFAULT 'EFECTIVO',
  `nota` VARCHAR(255) NULL,
  `otrosCargos` INT NOT NULL DEFAULT 0,
  `total` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_sales_fecha` (`fecha`),
  KEY `idx_sales_usuarioId` (`usuarioId`),
  CONSTRAINT `fk_sales_usuario`
    FOREIGN KEY (`usuarioId`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `sale_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `saleId` INT NOT NULL,
  `productoId` INT NOT NULL,
  `codigo_snapshot` VARCHAR(64) NOT NULL,
  `nombre_snapshot` VARCHAR(190) NOT NULL,
  `precio_snapshot` INT NOT NULL,
  `cantidad` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sale_items_saleId` (`saleId`),
  KEY `idx_sale_items_productoId` (`productoId`),
  CONSTRAINT `fk_sale_items_sale`
    FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_sale_items_producto`
    FOREIGN KEY (`productoId`) REFERENCES `products` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- === MOVEMENTS (historial stock) ===
CREATE TABLE `movements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo` ENUM('INGRESO', 'SALIDA', 'AJUSTE') NOT NULL,
  `productoId` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuarioId` INT NOT NULL,
  `motivo` VARCHAR(120) NULL,
  `nota` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_movements_fecha` (`fecha`),
  KEY `idx_movements_productoId` (`productoId`),
  KEY `idx_movements_usuarioId` (`usuarioId`),
  CONSTRAINT `fk_movements_producto`
    FOREIGN KEY (`productoId`) REFERENCES `products` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_movements_usuario`
    FOREIGN KEY (`usuarioId`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- === SEED ===

-- Passwords demo (cambiar en produccion):
-- admin@taller.local -> Admin1234!
-- venta@taller.local -> Venta1234!
INSERT INTO `users` (`nombre`, `email`, `rol`, `passwordHash`, `activo`) VALUES
  ('Admin', 'admin@taller.local', 'Administrador', '$2b$10$y6c1DNxFP5GWoz9MD.o2ZOGYAaMBd5z5BeLotYt9I3Mt7QtkL2lmS', 1),
  ('Vendedor', 'venta@taller.local', 'Vendedor', '$2b$10$YkeUoUhARV3sPIQrN68XTOKqJeE9BLz/Fhr5iGGY7D7TF1ZzWDjLG', 1);

INSERT INTO `categories` (`nombre`) VALUES
  ('Lubricantes'),
  ('Filtros'),
  ('Herramientas'),
  ('Repuestos');

-- Productos demo (precio incluye IVA, CLP)
INSERT INTO `products` (`codigo`, `nombre`, `categoriaId`, `precio`, `stock`, `minimo`, `fechaIngreso`) VALUES
  ('7801234567890', 'Aceite 10W-40 1L', (SELECT id FROM categories WHERE nombre='Lubricantes' LIMIT 1), 8990, 12, 5, NOW()),
  ('7501031311309', 'Filtro de aire universal', (SELECT id FROM categories WHERE nombre='Filtros' LIMIT 1), 6490, 4, 3, NOW()),
  ('8437011845112', 'Filtro de aceite', (SELECT id FROM categories WHERE nombre='Filtros' LIMIT 1), 5290, 2, 3, NOW()),
  ('4006381333931', 'Set llaves allen', (SELECT id FROM categories WHERE nombre='Herramientas' LIMIT 1), 11990, 7, 2, NOW()),
  ('6901234567892', 'Bujia estandar', (SELECT id FROM categories WHERE nombre='Repuestos' LIMIT 1), 3490, 18, 5, NOW());

-- Movimientos demo (opcional)
INSERT INTO `movements` (`tipo`, `productoId`, `cantidad`, `fecha`, `usuarioId`) VALUES
  ('INGRESO', (SELECT id FROM products WHERE codigo='7801234567890' LIMIT 1), 12, NOW(), (SELECT id FROM users WHERE email='admin@taller.local' LIMIT 1)),
  ('INGRESO', (SELECT id FROM products WHERE codigo='6901234567892' LIMIT 1), 18, NOW(), (SELECT id FROM users WHERE email='admin@taller.local' LIMIT 1));
