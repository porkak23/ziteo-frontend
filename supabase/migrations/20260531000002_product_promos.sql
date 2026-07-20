-- Añadir columnas de oferta/promoción a la tabla products.
-- Permite a proveedores marcar un producto con precio especial y fecha de vencimiento.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS promo_active  boolean      DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_price   numeric,
  ADD COLUMN IF NOT EXISTS promo_until   timestamptz;

-- Índice parcial para consultas de productos en oferta activa
CREATE INDEX IF NOT EXISTS idx_products_promo_active
  ON products(promo_active, promo_until)
  WHERE promo_active = true;

-- Comentarios
COMMENT ON COLUMN products.promo_active IS 'Si true, se muestra promo_price como precio especial en la tienda';
COMMENT ON COLUMN products.promo_price  IS 'Precio especial durante la promoción (Bs.)';
COMMENT ON COLUMN products.promo_until  IS 'Fecha/hora hasta la que aplica la promoción (UTC)';
