-- ============================================================
-- MIGRATION: 20260519_kpi_views.sql
-- Business KPI views for internal monitoring dashboards.
-- All views are READ-ONLY and scoped to the authenticated role.
-- SECURITY NOTE: these views expose aggregate counts only —
-- no PII, no tokens, no sensitive columns.
-- ============================================================


-- ============================================================
-- KPI 1: Orders by day (last 30 days)
-- Tracks daily order volume and GMV for trending dashboards.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_orders_by_day AS
SELECT
  DATE(created_at AT TIME ZONE 'America/La_Paz') AS day,
  COUNT(*)::INT                                   AS order_count,
  COALESCE(SUM(total), 0)::NUMERIC               AS gmv
FROM orders
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(created_at AT TIME ZONE 'America/La_Paz')
ORDER BY day DESC;

GRANT SELECT ON public.kpi_orders_by_day TO authenticated;


-- ============================================================
-- KPI 2: GMV and order count by city
-- City is resolved from the constructor's profile (the buyer).
-- Covers all-time data; filter by date in the consuming query.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_gmv_by_city AS
SELECT
  COALESCE(p.city, 'Desconocida')        AS city,
  COUNT(o.id)::INT                        AS total_orders,
  COALESCE(SUM(o.total), 0)::NUMERIC     AS total_gmv,
  COALESCE(
    SUM(o.total) FILTER (WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')),
    0
  )::NUMERIC                             AS confirmed_gmv
FROM orders o
LEFT JOIN profiles p ON p.user_id = o.constructor_id
GROUP BY COALESCE(p.city, 'Desconocida')
ORDER BY total_gmv DESC;

GRANT SELECT ON public.kpi_gmv_by_city TO authenticated;


-- ============================================================
-- KPI 3: Payment confirmation rate
-- Measures funnel health: what % of orders move past pending.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_payment_confirmation_rate AS
SELECT
  COUNT(*)::INT                                             AS total_orders,
  COUNT(*) FILTER (WHERE status = 'confirmed')::INT        AS confirmed,
  COUNT(*) FILTER (WHERE status = 'expired')::INT          AS expired,
  COUNT(*) FILTER (WHERE status = 'cancelled')::INT        AS cancelled,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered'))::NUMERIC
    / NULLIF(COUNT(*), 0) * 100,
    2
  )                                                        AS confirmation_rate
FROM orders;

GRANT SELECT ON public.kpi_payment_confirmation_rate TO authenticated;


-- ============================================================
-- KPI 4: Licitaciones engagement
-- Measures how many tenders have received at least one bid.
-- Uses licitacion_postulaciones as the bids table.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_licitaciones_engagement AS
SELECT
  COUNT(DISTINCT l.id)::INT                                                     AS total,
  COUNT(DISTINCT lp.licitacion_id)::INT                                         AS with_bids,
  (COUNT(DISTINCT l.id) - COUNT(DISTINCT lp.licitacion_id))::INT                AS without_bids,
  ROUND(
    COUNT(DISTINCT lp.licitacion_id)::NUMERIC
    / NULLIF(COUNT(DISTINCT l.id), 0) * 100,
    2
  )                                                                              AS engagement_rate
FROM licitaciones l
LEFT JOIN licitacion_postulaciones lp ON lp.licitacion_id = l.id;

GRANT SELECT ON public.kpi_licitaciones_engagement TO authenticated;


-- ============================================================
-- KPI 5: Active providers
-- "Active" = has at least 1 product with active = true.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_active_providers AS
SELECT
  COUNT(DISTINCT ur.user_id)::INT                                                          AS total_providers,
  COUNT(DISTINCT p.provider_id)::INT                                                        AS with_products,
  (COUNT(DISTINCT ur.user_id) - COUNT(DISTINCT p.provider_id))::INT                        AS without_products
FROM user_roles ur
LEFT JOIN products p
  ON p.provider_id = ur.user_id
  AND p.active = true
WHERE ur.role = 'proveedor';

GRANT SELECT ON public.kpi_active_providers TO authenticated;


-- ============================================================
-- KPI 6: Active maestros
-- "Profile complete" = maestro_profiles row exists and
-- specialties array is non-empty.
-- "Available" = available = true in maestro_profiles.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_active_maestros AS
SELECT
  COUNT(DISTINCT ur.user_id)::INT                                                           AS total_maestros,
  COUNT(DISTINCT mp.user_id) FILTER (
    WHERE mp.specialties IS NOT NULL
      AND array_length(mp.specialties, 1) > 0
  )::INT                                                                                    AS profile_complete,
  COUNT(DISTINCT mp.user_id) FILTER (WHERE mp.available = true)::INT                       AS available
FROM user_roles ur
LEFT JOIN maestro_profiles mp ON mp.user_id = ur.user_id
WHERE ur.role = 'maestro';

GRANT SELECT ON public.kpi_active_maestros TO authenticated;


-- ============================================================
-- KPI 7: User signups by day (last 30 days)
-- by_role is a JSONB object: {"constructor": N, "maestro": N, …}
-- Built by aggregating user_roles — one user can have N roles,
-- so we count distinct role assignments, not just distinct users.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_signups_by_day AS
SELECT
  DATE(p.created_at AT TIME ZONE 'America/La_Paz') AS day,
  COUNT(DISTINCT p.user_id)::INT                   AS signups,
  jsonb_object_agg(
    role_counts.role,
    role_counts.cnt
  )                                                AS by_role
FROM profiles p
LEFT JOIN LATERAL (
  SELECT
    ur.role,
    COUNT(*)::INT AS cnt
  FROM user_roles ur
  WHERE ur.user_id = p.user_id
  GROUP BY ur.role
) role_counts ON true
WHERE p.created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(p.created_at AT TIME ZONE 'America/La_Paz')
ORDER BY day DESC;

GRANT SELECT ON public.kpi_signups_by_day TO authenticated;
