ALTER TABLE products ADD COLUMN activo TINYINT NOT NULL DEFAULT 1;
CREATE INDEX idx_products_activo ON products (activo);
