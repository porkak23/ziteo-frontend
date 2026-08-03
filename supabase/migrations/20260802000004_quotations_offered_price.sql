-- ============================================================
-- MIGRATION: 20260802000004_quotations_offered_price.sql
-- Fix P1: el botón "Enviar Oferta" del proveedor descartaba el
-- precio en silencio — el onClick solo cerraba el modal y limpiaba
-- el input, sin escribir nada (VendedorApp.tsx:2176). `quotations`
-- no tenía columna para el precio ofertado, solo `subtotal` (lo que
-- pidió el comprador).
-- ============================================================

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS offered_price numeric,
  ADD COLUMN IF NOT EXISTS offered_at timestamptz;

-- provider_update_quotation_status ya existe y ya permite UPDATE con
-- WITH CHECK (provider_id = auth.uid()) — RLS no restringe por
-- columna, así que no hace falta tocar la policy para permitir estas
-- dos columnas nuevas.
