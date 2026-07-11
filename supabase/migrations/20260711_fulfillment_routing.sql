-- Ruteo inteligente de despacho: Recogida / Flota Propia / Pool Ziteoo
--
-- Problema: el delivery_method elegido por el comprador (pickup/delivery) nunca
-- llegaba al vendedor y el trigger creaba delivery incluso para pickups; el
-- vendedor despachaba "Flota Propia" escribiendo conductor+placa a mano cada vez
-- porque no existía modelo de vehículo del vendedor; y la compatibilidad
-- vehículo-carga era binaria con un bug de igualdad estricta (un camión no podía
-- tomar carga ligera del pool, y camioneta/camión no se distinguían).
--
-- Esta migración: (1) agrega el nivel de carga 'medium' (camioneta/pickup) a los
-- 3 CHECK de cargo_type; (2) modela un vehículo por tienda reutilizando
-- vehicle_type/vehicle_plate de user_roles + fleet_driver_name/vehicle_available
-- nuevos; (3) agrega deliveries.fulfillment_mode ('flota'|'pool'); (4) reescribe
-- auto_create_delivery_on_processing para clasificar automáticamente: pickup no
-- crea delivery, delivery con vehículo capaz+disponible+libre va a flota propia,
-- cualquier otro caso va al pool; (5) corrige accept_delivery con una matriz de
-- compatibilidad correcta (capacidad >= carga, camión no ve carga light); (6)
-- nuevo RPC advance_own_fleet_delivery para que el vendedor avance/derive su
-- propia entrega; (7) endurece RLS de deliveries_select para que el pool de
-- choferes no vea entregas de flota propia.
--
-- Verificado end-to-end en el sandbox aislado (ziteoo-sandbox) antes de aplicar
-- aquí: casos A (pickup), B (flota propia ciclo completo), C (vehículo sin
-- capacidad → pool), y matching moto-rechaza/camión-acepta en accept_delivery.

-- 1. CHECKs de cargo_type: agregar 'medium'
ALTER TABLE public.orders DROP CONSTRAINT orders_cargo_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_cargo_type_check
  CHECK (cargo_type = ANY (ARRAY['light','medium','heavy']::text[]));

ALTER TABLE public.deliveries DROP CONSTRAINT deliveries_cargo_type_check;
ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_cargo_type_check
  CHECK (cargo_type = ANY (ARRAY['light','medium','heavy']::text[]));

ALTER TABLE public.transport_requests DROP CONSTRAINT transport_requests_cargo_type_check;
ALTER TABLE public.transport_requests ADD CONSTRAINT transport_requests_cargo_type_check
  CHECK (cargo_type = ANY (ARRAY['light','medium','heavy']::text[]));

-- 2. user_roles: nuevas columnas para flota del vendedor
--    (vehicle_type/vehicle_plate ya existen, compartidas con el rol chofer)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS fleet_driver_name text,
  ADD COLUMN IF NOT EXISTS vehicle_available boolean NOT NULL DEFAULT true;

-- 3. deliveries: fulfillment_mode
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS fulfillment_mode text NOT NULL DEFAULT 'pool'
    CHECK (fulfillment_mode IN ('flota','pool'));

UPDATE public.deliveries
   SET fulfillment_mode = 'flota'
 WHERE notes LIKE 'Flota propia:%';

