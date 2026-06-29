-- 20260611_rls_profiles_authenticated_only.sql
--
-- Seguridad RLS — Fase 0.2: cerrar el acceso anónimo a `profiles`.
--
-- Contexto del hallazgo (auditoría 2026-06-11):
--   La política "Public read profiles maestros proveedores" aplicaba al rol
--   `public` (incluye `anon`): cualquier cliente sin sesión podía enumerar el
--   directorio completo de maestros/proveedores con teléfono y email. Además,
--   el pre-check de registro (authService.registerAnonymous) usaba esa
--   visibilidad anónima como puerta a la ruta de "recuperación" con password
--   determinista — registrarse con el teléfono de otro iniciaba sesión en su
--   cuenta. (El fix de fondo de la password determinista es Fase 1.6.)
--
--   A la vez, las pantallas autenticadas que embeben perfiles de contrapartes
--   (nombre del comprador en pedidos del proveedor, nombres de constructores
--   en licitaciones/contratos/reviews) apuntan a filas que la política vieja
--   NO exponía (solo maestro/proveedor), por lo que esos joins devolvían null.
--
-- Cambio:
--   * anon pierde TODA visibilidad de filas de profiles.
--   * authenticated puede ver todas las filas — las columnas sensibles
--     (pin_hash, totp_secret) ya están fuera del GRANT desde
--     20260609_rls_hide_auth_secrets, y el teléfono del comprador es necesario
--     para la coordinación de entrega por parte del proveedor.
--
-- Impacto en frontend (verificado, sin cambios de código necesarios):
--   * authService.ts:112 (pre-check de teléfono en registro, corre como anon)
--     ahora devuelve null siempre; el duplicado lo captura auth.signUp con
--     "User already registered". La ruta de auto-login por re-registro queda
--     bloqueada (intencional).
--   * StatusPage.tsx:49 (ping de conectividad como anon) devuelve 0 filas sin
--     error; sigue midiendo latencia.
--   * Todas las demás lecturas de profiles ocurren con sesión iniciada.
--
-- Residual conocido (backlog Fase 3): phone/email de cualquier perfil siguen
-- siendo legibles por usuarios autenticados; la separación por columna exige
-- una vista de directorio (public_profiles) y migrar los reads del frontend.

BEGIN;

DROP POLICY IF EXISTS "Public read profiles maestros proveedores" ON public.profiles;

CREATE POLICY "Authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

COMMIT;
