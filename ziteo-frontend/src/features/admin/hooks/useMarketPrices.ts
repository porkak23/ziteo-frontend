import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface MarketPricePoint {
  commodity: string
  price: number
  currency: string
  unit: string
  captured_at: string
}

export interface PriceDeviationRow {
  category_name: string
  commodity_key: string
  avg_catalog_price: number
  product_count: number
  market_price: number
  currency: string
  captured_at: string
  deviation_pct: number
}

export interface MarketSourceStatus {
  id: string
  label: string
  enabled: boolean
  last_ok_at: string | null
  last_error: string | null
}

const HISTORY_DAYS = 30

async function fetchPriceHistory(): Promise<MarketPricePoint[]> {
  const since = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('market_prices')
    .select('commodity, price, currency, unit, captured_at')
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as MarketPricePoint[]
}

async function fetchDeviation(): Promise<PriceDeviationRow[]> {
  const { data, error } = await supabase.from('admin_price_deviation').select('*')
  if (error) throw error
  return (data ?? []) as PriceDeviationRow[]
}

async function fetchSources(): Promise<MarketSourceStatus[]> {
  const { data, error } = await supabase
    .from('market_sources')
    .select('id, label, enabled, last_ok_at, last_error')
  if (error) throw error
  return (data ?? []) as MarketSourceStatus[]
}

// Ver market_prices/market_sources/admin_price_deviation en
// 20260719000004_admin_market_prices.sql. Solo polling — el módulo
// Mercado no necesita realtime (los precios se actualizan cada 3h vía
// cron, ver 20260719000005_schedule_market_ingest.sql).
export function useMarketPriceHistory() {
  return useQuery<MarketPricePoint[], Error>({
    queryKey: ['admin', 'market-price-history'],
    queryFn: fetchPriceHistory,
    staleTime: 10 * 60_000,
  })
}

export function usePriceDeviation() {
  return useQuery<PriceDeviationRow[], Error>({
    queryKey: ['admin', 'price-deviation'],
    queryFn: fetchDeviation,
    staleTime: 10 * 60_000,
  })
}

export function useMarketSources() {
  return useQuery<MarketSourceStatus[], Error>({
    queryKey: ['admin', 'market-sources'],
    queryFn: fetchSources,
    staleTime: 5 * 60_000,
  })
}
