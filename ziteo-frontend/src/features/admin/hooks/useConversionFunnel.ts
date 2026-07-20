import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface ConversionFunnel {
  addedToCart: number
  orderPlaced: number
  paymentConfirmed: number
}

const FUNNEL_EVENTS = ['added_to_cart', 'order_placed', 'payment_confirmed'] as const
const WINDOW_DAYS = 7

async function fetchFunnel(): Promise<ConversionFunnel> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const counts = await Promise.all(
    FUNNEL_EVENTS.map((eventName) =>
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', eventName)
        .gte('created_at', since)
    )
  )

  for (const result of counts) {
    if (result.error) throw result.error
  }

  return {
    addedToCart: counts[0].count ?? 0,
    orderPlaced: counts[1].count ?? 0,
    paymentConfirmed: counts[2].count ?? 0,
  }
}

// Funnel de conversión de los últimos 7 días, calculado sobre la tabla
// `events` (dual-write desde analytics.ts). No es funnel por-usuario
// (no rastrea si el MISMO usuario avanzó de paso) — es un conteo de
// volumen por etapa, suficiente para detectar caídas grandes.
export function useConversionFunnel() {
  return useQuery<ConversionFunnel, Error>({
    queryKey: ['admin', 'conversion-funnel'],
    queryFn: fetchFunnel,
    staleTime: 5 * 60_000,
  })
}
