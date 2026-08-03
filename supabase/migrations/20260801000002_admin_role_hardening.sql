-- ============================================================
-- MIGRATION: 20260801000002_admin_role_hardening.sql
-- Habilita el rol 'admin' en user_roles sin abrir una vía de
-- escalada de privilegios.
-- ============================================================
--
-- Contexto: hoy no existe ningún usuario admin (constructor:2,
-- proveedor:1, chofer:1) y el CHECK constraint user_roles_role_check
-- NO permite el valor 'admin' — ni siquiera insertándolo a mano por
-- SQL. El God Mode (RLS + vistas + Edge Function, todo ya construido
-- en 20260719000001 y siguientes) es hoy inalcanzable.
--
-- El motivo por el que este archivo hace TODO en una sola transacción
-- y en este orden específico: el CHECK constraint es hoy la ÚNICA
-- defensa contra que un usuario se auto-asigne admin vía PostgREST.
-- Verificado en prod que las policies actuales de user_roles NO
-- restringen el valor de `role`:
--   "Users insert own roles"     INSERT WITH CHECK (auth.uid()=user_id)
--   "Users can update own role"  UPDATE USING (user_id=auth.uid())      -- WITH CHECK null
--   "Users update own roles"     UPDATE USING (auth.uid()=user_id)      -- WITH CHECK null
-- (cuando WITH CHECK es null en un UPDATE, Postgres reutiliza el
-- USING como check — que tampoco restringe el rol).
--
-- Si se ampliara el CHECK constraint sin cerrar antes estas policies,
-- se abriría una ventana en la que CUALQUIER usuario autenticado
-- podría hacer POST/PATCH a /rest/v1/user_roles con role:'admin' y
-- convertirse en admin. Por eso el paso 1 (cerrar policies) va ANTES
-- que el paso 2 (ampliar el constraint), en la misma transacción.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Cerrar las policies de escritura de user_roles ANTES de que el
--    valor 'admin' sea válido para la columna role.
-- ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users insert own roles" ON public.user_roles;
CREATE POLICY "Users insert own roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role <> 'admin');

DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
CREATE POLICY "Users can update own role" ON public.user_roles
  FOR UPDATE
  USING (user_id = auth.uid() AND role <> 'admin')
  WITH CHECK (user_id = auth.uid() AND role <> 'admin');

DROP POLICY IF EXISTS "Users update own roles" ON public.user_roles;
CREATE POLICY "Users update own roles" ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id AND role <> 'admin')
  WITH CHECK (auth.uid() = user_id AND role <> 'admin');

-- Nota: el USING con role <> 'admin' además impide que un no-admin
-- lea/mute una fila admin existente por UPDATE (aunque la lectura ya
-- estaba limitada por "Users view own roles"), y evita que alguien
-- degrade la fila admin de otro usuario.

-- ────────────────────────────────────────────────────────────────
-- 2. Recién ahora, ampliar el CHECK constraint. Las policies de
--    arriba son la defensa real; el constraint pasa a ser defensa en
--    profundidad, no la única línea.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role::text = ANY (ARRAY['constructor','proveedor','maestro','chofer','admin']::text[]));

-- ────────────────────────────────────────────────────────────────
-- 3. Canal único de asignación de admin: RPC sin GRANT a
--    `authenticated`. RLS no puede tocarla (no se ejecuta vía
--    PostgREST con JWT de usuario) y ningún cliente autenticado tiene
--    EXECUTE. Solo alcanzable con service_role o conexión directa de
--    Postgres (SQL Editor del dashboard).
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.grant_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
    RAISE EXCEPTION 'No existe un profile para user_id %', target_user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role, onboarding_completed)
  VALUES (target_user_id, 'admin', true)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin_role(uuid) FROM PUBLIC;
-- Deliberadamente SIN GRANT a `authenticated`: la asignación de admin
-- solo ocurre desde el SQL Editor (service_role / superuser), nunca
-- desde el cliente.

-- ────────────────────────────────────────────────────────────────
-- 4. is_admin_mfa(): función NUEVA y separada de is_admin(). No se
--    toca is_admin() porque la invocan 15 policies RLS existentes —
--    cambiar su semántica alteraría 15 superficies a la vez, y una
--    policy rota no da error, devuelve cero filas (indistinguible de
--    "no hay datos"). is_admin_mfa() exige aal2 (segundo factor ya
--    verificado en la sesión actual) y se usa solo en las escrituras
--    admin nuevas (Fase 2 en adelante), nunca retroactivamente sobre
--    las policies de solo lectura ya desplegadas.
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin_mfa()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() AND (auth.jwt() ->> 'aal') = 'aal2';
$$;

REVOKE ALL ON FUNCTION public.is_admin_mfa() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_mfa() TO authenticated;

COMMIT;
