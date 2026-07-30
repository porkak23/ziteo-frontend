-- RPC confirm_pickup_delivered: cierra el ciclo de la ruta "retiro en tienda".
--
-- Problema: auto_create_delivery_on_processing corta temprano cuando
-- delivery_method='pickup' (no crea fila en `deliveries` porque no hay
-- transporte que rutear), y no existía ningún RPC que moviera la orden a
-- 'delivered' en ese caso. Verificado en sandbox: la orden quedaba en
-- 'processing' con el código de retiro mostrado para siempre, sin ninguna
-- acción en ninguna pantalla (ni vendedor ni comprador) que la cerrara.
--
-- Mismo patrón que advance_own_fleet_delivery (20260711000001): dos UPDATEs
-- porque trg_order_status no permite saltar processing→delivered directo.

CREATE OR REPLACE FUNCTION public.confirm_pickup_delivered(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;
  IF auth.uid() IS DISTINCT FROM v_order.provider_id THEN
    RAISE EXCEPTION 'Solo el proveedor de la orden puede confirmar el retiro';
  END IF;
  IF v_order.delivery_method IS DISTINCT FROM 'pickup' THEN
    RAISE EXCEPTION 'Esta orden no es de retiro en tienda';
  END IF;
  IF v_order.status <> 'processing' THEN
    RAISE EXCEPTION 'La orden no está lista para cerrarse (estado actual: %)', v_order.status;
  END IF;

  UPDATE orders SET status = 'shipped', updated_at = now() WHERE id = p_order_id;
  UPDATE orders SET status = 'delivered', delivered_date = now(), updated_at = now() WHERE id = p_order_id;

  PERFORM send_notification(
    v_order.constructor_id,
    'order',
    'Pedido retirado',
    'Confirmaste el retiro de tu pedido en tienda. ¡Gracias por comprar en Ziteoo!'
  );

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.confirm_pickup_delivered(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_pickup_delivered(uuid) FROM anon, PUBLIC;

-- ============================================================================
-- DOWN (referencia, no ejecutar automáticamente):
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.confirm_pickup_delivered(uuid);
