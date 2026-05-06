-- ============================================================
-- FASE 2E: Cargo routing — vehicle_type on chofer + accept_delivery validation
-- ============================================================

-- -------------------------------------------------------
-- 1. user_roles (chofer): vehicle_type column
-- -------------------------------------------------------
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT
    CHECK (vehicle_type IN ('moto', 'camion', 'camioneta', 'pickup'));

COMMENT ON COLUMN user_roles.vehicle_type IS
  'Tipo de vehículo del chofer. moto=carga ligera (<5 kg), camion/camioneta/pickup=carga pesada (>=5 kg)';

-- -------------------------------------------------------
-- 2. Helper: map vehicle_type → cargo_type
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION vehicle_to_cargo_type(p_vehicle TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_vehicle = 'moto'                           THEN 'light'
    WHEN p_vehicle IN ('camion', 'camioneta', 'pickup') THEN 'heavy'
    ELSE NULL
  END;
$$;

-- -------------------------------------------------------
-- 3. accept_delivery RPC — replaces previous version
--    Adds cargo_type compatibility check before claiming.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION accept_delivery(p_delivery_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delivery       RECORD;
  v_driver_vehicle TEXT;
  v_cargo_cap      TEXT;
BEGIN
  -- Lock the delivery row to prevent race conditions
  SELECT * INTO v_delivery
  FROM deliveries
  WHERE id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Entrega no encontrada');
  END IF;

  IF v_delivery.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta entrega ya fue tomada por otro chofer');
  END IF;

  -- Read driver's declared vehicle_type
  SELECT vehicle_type INTO v_driver_vehicle
  FROM user_roles
  WHERE user_id = auth.uid()
    AND role = 'chofer'
  LIMIT 1;

  -- Derive cargo capability and validate
  v_cargo_cap := vehicle_to_cargo_type(v_driver_vehicle);

  IF v_cargo_cap IS NOT NULL AND v_cargo_cap != v_delivery.cargo_type THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', CASE
        WHEN v_delivery.cargo_type = 'heavy'
          THEN 'Este pedido requiere camión o camioneta (carga pesada)'
          ELSE 'Este pedido es solo para motocicletas (carga ligera)'
      END
    );
  END IF;

  -- Claim the delivery atomically
  UPDATE deliveries
  SET
    status      = 'accepted',
    driver_id   = auth.uid(),
    accepted_at = now(),
    updated_at  = now()
  WHERE id = p_delivery_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta entrega ya fue tomada');
  END IF;

  RETURN jsonb_build_object('success', true, 'delivery_id', p_delivery_id);
END;
$$;

COMMENT ON FUNCTION accept_delivery(UUID) IS
  'Race-condition-safe delivery claim. Validates driver vehicle_type vs delivery cargo_type.';
