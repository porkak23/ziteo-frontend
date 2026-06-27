-- RPC para que el chofer avance el estado de una solicitud de transporte
CREATE OR REPLACE FUNCTION public.advance_transport_request(
  p_request_id uuid,
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request transport_requests%ROWTYPE;
  v_driver_id uuid := auth.uid()::uuid;
BEGIN
  IF p_new_status NOT IN ('in_transit', 'completed', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Estado no válido');
  END IF;

  SELECT * INTO v_request
  FROM transport_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Solicitud no encontrada');
  END IF;

  IF v_request.driver_id IS DISTINCT FROM v_driver_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'No tienes permiso para modificar esta solicitud');
  END IF;

  IF p_new_status = 'in_transit' AND v_request.status <> 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Solo puedes iniciar tránsito desde estado aceptado');
  END IF;
  IF p_new_status = 'completed' AND v_request.status NOT IN ('accepted', 'in_transit') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Solo puedes completar desde aceptado o en tránsito');
  END IF;

  UPDATE transport_requests
  SET
    status       = p_new_status,
    completed_at = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', p_new_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_transport_request(uuid, text) TO authenticated;
