-- ============================================================
-- God Mode F3 — cron que invoca la Edge Function market-prices-ingest
-- ============================================================
-- El secreto compartido (MARKET_INGEST_SECRET) se guarda en Supabase
-- Vault, NO en texto plano en esta migración — vault.create_secret()
-- se ejecuta una sola vez con un valor aleatorio.
--
-- PASO MANUAL PENDIENTE tras aplicar esta migración: el valor generado
-- en vault y el secret que lee la Edge Function (Deno.env.get) son DOS
-- almacenes distintos que no se sincronizan solos. Ejecutar:
--   select decrypted_secret from vault.decrypted_secrets where name = 'market_ingest_secret';
-- y luego:
--   npx supabase secrets set MARKET_INGEST_SECRET='<valor-copiado>' --project-ref yvqbubjfhmuztknmhyvd
-- Sin este paso, la Edge Function rechaza la llamada del cron con 401.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'market_ingest_secret') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'market_ingest_secret',
      'Secreto compartido entre pg_cron y la Edge Function market-prices-ingest'
    );
  END IF;
END $$;

-- project_url también en vault para no hardcodear el dominio del proyecto
-- en la migración (portable entre entornos si algún día hay staging).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_url') THEN
    PERFORM vault.create_secret(
      'https://yvqbubjfhmuztknmhyvd.supabase.co',
      'project_url',
      'URL base del proyecto Supabase, usada por cron jobs que llaman Edge Functions'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION trigger_market_prices_ingest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url    text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'market_ingest_secret';

  PERFORM net.http_post(
    url := v_url || '/functions/v1/market-prices-ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
END;
$$;

-- Cada 3 horas: suficiente frescura para precios de mercado, sin abusar
-- de la API pública de Binance P2P.
SELECT cron.schedule(
  'market_prices_ingest',
  '0 */3 * * *',
  $cron$SELECT trigger_market_prices_ingest()$cron$
);
