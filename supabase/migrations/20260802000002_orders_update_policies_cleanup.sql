-- ============================================================
-- MIGRATION: 20260802000002_orders_update_policies_cleanup.sql
-- Limpieza del drift de policies de UPDATE en `orders` — defensa en
-- profundidad detrás del trigger de 20260802000001.
-- ============================================================
--
-- Verificado en prod (pg_policies, no el repo): existen 4 policies de
-- UPDATE en orders. Dos no están en ninguna migración de este repo
-- ("Constructors update own orders", "Providers update order status")
-- — drift creado a mano en el dashboard en algún momento. Ninguna de
-- las 4 tiene WITH CHECK real que re-afirme la pertenencia de la fila
-- resultante.
--
-- El trigger ya bloquea el fraude de monto (total/provider_id/etc
-- inmutables). Este archivo cierra el vector de "robar la orden"
-- (reasignarla a otro provider_id) a nivel de policy también, y deja
-- una única policy por rol en vez de cuatro superpuestas.

DROP POLICY IF EXISTS "Constructors update own orders" ON public.orders;
DROP POLICY IF EXISTS "Providers update order status" ON public.orders;
DROP POLICY IF EXISTS "orders_update_constructor_evidence" ON public.orders;
DROP POLICY IF EXISTS "orders_update_provider" ON public.orders;

CREATE POLICY "orders_update_constructor" ON public.orders
  FOR UPDATE
  USING (constructor_id = auth.uid())
  WITH CHECK (constructor_id = auth.uid());

CREATE POLICY "orders_update_provider" ON public.orders
  FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
