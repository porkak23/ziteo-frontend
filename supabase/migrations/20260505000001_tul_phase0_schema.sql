-- ============================================================
-- FASE 0: TUL-inspired schema extensions
-- ============================================================

-- -------------------------------------------------------
-- 1. products: etapa de obra + precios de bulto + peso
-- -------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS construction_stage TEXT
    CHECK (construction_stage IN ('fundaciones', 'muros', 'techos', 'terminaciones')),
  ADD COLUMN IF NOT EXISTS bulk_unit        TEXT,
  ADD COLUMN IF NOT EXISTS bulk_price       NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS bulk_min_qty     INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg        NUMERIC(8, 2);

COMMENT ON COLUMN products.construction_stage IS 'Etapa de obra: fundaciones, muros, techos, terminaciones';
COMMENT ON COLUMN products.weight_kg          IS 'Peso unitario en kg. Decide cargo_type: <5 kg = light, >=5 kg = heavy';

-- -------------------------------------------------------
-- 2. user_roles (proveedor): condiciones de servicio TUL
-- -------------------------------------------------------
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS min_order_amount       NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS delivery_time_hours    INTEGER,
  ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS service_zones          TEXT[];

COMMENT ON COLUMN user_roles.min_order_amount        IS 'Importe mínimo de pedido en Bs.';
COMMENT ON COLUMN user_roles.delivery_time_hours     IS 'Tiempo de entrega prometido en horas';
COMMENT ON COLUMN user_roles.free_shipping_threshold IS 'Umbral de pedido para envío gratis en Bs.';
COMMENT ON COLUMN user_roles.service_zones           IS 'Zonas de entrega (ciudades/barrios)';

-- -------------------------------------------------------
-- 3. deliveries: tipo de carga (moto vs camión)
-- -------------------------------------------------------
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS cargo_type TEXT NOT NULL DEFAULT 'light'
    CHECK (cargo_type IN ('light', 'heavy'));

COMMENT ON COLUMN deliveries.cargo_type IS 'light = motocicleta (<5 kg), heavy = camión/camioneta (>=5 kg)';

-- user_roles chofer: vehicle_type ya existe, solo documentamos valores esperados
-- 'moto' = carga ligera, 'camion'/'camioneta'/'pickup' = carga pesada
-- No se agrega CHECK para no romper datos existentes.

-- -------------------------------------------------------
-- 4. orders: columna buyer_id alias (constructor_id ya existe)
--    Agregamos cargo_type al nivel de orden para referencia rápida
-- -------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cargo_type TEXT DEFAULT 'light'
    CHECK (cargo_type IN ('light', 'heavy'));

-- -------------------------------------------------------
-- 5. quotations: cotizaciones formales PDF (reemplaza CrediTUL)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
  items        JSONB NOT NULL DEFAULT '[]',
  subtotal     NUMERIC(12, 2) NOT NULL,
  pdf_url      TEXT,
  expires_at   TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'converted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quotations_buyer_idx    ON quotations(buyer_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS quotations_provider_idx ON quotations(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quotations_status_idx   ON quotations(status) WHERE status IN ('pending', 'accepted');

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_read_own_quotations"
ON quotations FOR SELECT TO authenticated
USING (buyer_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY "buyer_insert_quotation"
ON quotations FOR INSERT TO authenticated
WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "provider_update_quotation_status"
ON quotations FOR UPDATE TO authenticated
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

-- -------------------------------------------------------
-- 6. Storage bucket: PDFs de cotizaciones
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quotation-pdfs',
  'quotation-pdfs',
  false,
  5242880, -- 5 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "buyer_upload_quotation_pdf"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'quotation-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "participants_read_quotation_pdf"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'quotation-pdfs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.buyer_id = auth.uid()
        AND q.pdf_url LIKE '%' || name || '%'
    )
  )
);

-- -------------------------------------------------------
-- 7. RPC: generate_quotation (SECURITY DEFINER)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_quotation(
  p_buyer_id    UUID,
  p_provider_id UUID,
  p_items       JSONB,
  p_subtotal    NUMERIC,
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() != p_buyer_id THEN
    RAISE EXCEPTION 'Solo el comprador puede generar su propia cotización';
  END IF;

  INSERT INTO quotations (buyer_id, provider_id, items, subtotal, expires_at)
  VALUES (
    p_buyer_id,
    p_provider_id,
    p_items,
    p_subtotal,
    now() + (p_expires_in_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- -------------------------------------------------------
-- 8. Trigger: auto-expire quotations on read
--    (se maneja en cliente; aquí solo marcamos expiradas en bulk)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_old_quotations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE quotations
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();
$$;
