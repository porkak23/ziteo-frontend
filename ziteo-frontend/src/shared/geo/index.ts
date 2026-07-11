import { hasMapsKey } from '@/shared/lib/mapsLoader'
import { googleProvider } from './googleProvider'
import { noneProvider } from './noneProvider'
import type { GeoService } from './types'

export type { GeoAddress, GeoPoint, GeoService } from './types'

let service: GeoService = hasMapsKey ? googleProvider : noneProvider

export function getGeoService(): GeoService {
  return service
}

/** Solo debe llamarse desde src/sandbox/index.ts (installSandbox). */
export function __setGeoService(next: GeoService): void {
  service = next
}
