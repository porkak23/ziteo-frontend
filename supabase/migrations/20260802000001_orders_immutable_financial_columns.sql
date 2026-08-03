-- ============================================================
-- MIGRATION: 20260802000001_orders_immutable_financial_columns.sql
-- Fix P0: un proveedor pudo cambiar el `total` de una orden ajena
-- vía PATCH directo a PostgREST. Verificado en prod con un JWT
-- real: Bs 580 → Bs 1 en una orden de la que era `provider_id`.
-- ============================================================
--
-- Por qué un trigger y no solo policies: WITH CHECK en RLS no puede
-- comparar contra OLD, solo ve la fila nueva — es literalmente
-- imposible expresar "el total no cambió" en una policy. Un trigger
-- BEFORE UPDATE es además incondicional: sobrevive a cualquier
-- policy que alguien cree a mano en el dashboard (que es exactamente
-- cómo llegaron dos de las cuatro policies de UPDATE que hoy tiene
-- `orders` en prod — "Constructors update own orders" y "Providers
-- update order status" no existen en ningún archivo de este repo).
--
-- El escape para RPCs legítimas NO puede ser `auth.uid() IS NULL`:
-- SECURITY DEFINER cambia el rol de Postgres, no el JWT — auth.uid()
-- sigue devolviendo el usuario real dentro de esas funciones.
-- Verificado leyendo los cuerpos vivos en prod (pg_get_functiondef):
-- de las 5 RPCs que escriben `orders`, solo confirm_payment_by_provider
-- toca columnas de esta lista (payment_confirmed_at, payment_confirmed_by).
-- Las demás (upload_payment_evidence, confirm_pickup_delivered,
-- advance_own_fleet_delivery, sync_order_status_from_delivery,
-- expire_pending_orders) solo escriben status/updated_at/delivered_date
-- y no necesitan el escape.

CREATE OR REPLACE FUNCTION public.enforce_orders_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Flag transaction-local: las RPCs SECURITY DEFINER que necesiten
  -- tocar estas columnas lo activan explícitamente al inicio con
  -- PERFORM set_config('ziteo.allow_privileged_order_write','on',true).
  IF current_setting('ziteo.allow_privileged_order_write', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.total IS DISTINCT FROM OLD.total THEN
    RAISE EXCEPTION 'Columna total no puede modificarse desde el cliente'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'Columna provider_id no puede modificarse desde el cliente'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.constructor_id IS DISTINCT FROM OLD.constructor_id THEN
    RAISE EXCEPTION 'Columna constructor_id no puede modificarse desde el cliente'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.payment_confirmed_at IS DISTINCT FROM OLD.payment_confirmed_at THEN
    RAISE EXCEPTION 'Columna payment_confirmed_at no puede modificarse desde el cliente'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.payment_confirmed_by IS DISTINCT FROM OLD.payment_confirmed_by THEN
    RAISE EXCEPTION 'Columna payment_confirmed_by no puede modificarse desde el cliente'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Columna created_at no puede modificarse desde el cliente'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_orders_immutable_columns() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_orders_immutable_columns() FROM authenticated, anon;

DROP TRIGGER IF EXISTS trg_orders_immutable_columns ON public.orders;
CREATE TRIGGER trg_orders_immutable_columns
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_orders_immutable_columns();

-- Habilitar el escape solo donde se demostró que hace falta.
CREATE OR REPLACE FUNCTION public.confirm_payment_by_provider(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    RAISE EXCEPTION 'Solo el proveedor de esta orden puede confirmar el pago.';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'La orden no está en estado pendiente (estado actual: %)', v_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM orders
     WHERE id = p_order_id
       AND payment_evidence_url IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'El constructor aún no ha subido el comprobante de pago.';
  END IF;

  PERFORM set_config('ziteo.allow_privileged_order_write', 'on', true);

  UPDATE orders
     SET status                = 'processing',
         payment_confirmed_at  = now(),
         payment_confirmed_by  = auth.uid(),
         updated_at            = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;
