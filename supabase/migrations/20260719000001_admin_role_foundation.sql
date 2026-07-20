-- ============================================================
-- God Mode F0 — Fundación de seguridad admin
-- ============================================================
-- Introduce el rol 'admin' y una función is_admin() reutilizable
-- para dar al panel de administración lectura global segura via RLS,
-- sin abrir ninguna tabla a anon ni degradar las policies existentes.

-- 1. is_admin(): true si el usuario autenticado tiene una fila
--    en user_roles con role = 'admin'. STABLE + SECURITY DEFINER
--    para poder evaluarla dentro de policies sin recursión de RLS
--    sobre user_roles.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 2. Policies de lectura global para admin.
--    Se agregan como policies ADICIONALES (Postgres las combina con OR
--    dentro del mismo comando), nunca reemplazan las existentes.

-- ORDERS
CREATE POLICY "admin_select_all_orders" ON orders
  FOR SELECT USING (is_admin());

-- ORDER_ITEMS
CREATE POLICY "admin_select_all_order_items" ON order_items
  FOR SELECT USING (is_admin());

-- QUOTATIONS
CREATE POLICY "admin_select_all_quotations" ON quotations
  FOR SELECT USING (is_admin());

-- DELIVERIES
CREATE POLICY "admin_select_all_deliveries" ON deliveries
  FOR SELECT USING (is_admin());

-- TRANSPORT_REQUESTS
CREATE POLICY "admin_select_all_transport_requests" ON transport_requests
  FOR SELECT USING (is_admin());

-- DRIVER_LOCATIONS (necesario para el mapa en vivo)
CREATE POLICY "admin_select_all_driver_locations" ON driver_locations
  FOR SELECT USING (is_admin());

-- PRODUCTS (ya es select_all=true para todos; no requiere policy admin)

-- USER_ROLES (para ver quién es chofer/proveedor/etc, vehículos, tiendas)
CREATE POLICY "admin_select_all_user_roles" ON user_roles
  FOR SELECT USING (is_admin());

-- PROFILES (ya legible por cualquier authenticated; no requiere policy admin)

-- NOTIFICATIONS (para feed de actividad)
CREATE POLICY "admin_select_all_notifications" ON notifications
  FOR SELECT USING (is_admin());

-- CART_ITEMS (para detectar carritos abandonados)
CREATE POLICY "admin_select_all_cart_items" ON cart_items
  FOR SELECT USING (is_admin());

-- MESSAGES (visibilidad de soporte/moderación; solo lectura)
CREATE POLICY "admin_select_all_messages" ON messages
  FOR SELECT USING (is_admin());

-- 3. Tabla admin_alerts: alertas por severidad generadas por triggers
--    (pago sin verificar, delivery failed, chofer mudo, desviación de
--    precio, etc). Solo admin puede leerla y marcarla como reconocida.
CREATE TABLE IF NOT EXISTS admin_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity        text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  kind            text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_unacked
  ON admin_alerts(created_at DESC) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity
  ON admin_alerts(severity, created_at DESC);

ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_alerts_select" ON admin_alerts
  FOR SELECT USING (is_admin());
CREATE POLICY "admin_alerts_update_ack" ON admin_alerts
  FOR UPDATE USING (is_admin());
-- INSERT solo vía funciones SECURITY DEFINER (triggers), nunca directo:
-- no se agrega policy de INSERT => bloqueado para authenticated/anon.

ALTER PUBLICATION supabase_realtime ADD TABLE admin_alerts;

-- 4. RPC para reconocer una alerta desde el dashboard.
CREATE OR REPLACE FUNCTION acknowledge_admin_alert(p_alert_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: se requiere rol admin.';
  END IF;

  UPDATE admin_alerts
     SET acknowledged_at = now(),
         acknowledged_by = auth.uid()
   WHERE id = p_alert_id
     AND acknowledged_at IS NULL;

  RETURN jsonb_build_object('success', true, 'alert_id', p_alert_id);
END;
$$;

REVOKE ALL ON FUNCTION acknowledge_admin_alert(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION acknowledge_admin_alert(uuid) TO authenticated;
