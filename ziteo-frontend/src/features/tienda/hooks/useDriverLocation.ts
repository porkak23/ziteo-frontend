import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { DriverLocation } from '@/features/transportista/types/deliveryTypes'

export function useDriverLocation(driverId: string | null) {
  const [location, setLocation] = useState<DriverLocation | null>(null)

  useEffect(() => {
    if (!driverId) return

    // Fetch inicial
    supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .single()
      .then(({ data }) => {
        if (data) setLocation(data as DriverLocation)
      })

    // Suscripcion realtime
    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`driver_location:${driverId}:${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          setLocation(payload.new as DriverLocation)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [driverId])

  return location
}
