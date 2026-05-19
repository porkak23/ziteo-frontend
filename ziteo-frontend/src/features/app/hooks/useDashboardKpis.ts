// useDashboardKpis — Admin KPI panel hook (not connected to any UI yet)
// Queries the kpi_* views created in 20260519_kpi_views.sql.
// Intended for a future internal admin dashboard — keep typed and ready.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KpiOrderByDay {
  day: string        // ISO date string, e.g. "2026-05-18"
  order_count: number
  gmv: number
}

export interface KpiGmvByCity {
  city: string
  total_orders: number
  total_gmv: number
  confirmed_gmv: number
}

export interface KpiPaymentConfirmationRate {
  total_orders: number
  confirmed: number
  expired: number
  cancelled: number
  confirmation_rate: number  // percentage 0–100
}

export interface KpiLicitacionesEngagement {
  total: number
  with_bids: number
  without_bids: number
  engagement_rate: number  // percentage 0–100
}

export interface KpiActiveProviders {
  total_providers: number
  with_products: number
  without_products: number
}

export interface KpiActiveMaestros {
  total_maestros: number
  profile_complete: number
  available: number
}

export interface KpiSignupByDay {
  day: string        // ISO date string
  signups: number
  by_role: Record<string, number>  // e.g. { constructor: 3, maestro: 1 }
}

export interface DashboardKpis {
  ordersByDay: KpiOrderByDay[]
  gmvByCity: KpiGmvByCity[]
  paymentRate: KpiPaymentConfirmationRate | null
  licitacionesEngagement: KpiLicitacionesEngagement | null
  activeProviders: KpiActiveProviders | null
  activeMaestros: KpiActiveMaestros | null
  signupsByDay: KpiSignupByDay[]
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchAllKpis(): Promise<DashboardKpis> {
  const [
    ordersByDayRes,
    gmvByCityRes,
    paymentRateRes,
    licitacionesRes,
    activeProvidersRes,
    activeMaestrosRes,
    signupsByDayRes,
  ] = await Promise.all([
    supabase.from('kpi_orders_by_day').select('*'),
    supabase.from('kpi_gmv_by_city').select('*'),
    supabase.from('kpi_payment_confirmation_rate').select('*').maybeSingle(),
    supabase.from('kpi_licitaciones_engagement').select('*').maybeSingle(),
    supabase.from('kpi_active_providers').select('*').maybeSingle(),
    supabase.from('kpi_active_maestros').select('*').maybeSingle(),
    supabase.from('kpi_signups_by_day').select('*'),
  ])

  return {
    ordersByDay: (ordersByDayRes.data ?? []) as KpiOrderByDay[],
    gmvByCity: (gmvByCityRes.data ?? []) as KpiGmvByCity[],
    paymentRate: (paymentRateRes.data as KpiPaymentConfirmationRate | null) ?? null,
    licitacionesEngagement: (licitacionesRes.data as KpiLicitacionesEngagement | null) ?? null,
    activeProviders: (activeProvidersRes.data as KpiActiveProviders | null) ?? null,
    activeMaestros: (activeMaestrosRes.data as KpiActiveMaestros | null) ?? null,
    signupsByDay: (signupsByDayRes.data ?? []) as KpiSignupByDay[],
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboardKpis() {
  return useQuery<DashboardKpis, Error>({
    queryKey: ['kpi', 'dashboard'],
    queryFn: fetchAllKpis,
    // KPIs are expensive — refresh every 5 minutes, keep previous data visible
    staleTime: 5 * 60 * 1_000,
    gcTime: 30 * 60 * 1_000,
    // Do not auto-refetch on window focus to avoid unnecessary DB load
    refetchOnWindowFocus: false,
  })
}
