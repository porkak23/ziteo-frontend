-- F1: Add p_project_id to place_order RPC so checkout can link an order to a saved
-- project and auto-copy the terreno's coords when no explicit delivery location is provided.
-- p_project_id is the LAST parameter (DEFAULT NULL) → existing callers are unaffected.

CREATE OR REPLACE FUNCTION public.place_order(
  p_constructor_id  uuid,
  p_provider_id     uuid,
  p_total           numeric,
  p_items           jsonb,
  p_delivery_method text             DEFAULT 'delivery',
  p_delivery_address text            DEFAULT NULL,
  p_delivery_lat    double precision DEFAULT NULL,
  p_delivery_lng    double precision DEFAULT NULL,
  p_cargo_type      text             DEFAULT NULL,
  p_project_id      uuid             DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id       uuid;
  v_item           jsonb;
  v_stock_quantity int;
  v_is_rental      boolean;
  v_rental_status  text;
  v_eff_address    text             := p_delivery_address;
  v_eff_lat        double precision := p_delivery_lat;
  v_eff_lng        double precision := p_delivery_lng;
BEGIN
  -- AuthZ: caller may only place orders on their own behalf.
  IF auth.uid() IS DISTINCT FROM p_constructor_id THEN
    RAISE EXCEPTION 'No autorizado: solo el constructor puede crear su propia orden.';
  END IF;

  -- If no explicit coords but a project_id is given, borrow the terreno's location.
  -- Also validates the project belongs to this constructor (no spoofing other projects).
  IF p_project_id IS NOT NULL AND (v_eff_lat IS NULL OR v_eff_lng IS NULL) THEN
    SELECT location_address, location_lat::double precision, location_lng::double precision
      INTO v_eff_address, v_eff_lat, v_eff_lng
      FROM public.projects
     WHERE id = p_project_id
       AND constructor_id = p_constructor_id;
  END IF;

  -- Stock check before any insert (avoids partial state on failure).
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock_quantity INTO v_stock_quantity
      FROM public.products
     WHERE id = (v_item->>'product_id')::uuid;
    IF v_stock_quantity < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'product_id');
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    constructor_id, provider_id, total, status,
    delivery_method, delivery_address, delivery_lat, delivery_lng,
    cargo_type, project_id
  )
  VALUES (
    p_constructor_id, p_provider_id, p_total, 'pending',
    COALESCE(p_delivery_method, 'delivery'), v_eff_address, v_eff_lat, v_eff_lng,
    p_cargo_type, p_project_id
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_is_rental     := COALESCE((v_item->>'is_rental')::boolean, false);
    v_rental_status := CASE WHEN v_is_rental THEN 'reserved' ELSE NULL END;

    INSERT INTO public.order_items (
      order_id, product_id, quantity, price_unit, is_rental,
      rental_start_date, rental_end_date, rental_days,
      rental_unit_rate, rental_deposit, rental_status
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
