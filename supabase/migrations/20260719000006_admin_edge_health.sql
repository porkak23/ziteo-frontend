-- ============================================================
-- God Mode F4 — Salud de Edge Functions
-- ============================================================
-- Tabla poblada por el wrapper _shared/telemetry.ts (adopción incremental:
-- cada Edge Function que lo importa reporta su propia salud; las que no
-- lo adopten todavía simplemente no aparecen en el panel).

CREATE TABLE IF NOT EXISTS edge_function_health (
  id            bigserial PRIMARY KEY,
  function_name text NOT NULL,
  status_code   int NOT NULL,
  duration_ms   int NOT NULL,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_function_health_name_time
  ON edge_function_health(function_name, created_at DESC);

ALTER TABLE edge_function_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_all_edge_function_health" ON edge_function_health
  FOR SELECT USING (is_admin());

-- Retención 14 días — suficiente para detectar tendencias sin acumular
-- indefinidamente (mismo patrón de retención que driver_location_history).
SELECT cron.schedule(
  'purge_edge_function_health',
  '30 4 * * *',
  $cron$DELETE FROM edge_function_health WHERE created_at < now() - interval '14 days'$cron$
);

-- Vista agregada: tasa de error y latencia p95 por función, última 1h.
CREATE OR REPLACE VIEW admin_edge_health_summary
WITH (security_invoker = true)
AS
SELECT
  function_name,
  COUNT(*) AS request_count,
  COUNT(*) FILTER (WHERE status_code >= 500) AS error_count,
  ROUND(
    (COUNT(*) FILTER (WHERE status_code >= 500))::numeric / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS error_rate_pct,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms,
  MAX(created_at) AS last_seen_at
FROM edge_function_health
WHERE created_at > now() - interval '1 hour'
GROUP BY function_name
ORDER BY function_name;

GRANT SELECT ON admin_edge_health_summary TO authenticated;
