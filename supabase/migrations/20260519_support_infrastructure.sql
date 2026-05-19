-- ============================================================
-- MIGRATION: 20260519_support_infrastructure.sql
-- Infraestructura de soporte al usuario:
--   1. Agregar tipo 'dispute' al CHECK de notifications.type
--   2. Tabla disputes con RLS
--   3. RPC create_dispute()
-- ============================================================


-- ============================================================
-- 1. EXTENDER notifications.type PARA INCLUIR 'dispute'
-- Reemplaza el CHECK constraint existente que solo tiene:
--   ('contract','project_application','order','delivery','general')
-- ============================================================

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('contract', 'project_application', 'order', 'delivery', 'general', 'dispute'));


-- ============================================================
-- 2. TABLA disputes
-- Registra disputas entre constructor y proveedor sobre una orden.
-- Solo service-role puede marcar como 'resolved'.
-- ============================================================

CREATE TABLE IF NOT EXISTS disputes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_by   uuid        NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason       text        NOT NULL,
  details      text        NOT NULL,
  status       varchar     NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'resolved')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_disputes_order_id    ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by  ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status      ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at  ON disputes(created_at DESC);

-- RLS en disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Los involucrados en la orden pueden ver la disputa
CREATE POLICY "disputes_select_involved" ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
       WHERE orders.id = disputes.order_id
         AND (orders.constructor_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

-- Cualquier parte involucrada puede abrir una disputa (via RPC create_dispute)
-- Los INSERTs directos están bloqueados — solo la RPC SECURITY DEFINER puede insertar.
CREATE POLICY "disputes_insert_rpc_only" ON disputes
  FOR INSERT
  WITH CHECK (false);

-- Solo service-role puede actualizar el status a 'resolved'
-- Los usuarios normales (authenticated) no pueden hacer UPDATE en disputes.
-- La resolución manual la hace un admin via SQL o la RPC resolve_dispute (servicio interno).
CREATE POLICY "disputes_update_service_role_only" ON disputes
  FOR UPDATE
  USING (false);


-- ============================================================
-- 3. RPC create_dispute(p_order_id, p_reason, p_details)
-- Solo puede ser llamada por el constructor o proveedor de la orden.
-- Inserta un registro en disputes y envía notificación de tipo
-- 'dispute' a ambas partes.
-- Returns: el dispute_id como jsonb.
-- ============================================================

CREATE OR REPLACE FUNCTION create_dispute(
  p_order_id uuid,
  p_reason   text,
  p_details  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_constructor_id uuid;
  v_provider_id    uuid;
  v_order_status   text;
  v_dispute_id     uuid;
  v_other_party_id uuid;
BEGIN
  -- Validar datos de entrada
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'El motivo de la disputa no puede estar vacío.';
  END IF;

  IF p_details IS NULL OR length(trim(p_details)) < 20 THEN
    RAISE EXCEPTION 'Los detalles deben tener al menos 20 caracteres.';
  END IF;

  -- Buscar la orden
  SELECT constructor_id, provider_id, status
    INTO v_constructor_id, v_provider_id, v_order_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  -- Solo el constructor o proveedor de la orden pueden abrir una disputa
  IF auth.uid() IS DISTINCT FROM v_constructor_id
     AND auth.uid() IS DISTINCT FROM v_provider_id THEN
    RAISE EXCEPTION 'Solo el constructor o proveedor de esta orden pueden reportar una disputa.';
  END IF;

  -- La disputa aplica sobre órdenes en estados terminales o con problema
  IF v_order_status NOT IN ('delivered', 'cancelled', 'expired', 'confirmed', 'processing', 'shipped') THEN
    RAISE EXCEPTION 'No se puede abrir una disputa en una orden con estado: %', v_order_status;
  END IF;

  -- Evitar duplicados: no abrir dos disputas 'open' para la misma orden
  IF EXISTS (
    SELECT 1 FROM disputes
     WHERE order_id = p_order_id
       AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Ya existe una disputa abierta para esta orden.';
  END IF;

  -- Insertar la disputa
  INSERT INTO disputes (order_id, created_by, reason, details, status)
  VALUES (p_order_id, auth.uid(), p_reason, p_details, 'open')
  RETURNING id INTO v_dispute_id;

  -- Determinar a quién notificar (la otra parte)
  IF auth.uid() = v_constructor_id THEN
    v_other_party_id := v_provider_id;
  ELSE
    v_other_party_id := v_constructor_id;
  END IF;

  -- Notificar a la otra parte
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    v_other_party_id,
    'dispute',
    'Disputa reportada en un pedido',
    'Se ha abierto una disputa en la orden. Revisa los detalles en Mis Pedidos.'
  );

  -- Notificar también al creador de la disputa (confirmación de recepción)
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    auth.uid(),
    'dispute',
    'Tu reporte fue enviado',
    'Tu reporte de problema fue registrado. El equipo de Ziteo revisará la situación.'
  );

  RETURN jsonb_build_object(
    'success',    true,
    'dispute_id', v_dispute_id,
    'order_id',   p_order_id
  );
END;
$$;


-- ============================================================
-- 4. RPC resolve_dispute(p_dispute_id, p_resolution_notes)
-- Solo para uso interno / service-role via SQL directo.
-- Documenta la resolución y marca la disputa como resuelta.
-- Notifica a ambas partes.
-- ============================================================

CREATE OR REPLACE FUNCTION resolve_dispute(
  p_dispute_id       uuid,
  p_resolution_notes text DEFAULT 'Disputa resuelta por el equipo de Ziteo.'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id       uuid;
  v_constructor_id uuid;
  v_provider_id    uuid;
  v_status         text;
BEGIN
  -- Solo service-role puede resolver (auth.uid() será NULL cuando se llama
  -- desde el dashboard de Supabase con service-role key)
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'resolve_dispute solo puede ser ejecutada por service-role.';
  END IF;

  SELECT d.order_id, d.status, o.constructor_id, o.provider_id
    INTO v_order_id, v_status, v_constructor_id, v_provider_id
    FROM disputes d
    JOIN orders o ON o.id = d.order_id
   WHERE d.id = p_dispute_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Disputa no encontrada: %', p_dispute_id;
  END IF;

  IF v_status = 'resolved' THEN
    RAISE EXCEPTION 'La disputa ya está resuelta.';
  END IF;

  -- Marcar como resuelta (bypassa RLS via SECURITY DEFINER)
  UPDATE disputes
     SET status      = 'resolved',
         resolved_at = now(),
         details     = details || E'\n\n[Resolución] ' || p_resolution_notes
   WHERE id = p_dispute_id;

  -- Notificar a ambas partes
  INSERT INTO notifications (user_id, type, title, message)
  VALUES
    (v_constructor_id, 'dispute', 'Disputa resuelta', p_resolution_notes),
    (v_provider_id,    'dispute', 'Disputa resuelta', p_resolution_notes);

  RETURN jsonb_build_object(
    'success',    true,
    'dispute_id', p_dispute_id
  );
END;
$$;
