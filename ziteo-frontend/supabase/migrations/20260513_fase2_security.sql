-- =============================================================
-- Fase 2 Security: auth_throttle + check_throttle + promote_user_role
--                  + quotations server-side subtotal recalc
-- =============================================================

-- -------------------------------------------------------
-- 1a. Tabla auth_throttle
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_throttle (
  id           bigserial PRIMARY KEY,
  identifier   text NOT NULL,        -- phone number or IP
  window_start timestamptz NOT NULL DEFAULT now(),
  attempts     int NOT NULL DEFAULT 1,
  CONSTRAINT auth_throttle_identifier_window_key UNIQUE (identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_auth_throttle_identifier
  ON auth_throttle(identifier, window_start);

-- -------------------------------------------------------
-- 1b. Función check_throttle
-- -------------------------------------------------------
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

-- Owned by postgres (SECURITY DEFINER already makes it run as the definer)
ALTER FUNCTION check_throttle(text, int, int) OWNER TO postgres;

-- -------------------------------------------------------
-- 1c. Función promote_user_role
-- -------------------------------------------------------
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

-- -------------------------------------------------------
-- 1d. RLS en auth_throttle
-- -------------------------------------------------------
ALTER TABLE auth_throttle ENABLE ROW LEVEL SECURITY;

-- Nobody can read or write from the client side; only SECURITY DEFINER functions can
CREATE POLICY "service_role_only"
  ON auth_throttle
  USING (false);

-- -------------------------------------------------------
-- Fix 3: generate_quotation — recalculate subtotal server-side
--
-- The function keeps p_subtotal in its signature for API compatibility
-- but ignores it entirely. Subtotal is recalculated from p_items JSONB
-- by joining each item's product_id against the products table to get
-- the authoritative price_unit.
--
-- Expected p_items element shape: {"product_id": "<uuid>", "quantity": <int>}
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_quotation(
  p_buyer_id        UUID,
  p_provider_id     UUID,
  p_items           JSONB,
  p_subtotal        NUMERIC,          -- kept for client compatibility, ignored
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id        UUID;
  v_subtotal  NUMERIC(12, 2);
BEGIN
  IF auth.uid() != p_buyer_id THEN
    RAISE EXCEPTION 'Solo el comprador puede generar su propia cotización';
  END IF;

  -- Recalculate subtotal server-side; never trust the client value
  SELECT COALESCE(
    SUM(
      (item->>'quantity')::numeric * p.price_unit
    ),
    0
  )
  INTO v_subtotal
  FROM jsonb_array_elements(p_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::uuid;

  INSERT INTO quotations (buyer_id, provider_id, items, subtotal, expires_at)
  VALUES (
    p_buyer_id,
    p_provider_id,
    p_items,
    v_subtotal,
    now() + (p_expires_in_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- -------------------------------------------------------
-- Fix 3b: CHECK constraint on quotations.subtotal
-- NOT VALID so existing rows are not re-validated
-- -------------------------------------------------------
ALTER TABLE quotations
  ADD CONSTRAINT chk_subtotal_range
  CHECK (subtotal >= 0 AND subtotal < 1000000000)
  NOT VALID;
