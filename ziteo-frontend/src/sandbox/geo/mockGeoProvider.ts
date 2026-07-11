import type { GeoAddress, GeoPoint, GeoService } from '@/shared/geo'
import { driverPositionWithJitter, nearestSandboxAddress, SANDBOX_ADDRESSES } from '@/sandbox/fixtures/coords'

export const mockGeoProvider: GeoService = {
  kind: 'mock',
  canRenderMap: true,
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    return nearestSandboxAddress(lat, lng)
  },
  async suggestAddresses(query: string): Promise<GeoAddress[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SANDBOX_ADDRESSES.filter((a) => a.address.toLowerCase().includes(q)).map((a) => ({
      address: a.address,
      city: 'Santa Cruz',
      point: { lat: a.lat, lng: a.lng },
    }))
  },
  async getCurrentPosition(): Promise<GeoPoint | null> {
    return driverPositionWithJitter()
  },
}
