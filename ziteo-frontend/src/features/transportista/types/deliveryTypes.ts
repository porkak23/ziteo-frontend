export type DeliveryStatus = 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed'
export type CargoType = 'light' | 'medium' | 'heavy'
export type VehicleType = 'moto' | 'camion' | 'camioneta' | 'pickup'
export type CargoCapability = 'light' | 'medium' | 'heavy'
export type FulfillmentMode = 'flota' | 'pool'

export function vehicleToCargoCapability(vehicleType: string | null): CargoCapability | null {
  if (!vehicleType) return null
  if (vehicleType === 'moto') return 'light'
  if (vehicleType === 'camioneta' || vehicleType === 'pickup') return 'medium'
  if (vehicleType === 'camion') return 'heavy'
  return null
}

/**
 * Carga que un vehículo con esta capacidad puede ver en el pool.
 * Espejo de la matriz en accept_delivery: moto solo light; camioneta
 * light+medium; camión medium+heavy (un camión no toma una bolsa de clavos).
 */
export function allowedCargoForCapability(capability: CargoCapability | null): CargoType[] {
  if (capability === 'light') return ['light']
  if (capability === 'medium') return ['light', 'medium']
  if (capability === 'heavy') return ['medium', 'heavy']
  return ['light', 'medium', 'heavy']
}

export interface Delivery {
  id: string
  order_id: string
  driver_id: string | null
  status: DeliveryStatus
  cargo_type: CargoType
  fulfillment_mode: FulfillmentMode
  pickup_address: string | null
  dropoff_address: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  dropoff_lat: number | null
  dropoff_lng: number | null
  distance_km: number | null
  estimated_fee: number | null
  notes: string | null
  accepted_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  /** Joined from orders */
  order?: {
    total: number
    constructor_id: string
    provider_id: string
  }
}

export interface AcceptDeliveryResult {
  success: boolean
  message?: string
  delivery_id?: string
}

export interface DriverLocation {
  driver_id: string
  lat: number
  lng: number
  heading: number | null
  updated_at: string
}
