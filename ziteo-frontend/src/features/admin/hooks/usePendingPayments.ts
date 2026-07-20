import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface PendingPaymentOrder {
  id: string
  constructor_id: string
  provider_id: string
  total: number
  payment_evidence_url: string
  payment_evidence_uploaded_at: string
  created_at: string
}

async function fetchPendingPayments(): Promise<PendingPaymentOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, constructor_id, provider_id, total, payment_evidence_url, payment_evidence_uploaded_at, created_at')
    .not('payment_evidence_url', 'is', null)
    .is('payment_confirmed_at', null)
    .order('payment_evidence_uploaded_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as PendingPaymentOrder[]
}

// Pagos con evidencia subida pero sin confirmar/rechazar por el proveedor —
// ordenados por antigüedad (más viejo primero) para visibilizar cuellos de
// botella. Solo polling: no forma parte de los 3 canales realtime del panel.
export function usePendingPayments() {
  return useQuery<PendingPaymentOrder[], Error>({
    queryKey: ['admin', 'pending-payments'],
    queryFn: fetchPendingPayments,
    staleTime: 20_000,
    refetchInterval: 30_000,
  })
}
