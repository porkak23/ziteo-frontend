import type { Delivery } from './deliveryTypes'
import type { TransportRequest } from '../../transporte/hooks/useTransportRequests'

export type UnifiedJob =
  | {
      kind: 'delivery'
      id: string
      cargoType: 'light' | 'heavy'
      pickupAddress: string | null
      dropoffAddress: string | null
      pickupLat: number | null
      pickupLng: number | null
      dropoffLat: number | null
      dropoffLng: number | null
      feeLabel: string
      distanceKm: number | null
      createdAt: string
      raw: Delivery
    }
  | {
      kind: 'transport'
      id: string
      cargoType: 'light' | 'heavy'
      pickupAddress: string | null
      dropoffAddress: string | null
      pickupLat: number | null
      pickupLng: number | null
      dropoffLat: number | null
      dropoffLng: number | null
      description: string | null
      feeLabel: string
      createdAt: string
      raw: TransportRequest
    }

export type ActiveJob =
  | { kind: 'delivery'; id: string; status: string; dropoffAddress: string | null; raw: Delivery }
  | { kind: 'transport'; id: string; status: string; dropoffAddress: string | null; raw: TransportRequest }
