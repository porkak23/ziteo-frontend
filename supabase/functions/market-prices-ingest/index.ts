// market-prices-ingest/index.ts — Ingesta periódica de precios de mercado
// (USD/BOB paralelo vía Binance P2P, índice de acero) → tabla market_prices.
//
// Invocada por pg_cron vía pg_net.http_post (ver
// 20260719000005_schedule_market_ingest.sql), nunca desde el navegador.
// Autenticación: header x-cron-secret debe coincidir con el secret
// MARKET_INGEST_SECRET. No usa verify_jwt (config.toml) porque pg_net no
// firma JWT de usuario — el secreto compartido es la única puerta.
//
// Cada fuente falla de forma aislada: un error en Binance no bloquea el
// índice de acero, y viceversa. market_sources.last_ok_at/last_error se
// actualiza por fuente para que check_stale_market_sources() (SQL) genere
// alerta si una fuente lleva >24h sin éxito.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MARKET_INGEST_SECRET = Deno.env.get('MARKET_INGEST_SECRET') ?? ''

interface SourceResult {
  sourceId: string
  ok: boolean
  error?: string
}

async function ingestBinanceP2P(db: ReturnType<typeof createClient>): Promise<SourceResult> {
  const sourceId = 'binance_p2p_usdt_bob'
  try {
    const res = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: 'BOB',
        tradeType: 'SELL',
        page: 1,
        rows: 10,
        payTypes: [],
      }),
    })
    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`)
    const json = await res.json()
    const ads = (json?.data ?? []) as Array<{ adv?: { price?: string } }>
    const prices = ads
      .map((a) => parseFloat(a.adv?.price ?? ''))
      .filter((p) => Number.isFinite(p) && p > 0)
    if (prices.length === 0) throw new Error('No valid prices in Binance response')

    prices.sort((a, b) => a - b)
    const median = prices[Math.floor(prices.length / 2)]

    await db.from('market_prices').insert({
      source: sourceId,
      commodity: 'usd_bob_parallel',
      price: median,
      currency: 'BOB',
      unit: 'unit',
      meta: { sample_size: prices.length, min: prices[0], max: prices[prices.length - 1] },
    })
    await db.from('market_sources').update({ last_ok_at: new Date().toISOString(), last_error: null }).eq('id', sourceId)
    return { sourceId, ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.from('market_sources').update({ last_error: message }).eq('id', sourceId)
    return { sourceId, ok: false, error: message }
  }
}

// El índice de acero requiere una fuente pública estable con formato
// parseable de forma fiable (Trading Economics no expone JSON público sin
// key de pago). Se deja el módulo listo con el mismo contrato de
// SourceResult; hoy reporta "no configurado" en vez de fallar en silencio,
// para que quede visible en la respuesta y no se confunda con un error real.
async function ingestSteelIndex(db: ReturnType<typeof createClient>): Promise<SourceResult> {
  const sourceId = 'steel_index_trading_economics'
  const message = 'Fuente pendiente de configurar: sin endpoint público gratuito confiable'
  await db.from('market_sources').update({ last_error: message }).eq('id', sourceId)
  return { sourceId, ok: false, error: message }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST is accepted', 405, req)
  }

  const providedSecret = req.headers.get('x-cron-secret') ?? ''
  if (!MARKET_INGEST_SECRET || providedSecret !== MARKET_INGEST_SECRET) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing x-cron-secret', 401, req)
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const results = await Promise.all([ingestBinanceP2P(db), ingestSteelIndex(db)])

  return jsonResponse({ results }, 200, {}, req)
})
