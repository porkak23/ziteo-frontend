import type { GeoAddress, GeoPoint, GeoService } from './types'

/** Fallback cuando no hay API key de Google Maps configurada: solo texto, sin mapa. */
export const noneProvider: GeoService = {
  kind: 'none',
  canRenderMap: false,
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  },
  async suggestAddresses(): Promise<GeoAddress[]> {
    return []
  },
  getCurrentPosition(): Promise<GeoPoint | null> {
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
  },
}
