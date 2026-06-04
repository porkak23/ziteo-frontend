/// <reference types="@types/google.maps" />
import { setOptions } from '@googlemaps/js-api-loader'

export const MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? ''

export const hasMapsKey = Boolean(MAPS_KEY)

let optionsSet = false

function ensureOptions() {
  if (optionsSet) return
  setOptions({
    key: MAPS_KEY,
    v: 'weekly',
    libraries: ['places'],
    language: 'es',
    region: 'BO',
  })
  optionsSet = true
}

/**
 * Load a Google Maps library by name.
 * Uses google.maps.importLibrary (typed by @types/google.maps) after calling
 * setOptions once to configure the API key and settings.
 * Returns null (instead of throwing) when MAPS_KEY is not configured.
 */
export async function loadMapsLibrary(library: 'maps'): Promise<google.maps.MapsLibrary | null>
export async function loadMapsLibrary(library: 'places'): Promise<google.maps.PlacesLibrary | null>
export async function loadMapsLibrary(library: 'core'): Promise<google.maps.CoreLibrary | null>
export async function loadMapsLibrary(
  library: string
): Promise<google.maps.MapsLibrary | google.maps.PlacesLibrary | google.maps.CoreLibrary | null> {
  if (!hasMapsKey) return null
  ensureOptions()
  return google.maps.importLibrary(library) as Promise<
    google.maps.MapsLibrary | google.maps.PlacesLibrary | google.maps.CoreLibrary
  >
}
