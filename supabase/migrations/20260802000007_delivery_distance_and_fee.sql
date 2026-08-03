-- ============================================================
-- MIGRATION: 20260802000007_delivery_distance_and_fee.sql
-- Fix P2: deliveries.distance_km y estimated_fee nunca se calculaban
-- — no aparecían en el INSERT del trigger. El frontend compensaba
-- con un fallback (total * 0.08) en deliveryUtils.ts/useDriverEarnings.ts.
-- ============================================================
--
-- Fórmula de tarifa: replica el fallback existente del frontend
-- (8% del total) más un componente por distancia, para que el
-- fallback deje de ser la tarifa real "de facto" cuando hay
-- coordenadas de pickup y dropoff disponibles. Ambas quedan en NULL
-- si falta algún lat/lng — el fallback del frontend sigue cubriendo
-- ese caso sin cambios.
--
-- Bs 2/km es una tarifa base conservadora (referencia: viajes cortos
-- urbanos en Sucre/Potosí/Santa Cruz); ajustar junto con el negocio
-- cuando haya datos reales de costos de combustible/tiempo del chofer.
-- Se aplica solo a entregas nuevas — no se recalculan las existentes,
-- para no alterar retroactivamente lo que un chofer ya esperaba cobrar.

CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT ROUND((
    6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1))
        + sin(radians(lat1)) * sin(radians(lat2))
      ))
    )
  )::numeric, 2)
$$;

REVOKE ALL ON FUNCTION public.haversine_km(double precision, double precision, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.haversine_km(double precision, double precision, double precision, double precision) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.haversine_km(double precision, double precision, double precision, double precision) FROM anon;

CREATE OR REPLACE FUNCTION public.auto_create_delivery_on_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pickup_address   text;
  v_pickup_lat       numeric;
  v_pickup_lng       numeric;
  v_vehicle_type     text;
  v_vehicle_plate    text;
  v_fleet_driver     text;
  v_vehicle_available boolean;
  v_effective_cargo  text;
  v_vehicle_cap      text;
  v_vehicle_busy     boolean;
  v_mode             text;
  v_distance_km      numeric;
  v_estimated_fee    numeric;
BEGIN
  IF OLD.status <> 'processing' AND NEW.status = 'processing' THEN

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

    IF v_vehicle_cap IS NOT NULL
       AND cargo_rank(v_vehicle_cap) >= cargo_rank(v_effective_cargo)
       AND COALESCE(v_vehicle_available, true)
       AND NOT v_vehicle_busy
    THEN
      v_mode := 'flota';
    ELSE
      v_mode := 'pool';
    END IF;

    -- Distancia/tarifa solo si hay las 4 coordenadas — si falta alguna
    -- (proveedor sin tienda configurada), quedan NULL y el fallback del
    -- frontend (total * 0.08) sigue operando sin cambios.
    IF v_pickup_lat IS NOT NULL AND v_pickup_lng IS NOT NULL
       AND NEW.delivery_lat IS NOT NULL AND NEW.delivery_lng IS NOT NULL
    THEN
      v_distance_km := haversine_km(v_pickup_lat, v_pickup_lng, NEW.delivery_lat, NEW.delivery_lng);
      v_estimated_fee := ROUND((NEW.total * 0.08 + v_distance_km * 2)::numeric, 2);
    ELSE
      v_distance_km := NULL;
      v_estimated_fee := NULL;
    END IF;

    INSERT INTO deliveries (
      order_id, status, cargo_type, fulfillment_mode,
      pickup_address, pickup_lat, pickup_lng,
      dropoff_address, dropoff_lat, dropoff_lng,
      distance_km, estimated_fee,
      notes
    )
    VALUES (
      NEW.id, 'pending', v_effective_cargo, v_mode,
      v_pickup_address, v_pickup_lat, v_pickup_lng,
      NEW.delivery_address, NEW.delivery_lat, NEW.delivery_lng,
      v_distance_km, v_estimated_fee,
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
$function$;
