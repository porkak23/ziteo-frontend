-- Sincroniza orders.status desde deliveries.status para el pool de choferes.
--
-- Problema: nada propagaba el avance de una delivery a su orden. El RPC
-- update_delivery_status (usado por el pool) solo toca `deliveries`; el
-- trigger trg_delivery_status solo valida la máquina de estados de
-- `deliveries`. Solo advance_own_fleet_delivery (flota propia) actualizaba
-- `orders` a mano. Resultado verificado en sandbox: un chofer del pool
-- completaba recojo→tránsito→entrega, deliveries.status quedaba 'delivered',
-- pero orders.status se quedaba pegado en 'processing' para siempre — el
-- comprador nunca veía su pedido como entregado y no había forma de cerrarlo.
--
-- Esta migración agrega un trigger AFTER UPDATE en `deliveries` que replica
-- el mismo patrón de dos pasos que ya usa advance_own_fleet_delivery (la
-- máquina de estados de `orders` no permite saltar processing→delivered
-- directo, exige pasar por 'shipped'). Es idempotente: cada UPDATE está
-- condicionado al estado actual de la orden, así que si
-- advance_own_fleet_delivery ya la movió a mano (ruta de flota propia), este
-- trigger no encuentra nada que hacer y no rompe esa ruta.

CREATE OR REPLACE FUNCTION public.sync_order_status_from_delivery()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'in_transit' THEN
    UPDATE orders
       SET status = 'shipped', updated_at = now()
     WHERE id = NEW.order_id
       AND status = 'processing';

  ELSIF NEW.status = 'delivered' THEN
    -- Si la orden sigue en 'processing' (nunca pasó por 'shipped' porque el
    -- trigger no vio el 'in_transit' -- p.ej. reset manual de pruebas), dar
    -- el paso intermedio primero para no violar trg_order_status.
    UPDATE orders
       SET status = 'shipped', updated_at = now()
     WHERE id = NEW.order_id
       AND status = 'processing';

    UPDATE orders
       SET status = 'delivered', delivered_date = now(), updated_at = now()
     WHERE id = NEW.order_id
       AND status = 'shipped';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_order_from_delivery ON public.deliveries;
CREATE TRIGGER trg_sync_order_from_delivery
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_status_from_delivery();

-- ============================================================================
-- DOWN (referencia, no ejecutar automáticamente):
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_sync_order_from_delivery ON public.deliveries;
-- DROP FUNCTION IF EXISTS public.sync_order_status_from_delivery();
