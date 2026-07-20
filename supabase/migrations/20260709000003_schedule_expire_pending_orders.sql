-- ============================================================
-- MIGRATION: 20260709_schedule_expire_pending_orders.sql
-- Two fixes to the order-expiry flow:
--   1. expire_pending_orders() exists (since 20260519_payment_flow_v1)
--      but was never scheduled — no cron job called it. Pending
--      orders past their 48h expires_at were never actually expired
--      nor had their stock restored. Schedule it hourly.
--   2. Notify the buyer (constructor_id) when their order is
--      rejected (pending -> cancelled, via reject_payment_by_provider)
--      or expires (pending -> expired, via expire_pending_orders).
--      Same pattern as notify_provider_on_new_order() /
--      notify_provider_on_payment_evidence(): SECURITY DEFINER
--      because notifications has WITH CHECK (false) for INSERT.
-- ============================================================


-- ============================================================
-- 1. SCHEDULE: expire-pending-orders-hourly
-- Runs at :30 past every hour, calling the existing RPC directly
-- (no edge function needed — expire_pending_orders() is already
-- SECURITY DEFINER and self-contained).
-- ============================================================

SELECT cron.schedule(
  'expire-pending-orders-hourly',
  '30 * * * *',
  $$SELECT public.expire_pending_orders()$$
);


-- ============================================================
-- 2. TRIGGER: notify the buyer (constructor) when their order
-- transitions out of 'pending' into 'cancelled' (payment rejected
-- by provider) or 'expired' (cron timeout). Only fires on the
-- pending -> {cancelled, expired} transitions to avoid notifying
-- on unrelated status changes.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_constructor_on_order_cancelled_or_expired()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.constructor_id,
      'order',
      'Pedido rechazado',
      COALESCE(NEW.payment_rejection_reason, 'El proveedor rechazó el comprobante de pago de tu pedido.')
    );
  ELSIF NEW.status = 'expired' THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.constructor_id,
      'order',
      'Pedido expirado',
      'Tu pedido expiró porque no se confirmó el pago a tiempo.'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_constructor_on_order_cancelled_or_expired ON public.orders;
CREATE TRIGGER trg_notify_constructor_on_order_cancelled_or_expired
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status IN ('cancelled', 'expired'))
  EXECUTE FUNCTION public.notify_constructor_on_order_cancelled_or_expired();
