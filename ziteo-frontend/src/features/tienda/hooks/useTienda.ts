import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { Category, ProductCard, TiendaFilters } from '../types/tiendaTypes'

export const TIENDA_PAGE_SIZE = 15

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
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
    queryKey: ['products', filters, offset],
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
          provider:profiles!products_provider_id_fkey (
            user_id,
            city,
            user_roles (
              store_name,
              is_verified
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
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      } else if (filters.group_keywords && filters.group_keywords.length > 0) {
        const kws = filters.group_keywords.slice(0, 5)
        query = query.or(kws.map((k) => `name.ilike.%${k}%`).join(','))
      }

      const { data, error } = await query.range(offset, offset + TIENDA_PAGE_SIZE - 1)
      if (error) throw error

      return (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price_unit),
        unit: p.unit_type,
        stock: p.stock_quantity,
        image_url: p.image_url,
        active: p.active,
        category_id: p.category_id,
        proveedor: (() => {
          const prov = Array.isArray(p.provider) ? p.provider[0] : p.provider
          return {
            user_id: prov?.user_id ?? '',
            store_name: prov?.user_roles?.[0]?.store_name ?? prov?.user_id ?? '',
            city: prov?.city ?? '',
            is_verified: prov?.user_roles?.[0]?.is_verified ?? false,
          }
        })(),
      })) as ProductCard[]
    },
  })
}
