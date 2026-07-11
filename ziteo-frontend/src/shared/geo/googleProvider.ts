/// <reference types="@types/google.maps" />
import { MAPS_KEY, hasMapsKey } from '@/shared/lib/mapsLoader'
import { captureException } from '@/lib/sentryClient'
import type { GeoAddress, GeoPoint, GeoService } from './types'

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}&language=es`
    )
    const data = (await res.json()) as { results?: { formatted_address: string }[] }
    return data.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch (err) {
    captureException(err, { context: 'googleProvider.reverseGeocode' })
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

function getCurrentPosition(): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  })
}

/**
 * Proveedor real de Google Maps. `kind` refleja si hay API key configurada:
 * sin key se comporta igual que noneProvider (fallback de solo-texto), pero
 * expone la misma forma para que los componentes no necesiten ramificar.
 */
export const googleProvider: GeoService = {
  kind: hasMapsKey ? 'google' : 'none',
  canRenderMap: hasMapsKey,
  reverseGeocode,
  async suggestAddresses(): Promise<GeoAddress[]> {
    // El autocompletado real se maneja con google.maps.places.Autocomplete
    // directamente en AddressInput (requiere estar atado a un <input> del DOM).
    // Este método existe para cumplir la interfaz cuando se llama fuera de ese contexto.
    return []
  },
  getCurrentPosition,
}
