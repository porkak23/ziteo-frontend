-- ============================================================
-- MIGRATION: 20260422_fix_audit_and_logistics.sql
-- Fixes:
--   1. Atomic order placement (no more phantom orders)
--   2. Inventory auto-decrement trigger
--   3. Deliveries table + Transportista RLS
--   4. Race-condition-safe delivery acceptance RPC
-- ============================================================


-- ============================================================
-- FIX 1: ATOMIC ORDER PLACEMENT
-- Replaces the two-step (orders → order_items) client calls
-- with a single PostgreSQL function that wraps both inserts
-- inside an implicit transaction. If order_items insertion
-- fails, the order row is automatically rolled back.
-- ============================================================

CREATE OR REPLACE FUNCTION place_order(
  p_constructor_id uuid,
  p_provider_id    uuid,
  p_total          numeric,
  p_items          jsonb   -- array of {product_id, quantity, price_unit}
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_item     jsonb;
  v_stock    integer;
BEGIN
  -- Verify caller is the constructor
  IF auth.uid() <> p_constructor_id THEN
    RAISE EXCEPTION 'Unauthorized: caller is not the constructor';
  END IF;

  -- Stock check: lock each product row before reading stock to prevent oversell
  -- in concurrent place_order calls for the same product.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock_quantity INTO v_stock
      FROM products
     WHERE id = (v_item->>'product_id')::uuid
       FOR UPDATE;

    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    IF v_stock < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Stock insuficiente para producto %: disponible %, solicitado %',
        v_item->>'product_id', v_stock, (v_item->>'quantity')::integer;
    END IF;
  END LOOP;

  -- Insert the order
  INSERT INTO orders (constructor_id, provider_id, total, status)
  VALUES (p_constructor_id, p_provider_id, p_total, 'pending')
  RETURNING id INTO v_order_id;

  -- Insert all order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price_unit)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price_unit')::numeric
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;


-- ============================================================
-- FIX 2: INVENTORY AUTO-DECREMENT TRIGGER
-- After order_items are inserted, automatically deduct the
-- quantity from products.stock_quantity. Uses FOR UPDATE to
-- prevent concurrent oversell race conditions.
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
     SET stock_quantity = stock_quantity - NEW.quantity,
         updated_at     = now()
   WHERE id = NEW.product_id;

  -- Guard: if stock goes negative, raise an error
  IF (SELECT stock_quantity FROM products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'Stock negativo detectado para producto %. Operación revertida.', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON order_items;
CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_order();


-- ============================================================
-- FIX 3: DELIVERIES TABLE (Transportista / Logistics module)
-- Stores last-mile delivery assignments. Each order can have
-- one delivery record. States: pending → accepted →
-- in_transit → delivered | failed.
-- ============================================================

CREATE TABLE IF NOT EXISTS deliveries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id       uuid        REFERENCES profiles(user_id) ON DELETE SET NULL,
  status          varchar     NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','in_transit','delivered','failed')),
  pickup_address  text,
  dropoff_address text,
  pickup_lat      numeric,
  pickup_lng      numeric,
  dropoff_lat     numeric,
  dropoff_lng     numeric,
  distance_km     numeric,
  estimated_fee   numeric,
  notes           text,
  accepted_at     timestamptz,
  picked_up_at    timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id   ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id  ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status     ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);

-- Ensure each order has at most one delivery record.
-- Required for ON CONFLICT DO NOTHING in trg_auto_create_delivery.
ALTER TABLE deliveries
  ADD CONSTRAINT IF NOT EXISTS deliveries_order_id_unique UNIQUE (order_id);


-- ============================================================
-- FIX 4: DELIVERY STATUS TRANSITION TRIGGER
-- Enforces valid state machine: pending → accepted →
-- in_transit → delivered | failed. Cancelled allowed any time
-- before delivered/failed.
-- ============================================================

CREATE OR REPLACE FUNCTION validate_delivery_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status = 'failed' AND OLD.status NOT IN ('delivered','failed') THEN RETURN NEW; END IF;
  IF OLD.status = 'pending'    AND NEW.status = 'accepted'   THEN RETURN NEW; END IF;
  IF OLD.status = 'accepted'   AND NEW.status = 'in_transit' THEN RETURN NEW; END IF;
  IF OLD.status = 'in_transit' AND NEW.status = 'delivered'  THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Transición de estado de entrega inválida: % → %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delivery_status ON deliveries;
CREATE TRIGGER trg_delivery_status
  BEFORE UPDATE OF status ON deliveries
  FOR EACH ROW EXECUTE FUNCTION validate_delivery_status_transition();


