import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export type DeliveryStatus = 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed'

export interface AdminActiveDelivery {
  id: string
  order_id: string
  driver_id: string | null
  status: DeliveryStatus
  dropoff_address: string | null
  dropoff_lat: number | null
  dropoff_lng: number | null
  pickup_address: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  updated_at: string
}

const ACTIVE_STATUSES: DeliveryStatus[] = ['pending', 'accepted', 'in_transit']

async function fetchActiveDeliveries(): Promise<AdminActiveDelivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('id, order_id, driver_id, status, dropoff_address, dropoff_lat, dropoff_lng, pickup_address, pickup_lat, pickup_lng, updated_at')
    .in('status', ACTIVE_STATUSES)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminActiveDelivery[]
}

// Deliveries activos para el Mapa Vivo — se cruzan por driver_id con
// admin_drivers_online (ver useAdminDriversOnline) para pintar el marker
// y su estado. is_admin() cubre el acceso vía admin_select_all_deliveries.
//
// Solo polling (sin canal realtime propio): el panel admin ya usa 3
// canales (events, admin_alerts, driver_locations) — el límite acordado
// en el plan del God Mode para no saturar Realtime. 15s de polling es
// indistinguible de push para este caso de uso.
export function useAdminActiveDeliveries() {
  return useQuery<AdminActiveDelivery[], Error>({
    queryKey: ['admin', 'active-deliveries'],
    queryFn: fetchActiveDeliveries,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}
