import { useState, useEffect } from 'react'
import { getGeoService } from '@/shared/geo'
import { SIMULATION } from '@/shared/config/simulation'

export interface GeoPosition {
  lat: number
  lng: number
  accuracy: number
}

export interface GeolocationState {
  position: GeoPosition | null
  error: string | null
  loading: boolean
}

export function useGeolocation(enabled: boolean) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
  })

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ position: null, error: null, loading: false })
      return
    }

    // Sandbox: reemplaza el GPS nativo por posiciones simuladas con jitter,
    // para que el tracking del chofer "se mueva" sin depender del dispositivo.
    if (SIMULATION && getGeoService().kind === 'mock') {
      setState((s) => ({ ...s, loading: true }))
      let cancelled = false

      const tick = async () => {
        const point = await getGeoService().getCurrentPosition()
        if (cancelled || !point) return
        setState({
          position: { lat: point.lat, lng: point.lng, accuracy: 15 },
          error: null,
          loading: false,
        })
      }

      tick()
      const id = setInterval(tick, 5000)
      return () => {
        cancelled = true
        clearInterval(id)
      }
    }

    if (!navigator.geolocation) {
      setState({ position: null, error: 'Geolocalización no disponible en este dispositivo', loading: false })
      return
    }

    setState((s) => ({ ...s, loading: true }))

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          error: null,
          loading: false,
        })
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message, loading: false }))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [enabled])

  return state
}

/** Haversine distance in meters between two lat/lng points */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
