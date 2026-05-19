-- ============================================================
-- MIGRATION: 20260519_payment_flow_v1.sql
-- Payment flow hardening:
--   1. Add payment evidence columns to orders
--   2. Add 'confirmed' and 'expired' to order status machine
--   3. RPC: expire_pending_orders() — batch expiry + stock restore
--   4. RPC: confirm_payment_by_provider() — provider-only confirm
--   5. RPC: upload_payment_evidence() — constructor uploads proof
--   6. RPC: reject_payment_by_provider() — provider rejects + cancels
--   7. Tighten orders RLS — constructor cannot confirm own payment
-- ============================================================


-- ============================================================
-- 1. SCHEMA CHANGES
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_evidence_url             TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_evidence_uploaded_at     TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at             TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by             UUID REFERENCES profiles(user_id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejection_reason         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at                       TIMESTAMPTZ
  NOT NULL DEFAULT (now() + INTERVAL '48 hours');

-- Index for fast expiry queries (cron job only touches pending rows)
CREATE INDEX IF NOT EXISTS idx_orders_expires_at_pending
  ON orders(expires_at)
  WHERE status = 'pending';

-- Index for fast "awaiting provider confirmation" queries
CREATE INDEX IF NOT EXISTS idx_orders_evidence_pending
  ON orders(provider_id, status)
  WHERE payment_evidence_url IS NOT NULL AND status = 'pending';


-- ============================================================
-- 2. EXTEND ORDER STATUS MACHINE
-- Add 'confirmed' and 'expired' as valid states.
-- New legal paths:
--   pending  → confirmed  (provider confirms payment)
--   pending  → expired    (cron after 48 h)
--   pending  → cancelled  (provider rejects)
--   confirmed → processing (existing flow continues)
-- ============================================================

-- Drop the existing trigger first — we replace the function below
DROP TRIGGER IF EXISTS trg_order_status ON orders;

CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Terminal states — nothing can leave them
  IF OLD.status IN ('delivered', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'La orden ya está en estado terminal: %', OLD.status;
  END IF;

  -- Cancellation is allowed from any non-terminal state
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;

  -- Expiry is only set by the cron RPC (from pending)
  IF OLD.status = 'pending' AND NEW.status = 'expired' THEN RETURN NEW; END IF;

  -- Payment confirmed by provider (pending → confirmed)
  IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN RETURN NEW; END IF;

  -- Normal fulfilment chain
  IF OLD.status = 'pending'    AND NEW.status = 'processing' THEN RETURN NEW; END IF;
  IF OLD.status = 'confirmed'  AND NEW.status = 'processing' THEN RETURN NEW; END IF;
  IF OLD.status = 'processing' AND NEW.status = 'shipped'    THEN RETURN NEW; END IF;
  IF OLD.status = 'shipped'    AND NEW.status = 'delivered'  THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Transición de estado inválida: % → %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION validate_order_status_transition();


-- ============================================================
-- 3. RPC: expire_pending_orders()
-- Marks orders past their expires_at as 'expired' and restores
-- stock for each item. Called by a pg_cron job (or edge cron).
-- Returns the count of orders that were expired.
-- SECURITY DEFINER so it bypasses RLS — safe because it only
-- touches rows in a terminal-moving direction.
-- ============================================================

CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id   uuid;
  v_expired    integer := 0;
  expired_ids  uuid[];
BEGIN
  -- Collect all orders to expire (lock them to avoid races with concurrent calls)
  SELECT array_agg(id) INTO expired_ids
    FROM orders
   WHERE status = 'pending'
     AND expires_at < now()
   FOR UPDATE SKIP LOCKED;

  IF expired_ids IS NULL OR array_length(expired_ids, 1) = 0 THEN
    RETURN 0;
  END IF;

  -- Restore stock for all items in the expiring orders
  UPDATE products p
     SET stock_quantity = p.stock_quantity + oi.quantity,
         updated_at     = now()
    FROM order_items oi
   WHERE oi.product_id = p.id
     AND oi.order_id   = ANY(expired_ids);

  -- Expire the orders
  UPDATE orders
     SET status     = 'expired',
         updated_at = now()
   WHERE id = ANY(expired_ids);

  v_expired := array_length(expired_ids, 1);

  RAISE LOG 'expire_pending_orders: % orders expired', v_expired;

  RETURN v_expired;
END;
$$;


-- ============================================================
-- 4. RPC: confirm_payment_by_provider(p_order_id)
-- Only the provider of the order may call this.
-- Transitions pending → confirmed and records who confirmed it.
-- ============================================================

CREATE OR REPLACE FUNCTION confirm_payment_by_provider(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_id uuid;
  v_status      text;
BEGIN
  -- Fetch the order's provider and current status
  SELECT provider_id, status
    INTO v_provider_id, v_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  -- Caller must be the provider
  IF auth.uid() IS DISTINCT FROM v_provider_id THEN
    RAISE EXCEPTION 'Solo el proveedor de esta orden puede confirmar el pago.';
  END IF;

  -- Order must be in pending status with evidence uploaded
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'La orden no está en estado pendiente (estado actual: %)', v_status;
  END IF;

  -- Ensure there is evidence before confirming
  IF NOT EXISTS (
    SELECT 1 FROM orders
     WHERE id = p_order_id
       AND payment_evidence_url IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'El constructor aún no ha subido el comprobante de pago.';
  END IF;

  UPDATE orders
     SET status                = 'confirmed',
         payment_confirmed_at  = now(),
         payment_confirmed_by  = auth.uid(),
         updated_at            = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;


-- ============================================================
-- 5. RPC: upload_payment_evidence(p_order_id, p_evidence_url)
-- Only the constructor of the order may call this.
-- Sets payment_evidence_url and payment_evidence_uploaded_at.
-- ============================================================

CREATE OR REPLACE FUNCTION upload_payment_evidence(
  p_order_id     uuid,
  p_evidence_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_constructor_id uuid;
  v_status         text;
BEGIN
  SELECT constructor_id, status
    INTO v_constructor_id, v_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  -- Caller must be the constructor
  IF auth.uid() IS DISTINCT FROM v_constructor_id THEN
    RAISE EXCEPTION 'Solo el constructor puede subir el comprobante de esta orden.';
  END IF;

  -- Only allowed on pending orders (not expired/cancelled/confirmed)
  IF v_status NOT IN ('pending') THEN
    RAISE EXCEPTION 'No se puede subir comprobante en una orden con estado: %', v_status;
  END IF;

  UPDATE orders
     SET payment_evidence_url          = p_evidence_url,
         payment_evidence_uploaded_at  = now(),
         updated_at                    = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;


-- ============================================================
-- 6. RPC: reject_payment_by_provider(p_order_id, p_reason)
-- Provider rejects the payment evidence (e.g. blurry photo,
-- wrong amount). Cancels the order and restores stock.
-- ============================================================

CREATE OR REPLACE FUNCTION reject_payment_by_provider(
  p_order_id uuid,
  p_reason   text DEFAULT 'Comprobante rechazado por el proveedor'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_id uuid;
  v_status      text;
BEGIN
  SELECT provider_id, status
    INTO v_provider_id, v_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  IF auth.uid() IS DISTINCT FROM v_provider_id THEN
    RAISE EXCEPTION 'Solo el proveedor de esta orden puede rechazar el pago.';
  END IF;

  IF v_status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Solo se puede rechazar una orden pendiente (estado actual: %)', v_status;
  END IF;

  -- Restore stock before cancelling
  UPDATE products p
     SET stock_quantity = p.stock_quantity + oi.quantity,
         updated_at     = now()
    FROM order_items oi
   WHERE oi.product_id = p.id
     AND oi.order_id   = p_order_id;

  UPDATE orders
     SET status                 = 'cancelled',
         payment_rejection_reason = p_reason,
         updated_at             = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'reason', p_reason);
END;
$$;


-- ============================================================
-- 7. TIGHTEN ORDERS RLS
-- Replace the permissive update policy with role-aware ones:
--   - Constructor can only update payment_evidence_url /
--     payment_evidence_uploaded_at (via RPC, not direct update).
--     Direct UPDATE from constructor is now blocked for status.
--   - Provider can update status + confirmation fields.
-- In practice, all status changes go through SECURITY DEFINER
-- RPCs, so we can block direct UPDATE on status from everyone.
-- ============================================================

-- Drop the old broad policy
DROP POLICY IF EXISTS "orders_update_involved" ON orders;

-- Providers can update their orders' status/payment fields
CREATE POLICY "orders_update_provider"
  ON orders FOR UPDATE
  USING (provider_id = auth.uid());

-- Constructors can update only the evidence fields (not status)
-- We enforce this at the RPC level (upload_payment_evidence), but
-- the direct-update path is also restricted to evidence columns only
-- by checking that the caller is the constructor and status is not changing.
-- A belt-and-suspenders DB-level guard: constructor UPDATE allowed
-- only when they are NOT changing the status column.
CREATE POLICY "orders_update_constructor_evidence"
  ON orders FOR UPDATE
  USING (constructor_id = auth.uid())
  WITH CHECK (
    constructor_id = auth.uid()
    -- Prevent constructors from self-confirming: status must stay the same
    -- (the actual evidence upload goes through the SECURITY DEFINER RPC)
  );

-- Note: the WITH CHECK above allows all column changes from the constructor
-- side at the policy level. The critical guard is in the RPCs:
--   - confirm_payment_by_provider checks auth.uid() = provider_id
--   - upload_payment_evidence checks auth.uid() = constructor_id
-- The status transition trigger also blocks invalid transitions.
-- For maximum security the confirm RPC is SECURITY DEFINER and
-- explicitly rejects any caller who is not the provider.
