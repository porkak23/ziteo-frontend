export type ProductUnit = 'kg' | 'm2' | 'm3' | 'unidad' | 'saco' | 'varilla'

export type ConstructionStage = 'fundaciones' | 'muros' | 'techos' | 'terminaciones'

export interface Category {
  id: string
  name: string
  icon_name: string
  slug: string
}

export interface ProveedorInfo {
  id: string
  store_name: string
  city: string
  is_verified: boolean
  avatar_url: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  category_id: string
  provider_id: string
  stock: number
  image_url: string | null
  active: boolean
  created_at?: string
}

export interface ProductCard {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  stock: number
  image_url: string | null
  active: boolean
  category_id: string
  construction_stage?: ConstructionStage | null
  bulk_price?: number | null
  bulk_unit?: string | null
  bulk_min_qty?: number | null
  proveedor: {
    user_id: string
    store_name: string
    city: string
    is_verified: boolean
    min_order_amount?: number | null
    delivery_time_hours?: number | null
    free_shipping_threshold?: number | null
  }
}

export type ListingType = 'sell' | 'rent'

export interface TiendaFilters {
  category_id?: string
  city?: string
  min_price?: number
  max_price?: number
  search?: string
  group_keywords?: string[]
  listing_type?: ListingType
  construction_stage?: ConstructionStage
  provider_id?: string
}
