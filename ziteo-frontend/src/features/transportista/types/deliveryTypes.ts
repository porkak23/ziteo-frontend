export type DeliveryStatus = 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed'

export interface Delivery {
  id: string
  order_id: string
  driver_id: string | null
  status: DeliveryStatus
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
