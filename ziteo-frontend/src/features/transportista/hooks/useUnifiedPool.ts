import { useMemo } from 'react'
import { usePendingDeliveries, useAcceptDelivery } from './useDeliveries'
import { usePendingTransportRequests, useAcceptTransportRequest } from '../../transporte/hooks/useTransportRequests'
import { deliveryFee } from '../utils/deliveryUtils'
import { haversineDistance } from '../../../shared/hooks/useGeolocation'
import type { CargoCapability } from '../types/deliveryTypes'
import { allowedCargoForCapability } from '../types/deliveryTypes'
import type { UnifiedJob } from '../types/jobTypes'

interface GeoPos { lat: number; lng: number }

function distanceToPickup(job: UnifiedJob, pos: GeoPos | null): number {
  if (!pos || job.pickupLat == null || job.pickupLng == null) return Infinity
  return haversineDistance(pos.lat, pos.lng, job.pickupLat, job.pickupLng)
}

export function useUnifiedPool(cargoCapability: CargoCapability | null, driverPos: GeoPos | null) {
  const { data: deliveries = [], isLoading: dLoading } = usePendingDeliveries(cargoCapability)
  const { data: transports = [], isLoading: tLoading } = usePendingTransportRequests()
  const { mutate: acceptDelivery } = useAcceptDelivery()
  const { mutate: acceptTransport } = useAcceptTransportRequest()

  const pool = useMemo<UnifiedJob[]>(() => {
    const deliveryJobs: UnifiedJob[] = deliveries.map((d) => ({
      kind:           'delivery',
      id:             d.id,
      cargoType:      d.cargo_type,
      pickupAddress:  d.pickup_address,
      dropoffAddress: d.dropoff_address,
      pickupLat:      d.pickup_lat,
      pickupLng:      d.pickup_lng,
      dropoffLat:     d.dropoff_lat,
      dropoffLng:     d.dropoff_lng,
      feeLabel:       deliveryFee(d).label,
      distanceKm:     d.distance_km,
      createdAt:      d.created_at,
      raw:            d,
    }))

    const allowedCargo = allowedCargoForCapability(cargoCapability)
    const filtered = cargoCapability
      ? transports.filter((t) => allowedCargo.includes(t.cargo_type))
      : transports

    const transportJobs: UnifiedJob[] = filtered.map((t) => ({
      kind:           'transport',
      id:             t.id,
      cargoType:      t.cargo_type,
      pickupAddress:  t.pickup_address,
      dropoffAddress: t.dropoff_address,
      pickupLat:      t.pickup_lat,
      pickupLng:      t.pickup_lng,
      dropoffLat:     t.dropoff_lat,
      dropoffLng:     t.dropoff_lng,
      description:    t.description,
      feeLabel:       'A convenir',
      createdAt:      t.created_at,
      raw:            t,
    }))

    const all = [...deliveryJobs, ...transportJobs]
    return all.sort((a, b) => {
      const distA = distanceToPickup(a, driverPos)
      const distB = distanceToPickup(b, driverPos)
      if (distA !== distB) return distA - distB
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [deliveries, transports, cargoCapability, driverPos])

  function accept(job: UnifiedJob, callbacks: { onSuccess?: () => void; onError?: (e: Error) => void }) {
    if (job.kind === 'delivery') {
      acceptDelivery(job.id, callbacks)
    } else {
      acceptTransport(job.id, {
        onSuccess: (result) => {
          if (!result.success) {
            callbacks.onError?.(new Error(result.message ?? 'No disponible'))
          } else {
            callbacks.onSuccess?.()
          }
        },
        onError: callbacks.onError,
      })
    }
  }

  return { pool, isLoading: dLoading || tLoading, accept }
}
