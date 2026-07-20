-- ============================================================
-- God Mode F1 — Eventos de producto + feed de actividad admin
-- ============================================================
-- Tabla `events`: espejo liviano de los eventos de negocio que ya se
-- envían a PostHog (ver ziteo-frontend/src/lib/analytics.ts), para que
-- el Command Center tenga un feed en vivo consultable por SQL sin
-- depender de la API externa de PostHog.

CREATE TABLE IF NOT EXISTS events (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id),
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(event_name, created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Solo admin lee el feed; nadie inserta directo (solo vía log_event()).
CREATE POLICY "admin_select_all_events" ON events
  FOR SELECT USING (is_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- RPC log_event(): dual-write desde el cliente (fire-and-forget).
-- Reutiliza check_throttle() para evitar abuso: máx 60 eventos/minuto
-- por usuario autenticado.
CREATE OR REPLACE FUNCTION log_event(
  p_event_name text,
  p_properties jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF check_throttle('log_event:' || auth.uid()::text, 60, 1) THEN
    RETURN;
  END IF;

  INSERT INTO events (user_id, event_name, properties)
  VALUES (auth.uid(), p_event_name, COALESCE(p_properties, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION log_event(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_event(text, jsonb) TO authenticated;

-- ============================================================
-- Vista de choferes online — no cubierta por las kpi_* views
-- existentes (20260519_kpi_views.sql). "Online" = publicó su
-- ubicación en los últimos 2 minutos (el cliente hace upsert cada 30s).
-- ============================================================
-- security_invoker=true es OBLIGATORIO aquí: el owner (postgres) tiene
-- BYPASSRLS, así que una vista normal ignoraría el RLS de driver_locations
-- y expondría el GPS de todos los choferes a cualquier authenticated.
-- Con security_invoker, la vista respeta el RLS del usuario que consulta:
-- solo pasa admin_select_all_driver_locations (is_admin()) o las policies
-- de participación existentes (driver_can_upsert_own_location,
-- buyer_can_read_assigned_driver_location).
CREATE OR REPLACE VIEW admin_drivers_online
WITH (security_invoker = true)
AS
SELECT
  dl.driver_id,
  dl.lat,
  dl.lng,
  dl.heading,
  dl.updated_at,
  ur.vehicle_type,
  ur.vehicle_plate,
  ur.is_available
FROM driver_locations dl
JOIN user_roles ur ON ur.user_id = dl.driver_id AND ur.role = 'chofer'
WHERE dl.updated_at > now() - interval '2 minutes';

GRANT SELECT ON admin_drivers_online TO authenticated;
