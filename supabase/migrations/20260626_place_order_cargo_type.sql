-- Add p_cargo_type to place_order RPC so the frontend can pass it atomically
-- instead of doing a separate UPDATE patch after the fact.
-- Based on the live function definition in prod (no local-vs-prod drift risk here
-- since this is a full CREATE OR REPLACE from the verified live body).

CREATE OR REPLACE FUNCTION public.place_order(
  p_constructor_id  uuid,
  p_provider_id     uuid,
  p_total           numeric,
  p_items           jsonb,
  p_delivery_method text             DEFAULT 'delivery',
  p_delivery_address text            DEFAULT NULL,
  p_delivery_lat    double precision DEFAULT NULL,
  p_delivery_lng    double precision DEFAULT NULL,
  p_cargo_type      text             DEFAULT NULL
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
BEGIN
  -- AuthZ: the caller may only place an order on their own behalf.
  IF auth.uid() IS DISTINCT FROM p_constructor_id THEN
    RAISE EXCEPTION 'No autorizado: solo el constructor puede crear su propia orden.';
  END IF;

  -- Stock check before any insert (avoids partial state on failure).
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
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
    cargo_type
  )
  VALUES (
    p_constructor_id, p_provider_id, p_total, 'pending',
    COALESCE(p_delivery_method, 'delivery'), p_delivery_address, p_delivery_lat, p_delivery_lng,
    p_cargo_type
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
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
