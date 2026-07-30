-- accept_delivery: fail-closed cuando el chofer no tiene vehicle_type configurado.
--
-- Problema: cuando v_cargo_cap IS NULL (chofer sin vehicle_type en
-- user_roles), el chequeo de compatibilidad de carga se saltaba entero
-- (`v_cargo_cap IS NOT NULL AND (...)` es falso si v_cargo_cap es NULL) y el
-- chofer podía aceptar cualquier carga, incluida heavy, sin tener vehículo
-- registrado. Cambia a fail-closed: sin vehículo configurado, no puede
-- aceptar ningún trabajo del pool hasta que lo configure.

CREATE OR REPLACE FUNCTION public.accept_delivery(p_delivery_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_delivery       RECORD;
  v_driver_vehicle TEXT;
  v_cargo_cap      TEXT;
BEGIN
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

  IF v_delivery.fulfillment_mode != 'pool' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta entrega no está disponible para el pool de choferes');
  END IF;

  SELECT vehicle_type INTO v_driver_vehicle
  FROM user_roles
  WHERE user_id = auth.uid()
    AND role = 'chofer'
  LIMIT 1;

  v_cargo_cap := vehicle_to_cargo_type(v_driver_vehicle);

  IF v_cargo_cap IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Configura tu vehículo antes de aceptar trabajos'
    );
  END IF;

  IF cargo_rank(v_cargo_cap) < cargo_rank(v_delivery.cargo_type)
     OR (v_cargo_cap = 'heavy' AND v_delivery.cargo_type = 'light')
  THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', CASE
        WHEN v_delivery.cargo_type = 'heavy'
          THEN 'Este pedido requiere camión (carga pesada)'
        WHEN v_delivery.cargo_type = 'medium'
          THEN 'Este pedido requiere camioneta o camión (carga media)'
        ELSE 'Este pedido es solo para motocicletas o camionetas (carga ligera)'
      END
    );
  END IF;

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
$function$;

-- ============================================================================
-- DOWN (referencia, no ejecutar automáticamente):
-- ============================================================================
-- Restaurar la versión previa de accept_delivery — ver
-- supabase/migrations/20260711000001_fulfillment_routing.sql, sección 6
-- (el bloque original con `v_cargo_cap IS NOT NULL AND (...)`).
