import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface RoutePoint {
  lat: number
  lng: number
  recorded_at: string
}

async function fetchRouteHistory(driverId: string): Promise<RoutePoint[]> {
  const { data, error } = await supabase
    .from('driver_location_history')
    .select('lat, lng, recorded_at')
    .eq('driver_id', driverId)
    .gte('recorded_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true })
    .limit(500)
  if (error) throw error
  return (data ?? []) as RoutePoint[]
}

// Replay de ruta: últimas 4h de driver_location_history (ver
// 20260719000003_admin_history_and_alerts.sql). Se pide bajo demanda
// (al abrir el sheet de detalle de un chofer), no en cada tick del mapa.
export function useRouteHistory(driverId: string | null) {
  return useQuery<RoutePoint[], Error>({
    queryKey: ['admin', 'route-history', driverId],
    queryFn: () => fetchRouteHistory(driverId as string),
    enabled: !!driverId,
    staleTime: 60_000,
  })
}
