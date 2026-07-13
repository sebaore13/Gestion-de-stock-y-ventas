ALTER TABLE `sales`
  ADD COLUMN `descuento` INT NOT NULL DEFAULT 0 AFTER `montoRecibido`,
  ADD COLUMN `tipoDescuento` ENUM('$','%') NOT NULL DEFAULT '$' AFTER `descuento`,
  ADD COLUMN `descuentoMonto` INT NOT NULL DEFAULT 0 AFTER `tipoDescuento`;