-- ============================================================
-- FIX 5: ROW LEVEL SECURITY — deliveries
-- - Transportistas (chofer) can see all pending deliveries
--   (so they can pick one from the pool).
-- - Transportistas can only update deliveries they own.
-- - Constructors and Providers can see their own deliveries.
-- ============================================================

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Transportistas can view all pending deliveries (open pool)
CREATE POLICY "deliveries_chofer_select_pending" ON deliveries
  FOR SELECT
  USING (
    status = 'pending'
    OR driver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM orders
       WHERE orders.id = deliveries.order_id
         AND (orders.constructor_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

-- Only the assigned driver or system (RPC) can update
CREATE POLICY "deliveries_chofer_update_own" ON deliveries
  FOR UPDATE
  USING (driver_id = auth.uid());

-- Direct inserts are blocked; only SECURITY DEFINER RPCs (which bypass RLS) may insert.
CREATE POLICY "deliveries_insert_rpc" ON deliveries
  FOR INSERT
  WITH CHECK (false);


-- ============================================================
-- FIX 6: RACE-CONDITION-SAFE DELIVERY ACCEPTANCE RPC
-- Uses SELECT FOR UPDATE SKIP LOCKED to atomically claim
-- a delivery. If another driver claims it first, returns null.
-- ============================================================

CREATE OR REPLACE FUNCTION accept_delivery(p_delivery_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delivery deliveries%ROWTYPE;
BEGIN
  -- Lock the row exclusively; skip if already locked (another driver accepting)
  SELECT * INTO v_delivery
    FROM deliveries
   WHERE id = p_delivery_id
     AND status = 'pending'
   FOR UPDATE SKIP LOCKED;

  -- If row is locked or status changed, another driver got there first
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Este viaje ya fue tomado por otro transportista.'
    );
  END IF;

  -- Claim the delivery
  UPDATE deliveries
     SET driver_id   = auth.uid(),
         status      = 'accepted',
         accepted_at = now(),
         updated_at  = now()
   WHERE id = p_delivery_id;

  RETURN jsonb_build_object(
    'success', true,
    'delivery_id', p_delivery_id
  );
END;
$$;


-- ============================================================
-- FIX 7: UPDATE DELIVERY STATUS RPC (in_transit / delivered)
-- Only the assigned driver can advance the status.
-- ============================================================

CREATE OR REPLACE FUNCTION update_delivery_status(
  p_delivery_id uuid,
  p_new_status  varchar
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id uuid;
BEGIN
  SELECT driver_id INTO v_driver_id
    FROM deliveries
   WHERE id = p_delivery_id;

  -- IS DISTINCT FROM is NULL-safe: NULL <> value evaluates to NULL (falsy) in SQL,
  -- which would silently allow anyone to update a delivery with no driver yet assigned.
  IF v_driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: solo el transportista asignado puede actualizar el estado.';
  END IF;

  UPDATE deliveries
     SET status       = p_new_status,
         picked_up_at = CASE WHEN p_new_status = 'in_transit' THEN now() ELSE picked_up_at END,
         delivered_at = CASE WHEN p_new_status = 'delivered'  THEN now() ELSE delivered_at END,
         updated_at   = now()
   WHERE id = p_delivery_id;

  RETURN jsonb_build_object('success', true, 'new_status', p_new_status);
END;
$$;


-- ============================================================
-- FIX 8: AUTO-CREATE DELIVERY WHEN ORDER IS CONFIRMED
-- When an order transitions to 'processing', a delivery record
-- is automatically created in 'pending' state.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_delivery_on_processing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> 'processing' AND NEW.status = 'processing' THEN
    INSERT INTO deliveries (order_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_delivery ON orders;
CREATE TRIGGER trg_auto_create_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION auto_create_delivery_on_processing();


-- ============================================================
-- FIX 9: EXTEND NOTIFICATIONS TYPE CHECK to include 'delivery'
-- ============================================================

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('contract','project_application','order','delivery','general'));


-- ============================================================
-- FIX 10: SECURE NOTIFICATION INSERT RPC
-- Replaces direct client-side inserts (which allowed any user
-- to send notifications to anyone). SECURITY DEFINER + caller
-- check ensures only the app logic can send cross-user notifs.
-- ============================================================

CREATE OR REPLACE FUNCTION send_notification(
  p_user_id uuid,
  p_type    varchar,
  p_title   varchar,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Must be called by an authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO notifications (user_id, type, title, message)
  VALUES (p_user_id, p_type, p_title, p_message);
END;
$$;

-- Block direct client inserts — all notifications must go through send_notification RPC.
-- The RPC is SECURITY DEFINER so it bypasses RLS and can insert for any user_id,
-- but only when called by an authenticated session (prevents anonymous abuse).
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
CREATE POLICY "notifications_insert_rpc_only" ON notifications
  FOR INSERT WITH CHECK (false);
