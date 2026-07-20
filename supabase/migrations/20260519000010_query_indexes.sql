-- ============================================================
-- MIGRATION: 20260519_query_indexes.sql
-- Additional query-level indexes identified from frontend hook
-- analysis (Bloque B, lanzamiento v1.0).
-- All indexes from 20260519_add_v1_indexes.sql are skipped.
-- ============================================================


-- ── orders ───────────────────────────────────────────────────

-- orders: constructor_id + created_at — useMyOrders fetches by
-- constructor_id ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_constructor_created
  ON orders(constructor_id, created_at DESC);

-- orders: provider_id + status — useDashboardStats (proveedor)
-- and useProveedorOrders both filter provider_id + specific status
CREATE INDEX IF NOT EXISTS idx_orders_provider_status
  ON orders(provider_id, status);

-- orders: provider_id + created_at — useIncomingOrders orders
-- by created_at DESC for a given provider
CREATE INDEX IF NOT EXISTS idx_orders_provider_created
  ON orders(provider_id, created_at DESC);

-- orders: constructor_id + status — useDashboardStats constructor
-- path filters by (constructor_id, status IN (...))
CREATE INDEX IF NOT EXISTS idx_orders_constructor_status
  ON orders(constructor_id, status);


-- ── licitaciones ─────────────────────────────────────────────

-- licitaciones: status + created_at — useLicitacionesAbiertas
-- always filters status='open' and orders by created_at DESC
CREATE INDEX IF NOT EXISTS idx_licitaciones_status_created
  ON licitaciones(status, created_at DESC);

-- licitaciones: constructor_id + created_at — useMisLicitaciones
-- filters by constructor_id and orders by created_at DESC
CREATE INDEX IF NOT EXISTS idx_licitaciones_constructor_created
  ON licitaciones(constructor_id, created_at DESC);

-- licitaciones: city filter used by useLicitacionesAbiertas when
-- a city filter is applied alongside status='open'
CREATE INDEX IF NOT EXISTS idx_licitaciones_city
  ON licitaciones(city)
  WHERE status = 'open';

-- licitacion_postulaciones: licitacion_id + created_at —
-- usePostulantesDeLicitacion orders by created_at DESC
CREATE INDEX IF NOT EXISTS idx_postulaciones_licitacion_created
  ON licitacion_postulaciones(licitacion_id, created_at DESC);

-- licitacion_postulaciones: maestro_id lookup — useLicitacionesAbiertas
-- checks which licitaciones the current maestro has already applied to
CREATE INDEX IF NOT EXISTS idx_postulaciones_maestro_id
  ON licitacion_postulaciones(maestro_id);


-- ── contracts ────────────────────────────────────────────────

-- contracts: maestro_id + status — usePendingContracts and
-- useDashboardStats (maestro) both query by maestro_id + status
CREATE INDEX IF NOT EXISTS idx_contracts_maestro_status
  ON contracts(maestro_id, status);

-- contracts: constructor_id + status — useDashboardStats
-- (constructor) queries by constructor_id + status
CREATE INDEX IF NOT EXISTS idx_contracts_constructor_status
  ON contracts(constructor_id, status);


-- ── deliveries ────────────────────────────────────────────────

-- deliveries: status + cargo_type — usePendingDeliveries (repartidor
-- radar) filters status='pending' and optionally cargo_type
CREATE INDEX IF NOT EXISTS idx_deliveries_status_cargo
  ON deliveries(status, cargo_type);

-- deliveries: status + driver_id=NULL — available pool query
-- filters status='pending' IS driver_id NULL
CREATE INDEX IF NOT EXISTS idx_deliveries_pending_unassigned
  ON deliveries(status, created_at DESC)
  WHERE driver_id IS NULL;

-- deliveries: driver_id + created_at — useMyDeliveries fetches
-- all deliveries for a driver ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_created
  ON deliveries(driver_id, created_at DESC);


-- ── projects ─────────────────────────────────────────────────

-- projects: constructor_id + status — useDashboardStats and
-- useProyectos filter by constructor_id and/or status
CREATE INDEX IF NOT EXISTS idx_projects_constructor_status
  ON projects(constructor_id, status);

-- projects: status + needs_maestro — useProyectos for maestro role
-- filters needs_maestro=true AND status IN ('active','planning')
CREATE INDEX IF NOT EXISTS idx_projects_status_needs_maestro
  ON projects(status, needs_maestro)
  WHERE needs_maestro = true;

-- projects: status + needs_materials — useProyectos for proveedor
-- role filters needs_materials=true AND status IN ('active','planning')
CREATE INDEX IF NOT EXISTS idx_projects_status_needs_materials
  ON projects(status, needs_materials)
  WHERE needs_materials = true;


-- ── products ─────────────────────────────────────────────────

-- products: provider_id + active + created_at — useInventario
-- paginates by provider_id ordered by created_at DESC, active is
-- also queried in useDashboardStats (proveedor)
CREATE INDEX IF NOT EXISTS idx_products_provider_active_created
  ON products(provider_id, active, created_at DESC);


-- ── notifications ─────────────────────────────────────────────

-- notifications: user_id + is_read + created_at — notifications
-- screen fetches unread count and recent notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);


-- ── quotations ────────────────────────────────────────────────

-- quotations: buyer_id + status — useQuotation fetches pending
-- quotations for the current buyer
CREATE INDEX IF NOT EXISTS idx_quotations_buyer_status
  ON quotations(buyer_id, status);

-- quotations: provider_id + status — provider-side quotation lookup
CREATE INDEX IF NOT EXISTS idx_quotations_provider_status
  ON quotations(provider_id, status);

-- quotations: expires_at — cron/expiry queries on pending quotations
CREATE INDEX IF NOT EXISTS idx_quotations_expires_at
  ON quotations(expires_at)
  WHERE status = 'pending';
