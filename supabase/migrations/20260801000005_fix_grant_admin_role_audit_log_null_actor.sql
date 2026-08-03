-- ============================================================
-- MIGRATION: 20260801000005_fix_grant_admin_role_audit_log_null_actor.sql
-- Fix: grant_admin_role() fallaba al invocarse desde el SQL Editor /
-- service_role (el único canal por el que puede llamarse, por diseño).
-- ============================================================
--
-- log_admin_action() usa auth.uid() para actor_user_id, que es NOT NULL.
-- grant_admin_role() está deliberadamente sin GRANT a `authenticated`
-- (20260801000004) — solo se invoca con service_role o una conexión
-- directa de Postgres, donde auth.uid() es NULL. El PERFORM
-- log_admin_action(...) agregado en 20260801000003 nunca se probó por
-- ese canal y rompía la transacción completa (incluida la asignación
-- del rol admin) con una violación de NOT NULL.
--
-- Fix: grant_admin_role() escribe directo en admin_audit_log con
-- COALESCE(auth.uid(), target_user_id) como actor cuando no hay sesión
-- de usuario — deja explícito en metadata que fue un bootstrap sin
-- sesión, en vez de silenciar el caso o inventar un actor falso.

CREATE OR REPLACE FUNCTION public.grant_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
    RAISE EXCEPTION 'No existe un profile para user_id %', target_user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role, onboarding_completed)
  VALUES (target_user_id, 'admin', true)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.admin_audit_log (actor_user_id, action, target_type, target_id, metadata)
  VALUES (
    COALESCE(v_actor, target_user_id),
    'grant_admin_role',
    'user_roles',
    target_user_id::text,
    CASE WHEN v_actor IS NULL
      THEN jsonb_build_object('via', 'sql_editor_or_service_role', 'no_session', true)
      ELSE '{}'::jsonb
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_role(uuid) FROM anon;
