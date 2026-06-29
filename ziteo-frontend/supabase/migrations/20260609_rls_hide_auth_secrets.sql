-- 20260609_rls_hide_auth_secrets.sql
--
-- Seguridad RLS — Fase 1: ocultar los secretos de autenticación de `profiles`.
--
-- Contexto del hallazgo:
--   La política "Public read profiles maestros proveedores" expone la FILA COMPLETA
--   de cada maestro/proveedor a cualquiera (incluido el rol anónimo). RLS filtra filas,
--   no columnas, por lo que esa fila incluía pin_hash y totp_secret — un secreto TOTP
--   filtrado permite bypass total del 2FA, y un pin_hash permite romper el PIN offline.
--
-- Esta migración no cambia QUÉ filas se ven (el directorio sigue funcionando);
-- cambia QUÉ columnas puede leer un cliente: se quitan pin_hash y totp_secret del
-- alcance de los roles `anon` y `authenticated`. A partir de aquí esos secretos sólo
-- son legibles por `service_role` (Edge Functions), que es donde debe vivir la auth.
--
-- IMPORTANTE — orden de despliegue:
--   El frontend NO debe usar `select('*')` sobre profiles al aplicar esto (PostgREST
--   expande `*` a todas las columnas y fallaría con "permission denied for column
--   pin_hash"). Los `select('*')` ya se reemplazaron por columnas explícitas en:
--     - src/features/auth/services/authService.ts        (login)
--     - src/features/maestro/hooks/useMaestroProfile.ts  (perfil público maestro)
--     - src/features/proveedor/hooks/useVendedorProfile.ts (perfil público proveedor)
--   Desplegar ese código ANTES (o junto) con esta migración.

BEGIN;

-- El GRANT de SELECT a nivel de tabla cubre todas las columnas y no se puede
-- "restar" una sola; se revoca y se re-otorga sólo el subconjunto seguro.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, name, phone, email, city, active_role, avatar_url, bio,
  preferred_auth_method, totp_enabled, created_at, updated_at,
  terms_accepted_at, beta_acknowledged_at, waitlist
) ON public.profiles TO anon, authenticated;

-- pin_hash y totp_secret quedan deliberadamente excluidos del GRANT.
-- (INSERT/UPDATE no se tocan: el registro que escribe pin_hash='' sigue funcionando.)

COMMIT;
