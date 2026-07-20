import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface AdminDriverOnline {
  driver_id: string
  lat: number
  lng: number
  heading: number | null
  updated_at: string
  vehicle_type: string | null
  vehicle_plate: string | null
  is_available: boolean | null
}

async function fetchDriversOnline(): Promise<AdminDriverOnline[]> {
  const { data, error } = await supabase
    .from('admin_drivers_online')
    .select('*')
  if (error) throw error
  return (data ?? []) as AdminDriverOnline[]
}

// Canal sobre driver_locations (sin filtro): con <50 choferes activos
// esto es <2 msg/s, dentro del límite de 3 canales realtime del panel
// admin. Ver admin_drivers_online en 20260719000002_admin_events_and_activity.sql.
export function useAdminDriversOnline() {
  const queryClient = useQueryClient()
  const query = useQuery<AdminDriverOnline[], Error>({
    queryKey: ['admin', 'drivers-online'],
    queryFn: fetchDriversOnline,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`admin:driver_locations:${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'drivers-online'] })
        }
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return { ...query, connected }
}