-- 4. vehicle_to_cargo_type: 3 niveles (antes: moto=light, todo lo demás=heavy)
CREATE OR REPLACE FUNCTION public.vehicle_to_cargo_type(p_vehicle text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_vehicle = 'moto' THEN 'light'
    WHEN p_vehicle IN ('camioneta', 'pickup') THEN 'medium'
    WHEN p_vehicle = 'camion' THEN 'heavy'
    ELSE NULL
  END;
$function$;

-- 5. cargo_rank: nivel numérico para comparar capacidad vs carga
CREATE OR REPLACE FUNCTION public.cargo_rank(p_cargo text)
 RETURNS int
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE p_cargo
    WHEN 'light' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'heavy' THEN 3
    ELSE NULL
  END;
$function$;

-- 6. accept_delivery: matriz de compatibilidad del pool en vez de igualdad estricta.
--    Moto solo ve light; camioneta ve light+medium; camión ve medium+heavy (no light).
--    Solo entregas fulfillment_mode='pool' son aceptables por el pool de choferes.
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

  IF v_cargo_cap IS NOT NULL AND (
       cargo_rank(v_cargo_cap) < cargo_rank(v_delivery.cargo_type)
       OR (v_cargo_cap = 'heavy' AND v_delivery.cargo_type = 'light')
     ) THEN
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

-- 7. auto_create_delivery_on_processing: el corazón del ruteo automático.
CREATE OR REPLACE FUNCTION auto_create_delivery_on_processing()
RETURNS TRIGGER AS $$
DECLARE
  v_pickup_address    text;
  v_pickup_lat        numeric;
  v_pickup_lng        numeric;
  v_vehicle_type      text;
  v_vehicle_plate     text;
  v_fleet_driver      text;
  v_vehicle_available boolean;
  v_effective_cargo   text;
  v_vehicle_cap       text;
  v_vehicle_busy      boolean;
  v_mode              text;
BEGIN
  IF OLD.status <> 'processing' AND NEW.status = 'processing' THEN

    -- Caso A: recogida en tienda — no se crea delivery, solo se notifica al vendedor.
    IF NEW.delivery_method = 'pickup' THEN
      PERFORM send_notification(
        NEW.provider_id,
        'order',
        'Pedido para retiro en tienda',
        'El comprador pasará a recoger su pedido en tu tienda.'
      );
      RETURN NEW;
    END IF;

    v_effective_cargo := COALESCE(NEW.cargo_type, 'light');

    SELECT store_address, store_lat, store_lng,
           vehicle_type, vehicle_plate, fleet_driver_name, vehicle_available
      INTO v_pickup_address, v_pickup_lat, v_pickup_lng,
           v_vehicle_type, v_vehicle_plate, v_fleet_driver, v_vehicle_available
      FROM user_roles
      WHERE user_id = NEW.provider_id AND role = 'proveedor'
      LIMIT 1;

    v_vehicle_cap := vehicle_to_cargo_type(v_vehicle_type);

    v_vehicle_busy := EXISTS (
      SELECT 1
        FROM deliveries d
        JOIN orders o ON o.id = d.order_id
       WHERE o.provider_id = NEW.provider_id
         AND d.fulfillment_mode = 'flota'
         AND d.status IN ('accepted', 'in_transit')
    );

    -- Caso B: flota propia — vehículo capaz, disponible y libre.
    IF v_vehicle_cap IS NOT NULL
       AND cargo_rank(v_vehicle_cap) >= cargo_rank(v_effective_cargo)
       AND COALESCE(v_vehicle_available, true)
       AND NOT v_vehicle_busy
    THEN
      v_mode := 'flota';
    ELSE
      -- Caso C: sin vehículo, insuficiente, ocupado, o no disponible → pool.
      v_mode := 'pool';
    END IF;

    INSERT INTO deliveries (
      order_id, status, cargo_type, fulfillment_mode,
      pickup_address, pickup_lat, pickup_lng,
      dropoff_address, dropoff_lat, dropoff_lng,
      notes
    )
    VALUES (
      NEW.id, 'pending', v_effective_cargo, v_mode,
      v_pickup_address, v_pickup_lat, v_pickup_lng,
      NEW.delivery_address, NEW.delivery_lat, NEW.delivery_lng,
      CASE WHEN v_mode = 'flota'
        THEN 'Flota propia: ' || COALESCE(v_fleet_driver, 'Sin nombre') || ' — placa ' || COALESCE(v_vehicle_plate, 'N/D')
        ELSE NULL END
    )
    ON CONFLICT DO NOTHING;

    IF v_mode = 'flota' THEN
      PERFORM send_notification(
        NEW.provider_id,
        'transport',
        'Envía este pedido con tu vehículo',
        'Tu vehículo puede llevar este pedido. Inicia el envío desde Gestionar Envío.'
      );
    ELSE
      PERFORM send_notification(
        NEW.provider_id,
        'transport',
        'Pedido publicado al pool de Ziteoo',
        CASE
          WHEN v_vehicle_cap IS NULL THEN 'No tienes un vehículo registrado, así que lo publicamos para los transportistas de Ziteoo.'
          WHEN v_vehicle_busy THEN 'Tu vehículo está ocupado con otro envío, así que lo publicamos para los transportistas de Ziteoo.'
          WHEN NOT COALESCE(v_vehicle_available, true) THEN 'Marcaste tu vehículo como no disponible, así que lo publicamos para los transportistas de Ziteoo.'
          ELSE 'Tu vehículo no tiene capacidad para esta carga, así que lo publicamos para los transportistas de Ziteoo.'
        END
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Nuevo RPC: el vendedor avanza/deriva su propia entrega de flota propia.
--    'start': pending -> accepted -> in_transit (dos UPDATEs: el trigger
--    validate_delivery_status_transition exige pasar por 'accepted', no permite
--    saltar directo a in_transit) + order -> shipped.
--    'delivered': in_transit -> delivered + order -> delivered.
--    'derive_pool': (solo si pending) fulfillment_mode -> 'pool', limpia notes,
--    notifica — vía de escape manual si el vendedor prefiere el pool.
CREATE OR REPLACE FUNCTION public.advance_own_fleet_delivery(p_order_id uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order    orders%ROWTYPE;
  v_delivery deliveries%ROWTYPE;
BEGIN
  IF p_action NOT IN ('start', 'delivered', 'derive_pool') THEN
    RAISE EXCEPTION 'Acción inválida: %', p_action;
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;
  IF auth.uid() IS DISTINCT FROM v_order.provider_id THEN
    RAISE EXCEPTION 'Solo el proveedor de la orden puede gestionar esta entrega';
  END IF;

  SELECT * INTO v_delivery FROM deliveries WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrega no encontrada para esta orden';
  END IF;
  IF v_delivery.fulfillment_mode <> 'flota' THEN
    RAISE EXCEPTION 'Esta entrega no es de flota propia';
  END IF;

  IF p_action = 'start' THEN
    IF v_delivery.status <> 'pending' THEN
      RAISE EXCEPTION 'La entrega no está pendiente de inicio (estado actual: %)', v_delivery.status;
    END IF;
    UPDATE deliveries SET status = 'accepted', accepted_at = now(), updated_at = now()
     WHERE id = v_delivery.id;
    UPDATE deliveries SET status = 'in_transit', picked_up_at = now(), updated_at = now()
     WHERE id = v_delivery.id;
    UPDATE orders SET status = 'shipped', updated_at = now() WHERE id = p_order_id;

  ELSIF p_action = 'delivered' THEN
    IF v_delivery.status <> 'in_transit' THEN
      RAISE EXCEPTION 'La entrega no está en tránsito (estado actual: %)', v_delivery.status;
    END IF;
    UPDATE deliveries SET status = 'delivered', delivered_at = now(), updated_at = now()
     WHERE id = v_delivery.id;
    UPDATE orders SET status = 'delivered', delivered_date = now(), updated_at = now() WHERE id = p_order_id;

  ELSIF p_action = 'derive_pool' THEN
    IF v_delivery.status <> 'pending' THEN
      RAISE EXCEPTION 'Solo puedes derivar al pool una entrega que aún no ha iniciado';
    END IF;
    UPDATE deliveries
       SET fulfillment_mode = 'pool', notes = NULL, updated_at = now()
     WHERE id = v_delivery.id;
    PERFORM send_notification(
      v_order.provider_id,
      'transport',
      'Pedido derivado al pool de Ziteoo',
      'Publicamos este pedido para los transportistas de Ziteoo, tal como lo pediste.'
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'action', p_action);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.advance_own_fleet_delivery(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.advance_own_fleet_delivery(uuid, text) FROM anon, PUBLIC;

-- 9. create_delivery_by_provider: actualizar para setear fulfillment_mode.
--    Se mantiene como vía manual de compatibilidad (usada por la UI existente).
CREATE OR REPLACE FUNCTION public.create_delivery_by_provider(
  p_order_id uuid,
  p_mode     text,
  p_driver_name text DEFAULT NULL,
  p_vehicle_plate text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  IF p_mode NOT IN ('flota', 'repartidor') THEN
    RAISE EXCEPTION 'Modo inválido: %', p_mode;
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;
  IF auth.uid() IS DISTINCT FROM v_order.provider_id THEN
    RAISE EXCEPTION 'Solo el proveedor de la orden puede despachar';
  END IF;
  IF p_mode = 'flota' AND (p_driver_name IS NULL OR p_vehicle_plate IS NULL) THEN
    RAISE EXCEPTION 'Flota propia requiere conductor y placa';
  END IF;

  INSERT INTO deliveries (order_id, status, cargo_type, fulfillment_mode, notes)
  VALUES (
    p_order_id,
    CASE p_mode WHEN 'flota' THEN 'in_transit' ELSE 'pending' END,
    COALESCE(v_order.cargo_type, 'light'),
    CASE p_mode WHEN 'flota' THEN 'flota' ELSE 'pool' END,
    CASE p_mode WHEN 'flota'
      THEN 'Flota propia: ' || p_driver_name || ' — placa ' || p_vehicle_plate
      ELSE NULL END
  )
  ON CONFLICT (order_id) DO NOTHING;

  IF p_mode = 'flota' THEN
    UPDATE deliveries
       SET notes = 'Flota propia: ' || p_driver_name || ' — placa ' || p_vehicle_plate,
           fulfillment_mode = 'flota'
     WHERE order_id = p_order_id AND notes IS NULL;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_delivery_by_provider(uuid, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_delivery_by_provider(uuid, text, text, text) FROM anon, PUBLIC;

-- 10. RLS: el pool de choferes solo debe ver entregas fulfillment_mode='pool'.
--     Antes cualquier delivery 'pending' era visible (incluida la de flota propia).
DROP POLICY IF EXISTS deliveries_select ON public.deliveries;
CREATE POLICY deliveries_select ON public.deliveries
  FOR SELECT
  USING (
    (status = 'pending' AND fulfillment_mode = 'pool')
    OR driver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM orders
       WHERE orders.id = deliveries.order_id
         AND (orders.constructor_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

-- ============================================================================
-- DOWN (referencia, no ejecutar automáticamente):
-- ============================================================================
-- DROP POLICY IF EXISTS deliveries_select ON public.deliveries;
-- CREATE POLICY deliveries_select ON public.deliveries FOR SELECT USING (
--   status = 'pending' OR driver_id = auth.uid() OR EXISTS (
--     SELECT 1 FROM orders WHERE orders.id = deliveries.order_id
--       AND (orders.constructor_id = auth.uid() OR orders.provider_id = auth.uid())));
--
-- DROP FUNCTION IF EXISTS public.advance_own_fleet_delivery(uuid, text);
--
-- -- restaurar auto_create_delivery_on_processing a la versión store-location-only
-- -- (ver supabase/migrations/20260710_provider_store_location.sql)
--
-- -- restaurar accept_delivery y vehicle_to_cargo_type con la definición binaria
-- -- previa (moto=light, todo lo demás=heavy; igualdad estricta)
--
-- ALTER TABLE public.deliveries DROP COLUMN fulfillment_mode;
-- ALTER TABLE public.user_roles DROP COLUMN fleet_driver_name, DROP COLUMN vehicle_available;
--
-- ALTER TABLE public.orders DROP CONSTRAINT orders_cargo_type_check;
-- ALTER TABLE public.orders ADD CONSTRAINT orders_cargo_type_check
--   CHECK (cargo_type = ANY (ARRAY['light','heavy']::text[]));
-- ALTER TABLE public.deliveries DROP CONSTRAINT deliveries_cargo_type_check;
-- ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_cargo_type_check
--   CHECK (cargo_type = ANY (ARRAY['light','heavy']::text[]));
-- ALTER TABLE public.transport_requests DROP CONSTRAINT transport_requests_cargo_type_check;
-- ALTER TABLE public.transport_requests ADD CONSTRAINT transport_requests_cargo_type_check
--   CHECK (cargo_type = ANY (ARRAY['light','heavy']::text[]));
