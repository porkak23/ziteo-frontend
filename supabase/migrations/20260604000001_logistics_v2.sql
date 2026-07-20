-- ============================================================
-- LOGISTICS V2: driver_locations + delivery_method + place_order update
-- ============================================================

-- -------------------------------------------------------
-- 1. Tabla driver_locations: ubicación en tiempo real del conductor
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  heading    double precision DEFAULT 0,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- El conductor escribe/lee su propia ubicación
CREATE POLICY "driver_can_upsert_own_location" ON public.driver_locations
  FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

-- El comprador puede leer la ubicación del conductor asignado a su entrega activa
CREATE POLICY "buyer_can_read_assigned_driver_location" ON public.driver_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      JOIN public.orders o ON o.id = d.order_id
      WHERE d.driver_id = driver_locations.driver_id
        AND d.status IN ('accepted', 'in_transit')
        AND o.constructor_id = auth.uid()
    )
  );

-- Habilitar realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- -------------------------------------------------------
-- 2. RPC upsert_driver_location
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_driver_location(
  p_lat     double precision,
  p_lng     double precision,
  p_heading double precision DEFAULT 0
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.driver_locations (driver_id, lat, lng, heading, updated_at)
  VALUES (auth.uid(), p_lat, p_lng, p_heading, now())
  ON CONFLICT (driver_id) DO UPDATE
    SET lat        = EXCLUDED.lat,
        lng        = EXCLUDED.lng,
        heading    = EXCLUDED.heading,
        updated_at = EXCLUDED.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_driver_location TO authenticated;

-- -------------------------------------------------------
-- 3. Columnas nuevas en tabla orders
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_method') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_method text CHECK (delivery_method IN ('pickup', 'delivery')) DEFAULT 'delivery';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_address') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lat') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_lat double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lng') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_lng double precision;
  END IF;
END $$;

-- -------------------------------------------------------
-- 4. Columnas nuevas en tabla transport_requests
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transport_requests' AND column_name='pickup_lat') THEN
    ALTER TABLE public.transport_requests ADD COLUMN pickup_lat double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transport_requests' AND column_name='pickup_lng') THEN
    ALTER TABLE public.transport_requests ADD COLUMN pickup_lng double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transport_requests' AND column_name='dropoff_lat') THEN
    ALTER TABLE public.transport_requests ADD COLUMN dropoff_lat double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transport_requests' AND column_name='dropoff_lng') THEN
    ALTER TABLE public.transport_requests ADD COLUMN dropoff_lng double precision;
  END IF;
END $$;

-- -------------------------------------------------------
-- 5. Reemplazar place_order para aceptar delivery_method y dirección
--    (parámetros nuevos son opcionales con defaults para backward compatibility)
--    Se elimina primero la firma anterior (4 args) para evitar un overload
--    ambiguo con la nueva firma (que tiene defaults para los 4 args extra).
-- -------------------------------------------------------
DROP FUNCTION IF EXISTS public.place_order(uuid, uuid, numeric, jsonb);

CREATE OR REPLACE FUNCTION public.place_order(
  p_constructor_id   uuid,
  p_provider_id      uuid,
  p_total            numeric,
  p_items            jsonb,
  p_delivery_method  text DEFAULT 'delivery',
  p_delivery_address text DEFAULT NULL,
  p_delivery_lat     double precision DEFAULT NULL,
  p_delivery_lng     double precision DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id       uuid;
  v_item           jsonb;
  v_stock_quantity int;
  v_is_rental      boolean;
  v_rental_status  text;
BEGIN
  -- Validate stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock_quantity INTO v_stock_quantity FROM public.products WHERE id = (v_item->>'product_id')::uuid;
    IF v_stock_quantity < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'product_id');
    END IF;
  END LOOP;

  -- Create order (now includes delivery fields)
  INSERT INTO public.orders (
    constructor_id,
    provider_id,
    total,
    status,
    delivery_method,
    delivery_address,
    delivery_lat,
    delivery_lng
  )
  VALUES (
    p_constructor_id,
    p_provider_id,
    p_total,
    'pending',
    COALESCE(p_delivery_method, 'delivery'),
    p_delivery_address,
    p_delivery_lat,
    p_delivery_lng
  )
  RETURNING id INTO v_order_id;

  -- Insert items and update stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_is_rental := COALESCE((v_item->>'is_rental')::boolean, false);
    v_rental_status := CASE WHEN v_is_rental THEN 'reserved' ELSE NULL END;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      price_unit,
      is_rental,
      rental_start_date,
      rental_end_date,
      rental_days,
      rental_unit_rate,
      rental_deposit,
      rental_status
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price_unit')::numeric,
      v_is_rental,
      (v_item->>'rental_start_date')::date,
      (v_item->>'rental_end_date')::date,
      (v_item->>'rental_days')::int,
      (v_item->>'rental_unit_rate')::numeric,
      (v_item->>'rental_deposit')::numeric,
      v_rental_status
    );

    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::int
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- -------------------------------------------------------
-- 6. Trigger: notificar conductores cuando llega un nuevo delivery pending
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_drivers_new_delivery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insertar notificación a todos los usuarios con rol 'chofer'
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT ur.user_id,
    'Nuevo pedido disponible',
    'Hay un nuevo pedido cerca de ti. ¡Revisa el radar!',
    'order'
  FROM public.user_roles ur
  WHERE ur.role = 'chofer'
    AND NOT EXISTS (
      -- No duplicar si ya tienen una notificación no leída en los últimos 5 min
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = ur.user_id
        AND n.type = 'order'
        AND n.created_at > now() - interval '5 minutes'
    );
  RETURN NEW;
END;
$$;

-- Solo crear el trigger si la tabla notifications existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP TRIGGER IF EXISTS on_delivery_pending ON public.deliveries;
    CREATE TRIGGER on_delivery_pending
      AFTER INSERT ON public.deliveries
      FOR EACH ROW
      WHEN (NEW.status = 'pending')
      EXECUTE FUNCTION public.notify_drivers_new_delivery();
  END IF;
END $$;
