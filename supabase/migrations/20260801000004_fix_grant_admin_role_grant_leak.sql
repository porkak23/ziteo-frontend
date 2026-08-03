-- ============================================================
-- MIGRATION: 20260801000004_fix_grant_admin_role_grant_leak.sql
-- Fix urgente: grant_admin_role() era ejecutable por `authenticated`.
-- ============================================================
--
-- Causa raíz: el schema public tiene un ALTER DEFAULT PRIVILEGES de
-- `postgres` que otorga EXECUTE a `authenticated` y `service_role` en
-- TODA función nueva creada en el schema (confirmado con
-- pg_default_acl: defaclobjtype='f', acl incluye "authenticated=X").
-- El "REVOKE ALL ... FROM PUBLIC" de 20260801000002 no alcanza a
-- revertir un default ACL otorgado explícitamente a un rol con
-- nombre — solo revoca lo heredado de PUBLIC. Hacía falta un REVOKE
-- explícito de `authenticated`, que es el paso que faltó.
--
-- Verificado en prod con un JWT real de usuario no-admin: la RPC
-- devolvió 204 (éxito) y el usuario de prueba quedó con role='admin'
-- en user_roles. La fila fue revertida manualmente antes de esta
-- migración. Este archivo cierra el agujero para siempre.

REVOKE EXECUTE ON FUNCTION public.grant_admin_role(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(uuid) FROM anon;

-- Verificación de que ni service_role llega por default privileges de
-- forma no intencional queda fuera de este fix: service_role SÍ debe
-- poder ejecutarla (es el canal de bootstrap vía dashboard/script
-- administrativo), así que no se revoca ahí.
