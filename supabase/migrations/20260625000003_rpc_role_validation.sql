-- 20260625_rpc_role_validation.sql
-- Añade validación de rol chofer a accept_delivery y update_delivery_status.

CREATE OR REPLACE FUNCTION accept_delivery(p_delivery_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delivery deliveries%ROWTYPE;
BEGIN
  -- Validar que el caller tenga el rol 'chofer'
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'chofer'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: se requiere rol chofer para aceptar entregas.';
  END IF;

  SELECT * INTO v_delivery
    FROM deliveries
   WHERE id = p_delivery_id
     AND status = 'pending'
   FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Este viaje ya fue tomado por otro transportista.'
    );
  END IF;

  UPDATE deliveries
     SET driver_id   = auth.uid(),
         status      = 'accepted',
         accepted_at = now(),
         updated_at  = now()
   WHERE id = p_delivery_id;

  RETURN jsonb_build_object(
    'success', true,
    'delivery_id', p_delivery_id
  );
END;
$$;


CREATE OR REPLACE FUNCTION update_delivery_status(
  p_delivery_id uuid,
  p_new_status  varchar
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id uuid;
BEGIN
  -- Validar que el caller tenga el rol 'chofer'
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'chofer'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: se requiere rol chofer para actualizar estado de entrega.';
  END IF;

  SELECT driver_id INTO v_driver_id
    FROM deliveries
   WHERE id = p_delivery_id;

  IF v_driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: solo el transportista asignado puede actualizar el estado.';
  END IF;

  UPDATE deliveries
     SET status       = p_new_status,
         picked_up_at = CASE WHEN p_new_status = 'in_transit' THEN now() ELSE picked_up_at END,
         delivered_at = CASE WHEN p_new_status = 'delivered'  THEN now() ELSE delivered_at END,
         updated_at   = now()
   WHERE id = p_delivery_id;

  RETURN jsonb_build_object('success', true, 'new_status', p_new_status);
END;
$$;
