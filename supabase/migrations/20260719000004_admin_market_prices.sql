-- ============================================================
-- God Mode F3 — Inteligencia de mercado (precios USD/BOB, acero)
-- ============================================================

CREATE TABLE IF NOT EXISTS market_sources (
  id          text PRIMARY KEY,  -- ej. 'binance_p2p_usdt_bob', 'steel_index_trading_economics'
  label       text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  last_ok_at  timestamptz,
  last_error  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO market_sources (id, label) VALUES
  ('binance_p2p_usdt_bob', 'USD/BOB paralelo (Binance P2P)'),
  ('steel_index_trading_economics', 'Índice acero (Trading Economics)')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE market_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_all_market_sources" ON market_sources
  FOR SELECT USING (is_admin());

CREATE TABLE IF NOT EXISTS market_prices (
  id          bigserial PRIMARY KEY,
  source      text NOT NULL REFERENCES market_sources(id),
  commodity   text NOT NULL,  -- ej. 'usd_bob_parallel', 'steel_rebar'
  price       numeric NOT NULL,
  currency    text NOT NULL,  -- 'BOB' | 'USD'
  unit        text NOT NULL,  -- 'unit' | 'ton' | 'quintal'
  captured_at timestamptz NOT NULL DEFAULT now(),
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_market_prices_commodity_time
  ON market_prices(commodity, captured_at DESC);

ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_all_market_prices" ON market_prices
  FOR SELECT USING (is_admin());

-- Columna para cruzar categorías de producto con series de mercado.
-- NULL = categoría sin equivalente de mercado rastreado (no todas lo tienen).
ALTER TABLE categories ADD COLUMN IF NOT EXISTS commodity_key text;

-- Vista de desviación: último precio de mercado por commodity vs precio
-- promedio de productos activos en la categoría correspondiente.
-- Sin conversión de moneda automática (BOB vs USD) — el commodity_key
-- debe apuntar a series ya expresadas en BOB, o la comparación se hace
-- a ojo desde el dashboard hasta que exista una tabla de tipo de cambio
-- oficial para conversión automática.
CREATE OR REPLACE VIEW admin_price_deviation
WITH (security_invoker = true)
AS
WITH latest_market AS (
  SELECT DISTINCT ON (commodity)
    commodity, price AS market_price, currency, captured_at
  FROM market_prices
  ORDER BY commodity, captured_at DESC
),
category_avg AS (
  SELECT
    c.commodity_key,
    c.name AS category_name,
    AVG(p.price_unit) AS avg_catalog_price,
    COUNT(p.id) AS product_count
  FROM categories c
  JOIN products p ON p.category_id = c.id AND p.active = true
  WHERE c.commodity_key IS NOT NULL
  GROUP BY c.commodity_key, c.name
)
SELECT
  ca.category_name,
  ca.commodity_key,
  ca.avg_catalog_price,
  ca.product_count,
  lm.market_price,
  lm.currency,
  lm.captured_at,
  ROUND(
    ((ca.avg_catalog_price - lm.market_price) / NULLIF(lm.market_price, 0)) * 100,
    2
  ) AS deviation_pct
FROM category_avg ca
JOIN latest_market lm ON lm.commodity = ca.commodity_key;

GRANT SELECT ON admin_price_deviation TO authenticated;

-- Alerta de fuente caída: last_ok_at > 24h. Revisión periódica (mismo
-- patrón que check_stale_payment_evidence / check_silent_drivers de
-- 20260719000003_admin_history_and_alerts.sql).
CREATE OR REPLACE FUNCTION check_stale_market_sources()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_alerts (severity, kind, payload)
  SELECT
    'warning',
    'market_source_stale',
    jsonb_build_object('source_id', ms.id, 'label', ms.label, 'last_ok_at', ms.last_ok_at)
  FROM market_sources ms
  WHERE ms.enabled = true
    AND (ms.last_ok_at IS NULL OR ms.last_ok_at < now() - interval '24 hours')
    AND NOT EXISTS (
      SELECT 1 FROM admin_alerts a
       WHERE a.kind = 'market_source_stale'
         AND a.payload->>'source_id' = ms.id
         AND a.created_at > now() - interval '24 hours'
    );
END;
$$;

SELECT cron.schedule(
  'check_stale_market_sources',
  '0 */6 * * *',  -- cada 6 horas
  $cron$SELECT check_stale_market_sources()$cron$
);
