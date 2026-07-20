-- Migration: trigger para notificar al Vendedor (provider) cuando llega un pedido nuevo.
-- Contexto: dos caminos de checkout (tienda/useOrders y constructor/ConstructorTiendaTab)
-- divergieron; el del Constructor no llamaba send_notification. Este trigger cubre
-- ambos caminos de forma arquitectónica sin depender del frontend.
-- La función es SECURITY DEFINER porque notifications tiene WITH CHECK (false) en INSERT.

CREATE OR REPLACE FUNCTION public.notify_provider_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.provider_id,
    'order',
    'Nuevo pedido',
    'Has recibido un nuevo pedido de materiales.'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_provider_on_new_order ON public.orders;
CREATE TRIGGER trg_notify_provider_on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_provider_on_new_order();
