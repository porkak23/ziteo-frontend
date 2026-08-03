-- ============================================================
-- MIGRATION: 20260802000005_fix_generate_quotation_alias.sql
-- Fix: generate_quotation() nunca funcionó — bug de alias en la
-- subconsulta que calcula el subtotal real. Descubierto al reconectar
-- el flujo de cotizaciones (Fase 4), invocando el RPC con un JWT real
-- por primera vez: "column \"item\" does not exist" (42703).
-- ============================================================
--
-- El FROM declara el elemento del array como `items` (plural, por el
-- AS de jsonb_array_elements) pero el SELECT y el JOIN referencian
-- `item` (singular) — nunca coincidió, así que la función jamás pudo
-- ejecutar un INSERT exitoso desde que se escribió.

CREATE OR REPLACE FUNCTION public.generate_quotation(
  p_buyer_id uuid,
  p_provider_id uuid,
  p_items jsonb,
  p_subtotal numeric,
  p_expires_in_days integer DEFAULT 7
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_subtotal NUMERIC(12, 2);
BEGIN
  IF auth.uid() != p_buyer_id THEN
    RAISE EXCEPTION 'Solo el comprador puede generar su propia cotizacion';
  END IF;

  SELECT COALESCE(SUM((item->>'quantity')::numeric * p.price_unit), 0) INTO v_subtotal
    FROM jsonb_array_elements(p_items) AS item
    JOIN products p ON p.id = (item->>'product_id')::uuid;

  INSERT INTO quotations (buyer_id, provider_id, items, subtotal, expires_at)
    VALUES (p_buyer_id, p_provider_id, p_items, v_subtotal, now() + (p_expires_in_days || ' days')::INTERVAL)
    RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
