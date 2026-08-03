-- ============================================================
-- MIGRATION: 20260801000003_admin_audit_log.sql
-- Tabla append-only de auditoría para acciones admin.
-- ============================================================
--
-- Hoy no existe ningún registro de qué hizo un admin, ni de quién
-- otorga el rol admin (admin_alerts.acknowledged_by solo audita el
-- ack de alertas). Esta tabla es append-only en el sentido estricto:
-- ni siquiera el owner puede modificar o borrar filas una vez
-- escritas, vía un trigger BEFORE UPDATE OR DELETE que rechaza todo.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  uuid NOT NULL REFERENCES auth.users(id),
  action         text NOT NULL,
  target_type    text,
  target_id      text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip             text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor
  ON public.admin_audit_log (actor_user_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo lectura para admin. Ninguna policy de INSERT/UPDATE/DELETE:
-- PostgREST no puede escribir aquí bajo ningún JWT, admin incluido.
CREATE POLICY "admin_audit_log_select" ON public.admin_audit_log
  FOR SELECT USING (is_admin());

-- Redundante con "sin policy de escritura" pero explícito: ni siquiera
-- un futuro GRANT accidental a authenticated bastaría para escribir,
-- porque además no hay policy que lo permita. Cinturón y tirantes.
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_log FROM authenticated, anon;

-- Verdaderamente append-only: bloquea UPDATE/DELETE incluso para el
-- owner de la tabla o una conexión con service_role/superuser que
-- bypassee RLS.
CREATE OR REPLACE FUNCTION public.reject_admin_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_log es append-only: % no permitido', TG_OP;
END;
$$;

CREATE TRIGGER trg_admin_audit_log_append_only
  BEFORE UPDATE OR DELETE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.reject_admin_audit_log_mutation();

-- Helper de escritura: SECURITY DEFINER para que las funciones que lo
-- llaman (RPCs admin) puedan insertar sin necesitar GRANT propio.
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action      text,
  p_target_type text DEFAULT NULL,
  p_target_id   text DEFAULT NULL,
  p_metadata    jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (actor_user_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_metadata);
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) TO authenticated;

-- Retro-instrumentar acknowledge_admin_alert (20260719000001) para
-- que quede en el audit log — hoy solo escribe acknowledged_by en la
-- propia fila de admin_alerts, sin rastro centralizado.
CREATE OR REPLACE FUNCTION public.acknowledge_admin_alert(p_alert_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: se requiere rol admin.';
  END IF;

  UPDATE admin_alerts
     SET acknowledged_at = now(),
         acknowledged_by = auth.uid()
   WHERE id = p_alert_id
     AND acknowledged_at IS NULL;

  PERFORM public.log_admin_action('acknowledge_alert', 'admin_alerts', p_alert_id::text);

  RETURN jsonb_build_object('success', true, 'alert_id', p_alert_id);
END;
$$;

-- Retro-instrumentar grant_admin_role (20260801000002) para que la
-- asignación de admin quede auditada también.
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

  PERFORM public.log_admin_action('grant_admin_role', 'user_roles', target_user_id::text);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin_role(uuid) FROM PUBLIC;
