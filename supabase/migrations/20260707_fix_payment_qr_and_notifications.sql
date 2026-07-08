-- ============================================================
-- MIGRATION: 20260707_fix_payment_qr_and_notifications.sql
-- Fixes the P0 bug "el QR de cobro nunca aparece" + closes gaps
-- in the payment confirmation flow:
--   1. RLS fix: allow a buyer with an active order to SELECT the
--      provider's QR object in the 'payment-qrs' bucket (today
--      there is no SELECT policy at all on that bucket).
--   2. Notify the provider when the constructor uploads payment
--      evidence, so the provider knows there is something to verify.
--   3. confirm_payment_by_provider() now leaves the order in
--      'processing' (not 'confirmed'), so the existing
--      trg_auto_create_delivery trigger fires and the delivery
--      row is created automatically once payment is confirmed.
-- ============================================================


-- ============================================================
-- 1. FIX RLS: buyer can read the provider's payment QR when
--    they have an active order (pending/confirmed) with them.
-- The QR is stored at path `${provider_user_id}/qr.png`, i.e.
-- the first path segment is the provider's user_id — see
-- usePaymentQr.ts uploadQr() and (storage.foldername(name))[1].
-- Uses orders.constructor_id (the buyer column) — orders never
-- had a buyer_id column.
-- ============================================================

CREATE POLICY "Buyer read qr with active order"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-qrs'
  AND EXISTS (
    SELECT 1
      FROM orders o
     WHERE o.constructor_id = auth.uid()
       AND o.provider_id::text = (storage.foldername(name))[1]
       AND o.status IN ('pending', 'confirmed')
  )
);


-- ============================================================
-- 2. TRIGGER: notify the provider when the constructor uploads
-- payment evidence (payment_evidence_url transitions NULL -> not
-- NULL). Same pattern as notify_provider_on_new_order(): SECURITY
-- DEFINER because notifications has WITH CHECK (false) for INSERT.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_provider_on_payment_evidence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.provider_id,
    'payment',
    'Pago por verificar',
    'El comprador subió un comprobante de pago. Revísalo para confirmar el pedido.'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_provider_on_payment_evidence ON public.orders;
CREATE TRIGGER trg_notify_provider_on_payment_evidence
  AFTER UPDATE OF payment_evidence_url ON public.orders
  FOR EACH ROW
  WHEN (OLD.payment_evidence_url IS NULL AND NEW.payment_evidence_url IS NOT NULL)
  EXECUTE FUNCTION public.notify_provider_on_payment_evidence();


-- ============================================================
-- 3. confirm_payment_by_provider(p_order_id): leave the order in
-- 'processing' instead of 'confirmed', so the fulfilment chain
-- continues automatically (trg_auto_create_delivery fires on the
-- pending -> processing transition and creates the delivery row).
-- All authorization/validation logic is preserved unchanged from
-- 20260519_payment_flow_v1.sql — only the target status changes.
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
     SET status                = 'processing',
         payment_confirmed_at  = now(),
         payment_confirmed_by  = auth.uid(),
         updated_at            = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;
