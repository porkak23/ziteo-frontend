-- ============================================================
-- God Mode F2 — Historial GPS + alertas automáticas + payment_transactions admin
-- ============================================================

-- ------------------------------------------------------------
-- 1. Historial de ubicación de choferes (replay de ruta)
--    driver_locations solo guarda la ÚLTIMA posición (upsert por PK).
--    Este historial se llena por trigger cada vez que se actualiza,
--    con retención de 30 días vía pg_cron.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_location_history (
  id         bigserial PRIMARY KEY,
  driver_id  uuid NOT NULL REFERENCES auth.users(id),
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  heading    double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_location_history_driver_time
  ON driver_location_history(driver_id, recorded_at DESC);

ALTER TABLE driver_location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_all_driver_location_history" ON driver_location_history
  FOR SELECT USING (is_admin());
CREATE POLICY "driver_select_own_location_history" ON driver_location_history
  FOR SELECT USING (driver_id = auth.uid());
-- INSERT solo vía trigger SECURITY DEFINER; no hay policy de INSERT
-- para authenticated/anon (bloqueado por defecto).

CREATE OR REPLACE FUNCTION copy_driver_location_to_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO driver_location_history (driver_id, lat, lng, heading, recorded_at)
  VALUES (NEW.driver_id, NEW.lat, NEW.lng, NEW.heading, NEW.updated_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_copy_driver_location_history ON driver_locations;
CREATE TRIGGER trg_copy_driver_location_history
  AFTER INSERT OR UPDATE ON driver_locations
  FOR EACH ROW EXECUTE FUNCTION copy_driver_location_to_history();

-- Retención 30 días (mismo patrón que 20260709_schedule_expire_pending_orders.sql).
SELECT cron.schedule(
  'purge_driver_location_history',
  '0 4 * * *',  -- diario 04:00 UTC
  $cron$DELETE FROM driver_location_history WHERE recorded_at < now() - interval '30 days'$cron$
);


-- ------------------------------------------------------------
-- 2. payment_transactions: faltó cubrir en la fundación admin (A2).
--    confirm_token es un secreto de un solo uso (capability token para
--    confirmar el pago) — se excluye del acceso admin por precaución.
--    La policy da SELECT a is_admin(), pero la única vía recomendada
--    de lectura es la vista admin_payment_transactions (sin token).
-- ------------------------------------------------------------
CREATE POLICY "admin_select_all_payment_transactions" ON payment_transactions
  FOR SELECT USING (is_admin());

CREATE OR REPLACE VIEW admin_payment_transactions
WITH (security_invoker = true)
AS
SELECT
  id, order_id, delivery_id, method, amount, status,
  evidence_url, token_used, created_by, created_at, settled_at
  -- confirm_token deliberadamente omitido
FROM payment_transactions;

GRANT SELECT ON admin_payment_transactions TO authenticated;


-- ------------------------------------------------------------
-- 3. Carritos abandonados — sobre cart_items existente (NO se crea
--    cart_snapshots; el carrito ya se espeja en BD).
--    "Abandonado" = ítem en carrito hace >30 min sin una order
--    posterior del mismo comprador al mismo proveedor.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW admin_abandoned_carts
WITH (security_invoker = true)
AS
SELECT
  ci.user_id,
  ci.product_id,
  ci.quantity,
  ci.added_at,
  ci.updated_at,
  p.name       AS product_name,
  p.provider_id,
  p.price_unit
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.updated_at < now() - interval '30 minutes'
  AND NOT EXISTS (
    SELECT 1 FROM orders o
     WHERE o.constructor_id = ci.user_id
       AND o.provider_id = p.provider_id
       AND o.created_at > ci.updated_at
  );

GRANT SELECT ON admin_abandoned_carts TO authenticated;


-- ------------------------------------------------------------
-- 4. Triggers de alertas automáticas → admin_alerts
-- ------------------------------------------------------------

-- 4a. Delivery marcado como failed
CREATE OR REPLACE FUNCTION alert_on_delivery_failed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status IS DISTINCT FROM 'failed' THEN
    INSERT INTO admin_alerts (severity, kind, payload)
    VALUES (
      'critical',
      'delivery_failed',
      jsonb_build_object('delivery_id', NEW.id, 'order_id', NEW.order_id, 'driver_id', NEW.driver_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_delivery_failed ON deliveries;
CREATE TRIGGER trg_alert_delivery_failed
  AFTER UPDATE OF status ON deliveries
  FOR EACH ROW EXECUTE FUNCTION alert_on_delivery_failed();

-- 4b. Evidencia de pago subida hace más de 2h sin confirmar/rechazar.
--     No hay trigger de "tiempo transcurrido" en Postgres; se revisa
--     periódicamente vía pg_cron (igual patrón que expire_pending_orders).
CREATE OR REPLACE FUNCTION check_stale_payment_evidence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_alerts (severity, kind, payload)
  SELECT
    'warning',
    'payment_evidence_stale',
    jsonb_build_object('order_id', o.id, 'uploaded_at', o.payment_evidence_uploaded_at)
  FROM orders o
  WHERE o.payment_evidence_url IS NOT NULL
    AND o.payment_confirmed_at IS NULL
    AND o.payment_evidence_uploaded_at < now() - interval '2 hours'
    AND NOT EXISTS (
      SELECT 1 FROM admin_alerts a
       WHERE a.kind = 'payment_evidence_stale'
         AND a.payload->>'order_id' = o.id::text
         AND a.created_at > now() - interval '6 hours'
    );
END;
$$;

SELECT cron.schedule(
  'check_stale_payment_evidence',
  '*/15 * * * *',  -- cada 15 minutos
  $cron$SELECT check_stale_payment_evidence()$cron$
);

-- 4c. Chofer "mudo": in_transit sin publicar ubicación en >5 min.
--     Mismo patrón de revisión periódica vía pg_cron.
CREATE OR REPLACE FUNCTION check_silent_drivers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_alerts (severity, kind, payload)
  SELECT
    'warning',
    'driver_silent',
    jsonb_build_object('delivery_id', d.id, 'driver_id', d.driver_id)
  FROM deliveries d
  LEFT JOIN driver_locations dl ON dl.driver_id = d.driver_id
  WHERE d.status = 'in_transit'
    AND (dl.updated_at IS NULL OR dl.updated_at < now() - interval '5 minutes')
    AND NOT EXISTS (
      SELECT 1 FROM admin_alerts a
       WHERE a.kind = 'driver_silent'
         AND a.payload->>'delivery_id' = d.id::text
         AND a.created_at > now() - interval '30 minutes'
    );
END;
$$;

SELECT cron.schedule(
  'check_silent_drivers',
  '*/5 * * * *',  -- cada 5 minutos
  $cron$SELECT check_silent_drivers()$cron$
);
