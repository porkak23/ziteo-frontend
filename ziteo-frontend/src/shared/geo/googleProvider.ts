/// <reference types="@types/google.maps" />
import { hasMapsKey, loadMapsLibrary } from '@/shared/lib/mapsLoader'
import { captureException } from '@/lib/sentryClient'
import type { GeoAddress, GeoPoint, GeoService } from './types'

// Reverse geocoding goes through the Maps JS SDK's Geocoder, not a raw
// fetch() to the REST endpoint. Google rejects HTTP-referrer-restricted keys
// on server-style REST calls (Geocoding/Places/Directions) — referrer
// restriction only authenticates requests made through the JS SDK's own
// channel. An IP-restricted key would work over REST, but that means a
// second key to manage; reusing the one key already loaded for the map is
// simpler and matches how MapPicker/DriverPoolMap already load it.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  try {
    const geocodingLib = await loadMapsLibrary('geocoding')
    if (!geocodingLib) return fallback
    const geocoder = new geocodingLib.Geocoder()
    const { results } = await geocoder.geocode({ location: { lat, lng }, language: 'es' })
    return results[0]?.formatted_address ?? fallback
  } catch (err) {
    captureException(err, { context: 'googleProvider.reverseGeocode' })
    return fallback
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
