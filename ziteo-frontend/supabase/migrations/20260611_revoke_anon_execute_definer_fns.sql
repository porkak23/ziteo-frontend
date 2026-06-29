-- 20260611_revoke_anon_execute_definer_fns.sql
--
-- Seguridad — Fase 0 (extensión): cerrar EXECUTE de anon en funciones
-- SECURITY DEFINER.
--
-- Contexto del hallazgo (advisor anon_security_definer_function_executable,
-- auditoría 2026-06-11): 25 funciones SECURITY DEFINER seguían ejecutables por
-- `anon` pese al hardening del 2026-06-09 (las funciones recreadas después de
-- esa migración heredan el GRANT EXECUTE por defecto de PUBLIC).
--
-- Caso explotable confirmado: resolve_dispute() valida "solo service-role" con
-- `IF auth.uid() IS NOT NULL THEN RAISE` — pero anon también tiene uid NULL,
-- así que cualquiera con la anon key pública podía resolver disputas ajenas.
--
-- Reglas aplicadas:
--   * anon: pierde EXECUTE en TODAS las SECURITY DEFINER de public (ningún
--     flujo anónimo llama RPCs; el frontend solo las llama con sesión y las
--     Edge Functions usan service_role).
--   * authenticated: pierde EXECUTE solo en las internas (cron / triggers /
--     service-role). Las 11 RPCs que usa el frontend con sesión (place_order,
--     accept_delivery, etc.) conservan EXECUTE para authenticated.
--   * ALTER DEFAULT PRIVILEGES: las funciones futuras ya no nacen ejecutables
--     por anon/authenticated (hay que otorgar EXECUTE explícitamente).

BEGIN;

-- 1. anon: fuera de todas las SECURITY DEFINER del schema public
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', fn.sig);
  END LOOP;
END $$;

-- 2. authenticated: fuera de las internas (cron / triggers / solo service-role)
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN (
        'resolve_dispute', 'promote_user_role', 'expire_pending_orders',
        'expire_old_quotations', 'notify_drivers_new_delivery',
        'broadcast_licitacion', 'check_throttle'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', fn.sig);
  END LOOP;
END $$;

-- 3. Las funciones que se creen en adelante no son ejecutables por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

COMMIT;
