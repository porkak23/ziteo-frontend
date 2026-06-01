import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

export interface ProductoConPromo {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  active: boolean
  promo_active: boolean
  promo_price: number | null
  promo_until: string | null   // ISO string
}

export function useProductsWithPromos() {
  const user = useAuthStore((s) => s.user)
  return useQuery<ProductoConPromo[]>({
    queryKey: ['products-promos', user?.user_id],
    enabled: !!user?.user_id,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('products')
        .select('id, name, price_unit, unit_type, stock_quantity, active, promo_active, promo_price, promo_until')
        .eq('provider_id', user!.user_id)
        .eq('active', true)
        .order('name')
        .limit(100)
      if (error) {
        if (error.code === '42703') return []   // columna no existe aún
        throw error
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        price: r.price_unit,
        unit: r.unit_type,
        stock: r.stock_quantity,
        active: r.active,
        promo_active: r.promo_active ?? false,
        promo_price: r.promo_price ?? null,
        promo_until: r.promo_until ?? null,
      }))
    },
    staleTime: 30_000,
  })
}

export interface SetPromoPayload {
  product_id: string
  promo_active: boolean
  promo_price?: number | null
  promo_until?: string | null
}

export function useSetPromo() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async (payload: SetPromoPayload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('products')
        .update({
          promo_active:  payload.promo_active,
          promo_price:   payload.promo_active ? (payload.promo_price ?? null) : null,
          promo_until:   payload.promo_active ? (payload.promo_until ?? null) : null,
        })
        .eq('id', payload.product_id)
        .eq('provider_id', user!.user_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-promos', user?.user_id] })
    },
  })
}
