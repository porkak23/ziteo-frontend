export interface GeoPoint {
  lat: number
  lng: number
}

export interface GeoAddress {
  address: string
  city?: string
  point?: GeoPoint
}

export interface GeoService {
  /** Identifica el proveedor activo — los componentes de mapa deciden su render con esto. */
  readonly kind: 'google' | 'mock' | 'none'
  /** true si hay una UI de mapa interactivo disponible (google real, o mock simulado). */
  readonly canRenderMap: boolean
  reverseGeocode(lat: number, lng: number): Promise<string>
  /** Sugerencias de autocompletado. 'none' devuelve []. */
  suggestAddresses(query: string): Promise<GeoAddress[]>
  getCurrentPosition(): Promise<GeoPoint | null>
}
