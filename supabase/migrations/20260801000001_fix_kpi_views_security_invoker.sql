-- ============================================================
-- MIGRATION: 20260801000001_fix_kpi_views_security_invoker.sql
-- Fix: 8 vistas sin `security_invoker=true` bypaseaban RLS.
-- ============================================================
--
-- El owner de estas vistas es `postgres`, que tiene BYPASSRLS. Sin
-- security_invoker, una vista corre con los privilegios del owner y
-- las policies RLS de las tablas base nunca se evalúan — el mismo
-- problema que ya se documentó y resolvió para las 5 vistas admin en
-- 20260719000002_admin_events_and_activity.sql:62-68.
--
-- Efecto concreto de este bug: las 7 vistas kpi_* fueron creadas con
-- GRANT SELECT TO authenticated (20260519000005_kpi_views.sql) bajo
-- el supuesto de que exponían "solo agregados, sin PII" — pero nunca
-- se restringió a admin. Cualquier usuario autenticado (constructor,
-- proveedor, maestro, chofer) podía leer el GMV total de la empresa,
-- GMV por ciudad, tasa de confirmación de pagos, engagement de
-- licitaciones y altas diarias. Confirmado en prod: 8 de 8 son los
-- únicos ERROR del advisor de seguridad de Supabase.
--
-- maestros_view es distinto: su lectura pública es intencional (ver
-- 20260519000007_maestros_search.sql, GRANT a authenticated Y anon) y
-- el comentario de esa vista ya decía "RLS heredada de las tablas
-- base" — solo faltaba declarar security_invoker para que esa
-- herencia ocurra de verdad. Con las policies actuales de profiles
-- (SELECT USING true), maestro_profiles (SELECT USING available=true)
-- y user_roles (policy pública de maestro con onboarding_completed),
-- el resultado para un usuario público no cambia.
--
-- Con security_invoker=true, las 7 vistas kpi_* pasan a devolver 0
-- filas para no-admins (orders no tiene policy pública de SELECT) y
-- datos completos para admin (policy admin_select_all_orders ya
-- existente). maestros_view sigue devolviendo lo mismo que hoy.

ALTER VIEW public.kpi_orders_by_day             SET (security_invoker = true);
ALTER VIEW public.kpi_gmv_by_city               SET (security_invoker = true);
ALTER VIEW public.kpi_payment_confirmation_rate SET (security_invoker = true);
ALTER VIEW public.kpi_licitaciones_engagement   SET (security_invoker = true);
ALTER VIEW public.kpi_active_providers          SET (security_invoker = true);
ALTER VIEW public.kpi_active_maestros           SET (security_invoker = true);
ALTER VIEW public.kpi_signups_by_day            SET (security_invoker = true);
ALTER VIEW public.maestros_view                 SET (security_invoker = true);
