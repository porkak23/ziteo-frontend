-- 20260625_document_orders_schema.sql
-- Documenta columnas de 'orders' que existen en producción pero no en migraciones.
-- TODOS los ALTER TABLE usan IF NOT EXISTS para ser idempotentes.
-- Ejecutado en vacío si las columnas ya existen (seguro re-ejecutar).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cargo_type          TEXT
    CHECK (cargo_type IN ('light', 'heavy')),
  ADD COLUMN IF NOT EXISTS delivery_method     TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_lat        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_lng        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS estimated_delivery_at TIMESTAMPTZ;
