-- ============================================================
-- Migration: 20260513_fase4_indexes_pagination.sql
-- Project:   Ziteo — Construction Logistics Marketplace (Bolivia)
-- Phase:     Fase 4 — Performance Improvements
-- Date:      2026-05-13
--
-- Summary:
--   Part 1: Composite partial indexes on products, orders,
--           deliveries, contracts, and notifications to
--           accelerate the most common dashboard queries.
--   Part 2: Keyset-pagination RPCs (list_products_cursor,
--           list_orders_cursor) to replace fragile OFFSET
--           queries with stable cursor-based pagination.
--
-- All indexes use CREATE INDEX IF NOT EXISTS so the migration
-- is safe to re-run on a database that is already partially
-- migrated.
-- ============================================================


-- ============================================================
-- PART 1 — PERFORMANCE INDEXES
-- ============================================================

-- ------------------------------------------------------------
-- products: tienda browsing
-- ------------------------------------------------------------

-- Provider catalog listing (most common query from Vendedor dashboard)
CREATE INDEX IF NOT EXISTS idx_products_provider_active
  ON products(provider_id, created_at DESC)
  WHERE active = true AND (is_deleted IS NULL OR is_deleted = false);

-- Category-filtered browsing (Constructor tienda tab)
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON products(category_id, created_at DESC)
  WHERE active = true AND (is_deleted IS NULL OR is_deleted = false);

-- Construction stage filter (e.g. cimientos, estructura, acabados)
CREATE INDEX IF NOT EXISTS idx_products_stage
  ON products(construction_stage, created_at DESC)
  WHERE construction_stage IS NOT NULL
    AND active = true
    AND (is_deleted IS NULL OR is_deleted = false);

-- ------------------------------------------------------------
-- orders: constructor sees their orders, proveedor sees incoming
-- ------------------------------------------------------------

-- Constructor order history
CREATE INDEX IF NOT EXISTS idx_orders_constructor
  ON orders(constructor_id, created_at DESC);

-- Provider incoming orders
CREATE INDEX IF NOT EXISTS idx_orders_provider
  ON orders(provider_id, created_at DESC);

-- Active order statuses (used by status-badge widgets)
CREATE INDEX IF NOT EXISTS idx_orders_status_active
  ON orders(status, created_at DESC)
  WHERE status IN ('pending', 'processing', 'shipped');

-- ------------------------------------------------------------
-- deliveries: radar screen — pending deliveries by cargo type
-- ------------------------------------------------------------

-- Repartidor radar — pending jobs filterable by cargo type
CREATE INDEX IF NOT EXISTS idx_deliveries_pending_cargo
  ON deliveries(cargo_type, created_at DESC)
  WHERE status = 'pending';

-- Driver active deliveries (accepted or in transit)
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_active
  ON deliveries(driver_id, created_at DESC)
  WHERE status IN ('accepted', 'in_transit');

-- ------------------------------------------------------------
-- contracts: constructor and maestro dashboards
-- ------------------------------------------------------------

-- Constructor licitaciones / contracts list
CREATE INDEX IF NOT EXISTS idx_contracts_constructor
  ON contracts(constructor_id, created_at DESC);

-- Maestro / trabajador contracts list
CREATE INDEX IF NOT EXISTS idx_contracts_maestro
  ON contracts(maestro_id, created_at DESC);

-- ------------------------------------------------------------
-- notifications: unread badge + list
-- ------------------------------------------------------------

-- Full notification list per user (newest first)
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);

-- Unread-only partial index — powers the unread badge count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id)
  WHERE is_read = false;


-- ============================================================
-- PART 2 — CURSOR-BASED PAGINATION RPCs
-- ============================================================

-- ------------------------------------------------------------
-- RPC: list_products_cursor
-- Keyset pagination for product catalog.
-- Cursor = (created_at, id) of the last seen row.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION list_products_cursor(
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id         UUID        DEFAULT NULL,
  p_limit             INT         DEFAULT 20,
  p_provider_id       UUID        DEFAULT NULL,
  p_category_id       UUID        DEFAULT NULL,
  p_stage             TEXT        DEFAULT NULL
)
RETURNS TABLE(
  id                  UUID,
  name                TEXT,
  price_unit          NUMERIC,
  provider_id         UUID,
  category_id         UUID,
  unit_type           TEXT,
  stock_quantity      INT,
  active              BOOLEAN,
  image_url           TEXT,
  construction_stage  TEXT,
  created_at          TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.name, p.price_unit, p.provider_id, p.category_id,
    p.unit_type, p.stock_quantity, p.active, p.image_url,
    p.construction_stage, p.created_at
  FROM products p
  WHERE
    p.active = true
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
    AND (p_provider_id IS NULL OR p.provider_id = p_provider_id)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_stage IS NULL OR p.construction_stage = p_stage)
    AND (
      p_cursor_created_at IS NULL
      OR p.created_at < p_cursor_created_at
      OR (p.created_at = p_cursor_created_at AND p.id < p_cursor_id)
    )
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION list_products_cursor IS
  'Keyset pagination for product catalog. Pass cursor_created_at + cursor_id from last row of previous page.';

-- ------------------------------------------------------------
-- RPC: list_orders_cursor
-- Keyset pagination for orders — scoped to auth.uid().
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION list_orders_cursor(
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id         UUID        DEFAULT NULL,
  p_limit             INT         DEFAULT 20,
  p_status            TEXT        DEFAULT NULL
)
RETURNS TABLE(
  id             UUID,
  constructor_id UUID,
  provider_id    UUID,
  status         TEXT,
  total          NUMERIC,
  cargo_type     TEXT,
  created_at     TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.constructor_id, o.provider_id, o.status,
    o.total, o.cargo_type, o.created_at
  FROM orders o
  WHERE
    (o.constructor_id = auth.uid() OR o.provider_id = auth.uid())
    AND (p_status IS NULL OR o.status = p_status)
    AND (
      p_cursor_created_at IS NULL
      OR o.created_at < p_cursor_created_at
      OR (o.created_at = p_cursor_created_at AND o.id < p_cursor_id)
    )
  ORDER BY o.created_at DESC, o.id DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION list_orders_cursor IS
  'Keyset pagination for orders visible to auth.uid() (as buyer or provider). Pass cursor from last row.';
