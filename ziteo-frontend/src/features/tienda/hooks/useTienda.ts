import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { queryKeys } from '../../../shared/query/keys'
import type { Category, ProductCard, TiendaFilters } from '../types/tiendaTypes'

export const TIENDA_PAGE_SIZE = 15

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Category[]
    },
  })
}

export function useProducts(filters: TiendaFilters, offset: number) {
  return useQuery<ProductCard[]>({
    queryKey: queryKeys.products(filters, offset),
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price_unit,
          unit_type,
          stock_quantity,
          image_url,
          active,
          category_id,
          listing_type,
          construction_stage,
          bulk_price,
          bulk_unit,
          bulk_min_qty,
          provider:profiles!products_provider_id_fkey (
            user_id,
            city,
            user_roles (
              store_name,
              is_verified,
              min_order_amount,
              delivery_time_hours,
              free_shipping_threshold
            )
          )
        `)
        .eq('active', true)

      if (filters.listing_type) {
        query = query.eq('listing_type', filters.listing_type)
      }
      if (filters.city) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query as any).eq('provider.city', filters.city)
      }
      if (filters.min_price !== undefined) {
        query = query.gte('price_unit', filters.min_price)
      }
      if (filters.max_price !== undefined) {
        query = query.lte('price_unit', filters.max_price)
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.provider_id) {
        query = query.eq('provider_id', filters.provider_id)
      }
      if (filters.construction_stage) {
        query = query.eq('construction_stage', filters.construction_stage)
      } else if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      } else if (filters.group_keywords && filters.group_keywords.length > 0) {
        const kws = filters.group_keywords.slice(0, 5)
        query = query.or(kws.map((k) => `name.ilike.%${k}%`).join(','))
      }

      const { data, error } = await query.range(offset, offset + TIENDA_PAGE_SIZE - 1)
      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price_unit),
        unit: p.unit_type,
        stock: p.stock_quantity,
        image_url: p.image_url,
        active: p.active,
        category_id: p.category_id,
        construction_stage: p.construction_stage ?? null,
        bulk_price: p.bulk_price ?? null,
        bulk_unit: p.bulk_unit ?? null,
        bulk_min_qty: p.bulk_min_qty ?? null,
        proveedor: {
          user_id: p.provider?.user_id ?? '',
          store_name: p.provider?.user_roles?.[0]?.store_name ?? p.provider?.user_id ?? '',
          city: p.provider?.city ?? '',
          is_verified: p.provider?.user_roles?.[0]?.is_verified ?? false,
          min_order_amount: p.provider?.user_roles?.[0]?.min_order_amount ?? null,
          delivery_time_hours: p.provider?.user_roles?.[0]?.delivery_time_hours ?? null,
          free_shipping_threshold: p.provider?.user_roles?.[0]?.free_shipping_threshold ?? null,
        },
      })) as ProductCard[]
    },
  })
}
