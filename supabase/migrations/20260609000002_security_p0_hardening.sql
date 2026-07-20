-- =============================================================
-- 20260609 — P0 SECURITY HARDENING
-- Applied to prod (project yvqbubjfhmuztknmhyvd) on 2026-06-09.
-- All changes are reversible and do not affect authenticated flows.
--
-- 1. place_order: enforce caller == p_constructor_id (was fully unauthenticated;
--    any anonymous caller could create orders for any constructor and decrement
--    arbitrary stock).
-- 2. Revoke EXECUTE on every SECURITY DEFINER public function from `anon`
--    (defense-in-depth: closes resolve_dispute's broken `auth.uid() IS NULL`
--    anon path, send_notification, and any future gap).
-- 3. Pin search_path = public on all SECURITY DEFINER functions.
-- 4. Revoke anon access to SECURITY DEFINER business-intelligence / ops views
--    (kpi_*, maestros_view, profiles_invalid_city) — they bypass RLS and were
--    readable by anonymous clients. profiles_invalid_city is ops-only.
-- =============================================================

-- 1. place_order — add the AuthZ guard. Body otherwise unchanged.
CREATE OR REPLACE FUNCTION public.place_order(
  p_constructor_id uuid, p_provider_id uuid, p_total numeric, p_items jsonb,
  p_delivery_method text DEFAULT 'delivery'::text, p_delivery_address text DEFAULT NULL::text,
  p_delivery_lat double precision DEFAULT NULL::double precision,
  p_delivery_lng double precision DEFAULT NULL::double precision)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id       uuid;
  v_item           jsonb;
  v_stock_quantity int;
  v_is_rental      boolean;
  v_rental_status  text;
BEGIN
  -- AuthZ: the caller may only place an order on their own behalf.
  -- Anonymous callers (auth.uid() IS NULL) are rejected by IS DISTINCT FROM.
  IF auth.uid() IS DISTINCT FROM p_constructor_id THEN
    RAISE EXCEPTION 'No autorizado: solo el constructor puede crear su propia orden.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock_quantity INTO v_stock_quantity FROM public.products WHERE id = (v_item->>'product_id')::uuid;
    IF v_stock_quantity < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'product_id');
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    constructor_id, provider_id, total, status,
    delivery_method, delivery_address, delivery_lat, delivery_lng
  )
  VALUES (
    p_constructor_id, p_provider_id, p_total, 'pending',
    COALESCE(p_delivery_method, 'delivery'), p_delivery_address, p_delivery_lat, p_delivery_lng
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_is_rental := COALESCE((v_item->>'is_rental')::boolean, false);
    v_rental_status := CASE WHEN v_is_rental THEN 'reserved' ELSE NULL END;

    INSERT INTO public.order_items (
      order_id, product_id, quantity, price_unit, is_rental,
      rental_start_date, rental_end_date, rental_days, rental_unit_rate, rental_deposit, rental_status
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
$function$;

-- 2 + 3. Revoke EXECUTE from anon + pin search_path on every SECURITY DEFINER fn.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon', r.sig);
    EXECUTE format('ALTER FUNCTION public.%s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- 4. Revoke anon (and ops-only authenticated) access to SECURITY DEFINER views.
REVOKE ALL ON
  public.kpi_active_maestros,
  public.kpi_active_providers,
  public.kpi_gmv_by_city,
  public.kpi_orders_by_day,
  public.kpi_signups_by_day,
  public.kpi_payment_confirmation_rate,
  public.kpi_licitaciones_engagement,
  public.maestros_view,
  public.profiles_invalid_city
FROM anon;
REVOKE ALL ON public.profiles_invalid_city FROM authenticated;
