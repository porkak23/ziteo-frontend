-- =============================================================
-- Rate limiting para auth: tabla auth_throttle + función check_throttle
--
-- check_throttle es invocada por las Edge Functions auth/register y
-- auth/otp-verify (supabase/functions/auth/*/index.ts) pero nunca existió
-- en el árbol de migraciones canónico — solo en el árbol legacy
-- ziteo-frontend/supabase/migrations/20260513_fase2_security.sql.
-- Portada aquí sin cambios funcionales. auth_throttle ya existe en prod
-- (creada por el árbol legacy), de ahí el IF NOT EXISTS.
-- =============================================================

CREATE TABLE IF NOT EXISTS auth_throttle (
  id           bigserial PRIMARY KEY,
  identifier   text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  attempts     int NOT NULL DEFAULT 1,
  CONSTRAINT auth_throttle_identifier_window_key UNIQUE (identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_auth_throttle_identifier
  ON auth_throttle(identifier, window_start);

ALTER TABLE auth_throttle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON auth_throttle;
CREATE POLICY "service_role_only"
  ON auth_throttle
  USING (false);

CREATE OR REPLACE FUNCTION check_throttle(
  p_identifier     text,
  p_max_attempts   int,
  p_window_minutes int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_attempts int;
  v_window_start   timestamptz;
BEGIN
  -- Truncate current time to the window boundary so all hits in the same
  -- window bucket share a single row.
  v_window_start := date_trunc('minute', now())
                    - ((EXTRACT(MINUTE FROM now())::int % p_window_minutes)
                       * interval '1 minute');

  -- Count attempts already recorded in the active window
  SELECT COALESCE(SUM(attempts), 0)
    INTO v_total_attempts
    FROM auth_throttle
   WHERE identifier   = p_identifier
     AND window_start >= now() - (p_window_minutes || ' minutes')::interval;

  -- Already at limit — block without recording another attempt
  IF v_total_attempts >= p_max_attempts THEN
    RETURN true;
  END IF;

  -- Record this new attempt (upsert into the current window bucket)
  INSERT INTO auth_throttle (identifier, window_start, attempts)
  VALUES (p_identifier, v_window_start, 1)
  ON CONFLICT (identifier, window_start)
  DO UPDATE SET attempts = auth_throttle.attempts + 1;

  RETURN false;
END;
$$;

ALTER FUNCTION check_throttle(text, int, int) OWNER TO postgres;

CREATE OR REPLACE FUNCTION promote_user_role(
  p_user_id uuid,
  p_role    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only callable by the service_role JWT context
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Permission denied: service_role required';
  END IF;

  -- Validate role
  IF p_role NOT IN ('proveedor', 'maestro', 'chofer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of proveedor, maestro, chofer', p_role;
  END IF;

  INSERT INTO user_roles (user_id, role, onboarding_completed)
  VALUES (p_user_id, p_role, false)
  ON CONFLICT DO NOTHING;
END;
$$;
