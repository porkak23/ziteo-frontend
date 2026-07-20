-- Migration: maestros_search view + availability index
-- Created: 2026-05-19

-- ─── View: maestros_view ──────────────────────────────────────────────────────
-- Replaces the two-query pattern (user_roles IDs → profiles data) with a single
-- JOIN that the client can query directly via PostgREST.
-- RLS is inherited from the underlying tables (profiles and maestro_profiles
-- have public SELECT policies; user_roles has its own SELECT policy).

CREATE OR REPLACE VIEW public.maestros_view AS
SELECT
  p.user_id,
  p.name,
  p.city,
  p.avatar_url,
  mp.specialties,
  mp.rate_type,
  mp.rate_amount,
  mp.available,
  mp.experience_years
FROM profiles p
INNER JOIN user_roles ur ON p.user_id = ur.user_id AND ur.role = 'maestro'
LEFT JOIN maestro_profiles mp ON p.user_id = mp.user_id;

COMMENT ON VIEW public.maestros_view IS
  'Búsqueda pública de maestros: JOIN de profiles + user_roles (role=maestro) + maestro_profiles. '
  'Lectura pública — RLS heredada de las tablas base.';

-- Grant SELECT to authenticated and anon so PostgREST can serve it
GRANT SELECT ON public.maestros_view TO authenticated, anon;

-- ─── Performance index ────────────────────────────────────────────────────────
-- City filter and availability are the two most frequent WHERE clauses.
-- If maestro_profiles doesn't exist yet this index will be created when the
-- table is created (migrations are applied in order).

CREATE INDEX IF NOT EXISTS idx_maestro_profiles_available
  ON public.maestro_profiles (available);

CREATE INDEX IF NOT EXISTS idx_maestro_profiles_user_id
  ON public.maestro_profiles (user_id);

-- ─── Stock release trigger for cancelled/expired orders ───────────────────────
-- Validates that stock is restored when an order transitions to cancelled or
-- expired. The actual restore_stock_on_cancel function must already exist from
-- the place_order RPC migration; this trigger attaches it to status changes.
-- Wrapped in DO block so it is idempotent (safe to re-run).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_restore_stock_on_cancel'
      AND tgrelid = 'orders'::regclass
  ) THEN
    -- Only create the trigger if the helper function already exists.
    -- If it does not exist, the application relies on the RPC-level stock
    -- management and this trigger is deferred to a future migration.
    IF EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'restore_stock_on_cancel'
    ) THEN
      CREATE TRIGGER trg_restore_stock_on_cancel
        AFTER UPDATE OF status ON orders
        FOR EACH ROW
        WHEN (
          NEW.status IN ('cancelled', 'expired') AND
          OLD.status NOT IN ('cancelled', 'expired')
        )
        EXECUTE FUNCTION restore_stock_on_cancel();
    END IF;
  END IF;
END;
$$;

-- ─── estimated_delivery_at column ────────────────────────────────────────────
-- Add the optional estimated delivery date column to orders if not present.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz DEFAULT NULL;
