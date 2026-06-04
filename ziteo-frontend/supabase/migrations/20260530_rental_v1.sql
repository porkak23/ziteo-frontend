-- Migration 20260530_rental_v1
-- Add rental columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS rental_daily_rate numeric(12,2),
ADD COLUMN IF NOT EXISTS rental_weekly_rate numeric(12,2),
ADD COLUMN IF NOT EXISTS rental_deposit numeric(12,2),
ADD COLUMN IF NOT EXISTS rental_min_days integer DEFAULT 1;

-- Add rental columns to order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS is_rental boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_start_date date,
ADD COLUMN IF NOT EXISTS rental_end_date date,
ADD COLUMN IF NOT EXISTS rental_days integer,
ADD COLUMN IF NOT EXISTS rental_unit_rate numeric(12,2),
ADD COLUMN IF NOT EXISTS rental_deposit numeric(12,2),
ADD COLUMN IF NOT EXISTS rental_status text CHECK (rental_status IN ('reserved','in_use','returned','completed'));

-- Replace place_order function
CREATE OR REPLACE FUNCTION public.place_order(
  p_constructor_id uuid,
  p_provider_id uuid,
  p_total numeric,
  p_items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_stock_quantity int;
  v_is_rental boolean;
  v_rental_status text;
BEGIN
  -- Validate stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock_quantity INTO v_stock_quantity FROM public.products WHERE id = (v_item->>'product_id')::uuid;
    IF v_stock_quantity < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'product_id');
    END IF;
  END LOOP;

  -- Create order
  INSERT INTO public.orders (constructor_id, provider_id, total, status)
  VALUES (p_constructor_id, p_provider_id, p_total, 'pending')
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

-- New RPCs for rental logic
CREATE OR REPLACE FUNCTION public.mark_rental_in_use(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure the caller is the provider
  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = p_order_id AND provider_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.order_items
  SET rental_status = 'in_use'
  WHERE order_id = p_order_id 
    AND is_rental = true 
    AND rental_status = 'reserved';
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_rental_return(p_order_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_product_id uuid;
  v_quantity int;
BEGIN
  -- Get item info
  SELECT order_id, product_id, quantity 
  INTO v_order_id, v_product_id, v_quantity
  FROM public.order_items
  WHERE id = p_order_item_id AND is_rental = true AND rental_status = 'in_use';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental item not found or not in_use';
  END IF;

  -- Ensure caller is provider
  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = v_order_id AND provider_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update status and restore stock
  UPDATE public.order_items
  SET rental_status = 'returned'
  WHERE id = p_order_item_id;

  UPDATE public.products
  SET stock_quantity = stock_quantity + v_quantity
  WHERE id = v_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_rental_completed(p_order_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  SELECT order_id INTO v_order_id
  FROM public.order_items
  WHERE id = p_order_item_id AND is_rental = true AND rental_status = 'returned';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental item not found or not returned';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = v_order_id AND provider_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.order_items
  SET rental_status = 'completed'
  WHERE id = p_order_item_id;
END;
$$;
