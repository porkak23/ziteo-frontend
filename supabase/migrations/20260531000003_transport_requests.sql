-- transport_requests: solicitudes de transporte independientes (no ligadas a un order)
-- Usadas cuando un constructor solicita transporte desde la app directamente.

CREATE TABLE IF NOT EXISTS transport_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    uuid NOT NULL,
  requester_role  text NOT NULL DEFAULT 'constructor',
  cargo_type      text NOT NULL CHECK (cargo_type IN ('light', 'heavy')),
  pickup_address  text NOT NULL,
  dropoff_address text NOT NULL,
  description     text,
  city            text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','in_transit','completed','cancelled')),
  driver_id       uuid,
  accepted_at     timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_requests_status     ON transport_requests(status);
CREATE INDEX IF NOT EXISTS idx_transport_requests_driver_id  ON transport_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_requester  ON transport_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_created_at ON transport_requests(created_at DESC);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;

-- El solicitante ve y crea las suyas
CREATE POLICY "tr_requester_select" ON transport_requests
  FOR SELECT USING (requester_id = auth.uid()::uuid);

CREATE POLICY "tr_requester_insert" ON transport_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid()::uuid);

-- Choferes (chofer role) ven todas las pendientes
CREATE POLICY "tr_chofer_select_pending" ON transport_requests
  FOR SELECT USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()::uuid
        AND user_roles.role = 'chofer'
    )
  );

-- El chofer asignado puede ver y actualizar su solicitud
CREATE POLICY "tr_chofer_select_own" ON transport_requests
  FOR SELECT USING (driver_id = auth.uid()::uuid);

CREATE POLICY "tr_chofer_update_own" ON transport_requests
  FOR UPDATE USING (driver_id = auth.uid()::uuid);

-- ─── RPC: aceptar una solicitud de transporte (claim seguro) ──────────────────
CREATE OR REPLACE FUNCTION accept_transport_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request transport_requests%ROWTYPE;
  v_driver_id uuid := auth.uid()::uuid;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT * INTO v_request
  FROM transport_requests
  WHERE id = p_request_id
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Solicitud no disponible (ya tomada por otro chofer)');
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'La solicitud ya no está disponible');
  END IF;

  UPDATE transport_requests
  SET status      = 'accepted',
      driver_id   = v_driver_id,
      accepted_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id);
END;
$$;
