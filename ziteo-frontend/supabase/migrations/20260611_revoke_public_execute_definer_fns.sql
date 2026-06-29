-- 20260611_revoke_public_execute_definer_fns.sql
--
-- Seguridad — Fase 0 (extensión, parte 2): revocar EXECUTE de PUBLIC.
--
-- La migración anterior (20260611_revoke_anon_execute_definer_fns) revocó a
-- `anon` y `authenticated` directamente, pero las funciones conservaban el
-- GRANT por defecto a PUBLIC — y anon/authenticated son miembros de PUBLIC,
-- así que seguían pudiendo ejecutar. (Esta es la misma trampa por la que el
-- hardening del 2026-06-09 no surtió efecto y el advisor seguía marcando 25
-- funciones.)
--
-- Los grants directos ya presentes a `authenticated` (las 11 RPCs del
-- frontend), `postgres` y `service_role` no se tocan y siguen vigentes.

BEGIN;

DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.sig);
  END LOOP;
END $$;

COMMIT;
